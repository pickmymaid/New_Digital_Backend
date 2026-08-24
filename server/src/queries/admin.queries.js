const { AdminModel } = require("../models/users/admin.model")

const getAllTeamMember = async (user_id) => {
  return await AdminModel.find({ user_id: { $ne: user_id }, status: {$ne: 'deleted'} }, { _id: 0, password: 0, createdAt: 0, updatedAt: 0 })
}

const deleteTeamMember = async (user_id) => {
  return await AdminModel.updateOne({ user_id }, { status: 'deleted' })
}

module.exports = { getAllTeamMember, deleteTeamMember };
