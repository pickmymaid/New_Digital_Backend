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

const verifyPayment = async(ref, user_id) => {
    const paymentDoc = await paymentModel.findOne({transRef: ref, user_id});

    if(!paymentDoc){
        throw new Error('User and token missmatch')
    }else if(paymentDoc?.status !== 1){
        const expiryDate = subscriptionExpiryDateGenerator(paymentDoc?.type);
        const paymentDate = new Date();
        await paymentModel.updateOne({user_id, transRef: ref},{
            $set: {
                status: 1,
                is_paid: true,
                expiryDate,
                paymentDate
            }
        })
        await paymentModel.deleteMany({user_id, status: 0})

        return {
            reciept: paymentDoc?.reciept_number,
            type: paymentDoc?.type,
            ref: paymentDoc?.transRef,
            expiryDate,
            paymentDate,
            status: 1
        }
    }else{
        return {
            reciept: paymentDoc?.reciept_number,
            type: paymentDoc?.type,
            ref: paymentDoc?.transRef,
            expiryDate: paymentDoc?.expiryDate,
            paymentDate: paymentDoc?.paymentDate,
            status: paymentDoc?.status
        }
    }

}

module.exports = { savePayment, getAccessTokenWithRef, getPaymentDetails, verifyPayment };
