import { getPayments, getPaymentsByUserID, manualverifyToken, verifyToken } from './../queries/payment.queries';
import { generateToken } from '../queries/payment.queries';
import messages from '../utils/constants/messages';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { IPaymentBody, IPaymentCl, IPaymentTokenBody } from '../types/requestBody.types';

export const generatePaymentTokenService = (body: IPaymentBody) => {
  return new Promise(async (resolve, reject) => {
    try {
      let decodedToken: any;
      let amount: number = 0;
      const jwtSecret = process.env.JWT_SECRET as string;
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
      const data: IPaymentCl = {
        amount,
        type: body.type,
        expiryDate,
        user_id: decodedToken.user_id,
      };
      console.log(decodedToken, 'decoded');
      const Token = await generateToken(data);
      resolve(Token);
    } catch (error: any) {
      console.log(error);
      
      reject({
        message: messages.error.INTERNAL_SERVER_ERROR,
      });
    }
  });
};

export const verifyPaymentTokenService = (body: IPaymentBody) => {
  return new Promise(async (resolve, reject) => {
    try {
      let decodedToken: any;
      let tokenBody = body?.token as string;
      const jwtSecret = process.env.JWT_SECRET as string;
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
    } catch (error: any) {
      reject({
        message: messages.error.INTERNAL_SERVER_ERROR,
      });
    }
  });
};


export const manualVerifyPaymentService = (body: IPaymentTokenBody) => {
  return new Promise(async (resolve, reject) => {
    try {

     await manualverifyToken(body);

     return resolve(messages.success.UPDATED_SUCCESSFULLY);
   
    } catch (error: any) {
      return reject(error.message);
    }
  });
}




export const getPaymentsService = (page?: number, limit?: number, search?: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getPayments(page, limit, search);
      return resolve(data);
    } catch (error: any) {
      reject({
        message: messages.error.INTERNAL_SERVER_ERROR,
      });
    }
  });
};

export const getUserPaymentDetails = (userID: string) => {
  console.log(userID)
  return new Promise(async (resolve, reject) => {
    try {
      let user = await getPaymentsByUserID(userID);
      resolve(user);
    } catch (error: any) {
      reject({
        message: messages.error.INTERNAL_SERVER_ERROR
      })
    }
  })
}
