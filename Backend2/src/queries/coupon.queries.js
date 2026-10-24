const { couponModel } = require('../models/coupon/coupon.model');
const { paymentModel } = require('../models/payment/payment.model');

const getCoupons = async () => {
  return await couponModel.find({}).sort({ createdAt: -1 });
};

const getCouponById = async (id) => {
  return await couponModel.findById(id);
};

const getCouponByCode = async (code) => {
  return await couponModel.findOne({ code });
};

const countCoupons = async () => {
  return await couponModel.countDocuments({});
};

const saveCoupon = async (body) => {
  const coupon = new couponModel(body);
  return await coupon.save();
};

const updateCoupon = async (coupon, changes) => {
  Object.assign(coupon, changes);
  return await coupon.save();
};

const deleteCouponById = async (id) => {
  return await couponModel.findByIdAndDelete(id);
};

// is_paid is only set once the gateway confirms the order, so abandoned
// checkouts don't use up a once-per-customer coupon.
const countPaidPaymentsWithCoupon = async (user_id, code) => {
  return await paymentModel.countDocuments({ user_id, coupon_code: code, is_paid: true });
};

const countPaymentsWithCoupon = async (code) => {
  return await paymentModel.countDocuments({ coupon_code: code, is_paid: true });
};

module.exports = {
  getCoupons,
  getCouponById,
  getCouponByCode,
  countCoupons,
  saveCoupon,
  updateCoupon,
  deleteCouponById,
  countPaidPaymentsWithCoupon,
  countPaymentsWithCoupon,
};
