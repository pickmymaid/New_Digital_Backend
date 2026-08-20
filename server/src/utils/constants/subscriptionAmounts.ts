export const getSubscriptionAmount = (type: 0 | 1 | 2 | 3) => {
    return type == 0 ? 35000 : type == 1 ? 49500 : type === 3 ? 19500 : 89900; 
}

export const getSubscriptionPlan = ( type: 0 | 1 | 2 | 3) => {
    return type === 0 ? 'Basic Plan' : type === 1 ? 'Standard Plan' : type === 3 ? 'Special Plan' :'Premium Plan';
}