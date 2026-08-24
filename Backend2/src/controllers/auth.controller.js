const { responseHandler } = require("../utils/responseHandler/responseHandler");
const { adminLoginService, adminLogoutService, adminSignupService, createCustomerService, customerForgetPasswordService, customerLoginService, customerResetPasswordService } = require("../services/auth.service");
const messages = require("../utils/constants/messages");
const responseMessages = require("../utils/constants/responseMessages");
const { validateJwtToken } = require("../utils/validateJWT/validateJWT");

/**
 * This function creates a customer controller that handles requests to create a new customer and
 * checks if the password and confirm password fields match.
 * @param {object} req - The `req` parameter is an object that represents the HTTP request made to the
 * server. It contains information such as the request method, headers, URL, and request body.
 * @param {object} res - Response is an object that represents the HTTP response that an Express app
 * sends when it gets an HTTP request. It is used to send a response back to the client.
 * @returns either a response with a status code of 'BAD_REQUEST' or 'CREATED', depending on the
 * outcome of the createCustomerService promise. If the promise resolves successfully, the response
 * will have a status code of 'CREATED' and a message object in the data field. If the promise is
 * rejected, the response will have a status code of 'BAD_REQUEST' and an error
 */
const createCustomerController = (req, res) => {
  const user = req.body;
  const redirection = req.query.redirection || ''
  createCustomerService(user).then((data) => {
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
 * This is a function that handles customer login requests by calling a service and
 * returning a response with a token and message.
 * @param {object} req - The `req` parameter is an object that represents the HTTP request made to the
 * server. It contains information such as the request method, headers, URL, and body. In this case,
 * the `req` object is being used to extract the request body, which is expected to contain login
 * credentials for
 * @param {object} res - `res` is an object representing the HTTP response that will be sent back to
 * the client. It contains methods and properties that allow you to set the response status code,
 * headers, and body.
 */
const customerLoginController = (req, res) => {
  const credential = req.body;
  customerLoginService(credential).then((data) => {
    responseHandler(res, 'OK', data.otherData , { message: data.message })
  }).catch(error => {
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error)
  })
}

/**
 * This is a function that handles a customer forget password request by calling a service
 * and returning a response with appropriate status codes.
 * @param {object} req - The `req` parameter is an object that represents the HTTP request made by the
 * client. It contains information such as the request method, headers, URL, and body.
 * @param {object} res - `res` is an object representing the HTTP response that an Express.js server
 * sends when it receives an HTTP request. It contains methods and properties that allow you to send
 * data back to the client, such as the HTTP status code, headers, and the response body.
 */
const customerForgetPasswordController = (req, res) => {
  const body = req.body;
  customerForgetPasswordService(body.email).then((data) => {
    responseHandler(res, 'CREATED', null, data)
  }).catch((error) => {
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error)
  })
}

/**
 * This is a function that handles resetting a customer's password and returns an
 * appropriate response.
 * @param {object} req - The `req` parameter is an object that represents the HTTP request made to the
 * server. It contains information about the request such as the request method, headers, URL, and
 * body.
 * @param {object} res - `res` is the response object that is used to send the response back to the
 * client. The `res` object has
 * methods like `send`, `json`, `status`, etc. that are used to send
 * @returns a response to the client based on the outcome of the `customerResetPasswordService`
 * function. If the service function resolves successfully, the response will have a status code of
 * 'OK' and the data returned by the service function will be included in the response. If the service
 * function rejects with an error, the response will have a status code of 'UNAUTHORIZED' and the error
 */
const customerResetPasswordController = (req, res) => {
  const body = req.body;
  const token = req.headers.authorization
  const { password, confirm_password } = body;
  if (password !== confirm_password) {
    return responseHandler(res, 'BAD_REQUEST', null, { message: responseMessages.match('Password', 'Confirm Password') })
  }

  customerResetPasswordService(password, token).then((data) => {
    responseHandler(res, 'OK', null, data)
  }).catch((error) => {
    responseHandler(res, 'UNAUTHORIZED', null, error)
  })
}

/**
 * This is a function that handles the signup process for admin users, including password
 * confirmation and error handling.
 * @param {object} req - The `req` parameter is an object that represents the HTTP request made to the
 * server. It contains information about the request such as the request method, headers, URL, and
 * body.
 * @param {object} res - `res` is the response object that is used to send the response back to the
 * client. The `res` object has
 * methods like `send`, `json`, `status`, etc. that are used to send
 * @returns either a response with a status code of 400 (BAD_REQUEST) and an error message if there is
 * an error during the adminSignupService call, or a response with a status code of 201 (CREATED) and
 * the data returned by the adminSignupService call. If the confirm_password and password fields in the
 * request body are different, the function will also return a response
 */
const adminSignupController = (req, res) => {
  const body = req.body;
  const { password, confirm_password } = body;
  if (confirm_password !== password) {
    return responseHandler(res, 'BAD_REQUEST', { message: 'Password and confirm password are different', errorKey: 'confirm_password' })
  }
  delete body.confirm_password;

  adminSignupService(body).then((data) => {
    responseHandler(res, 'CREATED', { userDetails: data.data }, { message: data.message })
  }).catch((error) => {
    responseHandler(res, 'BAD_REQUEST', null, error)
  })
}


/**
 * This is a function that handles admin login requests by calling an admin login service
 * and returning a response with a token and message or an error.
 * @param {object} req - Request object which contains information about the incoming HTTP request
 * such as headers, body, and parameters.
 * @param {object} res - `res` is an object representing the HTTP response that will be sent back to
 * the client. It contains methods and properties that allow you to set the response status code,
 * headers, and body.
 */
const adminLoginController = (req, res) => {
  const body = req.body;
  adminLoginService(body).then((data) => {
    responseHandler(res, 'OK', { token: data.token }, { message: data.message })
  }).catch((error) => {
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error)
  })
}

const adminLogoutController = async (req, res) => {
  const decodedToken = await validateJwtToken(req.headers.authorization);

  adminLogoutService(decodedToken.user_id).then((data) => {
    responseHandler(res, 'OK', null, data)
  }).catch((error) => {
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error)
  })
}

module.exports = {
  createCustomerController,
  customerLoginController,
  customerForgetPasswordController,
  customerResetPasswordController,
  adminSignupController,
  adminLoginController,
  adminLogoutController,
};
