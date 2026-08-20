import axios from "axios";

export const verifyPaymentWithCred = async (accessToken: string, orderRef: string) => {
    const outletRef = process.env.PG_OUTLET_REFERENCE;
    const baseURL = process.env.PG_BASE_URL
    const {data:{_embedded: {payment}}} = await axios.get(
        `${baseURL}/transactions/outlets/${outletRef}/orders/${orderRef}`,
        {
            headers:{
                'Authorization': `Bearer ${accessToken}`
            }
        }
    )

    console.log({p:payment[0]});
    return payment[0]?.state as 'PURCHASED' | 'FAILED'
}

// https://api-gateway.ngenius-payments.com/identity/auth/access-token  
