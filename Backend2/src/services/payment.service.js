const { getPayments, getPaymentsByUserID, manualverifyToken, verifyToken, getPaymentById, updatePaymentById } = require('./../queries/payment.queries');
const { generateToken } = require('../queries/payment.queries');
const messages = require('../utils/constants/messages');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { HttpError } = require('../utils/httpError');

// 0 = pending (unpaid), 1 = active, 2 = expired/suspended
const PAYMENT_STATUSES = [0, 1, 2];

const generatePaymentTokenService = (body) => {
  return new Promise(async (resolve, reject) => {
    try {
      let decodedToken;
      let amount = 0;
      const jwtSecret = process.env.JWT_SECRET;
      jwt.verify(body?.token, jwtSecret, (err, decoded) => {
        if (err) {
          return reject(err);
        } else {
          decodedToken = decoded || '';
        }
      });
      let expiryDate = new Date();
      if (body.type === 0) {

        amount = 350;
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else if (body.type === 1) {
        amount = 495;
        expiryDate.setMonth(expiryDate.getMonth() + 2);
      } else if (body.type === 2) {
        amount = 899;
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      }
      console.log(expiryDate,'entered')
      const data = {
        amount,
        type: body.type,
        expiryDate,
        user_id: decodedToken.user_id,
      };
      console.log(decodedToken, 'decoded');
      const Token = await generateToken(data);
      resolve(Token);
    } catch (error) {
      console.log(error);

      reject({
        message: messages.error.INTERNAL_SERVER_ERROR,
      });
    }
  });
};

const verifyPaymentTokenService = (body) => {
  return new Promise(async (resolve, reject) => {
    try {
      let decodedToken;
      let tokenBody = body?.token;
      const jwtSecret = process.env.JWT_SECRET;
      jwt.verify(tokenBody, jwtSecret, (err, decoded) => {
        if (err) {
          return reject(err);
        } else {
          decodedToken = decoded || '';
        }
      });

      decodedToken.Tid = body.Tid;
      const Token = await verifyToken(decodedToken);
      if (!Token) {
        reject(messages.error.INVALID_ACCESS_TOKEN);
      } else {
        resolve(Token);
      }
    } catch (error) {
      reject({
        message: messages.error.INTERNAL_SERVER_ERROR,
      });
    }
  });
};


const manualVerifyPaymentService = (body) => {
  return new Promise(async (resolve, reject) => {
    try {

     await manualverifyToken(body);

     return resolve(messages.success.UPDATED_SUCCESSFULLY);

    } catch (error) {
      return reject(error.message);
    }
  });
}




const getPaymentsService = (page, limit, search) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getPayments(page, limit, search);
      return resolve(data);
    } catch (error) {
      reject({
        message: messages.error.INTERNAL_SERVER_ERROR,
      });
    }
  });
};

const getUserPaymentDetails = (userID) => {
  console.log(userID)
  return new Promise(async (resolve, reject) => {
    try {
      let user = await getPaymentsByUserID(userID);
      resolve(user);
    } catch (error) {
      reject({
        message: messages.error.INTERNAL_SERVER_ERROR
      })
    }
  })
}

// Validates an admin edit of a payment's expiry/status and returns the
// $set to apply. Kept free of DB access so it can be unit tested.
const buildPaymentUpdate = (payment, body, now = new Date()) => {
  const changes = {};

  if (body?.expiryDate !== undefined) {
    const expiryDate = new Date(body.expiryDate);
    if (body.expiryDate === null || Number.isNaN(expiryDate.getTime())) {
      throw new HttpError('BAD_REQUEST', 'expiryDate must be a valid date.');
    }
    changes.expiryDate = expiryDate;
  }
  if (body?.status !== undefined) {
    const status = Number(body.status);
    if (!PAYMENT_STATUSES.includes(status)) {
      throw new HttpError('BAD_REQUEST', 'status must be 0 (pending), 1 (active) or 2 (expired).');
    }
    changes.status = status;
  }
  if (Object.keys(changes).length === 0) {
    throw new HttpError('BAD_REQUEST', 'Send expiryDate and/or status to update.');
  }

  // The expiry cron flips any status-1 payment with a past expiry back to 2,
  // so an "active" record must actually expire in the future.
  const status = changes.status ?? payment.status;
  const expiryDate = changes.expiryDate ?? payment.expiryDate;
  if (status === 1 && (!expiryDate || expiryDate <= now)) {
    throw new HttpError('BAD_REQUEST', 'An active subscription needs an expiry date in the future.');
  }

  return changes;
};

const updatePaymentService = async (id, body) => {
  if (!id || !mongoose.isValidObjectId(id)) throw new HttpError('BAD_REQUEST', 'Invalid payment id.');
  const payment = await getPaymentById(id);
  if (!payment) throw new HttpError('NOT_FOUND', 'Payment not found.');
  return await updatePaymentById(payment._id, buildPaymentUpdate(payment, body));
};

module.exports = {
  generatePaymentTokenService,
  verifyPaymentTokenService,
  manualVerifyPaymentService,
  getPaymentsService,
  getUserPaymentDetails,
  buildPaymentUpdate,
  updatePaymentService,
};
