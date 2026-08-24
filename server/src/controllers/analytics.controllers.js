const { decodeJWT } = require("../utils/decodeJWT/decodeJWT");
const { emailRedirectCapture, getCategoryAnalyticsDataService, saveCategoryForAnalyticsService } = require("../services/analytics.service");
const { responseHandler } = require("../utils/responseHandler/responseHandler");

const saveCategoryForAnalyticsController = (req, res) => {
    const data = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if(token){
        const decoded = decodeJWT(token)
        data.user_id = decoded?.user_id
    }

    saveCategoryForAnalyticsService(data)
        .then((resp) => {
            console.log(resp,'this is resp')
            responseHandler(res, 'CREATED', null)
        }).catch(() => {
            responseHandler(res, 'BAD_REQUEST', null, { message: 'Somtehing Went Wrong' })
        })
}

const getCategoryAnalyticsDataController = async (req, res) => {
    const {query} = req;
    getCategoryAnalyticsDataService(query?.from, query?.to)
        .then((data) => {
            console.log({data});

            responseHandler(res, 'OK', data)
        })
        .catch((err) => {
            responseHandler(res, 'BAD_REQUEST', null, { message: 'Somtehing Went Wrong' })
        })
}

const emailClickCapture = async (req, res) => {
    const {type} = req.body;
    emailRedirectCapture(type)
        .then((data) => {
            responseHandler(res, 'OK', data)
        })
        .catch((err) => {
            responseHandler(res, 'BAD_REQUEST', null, { message: 'Somtehing Went Wrong' })
        })
}

module.exports = { saveCategoryForAnalyticsController, getCategoryAnalyticsDataController, emailClickCapture };
