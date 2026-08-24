const { getAllContacts, saveContact } = require("../queries/contact.queries");
const messages = require("../utils/constants/messages");
const { responseHandler } = require("../utils/responseHandler/responseHandler");

const createContactService = (body) => {
  return new Promise(async (resolve, reject) => {
    try {
      await saveContact(body);
      return resolve(messages.success.SUBMIT)
    } catch (error) {
      return reject(error.message)
    }
  })
}

const getContactService = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const contactData = await getAllContacts();
      return resolve({
        message: messages.success.RETRIEVED_SUCCESSFULLY,
        data: contactData
      })
    } catch (error) {
      return reject(messages.error.INTERNAL_SERVER_ERROR)
    }
  })
}

module.exports = { createContactService, getContactService };
