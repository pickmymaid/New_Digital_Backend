const getSubscriptionAmount = (type) => {
    return type == 0 ? 35000 : type == 1 ? 49500 : type === 3 ? 19500 : 89900;
}

const getSubscriptionPlan = ( type) => {
    return type === 0 ? 'Basic Plan' : type === 1 ? 'Standard Plan' : type === 3 ? 'Special Plan' :'Premium Plan';
}

module.exports = { getSubscriptionAmount, getSubscriptionPlan };
