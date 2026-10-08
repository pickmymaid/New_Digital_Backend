const {
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
} = require("../queries/skill.queries");
const { HttpError } = require("../utils/httpError");
const { isValidMongoId } = require("../utils/isValidMongoId/isValidMongoId");

// The list the admin panel's maid form used before skills were managed here.
// Seeded once, only into an empty collection, so admins start with it.
const DEFAULT_SKILLS = [
  "Newborn Care",
  "Child Care",
  "Cooking",
  "Assisting in Kitchen",
  "Private Tutor",
  "Private Nurse",
  "Elderly Care",
  "Caregiver",
  "Postpartum Care",
  "Private Driver",
  "Pet Care",
  "Gardening",
  "Car Washing",
  "Cleaning/Housekeeping",
];

const MAX_NAME_LENGTH = 60;

const normalizeName = (name) => {
  if (typeof name !== 'string' || !name.trim()) {
    throw new HttpError('BAD_REQUEST', 'Skill name is required.');
  }
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new HttpError('BAD_REQUEST', `Skill name must be at most ${MAX_NAME_LENGTH} characters.`);
  }
  return trimmed;
}

const findSkillOrThrow = async (id) => {
  if (!id || !isValidMongoId(id)) throw new HttpError('BAD_REQUEST', 'Invalid skill id.');
  const skill = await getSkillById(id);
  if (!skill) throw new HttpError('NOT_FOUND', 'Skill not found.');
  return skill;
}

const ensureNameAvailable = async (name, exceptId) => {
  const existing = await getSkillByName(name);
  if (existing && existing._id.toString() !== exceptId?.toString()) {
    throw new HttpError('CONFLICT', `A skill named "${existing.name}" already exists.`);
  }
}

const seedDefaultSkillsService = async () => {
  if (await countSkills() > 0) return;
  await insertSkills(DEFAULT_SKILLS);
}

const listSkillsService = async ({ includeInactive = false } = {}) => {
  return await getSkills(includeInactive ? {} : { is_active: true });
}

const createSkillService = async (body) => {
  const name = normalizeName(body?.name);
  await ensureNameAvailable(name);
  return await saveSkill({ name, is_active: body?.is_active !== false });
}

const updateSkillService = async (id, body) => {
  const skill = await findSkillOrThrow(id);
  const changes = {};
  let renamedFrom = null;

  if (body?.name !== undefined) {
    const name = normalizeName(body.name);
    if (name !== skill.name) {
      await ensureNameAvailable(name, skill._id);
      renamedFrom = skill.name;
      changes.name = name;
    }
  }
  if (body?.is_active !== undefined) {
    if (typeof body.is_active !== 'boolean') {
      throw new HttpError('BAD_REQUEST', 'is_active must be true or false.');
    }
    changes.is_active = body.is_active;
  }

  const updated = await updateSkill(skill, changes);
  let maidsUpdated = 0;
  if (renamedFrom) {
    const result = await renameSkillOnMaids(renamedFrom, updated.name);
    maidsUpdated = result.modifiedCount || 0;
  }
  return { skill: updated, maidsUpdated };
}

// Maid profiles keep the skill name they already have — deleting only removes it
// from the catalog, so it stops being offered for new/edited profiles.
const deleteSkillService = async (id) => {
  const skill = await findSkillOrThrow(id);
  const maidsUsing = await countMaidsWithSkill(skill.name);
  await deleteSkillById(skill._id);
  return { skill, maidsUsing };
}

module.exports = {
  seedDefaultSkillsService,
  listSkillsService,
  createSkillService,
  updateSkillService,
  deleteSkillService,
};
