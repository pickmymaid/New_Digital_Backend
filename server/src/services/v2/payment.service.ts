import moment from "moment";
import { getCustomerWithID } from "../../queries/user.queries";
import { getAccessTokenWithRef, getPaymentDetails, savePayment, verifyPayment } from "../../queries/v2/payment.queries";
import { recieptTemplate } from "../../templates/recieptTemplate";
import { ICustomerCollection } from "../../types/dbStructureTypes";
import { IPaymentCredentials } from "../../types/requestBody.types";
import { createPaymentWithToken } from "../../utils/createPaymentWithToken/createPaymentWithToken";
import { generateAccessToken } from "../../utils/generatePaymentAccessToken/generatePaymentAccessToken";
import { recieptBody } from "../../utils/mailBody/reciept";
import { sendMail } from "../../utils/sendMail/sendMail";
import { verifyPaymentWithCred } from "../../utils/verifyPayment/verifyPayment";
import { getSubscriptionAmount, getSubscriptionPlan } from "../../utils/constants/subscriptionAmounts";
import logger from "../../config/logger";
import { sendSesEmailWithAttachment } from "../../utils/sendMail/sendSESMail";
import {inspect} from 'util'

export const createPaymentService = (type: 0 | 1 | 2 | 3, user_id: string) => {
    return new Promise(async (resolve, reject) => {
        try{
            const accessToken = await generateAccessToken();
            const customer = await getCustomerWithID(user_id);
            const response = await createPaymentWithToken(accessToken, type, customer)
            const paymentCredentials: IPaymentCredentials = {
                transactionToken: accessToken,
                transRef: response?.reference,
                type,
                user_id,
            }
            await savePayment(paymentCredentials);

            resolve({
                payment_url: response?._links?.payment?.href
            })
        }catch(error:any){
            logger.error(error?.message || error , {meta: {type, user_id}})
            console.log(inspect({error}, { showHidden: true, depth: null, colors: true }))
            reject(error)
        }
    })
}

export const verifyPaymentService = (ref: string, user_id: string) => {
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

            const state = await verifyPaymentWithCred(accessToken as string, ref);
            if(state === 'PURCHASED'){
                const response = await verifyPayment(ref,user_id);

                const paymentPlan = getSubscriptionPlan(response.type as (0 | 1 | 2 | 3));
                const startDate = moment(response.paymentDate).format('DD/MM/YYYY');
                const expiryDate = moment(response.expiryDate).format('DD/MM/YYYY');
                let billAddress = `${user?.first_name}\n${user?.email}\n`

                if(user?.phone){
                    billAddress += `+${user?.phone}`
                }

                const template = await recieptTemplate(billAddress,response.ref,paymentPlan,`${startDate} to ${expiryDate}`,getSubscriptionAmount(response.type as (1 | 2 | 0)) / 100, response?.reciept as number, startDate as string);
                sendSesEmailWithAttachment(
                    user?.email as string,
                    'Pickmymaid Subscription Confirmation and Receipt',
                    recieptBody(user?.first_name as string, startDate, expiryDate, paymentPlan), 
                    '', 
                    [
                        {
                            filename: `${user?.first_name} Invoice.pdf`,
                            content: template.buffer as Buffer,
                            contentType: 'application/pdf'
                        }
                    ],
                    ["pickmymaid@gmail.com"]
                )
                resolve(response)
            }else{
                reject(`Oops! It seems there was an issue with your payment. Please double-check your payment details and try again. If the problem persists, don't hesitate to reach out to our support team for assistance. We're here to help!`)
            }
        }catch(error:any){
            logger.error(error?.message || error , {meta: {ref, user_id}})
            console.log(error );
            

            reject(error)
        }
    })
}

export const getInvoice = (ref: string, user_id: string) => {
    return new Promise(async (resolve, reject) => {
        try{
            const details = await getPaymentDetails(ref,user_id);
            if(details?.[0]){
                const paymentPlan = getSubscriptionPlan(details[0].type as (0 | 1 | 2 | 3));
                const startDate = moment(details[0].paymentDate).format('DD/MM/YYYY');
                const expiryDate = moment(details[0].expiryDate).format('DD/MM/YYYY');
                let billAddress = `${details[0]?.customer?.first_name}\n${details[0]?.customer?.email}\n`
                if(details[0]?.customer.phone){
                    billAddress += `+${details[0]?.customer?.phone}`
                }
                const template = await recieptTemplate(billAddress,details[0].transRef,paymentPlan,`${startDate} to ${expiryDate}`,getSubscriptionAmount(details[0].type as (1 | 2 | 0)) / 100, details[0]?.reciept_number as number, startDate);
                return resolve(template.buffer)
            }

            return reject(false)
        }catch(error:any){
            logger.error(error?.message || error , {meta: {ref, user_id}})
            console.log(error);
            
            reject(error)
        }
    })
}

export const sendInvoiceToMail = async (user_id: string) => {
    return new Promise(async (resolve, reject) => {
        try{
            
        }catch(error:any){
            logger.error(error?.message || error , {meta: {user_id}})
            console.log(error);
            
            reject(error)
        }
    })
}