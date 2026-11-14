const moment = require("moment");
const { getCustomerWithID } = require("../../queries/user.queries");
const { getPaymentDetails, savePayment, findPaymentByRef, markPaidIfUnpaid, findUnconfirmedNgeniusPayments } = require("../../queries/v2/payment.queries");
const { recieptTemplate } = require("../../templates/recieptTemplate");
const { createPaymentWithToken } = require("../../utils/createPaymentWithToken/createPaymentWithToken");
// Gateway and mail helpers are called through their modules so tests can stub them.
const accessTokens = require("../../utils/generatePaymentAccessToken/generatePaymentAccessToken");
const { recieptBody } = require("../../utils/mailBody/reciept");
const { sendMail } = require("../../utils/sendMail/sendMail");
const gateway = require("../../utils/verifyPayment/verifyPayment");
const { subscriptionExpiryDateGenerator } = require("../../utils/subscriptionExpiryDateGenerator/subscriptionExpiryDateGenerator");
const { getSubscriptionAmount, getLegacySubscriptionAmount, getSubscriptionPlan } = require("../../utils/constants/subscriptionAmounts");
const logger = require("../../config/logger");
const sesMail = require("../../utils/sendMail/sendSESMail");
const {inspect} = require('util');
const { applyDiscount, findUsableCouponService } = require("../coupon.service");

// Receipt line, e.g. "Basic Plan (WELCOME10 - 10% off)".
const receiptPlanName = (payment) => {
    const plan = getSubscriptionPlan(payment.type);
    return payment.coupon_code ? `${plan} (${payment.coupon_code} - ${payment.discount_percent}% off)` : plan;
}

// Records created before coupons existed have no stored amount.
const chargedAmount = (payment) => payment.amount ?? getLegacySubscriptionAmount(payment.type);

const createPaymentService = (type, user_id, coupon_code) => {
    return new Promise(async (resolve, reject) => {
        try{
            const coupon = coupon_code ? await findUsableCouponService(coupon_code, user_id) : null;
            const amount = applyDiscount(getSubscriptionAmount(type), coupon?.discount_percent);

            const accessToken = await accessTokens.generateAccessToken();
            const customer = await getCustomerWithID(user_id);
            const response = await createPaymentWithToken(accessToken, amount, customer)
            const paymentCredentials = {
                transactionToken: accessToken,
                transRef: response?.reference,
                type,
                user_id,
                amount,
            }
            if(coupon){
                paymentCredentials.coupon_code = coupon.code;
                paymentCredentials.discount_percent = coupon.discount_percent;
            }
            await savePayment(paymentCredentials);

            resolve({
                payment_url: response?._links?.payment?.href
            })
        }catch(error){
            logger.error(error?.message || error , {meta: {type, user_id}})
            console.log(inspect({error}, { showHidden: true, depth: null, colors: true }))
            reject(error)
        }
    })
}

// Customer-facing outcomes are rejected as plain strings (the controller
// and the internal admin route turn those into a 400 with this message).
const PAYMENT_MISMATCH = 'Your account and payment are missmatching!';
const PAYMENT_NOT_COMPLETED = `Oops! It seems there was an issue with your payment. Please double-check your payment details and try again. If the problem persists, don't hesitate to reach out to our support team for assistance. We're here to help!`;

// The access token saved with an order is reusable for about 5 minutes.
const TOKEN_REUSE_MS = 4 * 60 * 1000;

const paymentSummary = (payment) => ({
    reciept: payment.reciept_number,
    type: payment.type,
    ref: payment.transRef,
    expiryDate: payment.expiryDate,
    paymentDate: payment.paymentDate,
    status: payment.status,
    amount: payment.amount,
    coupon_code: payment.coupon_code,
    discount_percent: payment.discount_percent,
});

const sendReceipt = async (summary, user_id) => {
    const user = await getCustomerWithID(user_id);
    if (!user?.email) return;

    const paymentPlan = getSubscriptionPlan(summary.type);
    const startDate = moment(summary.paymentDate).format('DD/MM/YYYY');
    const expiryDate = moment(summary.expiryDate).format('DD/MM/YYYY');
    let billAddress = `${user?.first_name}\n${user?.email}\n`;
    if (user?.phone) {
        billAddress += `+${user?.phone}`;
    }

    const template = await recieptTemplate(billAddress, summary.ref, receiptPlanName(summary), `${startDate} to ${expiryDate}`, chargedAmount(summary) / 100, summary.reciept, startDate);
    await sesMail.sendSesEmailWithAttachment(
        user?.email,
        'Pickmymaid Subscription Confirmation and Receipt',
        recieptBody(user?.first_name, startDate, expiryDate, paymentPlan),
        '',
        [
            {
                filename: `${user?.first_name} Invoice.pdf`,
                content: template.buffer,
                contentType: 'application/pdf'
            }
        ],
        "pickmymaid@gmail.com"
    );
};

/**
 * The single place an N-Genius order becomes paid. Used by the customer's
 * return page, the gateway webhook, the admin "verify payment" action and
 * the reconcile job, so none of them depends on the others (or on the
 * customer's browser) having run.
 *
 * Returns { paid: true, payment } once paid, or { paid: false, state }
 * while the gateway hasn't taken the money. Never trusts the caller: the
 * order is always read back from N-Genius and its amount checked against
 * what this server created it for.
 */
