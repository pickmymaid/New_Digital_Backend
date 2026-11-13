const { AdminModel } = require("../models/users/admin.model");
const { CustomerModel } = require("../models/users/customer.model");
const { CustomerPreferenceModel } = require("../models/users/customerPreference.model");
const { paymentModel } = require("../models/payment/payment.model");
const { createUserID } = require("../utils/createUserID/createUserID");

const createCustomer = async (body) => {
  const newUser = new CustomerModel({
    user_id: createUserID(body.first_name),
    ...body
  });
  return await newUser.save();
}

const addCustomerPreference = async (data) => {
  const preference = new CustomerPreferenceModel({
    ...data
  })

  return await preference.save();
}

const updateUserInfo = async(body) => {
  return await CustomerModel.updateOne({email: body.email}, {
    $set: {
      ...body
    }
  })
}

const getCustomerWithID = async (id) => {
  return await CustomerModel.findOne({ user_id: id }).lean()
}

const getCustomerWithEmailOrAccountId = async (id, email) => {
  return await CustomerModel.findOne({$or: [{account_id: id}, {email}]})
}

const getAllCustomers = async (
  page = 1,
  limit = 10,
  search,
  { unpaidOnly = false, inactiveOnly = false, status, createdFrom, createdBefore } = {}
) => {
  const skip = (page - 1) * limit;

  const baseStages = [];
  // Signup-date window: createdFrom inclusive, createdBefore exclusive (both Dates).
  if (createdFrom || createdBefore) {
    const createdAt = {};
    if (createdFrom) createdAt.$gte = createdFrom;
    if (createdBefore) createdAt.$lt = createdBefore;
    baseStages.push({ $match: { createdAt } });
  }

  // Same "paid" rule as Backend2's coupon checks: status 2 alone isn't counted,
  // since the expiry job also sets it on orders that were never paid.
  if (unpaidOnly) {
    const paidUserIds = await paymentModel.distinct("user_id", {
      $or: [{ is_paid: true }, { status: 1 }],
    });
    baseStages.push({ $match: { user_id: { $nin: paidUserIds } } });
  }
  if (inactiveOnly) {
    // Active = status 1 (the subscriber check used for maid access) and not past
    // expiryDate, so customers the expiry cron hasn't reached yet still count as expired.
    const activeUserIds = await paymentModel.distinct("user_id", {
      status: 1,
      $or: [{ expiryDate: { $gt: new Date() } }, { expiryDate: null }],
    });
    baseStages.push({ $match: { user_id: { $nin: activeUserIds } } });
  }

  // Build search condition
  const matchStage = {};
  if (search && search.trim() !== "") {
    // Escape regex metacharacters so input like "(" or "+" doesn't throw
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    matchStage.$or = [
      { first_name: regex },
      { last_name: regex },
      { email: regex },
      { phone: regex },
      { "preference.emirate_of_residence": regex },
      { "preference.position_required": regex },
      { "preference.area": regex },
      { "preference.accomodation_type": regex },
      { "preference.heared_from": regex },
      { "preference.child_category": regex },
      { "preference.nationality_preference": regex },
    ];
  }

  const hasSearch = Object.keys(matchStage).length > 0;

  const pipeline = [];

  if (!hasSearch) {
    // Optimization for no search: Sort and Paginate before lookup
    pipeline.push({ $sort: { createdAt: -1 } });
    if (limit) {
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });
    }
    pipeline.push({
      $lookup: {
        from: "customerpreferences",
        localField: "user_id",
        foreignField: "user_id",
        as: "preference",
      },
    });
    pipeline.push({
      $unwind: {
        path: "$preference",
        preserveNullAndEmptyArrays: true,
      },
    });
  } else {
    // Search involves preference fields, must lookup first
    pipeline.push({
      $lookup: {
        from: "customerpreferences",
        localField: "user_id",
        foreignField: "user_id",
        as: "preference",
      },
    });
    pipeline.push({
      $unwind: {
        path: "$preference",
        preserveNullAndEmptyArrays: true,
      },
    });
    pipeline.push({ $match: matchStage });
    pipeline.push({ $sort: { createdAt: -1 } });
    if (limit) {
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });
    }
  }

  pipeline.push({
    $project: {
      user_id: 1,
      first_name: 1,
      last_name: 1,
      email: 1,
      phone: 1,
      createdAt: 1,
      // The admin Customers page shows Blocked/Active and the Block/Unblock toggle from this.
      is_blocked: 1,
      "preference.emirate_of_residence": 1,
      "preference.position_required": 1,
      "preference.area": 1,
      "preference.accomodation_type": 1,
      "preference.heared_from": 1,
      "preference.child_category": 1,
      "preference.nationality_preference": 1,
      "preference.proposed_salary": 1,
      "preference.number_of_family": 1,
      "preference.additional_requirement": 1,
    },
  });

  const countPipeline = [];
  if (!hasSearch) {
    countPipeline.push({ $count: "total" });
  } else {
    countPipeline.push({
      $lookup: {
        from: "customerpreferences",
        localField: "user_id",
        foreignField: "user_id",
        as: "preference",
      },
    });
    countPipeline.push({
      $unwind: {
        path: "$preference",
        preserveNullAndEmptyArrays: true,
      },
    });
    countPipeline.push({ $match: matchStage });
    countPipeline.push({ $count: "total" });
  }

  const facets = { data: pipeline, totalCount: countPipeline };

  // plan_status: "expired" = paid before but the plan has run out,
  // "pending" = started a checkout but never paid, "no_payment" = never started one.
  let everPaidIds = [];
  let anyPaymentIds = [];
  if (inactiveOnly) {
    [everPaidIds, anyPaymentIds] = await Promise.all([
      paymentModel.distinct("user_id", { $or: [{ is_paid: true }, { status: 1 }] }),
      paymentModel.distinct("user_id"),
    ]);

    // ?status= narrows data and count to one plan_status; counts below stays
    // across all of them so every category's total is still available.
    const statusFilters = {
      expired: { user_id: { $in: everPaidIds } },
      pending: { user_id: { $in: anyPaymentIds, $nin: everPaidIds } },
      no_payment: { user_id: { $nin: anyPaymentIds } },
    };
    if (statusFilters[status]) {
      const statusMatch = { $match: statusFilters[status] };
      facets.data = [statusMatch, ...pipeline];
      facets.totalCount = [statusMatch, ...countPipeline];
    }

    // Per-status totals over every matching customer (all pages, search applied).
    facets.statusCounts = [
      ...countPipeline.slice(0, -1), // same filtering as the total, minus $count
      {
        $group: {
          _id: {
            $cond: [
              { $in: ["$user_id", everPaidIds] },
              "expired",
              { $cond: [{ $in: ["$user_id", anyPaymentIds] }, "pending", "no_payment"] },
            ],
          },
          total: { $sum: 1 },
        },
      },
    ];
  }

  const result = await CustomerModel.aggregate([...baseStages, { $facet: facets }]);

  const data = result[0].data;
  const count = result[0].totalCount[0]?.total || 0;

  if (!inactiveOnly) {
    return { data: data, count };
  }

  const everPaid = new Set(everPaidIds);
  const anyPayment = new Set(anyPaymentIds);
  for (const customer of data) {
    customer.plan_status = everPaid.has(customer.user_id)
      ? "expired"
      : anyPayment.has(customer.user_id)
        ? "pending"
        : "no_payment";
  }

  const counts = { total: 0, expired: 0, pending: 0, no_payment: 0 };
  for (const row of result[0].statusCounts) {
    counts[row._id] = row.total;
    counts.total += row.total;
  }

  return { data: data, count, counts };
};

