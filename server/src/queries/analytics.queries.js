const { FavStatics } = require("../models/favouriteCategoryStatistics/favouriteCategoryStatistics.model");

const saveCategoryForAnalytics = async (data) => {
    try{
        const body = {
            category: data.category,
            maid_id: data.maid_id
        }

        if(data?.user_id) body.user_id = data.user_id

        const newAnalytics = new FavStatics(body)

        return await newAnalytics.save()
    }catch(err){
        throw new Error(err?.message)
    }
}

const getCategoryForAnalyticsWithUser = async (user, maid) => {
    try{
        const response = await FavStatics.findOne({user_id: user, maid_id: maid})
        return response;
    }catch(err){
        throw new Error(err?.message)
    }
}

const getCategoryAnalyticsBetweenDate = async (from,to) => {
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
    }catch(err){
        throw new Error(err?.message)
    }
}

module.exports = { saveCategoryForAnalytics, getCategoryForAnalyticsWithUser, getCategoryAnalyticsBetweenDate };
