const { createPaymentService, getInvoice, verifyPaymentService } = require("../../services/v2/payment.service");
const { validateJwtToken } = require("../../utils/validateJWT/validateJWT");
const { responseHandler } = require("../../utils/responseHandler/responseHandler");
const logger = require("../../config/logger");
const { logErrorWithSource } = logger;
const { HttpError } = require("../../utils/httpError");

const createPaymentController = async (req, res) => {
    const {body} = req;
    const user = req.user
    createPaymentService(body?.type, user?._id, body?.coupon_code)
        .then((data) => {
            responseHandler(res,'OK',data)
        })
        .catch((error) => {
            // Invalid/expired/used coupon — tell the customer instead of a 500.
            if(error instanceof HttpError){
                return responseHandler(res, error.status, null, {message: error.message})
            }
            logErrorWithSource(error , {meta: {body: req.body}})
            // Don't echo the raw error: gateway (axios) errors are circular and would make res.send throw.
            responseHandler(res,'INTERNAL_SERVER_ERROR')
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
            // Customer-facing reasons are rejected as strings; anything else (e.g. a gateway error) stays in the logs.
            const message = typeof error === 'string' ? error : 'Could not verify the payment. Please try again.'
            responseHandler(res,'INTERNAL_SERVER_ERROR',null,{message})
        })

}

// Customers can only download their own invoices: the owner comes from the
// session, never from the request body.
const downloadInvoice = async (req, res) => {
    const user_id = req.user?.user_id;
    const ref = req.body?.ref;

    if (typeof ref !== 'string' || !ref) {
      return responseHandler(res, 'BAD_REQUEST', null, { message: 'Payment reference is required.' });
    }

    try {
      const data = await getInvoice(ref, user_id);

      if (data) {
        responseHandler(res, 'OK', data)
      } else {
        responseHandler(res, 'NOT_FOUND', null, { message: 'Invoice not found.' });
      }
    } catch (error) {
      // getInvoice rejects with `false` when no payment matches ref + user.
      if (error === false) {
        return responseHandler(res, 'NOT_FOUND', null, { message: 'Invoice not found.' });
      }
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
  downloadInvoice,
  sendInvoiceToMail,
};
