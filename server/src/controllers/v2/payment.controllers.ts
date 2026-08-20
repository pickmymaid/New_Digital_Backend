import { Request, Response } from "express";
import { createPaymentService, getInvoice, verifyPaymentService } from "../../services/v2/payment.service";
import { validateJwtToken } from "../../utils/validateJWT/validateJWT";
import { responseHandler } from "../../utils/responseHandler/responseHandler";
import { recieptTemplate } from "../../templates/recieptTemplate";
import { sendMail } from "../../utils/sendMail/sendMail";
import { recieptBody } from "../../utils/mailBody/reciept";
import logger, { logErrorWithSource } from "../../config/logger";
import { sendSesEmailWithAttachment } from "../../utils/sendMail/sendSESMail";

export const createPaymentController = async (req: Request, res: Response) => {
    const {body} = req;
    const user:any = req.user
    createPaymentService(body?.type, user?._id)
        .then((data) => {
            responseHandler(res,'OK',data)
        })
        .catch((error:any) => {
            logErrorWithSource(error , {meta: {body: req.body}})
            responseHandler(res,'INTERNAL_SERVER_ERROR',error)
        })
}

export const acknowledgePaymentController = async (req: Request, res: Response) => {
    const {params} = req;
    const user:any = req.user;
    verifyPaymentService(params?.ref, user?._id)
        .then((data:any) => {
            responseHandler(res,'OK',data)
        }).catch((error:any) => {
            logErrorWithSource(error , {meta: {body: req.body}})
            responseHandler(res,'INTERNAL_SERVER_ERROR',null,{message: error})
        })
    
}

export const generateReciept = async (req: Request, res: Response) => {
    const template = await recieptTemplate('Muhsin\nmuhsinny333@gmail.com\n+918606113002', '633d3ede43ed3343244','Premium Plan', '01/02/2023-01/03/2024',699,599, '01/02/2023');
    sendSesEmailWithAttachment(
        "muhsinny333@gmail.com" as string,
        'Pickmymaid Subscription Confirmation and Receipt',
        recieptBody('Muhsin','01/02/2023','01/03/2023','Premium Plan'), 
        '',
        [
            {
              filename: `muhsin Invoice.pdf`,
              content: template.buffer as string,
              contentType: "application/pdf",
            },
        ]
    )
    if(template?.status){
        res.send(template.buffer)
    }else{
        responseHandler(res,'INTERNAL_SERVER_ERROR',null, {message: 'Something went wrong on generating!'})
    }
}

export const downloadInvoice = async (req: Request, res: Response) => {
    try {
      const user_id = req.body.user_id;
      const ref = req.body.ref;
  
      const data = await getInvoice(ref, user_id);
  
      if (data) {
        responseHandler(res, 'OK', data)
      } else {
        responseHandler(res, "INTERNAL_SERVER_ERROR", null, {
          message: "Something went wrong on generating!",
        });
      }
    } catch (error) {
      responseHandler(res, "INTERNAL_SERVER_ERROR", null, {
        message: "Something went wrong on generating!",
      });
    }
};

export const sendInvoiceToMail = async (req: Request, res: Response) => {
    try{
        const user_id = req.body.user_id;
        const ref = req.body.ref;

        const data = await getInvoice(ref,user_id);

        if(data){
            responseHandler(res,'OK',data)
        }else{
            responseHandler(res,'INTERNAL_SERVER_ERROR',null, {message: 'Something went wrong on generating!'})
        }
    }catch(error){
        responseHandler(res,'INTERNAL_SERVER_ERROR',null, {message: 'Something went wrong on generating!'})
    }
}