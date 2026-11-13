const mongoose = require("mongoose");
const { getAllContacts, saveContact, deleteContactById } = require("../queries/contact.queries");
const messages = require("../utils/constants/messages");
const { HttpError } = require("../utils/httpError");
const { responseHandler } = require("../utils/responseHandler/responseHandler");

const createContactService = (body) => {
  return new Promise(async (resolve, reject) => {
    try {
      await saveContact(body);
      return resolve(messages.success.SUBMIT)
    } catch (error) {
      // Missing/invalid form fields are the caller's fault, not a server error.
      if (error.name === 'ValidationError' || error.name === 'CastError') {
        return reject(new HttpError('BAD_REQUEST', error.message))
      }
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

const deleteContactService = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!mongoose.isValidObjectId(id)) {
        return reject(new HttpError('BAD_REQUEST', 'Invalid contact message id.'))
      }
      const deleted = await deleteContactById(id);
      if (!deleted) {
        return reject(new HttpError('NOT_FOUND', 'Contact message not found.'))
      }
      return resolve(messages.success.DELETED_SUCCESSFULLY)
    } catch (error) {
      return reject(messages.error.INTERNAL_SERVER_ERROR)
    }
  })
}

module.exports = { createContactService, getContactService, deleteContactService };