const confirmPayment = async (payment, { accessToken } = {}) => {
    if (payment.status === 1 || payment.is_paid === true) {
        return { paid: true, payment: paymentSummary(payment) };
    }

    let token = accessToken;
    if (!token) {
        const tokenAge = Math.abs(Date.now() - new Date(payment.updatedAt).getTime());
        token = tokenAge < TOKEN_REUSE_MS ? payment.transactionToken : await accessTokens.generateAccessToken();
    }

    const order = await gateway.getOrderStatus(token, payment.transRef);
    if (!order.paid) {
        return { paid: false, state: order.state };
    }

    const expected = chargedAmount(payment);
    if (order.currency !== 'AED' || Number(order.amount) !== expected) {
        // Money was taken for a different amount than this order was created
        // for. Don't activate anything automatically; flag it for a person.
        logger.error('N-Genius order amount does not match the payment record', {
            meta: { ref: payment.transRef, user_id: payment.user_id, expected, charged: order.amount, currency: order.currency },
        });
        throw new Error(`Payment ${payment.transRef} was charged ${order.amount} ${order.currency}, expected ${expected} AED`);
    }

    const expiryDate = subscriptionExpiryDateGenerator(payment.type);
    const paymentDate = new Date();
    const { modifiedCount } = await markPaidIfUnpaid(payment.transRef, expiryDate, paymentDate);
    if (modifiedCount === 0) {
        // Another caller confirmed it a moment ago and sent the receipt.
        const current = await findPaymentByRef(payment.transRef);
        return { paid: true, payment: paymentSummary(current ?? payment) };
    }

    const summary = { ...paymentSummary(payment), status: 1, expiryDate, paymentDate };
    logger.info(`Payment ${payment.transRef} confirmed`, { meta: { user_id: payment.user_id, state: order.state } });
    sendReceipt(summary, payment.user_id).catch((mailError) => {
        // The payment is already confirmed; a failed receipt mail must not fail the request or crash the process.
        logger.error(`Failed to send receipt email: ${mailError?.message || mailError}`, { meta: { ref: payment.transRef, user_id: payment.user_id } });
    });
    return { paid: true, payment: summary };
};

// The order reference alone identifies the payment, so this works for a
// customer whose session cookie didn't survive the trip to the gateway.
// When a user is known (session, or the admin route) it must own the order.
const verifyPaymentService = async (ref, user_id) => {
    if (typeof ref !== 'string' || !ref) throw PAYMENT_MISMATCH;

    const payment = await findPaymentByRef(ref);
    if (!payment || (user_id && String(payment.user_id) !== String(user_id))) {
        throw PAYMENT_MISMATCH;
    }

    const result = await confirmPayment(payment);
    if (!result.paid) throw PAYMENT_NOT_COMPLETED;
    return result.payment;
};

// Called by N-Genius when an order changes. The body is only a hint about
// which order to look at: the order is read back from the gateway, so a
// forged or replayed webhook can't mark anything paid.
const handleGatewayWebhook = async (body) => {
    const ref = body?.order?.reference;
    if (typeof ref !== 'string' || !ref) return { handled: false, reason: 'no order reference' };

    const payment = await findPaymentByRef(ref);
    if (!payment) return { handled: false, reason: 'unknown order' };

    const result = await confirmPayment(payment);
    return { handled: true, paid: result.paid };
};

// Safety net for orders the webhook and the return page both missed.
const RECONCILE_MIN_AGE_MS = 2 * 60 * 1000;
const RECONCILE_LOOKBACK_MS = 48 * 60 * 60 * 1000;
const RECONCILE_BATCH_SIZE = 50;

const reconcilePendingPayments = async () => {
    const now = Date.now();
    const pending = await findUnconfirmedNgeniusPayments(
        new Date(now - RECONCILE_LOOKBACK_MS),
        new Date(now - RECONCILE_MIN_AGE_MS),
        RECONCILE_BATCH_SIZE
    );
    if (pending.length === 0) return { checked: 0, confirmed: 0, failed: 0 };

    const accessToken = await accessTokens.generateAccessToken();
    let confirmed = 0;
    let failed = 0;
    for (const payment of pending) {
        try {
            const result = await confirmPayment(payment, { accessToken });
            if (result.paid) confirmed += 1;
        } catch (error) {
            failed += 1;
            logger.error(`Reconcile: could not check payment ${payment.transRef}: ${error?.message || error}`);
        }
    }
    logger.info(`Payment reconcile: checked ${pending.length}, confirmed ${confirmed}, failed ${failed}`);
    return { checked: pending.length, confirmed, failed };
};

const getInvoice = (ref, user_id) => {
    return new Promise(async (resolve, reject) => {
        try{
            const details = await getPaymentDetails(ref,user_id);
            if(details?.[0]){
                const startDate = moment(details[0].paymentDate).format('DD/MM/YYYY');
                const expiryDate = moment(details[0].expiryDate).format('DD/MM/YYYY');
                let billAddress = `${details[0]?.customer?.first_name}\n${details[0]?.customer?.email}\n`
                if(details[0]?.customer.phone){
                    billAddress += `+${details[0]?.customer?.phone}`
                }
                const template = await recieptTemplate(billAddress,details[0].transRef,receiptPlanName(details[0]),`${startDate} to ${expiryDate}`,chargedAmount(details[0]) / 100, details[0]?.reciept_number, startDate);
                return resolve(template.buffer)
            }

            return reject(false)
        }catch(error){
            logger.error(error?.message || error , {meta: {ref, user_id}})
            console.log(error);

            reject(error)
        }
    })
}

const sendInvoiceToMail = async (user_id) => {
    return new Promise(async (resolve, reject) => {
        try{

        }catch(error){
            logger.error(error?.message || error , {meta: {user_id}})
            console.log(error);

            reject(error)
        }
    })
}

module.exports = {
  createPaymentService,
  verifyPaymentService,
  confirmPayment,
  handleGatewayWebhook,
  reconcilePendingPayments,
  getInvoice,
  sendInvoiceToMail,
};
