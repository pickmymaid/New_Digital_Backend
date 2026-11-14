const axios = require("axios");

// PURCHASE orders settle as PURCHASED; CAPTURED is the same money taken via
// authorise-then-capture.
const PAID_STATES = new Set(['PURCHASED', 'CAPTURED']);

const isPaidState = (state) => PAID_STATES.has(state);

// Reads an order from N-Genius. One order can hold several payment attempts
// (a declined card, then a good one), so it is paid if ANY attempt is — the
// first attempt alone can say FAILED on an order the customer did pay.
const getOrderStatus = async (accessToken, orderRef) => {
    const outletRef = process.env.PG_OUTLET_REFERENCE;
    const baseURL = process.env.PG_BASE_URL;
    const { data } = await axios.get(
        `${baseURL}/transactions/outlets/${outletRef}/orders/${encodeURIComponent(orderRef)}`,
        {
            timeout: 10000,
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }
    );

    const payments = data?._embedded?.payment ?? [];
    const paidAttempt = payments.find((payment) => isPaidState(payment?.state));
    return {
        paid: Boolean(paidAttempt),
        state: paidAttempt?.state ?? payments[payments.length - 1]?.state ?? data?.state,
        amount: data?.amount?.value,
        currency: data?.amount?.currencyCode,
    };
};

// Kept for existing callers: the state that decides whether the order is paid.
const verifyPaymentWithCred = async (accessToken, orderRef) => {
    return (await getOrderStatus(accessToken, orderRef)).state;
};

module.exports = { verifyPaymentWithCred, getOrderStatus, isPaidState };

// https://api-gateway.ngenius-payments.com/identity/auth/access-token
