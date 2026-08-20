import { ContactModel } from "../models/contact/contact.model";
import { IContactBody } from "../types/requestBody.types";

export const saveContact = async (body: IContactBody) => {
  let contactForm = new ContactModel({
    ...body
  });
  return await contactForm.save();
}

export const getAllContacts = async () => {
  return await ContactModel.find({}).sort({ updatedAt: -1 })
}