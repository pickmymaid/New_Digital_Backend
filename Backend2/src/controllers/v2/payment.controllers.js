const { createPaymentService, getInvoice, verifyPaymentService } = require("../../services/v2/payment.service");
const { validateJwtToken } = require("../../utils/validateJWT/validateJWT");
const { responseHandler } = require("../../utils/responseHandler/responseHandler");
const { recieptTemplate } = require("../../templates/recieptTemplate");
const { sendMail } = require("../../utils/sendMail/sendMail");
const { recieptBody } = require("../../utils/mailBody/reciept");
const logger = require("../../config/logger");
const { logErrorWithSource } = logger;
const { sendSesEmailWithAttachment } = require("../../utils/sendMail/sendSESMail");

const createPaymentController = async (req, res) => {
    const {body} = req;
    const user = req.user
    createPaymentService(body?.type, user?._id)
        .then((data) => {
            responseHandler(res,'OK',data)
        })
        .catch((error) => {
            logErrorWithSource(error , {meta: {body: req.body}})
            responseHandler(res,'INTERNAL_SERVER_ERROR',error)
        })
}

const acknowledgePaymentController = async (req, res) => {
    const {params} = req;
    const user = req.user;
    verifyPaymentService(params?.ref, user?._id)
        .then((data) => {
            responseHandler(res,'OK',data)
        }).catch((error) => {
            logErrorWithSource(error , {meta: {body: req.body}})
            responseHandler(res,'INTERNAL_SERVER_ERROR',null,{message: error})
        })

}

const generateReciept = async (req, res) => {
    const template = await recieptTemplate('Muhsin\nmuhsinny333@gmail.com\n+918606113002', '633d3ede43ed3343244','Premium Plan', '01/02/2023-01/03/2024',699,599, '01/02/2023');
    sendSesEmailWithAttachment(
        "muhsinny333@gmail.com",
        'Pickmymaid Subscription Confirmation and Receipt',
        recieptBody('Muhsin','01/02/2023','01/03/2023','Premium Plan'),
        '',
        [
            {
              filename: `muhsin Invoice.pdf`,
              content: template.buffer,
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

const downloadInvoice = async (req, res) => {
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

const sendInvoiceToMail = async (req, res) => {
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

module.exports = {
  createPaymentController,
  acknowledgePaymentController,
  generateReciept,
  downloadInvoice,
  sendInvoiceToMail,
};
