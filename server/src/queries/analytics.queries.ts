import { FavStatics } from "../models/favouriteCategoryStatistics/favouriteCategoryStatistics.model";
import { ICategoryAnalyticsBody, ICategoryAnalyticsDataReturn } from "../types/requestBody.types";

export const saveCategoryForAnalytics = async (data: ICategoryAnalyticsBody) => {
    try{
        const body: ICategoryAnalyticsBody = {
            category: data.category,
            maid_id: data.maid_id
        }

        if(data?.user_id) body.user_id = data.user_id

        const newAnalytics = new FavStatics(body)
        
        return await newAnalytics.save()
    }catch(err: any){
        throw new Error(err?.message)
    }
}

export const getCategoryForAnalyticsWithUser = async (user: string, maid: string): Promise<any> => {
    try{
        const response = await FavStatics.findOne({user_id: user, maid_id: maid})
        return response;
    }catch(err: any){
        throw new Error(err?.message)
    }
}

export const getCategoryAnalyticsBetweenDate = async (from: string | undefined,to: string | undefined): Promise<ICategoryAnalyticsDataReturn[]> => {
    try{
        console.log(new Date(from || '2010/12/22'),new Date(to || new Date()), new Date().toLocaleDateString());
        
        const data = await FavStatics.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(from || '2010/12/22'),
                        $lte: new Date(to || new Date())
                    }
                }
            },
            {
                $group: {
                    _id: "$category",
                    count: {$sum: 1}
                }
            }
        ])
        console.log(data, 'dd');
        
        return data;
    }catch(err: any){
        throw new Error(err?.message)
    }
}