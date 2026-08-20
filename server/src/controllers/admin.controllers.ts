import { Request, Response, response } from "express";
import { validateJwtToken } from "../utils/validateJWT/validateJWT";
import { deleteTeamMemberService, getCustomersService, getTeamMembersService, maidHistory, teamMemberRoleChangeService, toggleUserBlock, updateCustomerPasswordService } from "../services/admin.service";
import { responseHandler } from "../utils/responseHandler/responseHandler";
import { sendMail } from "../utils/sendMail/sendMail";
import { verifyPaymentService } from "../services/v2/payment.service";
import logger, { logErrorWithSource } from "../config/logger";

/**
 * This function retrieves team members and sends a response with the retrieved data or an error
 * message.
 * @param {Request} req - The `req` parameter is an object representing the HTTP request made to the
 * server. It contains information such as the request method, headers, URL, and any data sent in the
 * request body.
 * @param {Response} res - `res` is the response object that is used to send the response back to the
 * client. It is an instance of the `Response` class from the `express` module. It contains methods to
 * set the HTTP status code, headers, and body of the response. In this code snippet, it
 */
export const getTeamMembersController = async (req: Request, res: Response) => {
  try {
    const decodedToken: any = await validateJwtToken(req.headers.authorization);
    getTeamMembersService(decodedToken?.user_id)
      .then((data: any) => {
        responseHandler(res, 'OK', { team: data });
      })
      .catch((error: any) => {
        logErrorWithSource(error , {meta: {body: req.body}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error: any) {
    logErrorWithSource(error , {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
}

export const deleteTeamMemberController = async (req: Request, res: Response) => {
  let id: string = req.params.id;
  deleteTeamMemberService(id).then((data: any) => {
    responseHandler(res, 'OK', null, data)
  }).catch((error: any) => {
    logErrorWithSource(error , {meta: {body: req.body}})
    responseHandler(res, 'NOT_FOUND', null, error)
  })
}

export const teamMemberRoleChangeController = async (req: Request, res: Response) => {
  const id: string = req?.params?.id;
  teamMemberRoleChangeService(id).then((data: any) => {
    responseHandler(res, 'OK', null, data)
  }).catch((error: any) => {
    logErrorWithSource(error , {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error)
  })
}


export const getCustomersController = async (req: Request, res: Response) => {
  try {
    let page = parseInt((req.query.page as string));
    let limit = parseInt(req.query.limit as string);
    let search = req.query.search as string || ""; 
    getCustomersService(page, limit, search)
      .then((data: any) => {
        responseHandler(res, 'OK', { customer: data });
      })
      .catch((error: any) => {
        console.error(error, 'this is error')
        logErrorWithSource(error , {meta: {body: req.body}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error: any) {
    console.error(error, 'this is error')
    logErrorWithSource(error , {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

export const updateCustomerPasswordController = async (req: Request, res: Response) => {
  const { user_id } = req.body;
  updateCustomerPasswordService(user_id)
    .then((data: any) => {
      responseHandler(res, 'OK', { password: data.password }, { message: data.message })
    }).catch(errorMessage => {
      logger.error(errorMessage , {meta: {body: req.body}})
      responseHandler(res, 'INTERNAL_SERVER_ERROR', null, { message: errorMessage })
    })
}

export const verifyCustomerPaymentController = async (req: Request, res: Response) => {
  const {transRef, user_id} = req.body;
  
  verifyPaymentService(transRef, user_id)
    .then((data:any) => {
        responseHandler(res,'OK',data)
    }).catch((error:any) => {
      logErrorWithSource(error , {meta: {body: req.body}})
        responseHandler(res,'INTERNAL_SERVER_ERROR',null,{message: error})
    })
}


export const toggleUserBlockController = (req: Request, res: Response) => {
  const {user_id} = req.params;

  toggleUserBlock(user_id)
    .then((result:any) => {
        responseHandler(res,'OK',result.data, {message: result.message})
    }).catch((error:any) => {
        logErrorWithSource(error , {meta: {body: req.body}})
        responseHandler(res,'INTERNAL_SERVER_ERROR',null,{message: error})
    })
}

export const getMaidHistory = (req: Request, res: Response) => {
  const {maid_id} = req.params;
  if(!maid_id){
    return responseHandler(res, 'BAD_REQUEST', null, {message: 'Maid ID is required'})
  }

  maidHistory(maid_id)
    .then((result: any) => {
      responseHandler(res,'OK', result, {message: 'Fetched Successfully!'})
    }).catch((error:any) => {
      logErrorWithSource(error, {meta: {maid_id}})
      responseHandler(res, 'INTERNAL_SERVER_ERROR', null, {})
    })

}