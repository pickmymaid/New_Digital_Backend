import { Request, Response } from "express";
import { responseHandler } from "../utils/responseHandler/responseHandler";
import { IAdminLoginBody, IAdminRegisterBody, ICustomerForgetPassBody, ICustomerLoginBody, ICustomerRegisterBody } from "../types/requestBody.types";
import { IAdminCollection, ICustomerCollection } from "../types/dbStructureTypes";
import { addCustomerPreference, createAdmin, createCustomer, getAdminWithEmail, getAdminWithID, getCustomerWithEmail, updateAdminByEmail, updateCustomerPasswordToken, updateCustomerPasswordWithEmail } from "../queries/user.queries";
import messages from "../utils/constants/messages";
import { passwordToHash } from "../utils/passwordToHash/passwordToHash";
import { passwordValidator } from "../utils/passwordValidator/passwordValidator";
import jwt from 'jsonwebtoken'
import { generateJWT } from "../utils/generateJWT/generateJWT";
import { validateJwtToken } from "../utils/validateJWT/validateJWT";
import { sendMail } from "../utils/sendMail/sendMail";
import { adminLoginMailBody } from "../utils/mailBody/adminLogin";
import { adminLogoutBody } from "../utils/mailBody/adminLogout";
import { createUserID } from "../utils/createUserID/createUserID";
import base64url from "base64url";
import { forgetPasswordTemplate } from "../utils/mailBody/forgotPassword";
import { sendSesEmailWithAttachment } from "../utils/sendMail/sendSESMail";

/**
 * This function creates a new customer service account by checking if the user already exists, hashing
 * the password, and inserting the user into the database.
 * @param {ICustomerRegisterBody} user - The `user` parameter is an object of type
 * `ICustomerRegisterBody`, which contains the information needed to create a new customer account.
 * This information typically includes the customer's name, email address, password, and any other
 * relevant details.
 * @returns The function `createCustomerService` returns a Promise that resolves to a success message
 * (`messages.success.ACCOUNT_CREATED`) if a new customer account is successfully created, or rejects
 * with an error message (`messages.error.USER_ALREADY_EXIST` or the error message caught in the catch
 * block) if the user already exists or an error occurs during the process.
 */
export const createCustomerService = (user: ICustomerRegisterBody) => {
  return new Promise(async (resolve, reject) => {
    try {
      const isUserAvailable: ICustomerCollection = await getCustomerWithEmail(user.email as string);
      if (isUserAvailable) {
        return reject(messages.error.USER_ALREADY_EXIST)
      }
      user.password = await passwordToHash(user.password as string);
      const userId = createUserID(user.first_name as string);
      let insert = await createCustomer({
        ...user,
        type: 'email',
        user_id: userId
      });


      await addCustomerPreference({...user, user_id: userId})
      return resolve({
        message: messages.success.ACCOUNT_CREATED,
        user: {
          _id: insert.user_id,
          first_name: insert?.first_name,
          email: insert?.email,
          type: insert?.type,
          profile: insert?.profile,
          accountId: insert?.account_id
        }
      });
    } catch (error: any) {
      return reject(error.message)
    }
  })
}


/**
 * This is a TypeScript function that handles customer login authentication by validating the user's
 * email and password, generating a JWT token, and returning a success message with the token or an
 * error message if the credentials are invalid.
 * @param {ICustomerLoginBody} credential - The `credential` parameter is an object that contains the
 * email and password of a customer trying to log in. It has the type `ICustomerLoginBody`, which is
 * likely an interface defining the shape of the object.
 * @returns A Promise is being returned, which resolves to an object containing a success message and a
 * JWT token if the login is successful, or rejects with an error object if there is an issue with the
 * login process.
 */