const getCustomerWithEmail = async (email) => {
  return await CustomerModel.findOne({ email })
}

const updateCustomerPasswordToken = async (email, reset_token) => {
  return await CustomerModel.updateOne({ email }, { reset_token })
}

const updateRoleOfAdmin = async (id, currentStatus) => {
  return await AdminModel.updateOne({ user_id: id }, { is_super_admin: !currentStatus })
}

const updateCustomerPasswordWithEmail = async (email, password) => {
  return await CustomerModel.updateOne({ email }, { password, reset_token: null })
}

const dangerouslyUpdateCustomerPassword = async (userID, password) => {
  return await CustomerModel.updateOne({ user_id: userID }, { password, reset_token: null })
}

const createAdmin = async (body) => {
  const newAdmin = new AdminModel({
    user_id: createUserID(body.name),
    ...body
  })
  return await newAdmin.save();
}

const getAdminWithEmail = async (email) => {
  return await AdminModel.findOne({ email })
}

const getAdminWithID = async (user_id) => {
  return await AdminModel.findOne({ user_id })
}

const updateAdminByEmail = async (email, body) => {
  return await AdminModel.updateOne({ email }, {
    $set: {
      ...body
    }
  })
}

module.exports = {
  createCustomer,
  addCustomerPreference,
  updateUserInfo,
  getCustomerWithID,
  getCustomerWithEmailOrAccountId,
  getAllCustomers,
  getCustomerWithEmail,
  updateCustomerPasswordToken,
  updateRoleOfAdmin,
  updateCustomerPasswordWithEmail,
  dangerouslyUpdateCustomerPassword,
  createAdmin,
  getAdminWithEmail,
  getAdminWithID,
  updateAdminByEmail,
};
