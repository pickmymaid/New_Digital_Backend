const { SkillModel } = require("../models/skill/skill.model");
const { jobApplicationModel } = require("../models/jobApplication/jobApplication.model");

// Admin order first; skills never placed (sort_order null) follow, A–Z. Sorted here rather
// than in Mongo, which would put nulls first. The catalog is a few dozen documents.
const bySortOrderThenName = (a, b) =>
  (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity) || a.name.localeCompare(b.name)

const getSkills = async (filter = {}) => {
  const skills = await SkillModel.find(filter)
  return skills.sort(bySortOrderThenName)
}

// Next free position, so a new skill lands at the end of the admin's order.
const nextSortOrder = async () => {
  const last = await SkillModel.findOne({ sort_order: { $ne: null } }, { sort_order: 1 }).sort({ sort_order: -1 })
  return last ? last.sort_order + 1 : null
}

// ids: every skill's _id in the new display order.
const setSkillOrder = async (ids) => {
  return await SkillModel.bulkWrite(
    ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { sort_order: index } } } }))
  )
}

const clearSkillOrder = async () => {
  return await SkillModel.updateMany({}, { $set: { sort_order: null } })
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
  const skill = new SkillModel({ name: body.name, is_active: body.is_active, sort_order: await nextSortOrder() });
  return await skill.save();
}

const ensureSkillIndexes = async () => {
  return await SkillModel.init()
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
  setSkillOrder,
  clearSkillOrder,
  getSkills,
  getSkillById,
  getSkillByName,
  countSkills,
  saveSkill,
  insertSkills,
  ensureSkillIndexes,
  updateSkill,
  deleteSkillById,
  renameSkillOnMaids,
  countMaidsWithSkill,
};
