import { AdminModel } from "../models/users/admin.model";
import { CustomerModel } from "../models/users/customer.model";
import { CustomerPreferenceModel } from "../models/users/customerPreference.model";
import { IAdminCollection, ICustomerCollection } from "../types/dbStructureTypes";
import { IAdminRegisterBody, ICustomerRegisterBody } from "../types/requestBody.types";
import { createUserID } from "../utils/createUserID/createUserID";

export const createCustomer = async (body: any) => {
  const newUser = new CustomerModel({
    user_id: createUserID(body.first_name as string),
    ...body
  });
  return await newUser.save();
}

export const addCustomerPreference = async (data: any) => {
  const preference = new CustomerPreferenceModel({
    ...data
  })

  return await preference.save();
}

export const updateUserInfo = async(body: any) => {
  return await CustomerModel.updateOne({email: body.email}, {
    $set: {
      ...body
    }
  })
}

export const getCustomerWithID = async (id: string) => {
  return await CustomerModel.findOne({ user_id: id }).lean()
}

export const getCustomerWithEmailOrAccountId = async (id: string, email: string) => {
  return await CustomerModel.findOne({$or: [{account_id: id}, {email}]})
}

export const getAllCustomers = async (
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<{ data: ICustomerCollection[]; count: number }> => {
  const skip = (page - 1) * limit;

  // Build search condition
  const matchStage: any = {};
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

  const pipeline: any[] = [];

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

  const countPipeline: any[] = [];
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

  return { data: data as ICustomerCollection[], count };
};

export const getCustomerWithEmail = async (email: string) => {
  return await CustomerModel.findOne({ email }) as ICustomerCollection
}

export const updateCustomerPasswordToken = async (email: string, reset_token: string | null) => {
  return await CustomerModel.updateOne({ email }, { reset_token })
}

export const updateRoleOfAdmin = async (id: string, currentStatus: boolean | undefined) => {
  return await AdminModel.updateOne({ user_id: id }, { is_super_admin: !currentStatus })
}

export const updateCustomerPasswordWithEmail = async (email: string, password: string) => {
  return await CustomerModel.updateOne({ email }, { password, reset_token: null })
}

export const dangerouslyUpdateCustomerPassword = async (userID: string, password: string) => {
  return await CustomerModel.updateOne({ user_id: userID }, { password, reset_token: null })
}

export const createAdmin = async (body: IAdminRegisterBody) => {
  const newAdmin = new AdminModel({
    user_id: createUserID(body.name),
    ...body
  })
  return await newAdmin.save();
}

export const getAdminWithEmail = async (email: string) => {
  return await AdminModel.findOne({ email }) as IAdminCollection
}

export const getAdminWithID = async (user_id: string) => {
  return await AdminModel.findOne({ user_id }) as IAdminCollection
}

export const updateAdminByEmail = async (email: string, body: any) => {
  return await AdminModel.updateOne({ email }, {
    $set: {
      ...body
    }
  })
}



