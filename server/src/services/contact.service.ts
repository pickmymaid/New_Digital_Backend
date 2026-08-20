import { getAllContacts, saveContact } from "../queries/contact.queries";
import { IContactBody } from "../types/requestBody.types";
import messages from "../utils/constants/messages";
import { responseHandler } from "../utils/responseHandler/responseHandler";

export const createContactService = (body: IContactBody) => {
  return new Promise(async (resolve, reject) => {
    try {
      await saveContact(body);
      return resolve(messages.success.SUBMIT)
    } catch (error: any) {
      return reject(error.message)
    }
  })
}

export const getContactService = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const contactData = await getAllContacts();
      return resolve({
        message: messages.success.RETRIEVED_SUCCESSFULLY,
        data: contactData
      })
    } catch (error: any) {
      return reject(messages.error.INTERNAL_SERVER_ERROR)
    }
  })
}