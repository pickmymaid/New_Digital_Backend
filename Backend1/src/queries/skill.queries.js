const { SkillModel } = require("../models/skill/skill.model");
const { jobApplicationModel } = require("../models/jobApplication/jobApplication.model");

const getSkills = async (filter = {}) => {
  return await SkillModel.find(filter).sort({ name: 1 })
}

const getSkillById = async (id) => {
  return await SkillModel.findById(id)
}

const getSkillByName = async (name) => {
  return await SkillModel.findOne({ name_key: name.trim().toLowerCase() })
}

const countSkills = async () => {
  return await SkillModel.countDocuments({})
}

const saveSkill = async (body) => {
  const skill = new SkillModel({ name: body.name, is_active: body.is_active });
  return await skill.save();
}

const insertSkills = async (names) => {
  return await SkillModel.insertMany(names.map((name) => ({ name, name_key: name.toLowerCase() })), { ordered: false })
}

const updateSkill = async (skill, changes) => {
  Object.assign(skill, changes);
  return await skill.save();
}

const deleteSkillById = async (id) => {
  return await SkillModel.findByIdAndDelete(id)
}

// Maids store skills by name, so a rename has to be carried over to their profiles.
const renameSkillOnMaids = async (oldName, newName) => {
  return await jobApplicationModel.updateMany(
    { skills: oldName },
    { $set: { 'skills.$[s]': newName } },
    { arrayFilters: [{ s: oldName }] },
  )
}

const countMaidsWithSkill = async (name) => {
  return await jobApplicationModel.countDocuments({ skills: name })
}

module.exports = {
  getSkills,
  getSkillById,
  getSkillByName,
  countSkills,
  saveSkill,
  insertSkills,
  updateSkill,
  deleteSkillById,
  renameSkillOnMaids,
  countMaidsWithSkill,
};
