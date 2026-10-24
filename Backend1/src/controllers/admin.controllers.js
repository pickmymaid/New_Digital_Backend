const { validateJwtToken } = require("../utils/validateJWT/validateJWT");
const { deleteTeamMemberService, getCustomersService, getTeamMembersService, maidHistory, teamMemberRoleChangeService, toggleUserBlock, updateCustomerPasswordService } = require("../services/admin.service");
const { responseHandler } = require("../utils/responseHandler/responseHandler");
const { sendMail } = require("../utils/sendMail/sendMail");
const paymentServiceClient = require("../integrations/paymentServiceClient");
const logger = require("../config/logger");
const { logErrorWithSource } = logger;
const messages = require("../utils/constants/messages");

/**
 * This function retrieves team members and sends a response with the retrieved data or an error
 * message.
 * @param {object} req - The `req` parameter is an object representing the HTTP request made to the
 * server. It contains information such as the request method, headers, URL, and any data sent in the
 * request body.
 * @param {object} res - `res` is the response object that is used to send the response back to the
 * client. It contains methods to
 * set the HTTP status code, headers, and body of the response.
 */
const getTeamMembersController = async (req, res) => {
  try {
    const decodedToken = await validateJwtToken(req.headers.authorization);
    getTeamMembersService(decodedToken?.user_id)
      .then((data) => {
        responseHandler(res, 'OK', { team: data });
      })
      .catch((error) => {
        logErrorWithSource(error , {meta: {body: req.body}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error) {
    logErrorWithSource(error , {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
}

const deleteTeamMemberController = async (req, res) => {
  let id = req.params.id;
  deleteTeamMemberService(id).then((data) => {
    responseHandler(res, 'OK', null, data)
  }).catch((error) => {
    logErrorWithSource(error , {meta: {body: req.body}})
    responseHandler(res, 'NOT_FOUND', null, error)
  })
}

const teamMemberRoleChangeController = async (req, res) => {
  const id = req?.params?.id;
  teamMemberRoleChangeService(id).then((data) => {
    responseHandler(res, 'OK', null, data)
  }).catch((error) => {
    if (error?.message === messages.error.USER_NOT_FOUND) {
      return responseHandler(res, 'NOT_FOUND', null, error)
    }
    logErrorWithSource(error , {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error)
  })
}


const getCustomersController = async (req, res) => {
  try {
    // parseInt of a missing param is NaN, which MongoDB rejects in $skip
    let page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 100; // fixed page size
    let search = typeof req.query.search === "string" ? req.query.search : "";
    getCustomersService(page, limit, search)
      .then((data) => {
        responseHandler(res, 'OK', { customer: data });
      })
      .catch((error) => {
        console.error(error, 'this is error')
        logErrorWithSource(error , {meta: {body: req.body}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error) {
    console.error(error, 'this is error')
    logErrorWithSource(error , {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

const updateCustomerPasswordController = async (req, res) => {
  const { user_id } = req.body;
  if (typeof user_id !== 'string' || !user_id) {
    return responseHandler(res, 'BAD_REQUEST', null, { message: 'user_id is required.' })
  }
  updateCustomerPasswordService(user_id)
    .then((data) => {
      responseHandler(res, 'OK', { password: data.password }, { message: data.message })
    }).catch(errorMessage => {
      if (errorMessage === messages.error.USER_NOT_FOUND) {
        return responseHandler(res, 'NOT_FOUND', null, { message: errorMessage })
      }
      logger.error(errorMessage , {meta: {body: req.body}})
      responseHandler(res, 'INTERNAL_SERVER_ERROR', null, { message: errorMessage })
    })
}

const verifyCustomerPaymentController = async (req, res) => {
  const {transRef, user_id} = req.body;

  // Cross-service call: payment data/logic is owned by Backend2.
  paymentServiceClient.verifyPayment(transRef, user_id)
    .then((data) => {
        responseHandler(res,'OK',data)
    }).catch((error) => {
      // Backend2 answers 400 for expected outcomes (ref/user mismatch, unpaid).
      if (error?.response?.status === 400) {
        return responseHandler(res,'BAD_REQUEST',null,{message: error.response.data?.message})
      }
      logErrorWithSource(error , {meta: {body: req.body}})
      responseHandler(res,'INTERNAL_SERVER_ERROR',null,{message: error?.response?.data?.message || error?.message || 'Could not verify the payment.'})
    })
}


const toggleUserBlockController = (req, res) => {
  const {user_id} = req.params;

  toggleUserBlock(user_id)
    .then((result) => {
        responseHandler(res,'OK',result.data, {message: result.message})
    }).catch((error) => {
        logErrorWithSource(error , {meta: {body: req.body}})
        responseHandler(res,'INTERNAL_SERVER_ERROR',null,{message: error})
    })
}

const getMaidHistory = (req, res) => {
  const {maid_id} = req.params;
  if(!maid_id){
    return responseHandler(res, 'BAD_REQUEST', null, {message: 'Maid ID is required'})
  }

  maidHistory(maid_id)
    .then((result) => {
      responseHandler(res,'OK', result, {message: 'Fetched Successfully!'})
    }).catch((error) => {
      logErrorWithSource(error, {meta: {maid_id}})
      responseHandler(res, 'INTERNAL_SERVER_ERROR', null, {})
    })

}

module.exports = {
  getTeamMembersController,
  deleteTeamMemberController,
  teamMemberRoleChangeController,
  getCustomersController,
  updateCustomerPasswordController,
  verifyCustomerPaymentController,
  toggleUserBlockController,
  getMaidHistory,
};
