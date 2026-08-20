import { ClickSchemaModel } from "../models/click/click.model";
import { getCategoryAnalyticsBetweenDate, getCategoryForAnalyticsWithUser, saveCategoryForAnalytics } from "../queries/analytics.queries";
import { ICategoryAnalyticsBody } from "../types/requestBody.types"

export const saveCategoryForAnalyticsService = (data: ICategoryAnalyticsBody) => {
    return new Promise(async (resolve, reject) => {
        try{
            if(data?.user_id){
                const isDuplicate = await getCategoryForAnalyticsWithUser(data?.user_id, data.maid_id as string)
                if(isDuplicate && new Date(isDuplicate.createdAt).toLocaleDateString() === new Date().toLocaleDateString()){
                    return resolve(true)
                }
            }

            await saveCategoryForAnalytics(data);
            return resolve(true)
        }catch(error: any){
            console.log(error);
            return resolve(error?.message)
        }
    })
}

export const getCategoryAnalyticsDataService = async (from: string|undefined, to: string|undefined) => {
    return new Promise(async(resolve, reject) => {
        try{
            const data = await getCategoryAnalyticsBetweenDate(from, to);
            return resolve(data)
        }catch(error: any){
            return resolve(error?.message)
        }
    })
}

export const emailRedirectCapture = async (type) => {
    return new Promise(async(resolve, reject) => {
        try{
            await ClickSchemaModel.create({
                type
            })
            return true
        }catch(error: any){
            return resolve(error?.message)
        }
    })
}
