const crypto = require("crypto");
const { createPaymentService, getInvoice, verifyPaymentService, handleGatewayWebhook } = require("../../services/v2/payment.service");
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
            // Customer-facing reasons (unknown order, not paid yet) are rejected
            // as strings: an expected outcome, so a 400 the return page retries.
            if (typeof error === 'string') {
                return responseHandler(res,'BAD_REQUEST',null,{message: error})
            }
            logErrorWithSource(error , {meta: {ref: params?.ref}})
            responseHandler(res,'INTERNAL_SERVER_ERROR',null,{message: 'Could not verify the payment. Please try again.'})
        })

}

const secretsMatch = (given, expected) => {
    const a = Buffer.from(String(given ?? ''));
    const b = Buffer.from(String(expected));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// N-Genius calls this when an order changes. It must carry the custom
// header set up in the N-Genius portal. A non-2xx answer makes N-Genius
// retry, so only a real failure to process returns one.
const gatewayWebhookController = async (req, res) => {
    const secret = process.env.PG_WEBHOOK_SECRET;
    if (!secret) {
        return responseHandler(res, 'NOT_FOUND', null, {message: 'Payment webhook is not enabled.'});
    }
    const headerName = (process.env.PG_WEBHOOK_HEADER || 'x-webhook-secret').toLowerCase();
    if (!secretsMatch(req.headers[headerName], secret)) {
        logger.warn('Rejected payment webhook with a missing or wrong secret');
        return responseHandler(res, 'UNAUTHORIZED');
    }

    try {
        const result = await handleGatewayWebhook(req.body);
        logger.info('Payment webhook received', {meta: {event: req.body?.eventName, ref: req.body?.order?.reference, ...result}});
        responseHandler(res, 'OK', result);
    } catch (error) {
        logErrorWithSource(error, {meta: {event: req.body?.eventName, ref: req.body?.order?.reference}});
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, {message: 'Could not process the webhook.'});
    }
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
  gatewayWebhookController,
  downloadInvoice,
  sendInvoiceToMail,
};
