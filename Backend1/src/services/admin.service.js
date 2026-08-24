const { deleteTeamMember, getAllTeamMember } = require("../queries/admin.queries");
const messages = require("../utils/constants/messages")
const { dangerouslyUpdateCustomerPassword, getAdminWithID, getAllCustomers, getCustomerWithID, updateRoleOfAdmin } = require('../queries/user.queries');
const { passwordToHash } = require("../utils/passwordToHash/passwordToHash");
const { generatePassword } = require("../utils/generatePassword/generatePassword");
const { sendMail } = require("../utils/sendMail/sendMail");
const { CustomerModel } = require("../models/users/customer.model");
const { paymentModel } = require("../models/payment/payment.model");
const { MaidHistory } = require("../models/maidsHistory/maidHistory.model");

/**
 * This function returns a promise that resolves with all team members for a given user ID or rejects
 * with an internal server error message.
 * @param {string} user_id - The user_id parameter is a string that represents the unique identifier of
 * a user. It is used as a parameter for the getAllTeamMember function to retrieve all the team members
 * associated with that user.
 * @returns A Promise is being returned, which resolves with the result of the `getAllTeamMember`
 * function if it is successful, or rejects with an error message if it encounters an error.
 */
const getTeamMembersService = (user_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const teamMembers = await getAllTeamMember(user_id);
      resolve(teamMembers);
    } catch (error) {
      reject({
        message: messages.error.INTERNAL_SERVER_ERROR,
      });
    }
  })
}

const deleteTeamMemberService = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response = await deleteTeamMember(id);
      if (response.modifiedCount === 1) {
        resolve({
          message: 'Team member removed successfully'
        })
      } else {
        reject({
          message: messages.error.USER_NOT_FOUND
        })
      }


    } catch (error) {
      reject({
        message: messages.error.INTERNAL_SERVER_ERROR
      })
    }
  })
}

const teamMemberRoleChangeService = async (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await getAdminWithID(id);
      if (user) {
        await updateRoleOfAdmin(id, user?.is_super_admin)
        resolve({
          message: messages.success.UPDATED_SUCCESSFULLY
        })
      } else {
        reject({
          message: messages.error.USER_NOT_FOUND
        })
      }
    } catch (error) {
      reject({
        message: messages.error.INTERNAL_SERVER_ERROR
      })
    }
  })
}

const getCustomersService = (page, limit, search) => {
  return new Promise(async (resolve, reject) => {
    try {
      const customers = await getAllCustomers(page, limit, search);
      resolve(customers);
    } catch (error) {
      console.error(error, 'this is error')
      reject({
        message: messages.error.INTERNAL_SERVER_ERROR,
      });
    }
  });
};

const updateCustomerPasswordService = (user_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const password = generatePassword()
      const cryptedPassword = await passwordToHash(password);
      const user = await getCustomerWithID(user_id);
      await dangerouslyUpdateCustomerPassword(user_id, cryptedPassword);

      // ! Send mail to Customer

      return resolve({
        message: messages.success.UPDATED_SUCCESSFULLY,
        password
      })
    } catch (error) {
      return reject(error.message)
    }
  })
}


const toggleUserBlock = (user_id) => {
  return new Promise(async (resolve, reject) => {
    try{
      const user = await getCustomerWithID(user_id);

      const result = await CustomerModel.updateOne({user_id}, {
        $set: {
          is_blocked: user?.is_blocked ? false : true
        }
      })

      await paymentModel.updateMany({user_id, status: user?.is_blocked ? 2 : 1}, {
        $set: {status: user?.is_blocked ? 1 : 2}
      })

      return resolve({
        message: 'Blocked user successfully!',
        data: result
      })
    }catch(error){
      return reject(error.message)
    }
  })
}

const maidHistory = (maid_id) => {
  return new Promise(async (resolve, reject) => {
    try{
      const history = await MaidHistory.aggregate([
        {
          $match: {
            maid_id
          }
        },
        {
          $lookup: {
            from: "admins",
            localField: "updated_by",
            foreignField: "user_id",
            as: "updated_by"
          }
        },
        {
          $unwind: {
            path: "$updated_by"
          }
        },
        {
          $sort: {
            revision: -1
          }
        }
      ])

      return resolve(history)
    }catch(error){
      return reject(error.message)
    }
  })
}

module.exports = {
  getTeamMembersService,
  deleteTeamMemberService,
  teamMemberRoleChangeService,
  getCustomersService,
  updateCustomerPasswordService,
  toggleUserBlock,
  maidHistory,
};
