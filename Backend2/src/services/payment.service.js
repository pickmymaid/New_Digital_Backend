const { getPayments, getPaymentsByUserID, manualverifyToken, verifyToken } = require('./../queries/payment.queries');
const { generateToken } = require('../queries/payment.queries');
const messages = require('../utils/constants/messages');
const jwt = require('jsonwebtoken');

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

module.exports = {
  generatePaymentTokenService,
  verifyPaymentTokenService,
  manualVerifyPaymentService,
  getPaymentsService,
  getUserPaymentDetails,
};
