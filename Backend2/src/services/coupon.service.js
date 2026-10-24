const mongoose = require('mongoose');
const {
  getCoupons,
  getCouponById,
  getCouponByCode,
  countCoupons,
  saveCoupon,
  updateCoupon,
  deleteCouponById,
  countPaidPaymentsWithCoupon,
  countPaidPaymentsForCustomer,
  countPaymentsWithCoupon,
} = require('../queries/coupon.queries');
const { HttpError } = require('../utils/httpError');

// Seeded once, only into an empty collection, so the welcome offer exists
// out of the box and admins can change or remove it from the dashboard.
const DEFAULT_COUPON = { code: 'WELCOME10', discount_percent: 10 };

const MAX_CODE_LENGTH = 30;
const MIN_PERCENT = 1;
const MAX_PERCENT = 90;

const normalizeCode = (code) => {
  if (typeof code !== 'string' || !code.trim()) {
    throw new HttpError('BAD_REQUEST', 'Coupon code is required.');
  }
  const normalized = code.trim().toUpperCase();
  if (normalized.length > MAX_CODE_LENGTH || !/^[A-Z0-9_-]+$/.test(normalized)) {
    throw new HttpError('BAD_REQUEST', `Coupon code must be up to ${MAX_CODE_LENGTH} letters, numbers, "-" or "_".`);
  }
  return normalized;
};

const normalizePercent = (value) => {
  const percent = Number(value);
  if (!Number.isInteger(percent) || percent < MIN_PERCENT || percent > MAX_PERCENT) {
    throw new HttpError('BAD_REQUEST', `Discount must be a whole number from ${MIN_PERCENT} to ${MAX_PERCENT}.`);
  }
  return percent;
};

// null/'' clears the expiry; anything else must parse as a date.
const normalizeExpiry = (value) => {
  if (value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError('BAD_REQUEST', 'expires_at must be a valid date.');
  }
  return date;
};

const normalizeBoolean = (value, field) => {
  if (typeof value !== 'boolean') {
    throw new HttpError('BAD_REQUEST', `${field} must be true or false.`);
  }
  return value;
};

// Amounts are in fils (AED * 100), as sent to the payment gateway.
const applyDiscount = (amount, percent) => {
  if (!percent) return amount;
  return Math.round((amount * (100 - percent)) / 100);
};

const findCouponOrThrow = async (id) => {
  if (!id || !mongoose.isValidObjectId(id)) throw new HttpError('BAD_REQUEST', 'Invalid coupon id.');
  const coupon = await getCouponById(id);
  if (!coupon) throw new HttpError('NOT_FOUND', 'Coupon not found.');
  return coupon;
};

const ensureCodeAvailable = async (code, exceptId) => {
  const existing = await getCouponByCode(code);
  if (existing && existing._id.toString() !== exceptId?.toString()) {
    throw new HttpError('CONFLICT', `A coupon with code "${code}" already exists.`);
  }
};

const seedDefaultCouponService = async () => {
  if (await countCoupons() > 0) return;
  await saveCoupon(DEFAULT_COUPON);
};

// Resolves a code the customer typed into a coupon they can use right now.
// user_id is optional so the public preview works before login; the
// per-customer rules are always enforced again at create-payment, where
// the customer is always known.
const findUsableCouponService = async (rawCode, user_id) => {
  const code = normalizeCode(rawCode);
  const coupon = await getCouponByCode(code);
  if (!coupon || !coupon.is_active) {
    throw new HttpError('NOT_FOUND', 'This coupon code is not valid.');
  }
  if (coupon.expires_at && coupon.expires_at < new Date()) {
    throw new HttpError('BAD_REQUEST', 'This coupon code has expired.');
  }
  if (coupon.new_customers_only && user_id && await countPaidPaymentsForCustomer(user_id) > 0) {
    throw new HttpError('BAD_REQUEST', 'This coupon is only for new customers. Your account has already purchased a package.');
  }
  if (coupon.once_per_customer && user_id && await countPaidPaymentsWithCoupon(user_id, code) > 0) {
    throw new HttpError('BAD_REQUEST', 'You have already used this coupon code.');
  }
  return coupon;
};

const listCouponsService = async () => {
  const coupons = await getCoupons();
  return await Promise.all(
    coupons.map(async (coupon) => ({
      ...coupon.toObject(),
      times_used: await countPaymentsWithCoupon(coupon.code),
    }))
  );
};

const createCouponService = async (body) => {
  const code = normalizeCode(body?.code);
  await ensureCodeAvailable(code);
  const coupon = {
    code,
    discount_percent: normalizePercent(body?.discount_percent),
  };
  if (body?.is_active !== undefined) coupon.is_active = normalizeBoolean(body.is_active, 'is_active');
  if (body?.once_per_customer !== undefined) {
    coupon.once_per_customer = normalizeBoolean(body.once_per_customer, 'once_per_customer');
  }
  if (body?.new_customers_only !== undefined) {
    coupon.new_customers_only = normalizeBoolean(body.new_customers_only, 'new_customers_only');
  }
  if (body?.expires_at !== undefined) coupon.expires_at = normalizeExpiry(body.expires_at);
  return await saveCoupon(coupon);
};

const updateCouponService = async (id, body) => {
  const coupon = await findCouponOrThrow(id);
  const changes = {};

  if (body?.code !== undefined) {
    const code = normalizeCode(body.code);
    if (code !== coupon.code) {
      await ensureCodeAvailable(code, coupon._id);
      changes.code = code;
    }
  }
  if (body?.discount_percent !== undefined) changes.discount_percent = normalizePercent(body.discount_percent);
  if (body?.is_active !== undefined) changes.is_active = normalizeBoolean(body.is_active, 'is_active');
  if (body?.once_per_customer !== undefined) {
    changes.once_per_customer = normalizeBoolean(body.once_per_customer, 'once_per_customer');
  }
  if (body?.new_customers_only !== undefined) {
    changes.new_customers_only = normalizeBoolean(body.new_customers_only, 'new_customers_only');
  }
  if (body?.expires_at !== undefined) changes.expires_at = normalizeExpiry(body.expires_at);

  return await updateCoupon(coupon, changes);
};

// Past payments keep the coupon_code and discount they were charged with.
const deleteCouponService = async (id) => {
  const coupon = await findCouponOrThrow(id);
  await deleteCouponById(coupon._id);
  return coupon;
};

module.exports = {
  applyDiscount,
  normalizeCode,
  normalizePercent,
  seedDefaultCouponService,
  findUsableCouponService,
  listCouponsService,
  createCouponService,
  updateCouponService,
  deleteCouponService,
};
