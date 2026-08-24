const { createContactService, getContactService } = require("../services/contact.service");
const { responseHandler } = require("../utils/responseHandler/responseHandler");

const createContactController = (req, res) => {
  const contactData = req.body;
  createContactService(contactData).then((message) => {
    responseHandler(res, 'CREATED', null, { message })
  }).catch((errorMessage) => {
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, { message: errorMessage })
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
