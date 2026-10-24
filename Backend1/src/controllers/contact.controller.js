const { createContactService, getContactService } = require("../services/contact.service");
const { responseHandler } = require("../utils/responseHandler/responseHandler");
const { HttpError } = require("../utils/httpError");

const createContactController = (req, res) => {
  const contactData = req.body;
  createContactService(contactData).then((message) => {
    responseHandler(res, 'CREATED', null, { message })
  }).catch((error) => {
    if (error instanceof HttpError) {
      return responseHandler(res, error.status, null, { message: error.message })
    }
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, { message: error })
  })
}

const getContactController = (req, res) => {
  getContactService().then((data) => {
    responseHandler(res, 'OK', { contacts: data.data }, { message: data.message })
  }).catch((error) => {
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null)
  })
}

module.exports = { createContactController, getContactController };
