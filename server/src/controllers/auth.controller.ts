import { Request, Response } from "express";
import { IAdminLoginBody, IAdminLogoutBody, IAdminRegisterBody, ICustomerForgetPassBody, ICustomerLoginBody, ICustomerRegisterBody, ICustomerResetPassBody } from "../types/requestBody.types";
import { responseHandler } from "../utils/responseHandler/responseHandler";
import { adminLoginService, adminLogoutService, adminSignupService, createCustomerService, customerForgetPasswordService, customerLoginService, customerResetPasswordService } from "../services/auth.service";
import { ICustomerCollection } from "../types/dbStructureTypes";
import { string } from "yup";
import messages from "../utils/constants/messages";
import responseMessages from "../utils/constants/responseMessages";
import { RequestOptions } from "http";
import { validateJwtToken } from "../utils/validateJWT/validateJWT";

/**
 * This function creates a customer controller that handles requests to create a new customer and
 * checks if the password and confirm password fields match.
 * @param {Request} req - The `req` parameter is an object that represents the HTTP request made to the
 * server. It contains information such as the request method, headers, URL, and request body.
 * @param {Response} res - Response is an object that represents the HTTP response that an Express app
 * sends when it gets an HTTP request. It is used to send a response back to the client.
 * @returns either a response with a status code of 'BAD_REQUEST' or 'CREATED', depending on the
 * outcome of the createCustomerService promise. If the promise resolves successfully, the response
 * will have a status code of 'CREATED' and a message object in the data field. If the promise is
 * rejected, the response will have a status code of 'BAD_REQUEST' and an error
 */
export const createCustomerController = (req: Request, res: Response) => {
  const user: ICustomerRegisterBody = req.body;
  const redirection = req.query.redirection || ''
  createCustomerService(user).then((data: any) => {
    req.logIn(data.user,(err) => {
      if(err){
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, { err })
      }
      responseHandler(res, 'CREATED', data.user, { message: data.message, redirection: "pricing" })
    })
  }).catch(message => {
    responseHandler(res, 'BAD_REQUEST', null, { message })
  })
}


/**
 * This is a TypeScript function that handles customer login requests by calling a service and
 * returning a response with a token and message.
 * @param {Request} req - The `req` parameter is an object that represents the HTTP request made to the
 * server. It contains information such as the request method, headers, URL, and body. In this case,
 * the `req` object is being used to extract the request body, which is expected to contain login
 * credentials for
 * @param {Response} res - `res` is an object representing the HTTP response that will be sent back to
 * the client. It contains methods and properties that allow you to set the response status code,
 * headers, and body. In this specific code snippet, `res` is used to send a response back to the
 * client with a
 */
export const customerLoginController = (req: Request, res: Response) => {
  const credential: ICustomerLoginBody = req.body;
  customerLoginService(credential).then((data: any) => {
    responseHandler(res, 'OK', data.otherData , { message: data.message })
  }).catch(error => {
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error)
  })
}

/**
 * This is a TypeScript function that handles a customer forget password request by calling a service
 * and returning a response with appropriate status codes.
 * @param {Request} req - The `req` parameter is an object that represents the HTTP request made by the
 * client. It contains information such as the request method, headers, URL, and body.
 * @param {Response} res - `res` is an object representing the HTTP response that an Express.js server
 * sends when it receives an HTTP request. It contains methods and properties that allow you to send
 * data back to the client, such as the HTTP status code, headers, and the response body. In this case,
 * `res`
 */
export const customerForgetPasswordController = (req: Request, res: Response) => {
  const body: ICustomerForgetPassBody = req.body;
  customerForgetPasswordService(body.email).then((data: any) => {
    responseHandler(res, 'CREATED', null, data)
  }).catch((error: any) => {
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error)
  })
}

/**
 * This is a TypeScript function that handles resetting a customer's password and returns an
 * appropriate response.
 * @param {Request} req - The `req` parameter is an object that represents the HTTP request made to the
 * server. It contains information about the request such as the request method, headers, URL, and
 * body.
 * @param {Response} res - `res` is the response object that is used to send the response back to the
 * client. It is an instance of the `Response` class from the `express` module. The `res` object has
 * methods like `send`, `json`, `status`, etc. that are used to send
 * @returns a response to the client based on the outcome of the `customerResetPasswordService`
 * function. If the service function resolves successfully, the response will have a status code of
 * 'OK' and the data returned by the service function will be included in the response. If the service
 * function rejects with an error, the response will have a status code of 'UNAUTHORIZED' and the error
 */
export const customerResetPasswordController = (req: Request, res: Response) => {
  const body: ICustomerResetPassBody = req.body;
  const token = req.headers.authorization
  const { password, confirm_password } = body;
  if (password !== confirm_password) {
    return responseHandler(res, 'BAD_REQUEST', null, { message: responseMessages.match('Password', 'Confirm Password') })
  }

  customerResetPasswordService(password, token).then((data: any) => {
    responseHandler(res, 'OK', null, data)
  }).catch((error: any) => {
    responseHandler(res, 'UNAUTHORIZED', null, error)
  })
}

/**
 * This is a TypeScript function that handles the signup process for admin users, including password
 * confirmation and error handling.
 * @param {Request} req - The `req` parameter is an object that represents the HTTP request made to the
 * server. It contains information about the request such as the request method, headers, URL, and
 * body.
 * @param {Response} res - `res` is the response object that is used to send the response back to the
 * client. It is an instance of the `Response` class from the `express` module. The `res` object has
 * methods like `send`, `json`, `status`, etc. that are used to send
 * @returns either a response with a status code of 400 (BAD_REQUEST) and an error message if there is
 * an error during the adminSignupService call, or a response with a status code of 201 (CREATED) and
 * the data returned by the adminSignupService call. If the confirm_password and password fields in the
 * request body are different, the function will also return a response
 */
export const adminSignupController = (req: Request, res: Response) => {
  const body: IAdminRegisterBody = req.body;
  const { password, confirm_password } = body;
  if (confirm_password !== password) {
    return responseHandler(res, 'BAD_REQUEST', { message: 'Password and confirm password are different', errorKey: 'confirm_password' })
  }
  delete body.confirm_password;

  adminSignupService(body).then((data: any) => {
    responseHandler(res, 'CREATED', { userDetails: data.data }, { message: data.message })
  }).catch((error: any) => {
    responseHandler(res, 'BAD_REQUEST', null, error)
  })
}





/**
 * This is a TypeScript function that handles admin login requests by calling an admin login service
 * and returning a response with a token and message or an error.
 * @param {Request} req - Request object which contains information about the incoming HTTP request
 * such as headers, body, and parameters.
 * @param {Response} res - `res` is an object representing the HTTP response that will be sent back to
 * the client. It contains methods and properties that allow you to set the response status code,
 * headers, and body. In this specific code snippet, `res` is used to send a response back to the
 * client with a
 */
export const adminLoginController = (req: Request, res: Response) => {
  const body: IAdminLoginBody = req.body;
  adminLoginService(body).then((data: any) => {
    responseHandler(res, 'OK', { token: data.token }, { message: data.message })
  }).catch((error: any) => {
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error)
  })
}

export const adminLogoutController = async (req: Request, res: Response) => {
  const decodedToken: any = await validateJwtToken(req.headers.authorization);

  adminLogoutService(decodedToken.user_id).then((data: any) => {
    responseHandler(res, 'OK', null, data)
  }).catch((error: any) => {
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error)
  })
}