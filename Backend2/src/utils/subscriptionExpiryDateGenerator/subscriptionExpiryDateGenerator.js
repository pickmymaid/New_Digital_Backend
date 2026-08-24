const subscriptionExpiryDateGenerator = (type) => {
        const expiryDate = new Date();
        const currentMonth = expiryDate.getMonth();

        if(type === 3){
            expiryDate.setDate(expiryDate.getDate() + 14);

        }else if(type === 0 || type === 2){
            expiryDate.setDate(expiryDate.getDate() + 29)
        }else{
            expiryDate.setDate(expiryDate.getDate() + 59)
        }

        return expiryDate;
}

module.exports = { subscriptionExpiryDateGenerator };
