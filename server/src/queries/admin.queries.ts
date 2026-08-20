import { AdminModel } from "../models/users/admin.model"

export const getAllTeamMember = async (user_id: string) => {
  return await AdminModel.find({ user_id: { $ne: user_id }, status: {$ne: 'deleted'} }, { _id: 0, password: 0, createdAt: 0, updatedAt: 0 })
}

export const deleteTeamMember = async (user_id: string) => {
  return await AdminModel.updateOne({ user_id }, { status: 'deleted' })
}


