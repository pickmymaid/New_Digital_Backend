const {
  findUsableCouponService,
  listCouponsService,
  createCouponService,
  updateCouponService,
  deleteCouponService,
} = require('../services/coupon.service');
const { responseHandler } = require('../utils/responseHandler/responseHandler');
const { HttpError } = require('../utils/httpError');
const messages = require('../utils/constants/messages');
const { logErrorWithSource } = require('../config/logger');

const sendCouponError = (res, error) => {
  if (error instanceof HttpError) {
    return responseHandler(res, error.status, null, { message: error.message });
  }
  // Unique index on code — two requests raced past the duplicate check.
  if (error?.code === 11000) {
    return responseHandler(res, 'CONFLICT', null, { message: 'A coupon with this code already exists.' });
  }
  logErrorWithSource(error);
  return responseHandler(res, 'INTERNAL_SERVER_ERROR', null, { message: messages.error.INTERNAL_SERVER_ERROR });
};

// Public — lets the packages page preview a discount. Only the code and
// percentage are exposed, never the admin settings.
const validateCouponController = async (req, res) => {
  try {
    const coupon = await findUsableCouponService(req.query.code, req.user?._id);
    responseHandler(
      res,
      'OK',
      { code: coupon.code, discount_percent: coupon.discount_percent },
      { message: `${coupon.code} applied — ${coupon.discount_percent}% off` }
    );
  } catch (error) {
    sendCouponError(res, error);
  }
};

const getCouponsController = async (req, res) => {
  try {
    const coupons = await listCouponsService();
    responseHandler(res, 'OK', { coupons }, { message: messages.success.RETRIEVED_SUCCESSFULLY });
  } catch (error) {
    sendCouponError(res, error);
  }
};

const createCouponController = async (req, res) => {
  try {
    const coupon = await createCouponService(req.body);
    responseHandler(res, 'CREATED', { coupon }, { message: 'Coupon created successfully' });
  } catch (error) {
    sendCouponError(res, error);
  }
};

const updateCouponController = async (req, res) => {
  try {
    const coupon = await updateCouponService(req.params.id, req.body);
    responseHandler(res, 'OK', { coupon }, { message: messages.success.UPDATED_SUCCESSFULLY });
  } catch (error) {
    sendCouponError(res, error);
  }
};

const deleteCouponController = async (req, res) => {
  try {
    const coupon = await deleteCouponService(req.params.id);
    responseHandler(res, 'OK', { coupon }, { message: messages.success.DELETED_SUCCESSFULLY });
  } catch (error) {
    sendCouponError(res, error);
  }
};

module.exports = {
  validateCouponController,
  getCouponsController,
  createCouponController,
  updateCouponController,
  deleteCouponController,
};
