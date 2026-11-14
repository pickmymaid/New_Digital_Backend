const { paymentModel } = require("../../models/payment/payment.model");
const { subscriptionExpiryDateGenerator } = require("../../utils/subscriptionExpiryDateGenerator/subscriptionExpiryDateGenerator");

const savePayment = async(paymentCredentials) => {
    const lastPayment = await paymentModel.findOne({}).sort({_id: -1})

    let reciept_number = 300
    if(lastPayment?.reciept_number){
        reciept_number = lastPayment?.reciept_number + 1
    }

    const newPayment  = new paymentModel({
        ...paymentCredentials,
        reciept_number,
        status: 0,
        expiryDate: subscriptionExpiryDateGenerator(paymentCredentials.type),
        paymentDate: new Date()
    })
    await newPayment.save();
    return true;
}

const getAccessTokenWithRef = async (ref) => {
    const response = await paymentModel.findOne({transRef: ref});

    if(response){
        return {
            accessToken: response?.transactionToken,
            createdDate: response?.updatedAt
        }
    }else{
        return false;
    }
}

const getPaymentDetails = async (ref, user_id) => {
    try{
        const response = await paymentModel.aggregate([
            {
                $match: {
                    transRef: ref,
                    user_id
                }
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: 'user_id',
                    foreignField: 'user_id',
                    as: 'customer'
                }
            },
            {
                $unwind: {
                    path: '$customer',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);
        return response
    }catch(error){
        throw error;
    }
}

const findPaymentByRef = async (ref) => {
    return await paymentModel.findOne({transRef: ref});
}

// Atomic unpaid -> paid flip. Only the caller that gets modifiedCount 1 did
// it, so the webhook, the customer's return page, the reconcile job and
// any number of replicas can all confirm the same order at once and the
// plan is activated (and the receipt sent) exactly once.
const markPaidIfUnpaid = async (ref, expiryDate, paymentDate) => {
    return await paymentModel.updateOne(
        {transRef: ref, status: {$ne: 1}, is_paid: {$ne: true}},
        {$set: {status: 1, is_paid: true, expiryDate, paymentDate}}
    );
}

// N-Genius orders still waiting for confirmation. Every N-Genius order
// stores the amount it was created with; v1 (3G) records never do.
const findUnconfirmedNgeniusPayments = async (from, to, limit) => {
    return await paymentModel.find({
        status: 0,
        is_paid: {$ne: true},
        amount: {$exists: true},
        createdAt: {$gte: from, $lte: to},
    }).sort({createdAt: 1}).limit(limit);
}

module.exports = { savePayment, getAccessTokenWithRef, getPaymentDetails, findPaymentByRef, markPaidIfUnpaid, findUnconfirmedNgeniusPayments };
