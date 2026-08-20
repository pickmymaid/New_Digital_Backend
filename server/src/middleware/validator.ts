import { NextFunction, Request, Response } from "express";
import { Schema } from "yup";
import { responseHandler } from "../utils/responseHandler/responseHandler";
import { yupErrorMessageFormatter } from "../utils/yupErrorMessageFormatter/yupErrorMessageFormatter";

export const validator = (schema: Schema) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    let body = req.body
    await schema.validate(body);
    next()
  } catch (error: any) {
    responseHandler(res, 'BAD_REQUEST', null, {
      ...yupErrorMessageFormatter(error)
    })
  }
}