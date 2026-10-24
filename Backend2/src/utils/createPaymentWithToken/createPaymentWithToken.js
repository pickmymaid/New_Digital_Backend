const axios = require("axios");

// amount is in fils (AED * 100), already discounted by any coupon.
const createPaymentWithToken = async (accessToken, amount, customer) => {
    const outletRef = process.env.PG_OUTLET_REFERENCE;
    const baseURL = process.env.PG_BASE_URL;

    const body = {
        action: 'PURCHASE',
        amount: {
            currencyCode: 'AED',
            value: amount
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

module.exports = { createPaymentWithToken };
