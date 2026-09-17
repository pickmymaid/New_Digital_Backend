const { responseHandler } = require("../utils/responseHandler/responseHandler");
const { addCustomerPreference, createAdmin, createCustomer, getAdminWithEmail, getAdminWithID, getCustomerWithEmail, getCustomerWithPhone, upsertPendingCustomer, getPendingCustomerWithEmail, deletePendingCustomerWithEmail, updateAdminByEmail, updateCustomerPasswordToken, updateCustomerPasswordWithEmail } = require("../queries/user.queries");
const messages = require("../utils/constants/messages");
const { passwordToHash } = require("../utils/passwordToHash/passwordToHash");
const { passwordValidator } = require("../utils/passwordValidator/passwordValidator");
const jwt = require('jsonwebtoken');
const { generateJWT } = require("../utils/generateJWT/generateJWT");
const { validateJwtToken } = require("../utils/validateJWT/validateJWT");
const { sendMail } = require("../utils/sendMail/sendMail");
const { adminLoginMailBody } = require("../utils/mailBody/adminLogin");
const { adminLogoutBody } = require("../utils/mailBody/adminLogout");
const { createUserID } = require("../utils/createUserID/createUserID");
const { generateOtp } = require("../utils/generateOtp/generateOtp");
const base64url = require("base64url");
const { forgetPasswordTemplate } = require("../utils/mailBody/forgotPassword");
const { otpVerificationTemplate } = require("../utils/mailBody/otpVerification");
const { sendSesEmailWithAttachment } = require("../utils/sendMail/sendSESMail");

const OTP_VALIDITY_MS = 10 * 60 * 1000;

/**
 * This function starts a new customer registration by checking if the email/phone is already
 * taken, hashing the password, storing the submitted details as a pending (unverified)
 * registration, and emailing a 6-digit OTP to confirm the address. The actual customer account
 * is only created once that OTP is confirmed via `verifyCustomerOtpService`.
 * @param {object} user - The information submitted on the registration form (name, email,
 * password, phone, etc).
 * @returns A Promise that resolves with a message once the OTP has been emailed, or rejects with
 * an error (`USER_ALREADY_EXIST` for a taken email/phone, or a mail/server failure).
 */
const createCustomerService = (user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const isUserAvailable = await getCustomerWithEmail(user.email);
      if (isUserAvailable) {
        return reject({
          errorKey: 'email',
          status: 'CONFLICT',
          message: messages.error.USER_ALREADY_EXIST
        })
      }
      if (user.phone) {
        const isPhoneTaken = await getCustomerWithPhone(user.phone);
        if (isPhoneTaken) {
          return reject({
            errorKey: 'phone',
            status: 'CONFLICT',
            message: messages.error.USER_ALREADY_EXIST
          })
        }
      }
      user.password = await passwordToHash(user.password);
      const otp = generateOtp();

      await upsertPendingCustomer({
        ...user,
        otp,
        otp_expires_at: new Date(Date.now() + OTP_VALIDITY_MS)
      });

      try {
        await sendSesEmailWithAttachment(user.email, 'Verify Your Pickmymaid Email', otpVerificationTemplate(user.first_name, otp), '', [])
      } catch (mailError) {
        console.error('Failed to send OTP email:', mailError);
        return reject({
          status: 'INTERNAL_SERVER_ERROR',
          message: messages.error.MAIL_NOT_SENT
        })
      }

      return resolve({
        message: `OTP sent to ${user.email}`
      });
    } catch (error) {
      return reject({
        status: 'INTERNAL_SERVER_ERROR',
        message: error.message
      })
    }
  })
}

/**
 * This function completes customer registration by verifying the OTP emailed during
 * `createCustomerService` against the pending registration record, then creating the real
 * customer account and preference document.
 * @param {string} email - The email address the OTP was sent to.
 * @param {string} otp - The 6-digit OTP submitted by the user.
 * @returns A Promise that resolves with the created user's details, or rejects if the pending
 * registration is missing/expired or the OTP doesn't match.
 */
