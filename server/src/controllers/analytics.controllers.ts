import { Request, Response } from "express";
import { ICategoryAnalyticsBody, ICategoryAnalyticsDataReturn } from "../types/requestBody.types";
import { decodeJWT } from "../utils/decodeJWT/decodeJWT";
import { emailRedirectCapture, getCategoryAnalyticsDataService, saveCategoryForAnalyticsService } from "../services/analytics.service";
import { responseHandler } from "../utils/responseHandler/responseHandler";

export const saveCategoryForAnalyticsController = (req: Request, res: Response) => {
    const data: ICategoryAnalyticsBody = req.body;
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

export const getCategoryAnalyticsDataController = async (req: Request, res: Response) => {
    const {query} = req;
    getCategoryAnalyticsDataService(query?.from as (string | undefined), query?.to  as (string | undefined))
        .then((data) => {
            console.log({data});
            
            responseHandler(res, 'OK', data)
        })
        .catch((err: any) => {
            responseHandler(res, 'BAD_REQUEST', null, { message: 'Somtehing Went Wrong' })
        })
}

export const emailClickCapture = async (req: Request, res: Response) => {
    const {type} = req.body;
    emailRedirectCapture(type)
        .then((data) => {
            responseHandler(res, 'OK', data)
        })
        .catch((err: any) => {
            responseHandler(res, 'BAD_REQUEST', null, { message: 'Somtehing Went Wrong' })
        })
}