export const customerLoginService = (credential: ICustomerLoginBody) => {
  return new Promise(async (resolve, reject) => {
    try {
      let { email, password } = credential
      const user: ICustomerCollection = await getCustomerWithEmail(email);
      const jwtSecret = process.env.JWT_SECRET || ''

      if (user && user?.password) {
        const { user_id } = user;
        const isValidPassword = await passwordValidator(password, user?.password)
        if (isValidPassword) {
          const token = await jwt.sign({ user_id: user_id }, jwtSecret, {
            expiresIn: '10d'
          })
          return resolve({
            message: messages.success.LOGGED_IN,
            otherData: {
              token,
              first_name: user?.first_name,
              last_name: user?.last_name
            }
          })
        } else {
          return reject({
            errorKey: 'password',
            message: messages.error.WRONG_PASSWORD
          })
        }
      } else {
        return reject({
          errorKey: 'email',
          message: messages.error.USER_NOT_FOUND
        })
      }
    } catch (error: any) {
      return reject({
        message: error.message
      })
    }
  })
}


/**
 * This is a TypeScript function that generates a JWT token and sends a reset password link to a
 * customer's email if their email is found in the database.
 * @param {string} email - The email parameter is a string that represents the email address of the
 * customer who wants to reset their password.
 * @returns A Promise is being returned which resolves to an object with a "message" property if the
 * reset link is successfully sent to the email, or rejects with an object containing an "errorKey" and
 * "message" property if there is an error.
 */
export const customerForgetPasswordService = (email: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      let block: boolean = false;
      const user: ICustomerCollection = await getCustomerWithEmail(email);
      if (user) {
        // if (user.reset_token) {
        //   await validateJwtToken(user.reset_token).then(async (_) => {
        //     block = true;
        //     await updateCustomerPasswordToken(email, null);
        //     return reject({
        //       message: 'Reset password link is already sent! Please try again after 10 mins'
        //     })
        //   }).catch((error: any) => {
        //     console.error(error)
        //   })
        // }

        if (!block) {
          const token = await generateJWT({ email }, '600000')
          await updateCustomerPasswordToken(email, token);

          sendSesEmailWithAttachment(email, 'Reset Your Pickmymaid Password', forgetPasswordTemplate(user.first_name as string,`https://www.pickmymaid.com/reset-password/${base64url.encode(token)}`), '', [])
          return resolve({
            message: 'Reset link sent to email'
          })
        }
      } else {
        return reject({
          errorKey: 'email',
          message: messages.error.USER_NOT_FOUND
        })
      }
    } catch (error: any) {
      reject({
        message: messages.error.INTERNAL_SERVER_ERROR
      })
    }
  })
}

/**
 * This is a TypeScript function that resets a customer's password by validating a token and updating
 * the password in the database.
 * @param {string} password - The new password that the customer wants to set.
 * @param {string | undefined} token - The token parameter is a string that represents a JSON Web Token
 * (JWT) used for authentication and authorization purposes. It is used to verify the identity of the
 * user and ensure that they have the necessary permissions to perform the requested action, which in
 * this case is resetting their password.
 * @returns A Promise is being returned, which resolves to an object with a success message if the
 * password is updated successfully, or rejects with an error message if there is an unauthorized
 * access, user not found, or internal server error.
 */
export const customerResetPasswordService = (password: string, token: string | undefined) => {
  return new Promise(async (resolve, reject) => {
    try {
      token = base64url.decode(token || '')

      validateJwtToken(token).then(async (decodedToken: any) => {
        const { email } = decodedToken;
        let user: ICustomerCollection = await getCustomerWithEmail(email);

        if (user && user.email) {

          if (user.reset_token === token) {
            let encryptedPass: string = await passwordToHash(password);
            await updateCustomerPasswordWithEmail(user.email, encryptedPass);
            resolve({
              message: messages.success.PASSWORD_UPDATED
            })
          } else {
            return reject({
              message: messages.error.UNAUTHORIZED
            })
          }
        } else {
          return reject({
            message: messages.error.USER_NOT_FOUND
          })
        }
      }).catch((error: any) => {
        console.log({ error });

        return reject({
          message: 'Password Reset link expired!'
        })
      });
    } catch (error: any) {
      return reject({
        message: messages.error.INTERNAL_SERVER_ERROR
      })
    }
  })
}


