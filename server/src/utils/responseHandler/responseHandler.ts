import { Response } from "express";
import { httpStatus } from "../constants/httpStatusCodes";

export const responseHandler = (
  res: Response,
  status: 'OK' | 'CREATED' | 'NO_CONTENT' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR' | 'BAD_REQUEST',
  data?: any,
  addOns?: { [key: string]: any },
) => {
  let resBody: { [key: string]: any } = {
    ...httpStatus[status],
    ...addOns,
  }
  if (data) resBody.data = data
  res.status(httpStatus[status].statusCode).send(resBody)
}