const { validateJwtToken } = require("../utils/validateJWT/validateJWT");
const { deleteTeamMemberService, getCustomersService, getTeamMembersService, maidHistory, teamMemberRoleChangeService, toggleUserBlock, updateCustomerPasswordService, deleteCustomerService } = require("../services/admin.service");
const { HttpError } = require("../utils/httpError");
const { responseHandler } = require("../utils/responseHandler/responseHandler");
const { sendMail } = require("../utils/sendMail/sendMail");
const paymentServiceClient = require("../integrations/paymentServiceClient");
const logger = require("../config/logger");
const { logErrorWithSource } = logger;
const messages = require("../utils/constants/messages");

/**
 * This function retrieves team members and sends a response with the retrieved data or an error
 * message.
 * @param {object} req - The `req` parameter is an object representing the HTTP request made to the
 * server. It contains information such as the request method, headers, URL, and any data sent in the
 * request body.
 * @param {object} res - `res` is the response object that is used to send the response back to the
 * client. It contains methods to
 * set the HTTP status code, headers, and body of the response.
 */
const getTeamMembersController = async (req, res) => {
  try {
    const decodedToken = await validateJwtToken(req.headers.authorization);
    getTeamMembersService(decodedToken?.user_id)
      .then((data) => {
        responseHandler(res, 'OK', { team: data });
      })
      .catch((error) => {
        logErrorWithSource(error , {meta: {body: req.body}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error) {
    logErrorWithSource(error , {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
}

const deleteTeamMemberController = async (req, res) => {
  let id = req.params.id;
  deleteTeamMemberService(id).then((data) => {
    responseHandler(res, 'OK', null, data)
  }).catch((error) => {
    logErrorWithSource(error , {meta: {body: req.body}})
    responseHandler(res, 'NOT_FOUND', null, error)
  })
}

const teamMemberRoleChangeController = async (req, res) => {
  const id = req?.params?.id;
  teamMemberRoleChangeService(id).then((data) => {
    responseHandler(res, 'OK', null, data)
  }).catch((error) => {
    if (error?.message === messages.error.USER_NOT_FOUND) {
      return responseHandler(res, 'NOT_FOUND', null, error)
    }
    logErrorWithSource(error , {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error)
  })
}


const INACTIVE_PLAN_STATUSES = ['expired', 'pending', 'no_payment'];

// Calendar days are UAE days (UTC+4, no DST), so "2026-11-13" means
// 2026-11-13 00:00 to 24:00 in Dubai rather than in UTC.
const UAE_OFFSET = '+04:00';
const DAY_MS = 24 * 60 * 60 * 1000;

// "YYYY-MM-DD" -> Date at the start of that UAE day, or null if not a real date.
const parseUaeDay = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00${UAE_OFFSET}`);
  if (Number.isNaN(date.getTime())) return null;
  // Reject rollovers like 2026-02-30, which Date would quietly turn into March 2.
  const roundTrip = new Date(date.getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return roundTrip === value ? date : null;
};

// ?date=YYYY-MM-DD for one day, or ?from=YYYY-MM-DD&to=YYYY-MM-DD (both inclusive,
// either may be left out). Returns { range: { createdFrom, createdBefore } } or { error }.
const parseSignupDateFilter = (query) => {
  const present = (key) => typeof query[key] === 'string' && query[key] !== '';
  if (present('date') && (present('from') || present('to'))) {
    return { error: 'Use either date, or from/to, not both.' };
  }
  const days = {};
  for (const key of ['date', 'from', 'to']) {
    if (query[key] === undefined || query[key] === '') continue;
    days[key] = parseUaeDay(query[key]);
    if (!days[key]) return { error: `${key} must be a valid date in YYYY-MM-DD format.` };
  }
  if (days.date) {
    return { range: { createdFrom: days.date, createdBefore: new Date(days.date.getTime() + DAY_MS) } };
  }
  if (days.from && days.to && days.from > days.to) {
    return { error: 'from must be on or before to.' };
  }
  return {
    range: {
      createdFrom: days.from,
      createdBefore: days.to ? new Date(days.to.getTime() + DAY_MS) : undefined,
    },
  };
};

// options.unpaidOnly limits the list to customers with no paid payment;
// options.inactiveOnly to customers with no active plan (200 per page),
// optionally narrowed by ?status= to one of INACTIVE_PLAN_STATUSES.
const customersController = (options) => async (req, res) => {
  try {
    // parseInt of a missing param is NaN, which MongoDB rejects in $skip
    let page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = options?.inactiveOnly ? 200 : 100; // fixed page size
    let search = typeof req.query.search === "string" ? req.query.search : "";
    let queryOptions = options;
    if (options?.inactiveOnly && req.query.status !== undefined && req.query.status !== "") {
      const status = req.query.status;
      if (!INACTIVE_PLAN_STATUSES.includes(status)) {
        return responseHandler(res, 'BAD_REQUEST', null, {
          message: `status must be one of: ${INACTIVE_PLAN_STATUSES.join(', ')}.`,
        });
      }
      queryOptions = { ...options, status };
    }
    if (options?.inactiveOnly) {
      const dates = parseSignupDateFilter(req.query);
      if (dates.error) {
        return responseHandler(res, 'BAD_REQUEST', null, { message: dates.error });
      }
      queryOptions = { ...queryOptions, ...dates.range };
    }
    getCustomersService(page, limit, search, queryOptions)
      .then((data) => {
        responseHandler(res, 'OK', { customer: data });
      })
      .catch((error) => {
        console.error(error, 'this is error')
        logErrorWithSource(error , {meta: {body: req.body}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error) {
    console.error(error, 'this is error')
    logErrorWithSource(error , {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

const getCustomersController = customersController();
const getUnpaidCustomersController = customersController({ unpaidOnly: true });
const getInactiveCustomersController = customersController({ inactiveOnly: true });

const updateCustomerPasswordController = async (req, res) => {
  const { user_id } = req.body;
  if (typeof user_id !== 'string' || !user_id) {
    return responseHandler(res, 'BAD_REQUEST', null, { message: 'user_id is required.' })
  }
  updateCustomerPasswordService(user_id)
    .then((data) => {
      responseHandler(res, 'OK', { password: data.password }, { message: data.message })
    }).catch(errorMessage => {
      if (errorMessage === messages.error.USER_NOT_FOUND) {
        return responseHandler(res, 'NOT_FOUND', null, { message: errorMessage })
      }
      logger.error(errorMessage , {meta: {body: req.body}})
      responseHandler(res, 'INTERNAL_SERVER_ERROR', null, { message: errorMessage })
    })
}

const verifyCustomerPaymentController = async (req, res) => {
  const {transRef, user_id} = req.body;

  // Cross-service call: payment data/logic is owned by Backend2.
  paymentServiceClient.verifyPayment(transRef, user_id)
    .then((data) => {
        responseHandler(res,'OK',data)
    }).catch((error) => {
      // Backend2 answers 400 for expected outcomes (ref/user mismatch, unpaid).
      if (error?.response?.status === 400) {
        return responseHandler(res,'BAD_REQUEST',null,{message: error.response.data?.message})
      }
      logErrorWithSource(error , {meta: {body: req.body}})
      responseHandler(res,'INTERNAL_SERVER_ERROR',null,{message: error?.response?.data?.message || error?.message || 'Could not verify the payment.'})
    })
}


const toggleUserBlockController = (req, res) => {
  const {user_id} = req.params;

  toggleUserBlock(user_id)
    .then((result) => {
        responseHandler(res,'OK',result.data, {message: result.message})
    }).catch((error) => {
        logErrorWithSource(error , {meta: {body: req.body}})
        responseHandler(res,'INTERNAL_SERVER_ERROR',null,{message: error})
    })
}

const deleteCustomerController = async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await deleteCustomerService(user_id);
    responseHandler(res, 'OK', null, { message: result.message })
  } catch (error) {
    if (error instanceof HttpError) {
      return responseHandler(res, error.status, null, { message: error.message })
    }
    logErrorWithSource(error, { meta: { user_id } })
    responseHandler(res, 'INTERNAL_SERVER_ERROR', null, {})
  }
}

const getMaidHistory = (req, res) => {
  const {maid_id} = req.params;
  if(!maid_id){
    return responseHandler(res, 'BAD_REQUEST', null, {message: 'Maid ID is required'})
  }

  maidHistory(maid_id)
    .then((result) => {
      responseHandler(res,'OK', result, {message: 'Fetched Successfully!'})
    }).catch((error) => {
      logErrorWithSource(error, {meta: {maid_id}})
      responseHandler(res, 'INTERNAL_SERVER_ERROR', null, {})
    })

}

module.exports = {
  getTeamMembersController,
  deleteTeamMemberController,
  teamMemberRoleChangeController,
  getCustomersController,
  getUnpaidCustomersController,
  getInactiveCustomersController,
  updateCustomerPasswordController,
  verifyCustomerPaymentController,
  toggleUserBlockController,
  deleteCustomerController,
  getMaidHistory,
};
