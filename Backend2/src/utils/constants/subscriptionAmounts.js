// Package prices in fils (AED * 100) — what the payment gateway is charged
// before any coupon. Starter (type 3) is AED 0.38.
const getSubscriptionAmount = (type) => {
    return type == 0 ? 35000 : type == 1 ? 49500 : type === 3 ? 38 : 89900;
}

// What records created before `amount` was stored on payments were charged
// (Starter was AED 195 then). Only for re-generating their invoices.
const getLegacySubscriptionAmount = (type) => {
    return type === 3 ? 19500 : getSubscriptionAmount(type);
}

const getSubscriptionPlan = ( type) => {
    return type === 0 ? 'Basic Plan' : type === 1 ? 'Standard Plan' : type === 3 ? 'Special Plan' :'Premium Plan';
}

module.exports = { getSubscriptionAmount, getLegacySubscriptionAmount, getSubscriptionPlan };
