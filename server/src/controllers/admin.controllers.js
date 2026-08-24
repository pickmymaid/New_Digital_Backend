const { validateJwtToken } = require("../utils/validateJWT/validateJWT");
const { deleteTeamMemberService, getCustomersService, getTeamMembersService, maidHistory, teamMemberRoleChangeService, toggleUserBlock, updateCustomerPasswordService } = require("../services/admin.service");
const { responseHandler } = require("../utils/responseHandler/responseHandler");
const { sendMail } = require("../utils/sendMail/sendMail");
const { verifyPaymentService } = require("../services/v2/payment.service");
const logger = require("../config/logger");
const { logErrorWithSource } = logger;

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
    logErrorWithSource(error , {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error)
  })
}


const getCustomersController = async (req, res) => {
  try {
    let page = parseInt((req.query.page));
    let limit = parseInt(req.query.limit);
    let search = req.query.search || "";
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
  updateCustomerPasswordService(user_id)
    .then((data) => {
      responseHandler(res, 'OK', { password: data.password }, { message: data.message })
    }).catch(errorMessage => {
      logger.error(errorMessage , {meta: {body: req.body}})
      responseHandler(res, 'INTERNAL_SERVER_ERROR', null, { message: errorMessage })
    })
}

const verifyCustomerPaymentController = async (req, res) => {
  const {transRef, user_id} = req.body;

  verifyPaymentService(transRef, user_id)
    .then((data) => {
        responseHandler(res,'OK',data)
    }).catch((error) => {
      logErrorWithSource(error , {meta: {body: req.body}})
        responseHandler(res,'INTERNAL_SERVER_ERROR',null,{message: error})
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
