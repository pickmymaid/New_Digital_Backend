import { Request, Response } from "express";
import { getPaginatedMaidsService } from "../../services/v2/maids.service";
import { responseHandler } from "../../utils/responseHandler/responseHandler";
import { queryParser } from "../../utils/queryParser/queryParser";
import { decodeJWT } from "../../utils/decodeJWT/decodeJWT";
import logger, { logErrorWithSource } from "../../config/logger";

export const getPaginatedMaidsController = (req:Request, res: Response) => {
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
        option: queryParser(query?.option as string, true),
        location: queryParser(location as string),
        availability: queryParser(query?.availability as string, true), 
        skills: queryParser(query?.skills as string, true),
        ageFrom: query?.ageFrom as string,
        ageTo: query?.ageTo as string,
        nationality: queryParser(query?.nationality as string, true),
        salary: queryParser(query?.salary as string, true),
        service: queryParser(query?.service as string, true),
        visa: queryParser(query?.visa as string, true ),
        religion: queryParser(query?.religion as string, true),
        searchParams: query?.searchParams as string
    }

    getPaginatedMaidsService(page, filter, query?.sort as string | null, user_id)
        .then(data => {
            responseHandler(res,'OK',data)
        })
        .catch((error) => {
            logErrorWithSource(error, {meta: req.query})
            responseHandler(res,'INTERNAL_SERVER_ERROR',error)
        })
}