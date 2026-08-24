const { ClickSchemaModel } = require("../models/click/click.model");
const { getCategoryAnalyticsBetweenDate, getCategoryForAnalyticsWithUser, saveCategoryForAnalytics } = require("../queries/analytics.queries");

const saveCategoryForAnalyticsService = (data) => {
    return new Promise(async (resolve, reject) => {
        try{
            if(data?.user_id){
                const isDuplicate = await getCategoryForAnalyticsWithUser(data?.user_id, data.maid_id)
                if(isDuplicate && new Date(isDuplicate.createdAt).toLocaleDateString() === new Date().toLocaleDateString()){
                    return resolve(true)
                }
            }

            await saveCategoryForAnalytics(data);
            return resolve(true)
        }catch(error){
            console.log(error);
            return resolve(error?.message)
        }
    })
}

const getCategoryAnalyticsDataService = async (from, to) => {
    return new Promise(async(resolve, reject) => {
        try{
            const data = await getCategoryAnalyticsBetweenDate(from, to);
            return resolve(data)
        }catch(error){
            return resolve(error?.message)
        }
    })
}

const emailRedirectCapture = async (type) => {
    return new Promise(async(resolve, reject) => {
        try{
            await ClickSchemaModel.create({
                type
            })
            return true
        }catch(error){
            return resolve(error?.message)
        }
    })
}

module.exports = { saveCategoryForAnalyticsService, getCategoryAnalyticsDataService, emailRedirectCapture };
