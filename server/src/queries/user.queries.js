const { AdminModel } = require("../models/users/admin.model");
const { CustomerModel } = require("../models/users/customer.model");
const { CustomerPreferenceModel } = require("../models/users/customerPreference.model");
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
  search
) => {
  const skip = (page - 1) * limit;

  // Build search condition
  const matchStage = {};
  if (search && search.trim() !== "") {
    const regex = new RegExp(search.trim(), "i");
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
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
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
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
  }

  pipeline.push({
    $project: {
      user_id: 1,
      first_name: 1,
      last_name: 1,
      email: 1,
      phone: 1,
      createdAt: 1,
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

  const result = await CustomerModel.aggregate([
    {
      $facet: {
        data: pipeline,
        totalCount: countPipeline,
      },
    },
  ]);

  const data = result[0].data;
  const count = result[0].totalCount[0]?.total || 0;

  return { data: data, count };
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
