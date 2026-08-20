import { NextFunction } from "express";
import { responseHandler } from "../utils/responseHandler/responseHandler";

export const validateUser = async (req: any, res: any, next: NextFunction) => {
    try{
        if(req?.user){
            next()
        }else{
            responseHandler(res, 'UNAUTHORIZED')
        }
    }catch (error) {
        console.log(error,'this is error');
        return responseHandler(res, 'UNAUTHORIZED')
    }
}