/**
 * This is a TypeScript function that creates a new admin account with a hashed password and checks if
 * the email already exists in the database.
 * @param {IAdminRegisterBody} body - The parameter `body` is of type `IAdminRegisterBody`, which is
 * likely an interface defining the shape of an object containing information needed to register a new
 * admin user.
 * @returns A Promise is being returned.
 */
export const adminSignupService = (body: IAdminRegisterBody) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { email, password, name, is_super_admin } = body;
      let role = body.role;
      if (role === 'Admin' || role === 'A') {
        role = 'A';
      }

      const encryptedPass = await passwordToHash(password);
      const user: IAdminCollection = await getAdminWithEmail(email);

      if (user) {
        await updateAdminByEmail(email, {
          name,
          is_super_admin,
          role,
          password: encryptedPass,
          status: 'active'
        });
        resolve({
          data: { user_id: user.user_id, name, email, is_super_admin, role },
          message: messages.success.ACCOUNT_CREATED
        });
      } else {
        let response: any = await createAdmin({
          ...body,
          role,
          password: encryptedPass
        });
        let { user_id, name: resName, email: resEmail, is_super_admin: resIsSuperAdmin, role: resRole } = response;
        resolve({
          data: { user_id, name: resName, email: resEmail, is_super_admin: resIsSuperAdmin, role: resRole },
          message: messages.success.ACCOUNT_CREATED
        });
      }
    } catch (error: any) {
      return reject({
        message: messages.error.INTERNAL_SERVER_ERROR
      });
    }
  });
};


/**
 * This is a TypeScript function that handles the login process for an admin user, including password
 * validation and JWT generation.
 * @param {IAdminLoginBody} body - The `body` parameter is an object that contains the email and
 * password of the admin user trying to log in. It has the type `IAdminLoginBody`, which is likely an
 * interface that defines the shape of the object.
 * @returns The function `adminLoginService` returns a Promise that resolves to an object with a
 * `message` property and a `token` property if the login is successful, or rejects with an object
 * containing a `message` property if there is an error.
 */
export const adminLoginService = (body: IAdminLoginBody) => {
  return new Promise(async (resolve, reject) => {
    try {
      const adminMail: string = process.env.SA_EMAIL || '';
      console.log({ adminMail });

      const user: IAdminCollection = await getAdminWithEmail(body.email);
      if (user && user.status === 'active' && user.password) {
        const isValidPassword = await passwordValidator(body.password, user.password);
        if (isValidPassword) {
          const token = await generateJWT({
            user_id: user.user_id,
            role: user.role || (user.is_super_admin ? 'SA' : 'A')
          }, (user.role === 'SA' || user.is_super_admin) ? '24h' : '10h')

          // adminMail, `${user.name} Logged in to admin panel`, adminLoginMailBody(user?.name || '')
          sendSesEmailWithAttachment(adminMail as string, `${user.name} Logged in to admin panel`, adminLoginMailBody(user.name || ''))
            .then(res => console.log(res))
            .catch(err => console.log(err))

          resolve({
            message: messages.success.LOGGED_IN,
            token
          })
        } else {
          reject({
            message: messages.error.WRONG_PASSWORD
          })
        }
      } else {
        reject({
          message: messages.error.USER_NOT_FOUND
        })
      }
    } catch (error: any) {
      reject({
        message: error.message
      })
    }
  })
}

export const adminLogoutService = (user_id: string) => {
  return new Promise(async (resolve, reject) => {
    try {

      let adminEmail: string = process.env.SA_EMAIL || "";
      let user: IAdminCollection = await getAdminWithID(user_id)
      sendMail(adminEmail, `${user?.name} is logged out from admin panel`, adminLogoutBody(user.name || ''))
        .then(res => console.log(res))
        .catch(err => console.log(err))
      resolve({
        message: messages.success.LOGGED_OUT
      })
    } catch (error: any) {
      console.log({ error });

      reject({
        message: messages.error.INTERNAL_SERVER_ERROR
      })
    }
  })
}