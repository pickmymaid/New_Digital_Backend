const moment = require("moment");
const { getCustomerWithID } = require("../../queries/user.queries");
const { getAccessTokenWithRef, getPaymentDetails, savePayment, verifyPayment } = require("../../queries/v2/payment.queries");
const { recieptTemplate } = require("../../templates/recieptTemplate");
const { createPaymentWithToken } = require("../../utils/createPaymentWithToken/createPaymentWithToken");
const { generateAccessToken } = require("../../utils/generatePaymentAccessToken/generatePaymentAccessToken");
const { recieptBody } = require("../../utils/mailBody/reciept");
const { sendMail } = require("../../utils/sendMail/sendMail");
const { verifyPaymentWithCred } = require("../../utils/verifyPayment/verifyPayment");
const { getSubscriptionAmount, getSubscriptionPlan } = require("../../utils/constants/subscriptionAmounts");
const logger = require("../../config/logger");
const { sendSesEmailWithAttachment } = require("../../utils/sendMail/sendSESMail");
const {inspect} = require('util');

const createPaymentService = (type, user_id) => {
    return new Promise(async (resolve, reject) => {
        try{
            const accessToken = await generateAccessToken();
            const customer = await getCustomerWithID(user_id);
            const response = await createPaymentWithToken(accessToken, type, customer)
            const paymentCredentials = {
                transactionToken: accessToken,
                transRef: response?.reference,
                type,
                user_id,
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

const verifyPaymentService = (ref, user_id) => {
    return new Promise(async (resolve, reject) => {
        try{
            const FOUR_MIN = 4 * 60 * 1000;
            const tokenData = await getAccessTokenWithRef(ref);

            const user = await getCustomerWithID(user_id);

            let accessToken = null;

            if(tokenData){
                if(Math.abs(new Date().getTime() - new Date(tokenData?.createdDate).getTime()) < FOUR_MIN){
                    accessToken = tokenData?.accessToken;
                }else{
                    accessToken= await generateAccessToken();
                }
            }else{
                reject('Your account and payment are missmatching!')
            }

            const state = await verifyPaymentWithCred(accessToken, ref);
            if(state === 'PURCHASED'){
                const response = await verifyPayment(ref,user_id);

                const paymentPlan = getSubscriptionPlan(response.type);
                const startDate = moment(response.paymentDate).format('DD/MM/YYYY');
                const expiryDate = moment(response.expiryDate).format('DD/MM/YYYY');
                let billAddress = `${user?.first_name}\n${user?.email}\n`

                if(user?.phone){
                    billAddress += `+${user?.phone}`
                }

                const template = await recieptTemplate(billAddress,response.ref,paymentPlan,`${startDate} to ${expiryDate}`,getSubscriptionAmount(response.type) / 100, response?.reciept, startDate);
                sendSesEmailWithAttachment(
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
                    ["pickmymaid@gmail.com"]
                )
                resolve(response)
            }else{
                reject(`Oops! It seems there was an issue with your payment. Please double-check your payment details and try again. If the problem persists, don't hesitate to reach out to our support team for assistance. We're here to help!`)
            }
        }catch(error){
            logger.error(error?.message || error , {meta: {ref, user_id}})
            console.log(error );


            reject(error)
        }
    })
}

const getInvoice = (ref, user_id) => {
    return new Promise(async (resolve, reject) => {
        try{
            const details = await getPaymentDetails(ref,user_id);
            if(details?.[0]){
                const paymentPlan = getSubscriptionPlan(details[0].type);
                const startDate = moment(details[0].paymentDate).format('DD/MM/YYYY');
                const expiryDate = moment(details[0].expiryDate).format('DD/MM/YYYY');
                let billAddress = `${details[0]?.customer?.first_name}\n${details[0]?.customer?.email}\n`
                if(details[0]?.customer.phone){
                    billAddress += `+${details[0]?.customer?.phone}`
                }
                const template = await recieptTemplate(billAddress,details[0].transRef,paymentPlan,`${startDate} to ${expiryDate}`,getSubscriptionAmount(details[0].type) / 100, details[0]?.reciept_number, startDate);
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
  getInvoice,
  sendInvoiceToMail,
};
