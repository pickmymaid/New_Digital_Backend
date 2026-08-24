const { responseHandler } = require('../utils/responseHandler/responseHandler');
const { generatePaymentTokenService, getPaymentsService, getUserPaymentDetails, manualVerifyPaymentService, verifyPaymentTokenService } = require('../services/payment.service');
const { validateJwtToken } = require('../utils/validateJWT/validateJWT');
const logger = require('../config/logger');
const { logErrorWithSource } = logger;

//Payment first step to generate link
const generatePaymentTokenController = (req, res) => {
  try {
    let body = req.body;
    let token = req.headers.authorization?.split(' ')[1];
    body.token = token;

    generatePaymentTokenService(body)
      .then((data) => {
        responseHandler(res, 'OK', { URL: data });
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//verify the token is valid

const verifyPaymentTokenController = (req, res) => {
  try {
    let body = req.body;
    let token = req.headers.authorization?.split(' ')[1];
    body.token = token;

    verifyPaymentTokenService(body)
      .then((data) => {
        responseHandler(res, 'OK', { data });
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};


const getPaymentsController = (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit) : (page ? 10 : undefined);
    const search = req.query.search;

    getPaymentsService(page, limit, search)
      .then((data) => {
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
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

const getUserPaymentDetailsController = async (req, res) => {
  const user = req.user
  let userID = user?._id;

  getUserPaymentDetails(userID || '').then((user) => {
    responseHandler(res, 'OK', { user });
  }).catch((error) => {
    logErrorWithSource(error, {meta: {body: req.body}})
    console.log({ error });
    responseHandler(res, 'INTERNAL_SERVER_ERROR')
  })
}

const manualPaymentController = async (req, res)=>{
  let body = req.body;

    try{

      manualVerifyPaymentService(body).then((data) => {
        responseHandler(res, 'OK', { data });
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
    } catch (error) {
      logErrorWithSource(error, {meta: {body: req.body}})
      responseHandler(res, 'INTERNAL_SERVER_ERROR');
    }
}

module.exports = {
  generatePaymentTokenController,
  verifyPaymentTokenController,
  getPaymentsController,
  getUserPaymentDetailsController,
  manualPaymentController,
};
