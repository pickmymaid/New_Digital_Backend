import { Request, Response } from "express";
import { IContactBody } from "../types/requestBody.types";
import { createContactService, getContactService } from "../services/contact.service";
import { responseHandler } from "../utils/responseHandler/responseHandler";

export const createContactController = (req: Request, res: Response) => {
  const contactData: IContactBody = req.body;
  createContactService(contactData).then((message: any) => {
    responseHandler(res, 'CREATED', null, { message })
  }).catch((errorMessage: string) => {
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, { message: errorMessage })
  })
}

export const getContactController = (req: Request, res: Response) => {
  getContactService().then((data: any) => {
    responseHandler(res, 'OK', { contacts: data.data }, { message: data.message })
  }).catch((error: string) => {
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null)
  })
}