const verifyCustomerOtpService = (email, otp) => {
  return new Promise(async (resolve, reject) => {
    try {
      const pending = await getPendingCustomerWithEmail(email);
      if (!pending) {
        return reject({
          errorKey: 'email',
          status: 'NOT_FOUND',
          message: messages.error.REGISTRATION_NOT_FOUND
        })
      }

      if (pending.otp_expires_at.getTime() < Date.now()) {
        await deletePendingCustomerWithEmail(email);
        return reject({
          errorKey: 'otp',
          status: 'BAD_REQUEST',
          message: messages.error.OTP_EXPIRED
        })
      }

      if (pending.otp !== otp) {
        return reject({
          errorKey: 'otp',
          status: 'BAD_REQUEST',
          message: messages.error.INVALID_OTP
        })
      }

      const userId = createUserID(pending.first_name);
      const pendingData = pending.toObject();
      delete pendingData._id;
      delete pendingData.otp;
      delete pendingData.otp_expires_at;
      delete pendingData.createdAt;
      delete pendingData.updatedAt;
      delete pendingData.__v;

      let insert = await createCustomer({
        ...pendingData,
        type: 'email',
        user_id: userId
      });

      await addCustomerPreference({ ...pendingData, user_id: userId })
      await deletePendingCustomerWithEmail(email);

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
    } catch (error) {
      return reject({
        status: 'INTERNAL_SERVER_ERROR',
        message: error.message
      })
    }
  })
}


/**
 * This is a function that handles customer login authentication by validating the user's
 * email and password, generating a JWT token, and returning a success message with the token or an
 * error message if the credentials are invalid.
 * @param {object} credential - The `credential` parameter is an object that contains the
 * email and password of a customer trying to log in.
 * @returns A Promise is being returned, which resolves to an object containing a success message and a
 * JWT token if the login is successful, or rejects with an error object if there is an issue with the
 * login process.
 */
const customerLoginService = (credential) => {
  return new Promise(async (resolve, reject) => {
    try {
      let { email, password } = credential
      const user = await getCustomerWithEmail(email);
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
            status: 'UNAUTHORIZED',
            message: messages.error.WRONG_PASSWORD
          })
        }
      } else {
        return reject({
          errorKey: 'email',
          status: 'NOT_FOUND',
          message: messages.error.USER_NOT_FOUND
        })
      }
    } catch (error) {
      return reject({
        status: 'INTERNAL_SERVER_ERROR',
        message: error.message
      })
    }
  })
}


/**
 * This is a function that generates a JWT token and sends a reset password link to a
 * customer's email if their email is found in the database.
 * @param {string} email - The email parameter is a string that represents the email address of the
 * customer who wants to reset their password.
 * @returns A Promise is being returned which resolves to an object with a "message" property if the
 * reset link is successfully sent to the email, or rejects with an object containing an "errorKey" and
 * "message" property if there is an error.
 */
const customerForgetPasswordService = (email) => {
  return new Promise(async (resolve, reject) => {
    try {
      let block = false;
      const user = await getCustomerWithEmail(email);
      if (user) {
        // if (user.reset_token) {
        //   await validateJwtToken(user.reset_token).then(async (_) => {
        //     block = true;
        //     await updateCustomerPasswordToken(email, null);
        //     return reject({
        //       message: 'Reset password link is already sent! Please try again after 10 mins'
        //     })
        //   }).catch((error) => {
        //     console.error(error)
        //   })
        // }

        if (!block) {
          const token = await generateJWT({ email }, '600000')
          await updateCustomerPasswordToken(email, token);

          try {
            await sendSesEmailWithAttachment(email, 'Reset Your Pickmymaid Password', forgetPasswordTemplate(user.first_name,`https://www.pickmymaid.com/reset-password/${base64url.encode(token)}`), '', [])
          } catch (mailError) {
            console.error('Failed to send reset password email:', mailError);
            return reject({
              status: 'INTERNAL_SERVER_ERROR',
              message: messages.error.MAIL_NOT_SENT
            })
          }

          return resolve({
            message: 'Reset link sent to email'
          })
        }
      } else {
        return reject({
          errorKey: 'email',
          status: 'NOT_FOUND',
          message: messages.error.USER_NOT_FOUND
        })
      }
    } catch (error) {
      reject({
        status: 'INTERNAL_SERVER_ERROR',
        message: messages.error.INTERNAL_SERVER_ERROR
      })
    }
  })
}

