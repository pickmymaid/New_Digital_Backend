import { paymentModel } from "../../models/payment/payment.model";
import { IPaymentCl, IPaymentCreateBody, IPaymentCredentials } from "../../types/requestBody.types";
import { subscriptionExpiryDateGenerator } from "../../utils/subscriptionExpiryDateGenerator/subscriptionExpiryDateGenerator";

export const savePayment = async(paymentCredentials: IPaymentCredentials) => {
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

export const getAccessTokenWithRef = async (ref: string):Promise<{
    accessToken: string;
    createdDate: Date | string;
} | false> => {
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

export const getPaymentDetails = async (ref: string, user_id: string) => {
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

export const verifyPayment = async(ref: string, user_id: string) => {
    const paymentDoc = await paymentModel.findOne({transRef: ref, user_id});
    
    if(!paymentDoc){
        throw new Error('User and token missmatch')
    }else if(paymentDoc?.status !== 1){
        const expiryDate = subscriptionExpiryDateGenerator(paymentDoc?.type as 0 | 1 | 2);
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