const { getPaginatedMaidsService } = require("../../services/v2/maids.service");
const { responseHandler } = require("../../utils/responseHandler/responseHandler");
const { queryParser } = require("../../utils/queryParser/queryParser");
const { decodeJWT } = require("../../utils/decodeJWT/decodeJWT");
const logger = require("../../config/logger");
const { logErrorWithSource } = logger;

const getPaginatedMaidsController = (req, res) => {
    const {page} = req.params;
    const {query} = req;
    const token = req.headers.authorization?.split(' ')[1];
    let user_id = null

    if(token){
        const decoded = decodeJWT(token)
        user_id = decoded?.user_id
    }

    const location = query?.location || query?.country


    const filter = {
        option: queryParser(query?.option, true),
        location: queryParser(location),
        availability: queryParser(query?.availability, true),
        skills: queryParser(query?.skills, true),
        ageFrom: query?.ageFrom,
        ageTo: query?.ageTo,
        nationality: queryParser(query?.nationality, true),
        salary: queryParser(query?.salary, true),
        service: queryParser(query?.service, true),
        visa: queryParser(query?.visa, true ),
        religion: queryParser(query?.religion, true),
        searchParams: query?.searchParams
    }

    getPaginatedMaidsService(page, filter, query?.sort, user_id)
        .then(data => {
            responseHandler(res,'OK',data)
        })
        .catch((error) => {
            logErrorWithSource(error, {meta: req.query})
            responseHandler(res,'INTERNAL_SERVER_ERROR',error)
        })
}

module.exports = { getPaginatedMaidsController };
