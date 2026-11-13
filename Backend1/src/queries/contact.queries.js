const { ContactModel } = require("../models/contact/contact.model");

const saveContact = async (body) => {
  let contactForm = new ContactModel({
    ...body
  });
  return await contactForm.save();
}

const getAllContacts = async () => {
  return await ContactModel.find({}).sort({ updatedAt: -1 })
}

const deleteContactById = async (id) => {
  return await ContactModel.findByIdAndDelete(id);
}

module.exports = { saveContact, getAllContacts, deleteContactById };