/**
 * This is a function that resets a customer's password by validating a token and updating
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
const customerResetPasswordService = (password, token) => {
  return new Promise(async (resolve, reject) => {
    try {
      token = base64url.decode(token || '')

      validateJwtToken(token).then(async (decodedToken) => {
        const { email } = decodedToken;
        let user = await getCustomerWithEmail(email);

        if (user && user.email) {

          if (user.reset_token === token) {
            let encryptedPass = await passwordToHash(password);
            await updateCustomerPasswordWithEmail(user.email, encryptedPass);
            resolve({
              message: messages.success.PASSWORD_UPDATED
            })
          } else {
            return reject({
              status: 'UNAUTHORIZED',
              message: messages.error.UNAUTHORIZED
            })
          }
        } else {
          return reject({
            status: 'NOT_FOUND',
            message: messages.error.USER_NOT_FOUND
          })
        }
      }).catch((error) => {
        console.log({ error });

        return reject({
          status: 'UNAUTHORIZED',
          message: 'Password Reset link expired!'
        })
      });
    } catch (error) {
      return reject({
        status: 'INTERNAL_SERVER_ERROR',
        message: messages.error.INTERNAL_SERVER_ERROR
      })
    }
  })
}


/**
 * This is a function that creates a new admin account with a hashed password and checks if
 * the email already exists in the database.
 * @param {object} body - The information needed to register a new admin user.
 * @returns A Promise is being returned.
 */
const adminSignupService = (body) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { email, password, name, is_super_admin } = body;
      let role = body.role;
      if (role === 'Admin' || role === 'A') {
        role = 'A';
      }

      const encryptedPass = await passwordToHash(password);
      const user = await getAdminWithEmail(email);

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
        let response = await createAdmin({
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
    } catch (error) {
      return reject({
        status: 'INTERNAL_SERVER_ERROR',
        message: messages.error.INTERNAL_SERVER_ERROR
      });
    }
  });
};


/**
 * This is a function that handles the login process for an admin user, including password
 * validation and JWT generation.
 * @param {object} body - The `body` parameter is an object that contains the email and
 * password of the admin user trying to log in.
 * @returns The function `adminLoginService` returns a Promise that resolves to an object with a
 * `message` property and a `token` property if the login is successful, or rejects with an object
 * containing a `message` property if there is an error.
 */
const adminLoginService = (body) => {
  return new Promise(async (resolve, reject) => {
    try {
      const adminMail = process.env.SA_EMAIL || '';
      console.log({ adminMail });

      const user = await getAdminWithEmail(body.email);
      if (user && user.status === 'active' && user.password) {
        const isValidPassword = await passwordValidator(body.password, user.password);
        if (isValidPassword) {
          const token = await generateJWT({
            user_id: user.user_id,
            role: user.role || (user.is_super_admin ? 'SA' : 'A')
          }, (user.role === 'SA' || user.is_super_admin) ? '24h' : '10h')

          // adminMail, `${user.name} Logged in to admin panel`, adminLoginMailBody(user?.name || '')
          sendSesEmailWithAttachment(adminMail, `${user.name} Logged in to admin panel`, adminLoginMailBody(user.name || ''))
            .then(res => console.log(res))
            .catch(err => console.log(err))

          resolve({
            message: messages.success.LOGGED_IN,
            token
          })
        } else {
          reject({
            status: 'UNAUTHORIZED',
            message: messages.error.WRONG_PASSWORD
          })
        }
      } else {
        reject({
          status: 'NOT_FOUND',
          message: messages.error.USER_NOT_FOUND
        })
      }
    } catch (error) {
      reject({
        status: 'INTERNAL_SERVER_ERROR',
        message: error.message
      })
    }
  })
}

const adminLogoutService = (user_id) => {
  return new Promise(async (resolve, reject) => {
    try {

      let adminEmail = process.env.SA_EMAIL || "";
      let user = await getAdminWithID(user_id)
      sendMail(adminEmail, `${user?.name} is logged out from admin panel`, adminLogoutBody(user.name || ''))
        .then(res => console.log(res))
        .catch(err => console.log(err))
      resolve({
        message: messages.success.LOGGED_OUT
      })
    } catch (error) {
      console.log({ error });

      reject({
        status: 'INTERNAL_SERVER_ERROR',
        message: messages.error.INTERNAL_SERVER_ERROR
      })
    }
  })
}

module.exports = {
  createCustomerService,
  verifyCustomerOtpService,
  customerLoginService,
  customerForgetPasswordService,
  customerResetPasswordService,
  adminSignupService,
  adminLoginService,
  adminLogoutService,
};
