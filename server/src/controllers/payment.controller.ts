import { IPaymentBody, IPaymentTokenBody } from './../types/requestBody.types';
import { responseHandler } from '../utils/responseHandler/responseHandler';
import { Request, Response } from 'express';
import { generatePaymentTokenService, getPaymentsService, getUserPaymentDetails, manualVerifyPaymentService, verifyPaymentTokenService } from '../services/payment.service';
import { validateJwtToken } from '../utils/validateJWT/validateJWT';
import logger, { logErrorWithSource } from '../config/logger';

//Payment first step to generate link
export const generatePaymentTokenController = (req: Request, res: Response) => {
  try {
    let body: IPaymentBody = req.body;
    let token = req.headers.authorization?.split(' ')[1] as string;
    body.token = token;

    generatePaymentTokenService(body)
      .then((data: any) => {
        responseHandler(res, 'OK', { URL: data });
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//verify the token is valid

export const verifyPaymentTokenController = (req: Request, res: Response) => {
  try {
    let body: IPaymentBody = req.body;
    let token = req.headers.authorization?.split(' ')[1] as string;
    body.token = token;

    verifyPaymentTokenService(body)
      .then((data: any) => {
        responseHandler(res, 'OK', { data });
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};


export const getPaymentsController = (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : (page ? 10 : undefined);
    const search = req.query.search as string;

    getPaymentsService(page, limit, search)
      .then((data: any) => {
        if (page) {
          responseHandler(res, 'OK', { 
            payments: data.data, 
            count: data.count,
            page,
            limit
          });
        } else {
          responseHandler(res, 'OK', { payments: data.data });
        }
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

export const getUserPaymentDetailsController = async (req: Request, res: Response) => {
  const user:any = req.user
  let userID: string = user?._id;

  getUserPaymentDetails(userID || '').then((user) => {
    responseHandler(res, 'OK', { user });
  }).catch((error: any) => {
    logErrorWithSource(error, {meta: {body: req.body}})
    console.log({ error });
    responseHandler(res, 'INTERNAL_SERVER_ERROR')
  })
}

export const manualPaymentController = async (req: Request, res: Response)=>{
  let body: IPaymentTokenBody = req.body;
 
    try{

      manualVerifyPaymentService(body).then((data: any) => {
        responseHandler(res, 'OK', { data });
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
    } catch (error: any) {
      logErrorWithSource(error, {meta: {body: req.body}})
      responseHandler(res, 'INTERNAL_SERVER_ERROR');
    }
}