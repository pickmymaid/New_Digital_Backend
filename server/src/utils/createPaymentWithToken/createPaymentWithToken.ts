import axios from "axios"
import { ICustomerCollection } from "../../types/dbStructureTypes";

export const createPaymentWithToken = async (accessToken: string, type: 0 | 1 | 2 | 3, customer: any) => {
    const outletRef: string = process.env.PG_OUTLET_REFERENCE as string;
    const baseURL = process.env.PG_BASE_URL;
    
    const body = {
        action: 'PURCHASE',
        amount: {
            currencyCode: 'AED',
            value: type == 0 ? 35000 : type == 1 ? 49500 : type === 3? 19500 :89900
        },
        emailAddress: customer?.email,
        merchantAttributes: {
            redirectUrl: process.env.PAYMENT_REDIRECT_URL,
            cancelUrl: process.env.BASE_URL,
            skipConfirmationPage: true
        },
        billingAddress: {
            firstName: customer?.first_name,
            lastName: '',
        }
    }

    const response = await axios.post(
        `${baseURL}/transactions/outlets/${outletRef}/orders`,
        body,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/vnd.ni-payment.v2+json',
                'Accept': 'application/vnd.ni-payment.v2+json'
            }
        }
    )

    console.log(response.data);
    return response.data;
    
}