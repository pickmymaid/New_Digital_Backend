const {
  listSkillsService,
  createSkillService,
  updateSkillService,
  deleteSkillService,
} = require("../services/skill.service");
const { responseHandler } = require("../utils/responseHandler/responseHandler");
const { HttpError } = require("../utils/httpError");
const messages = require("../utils/constants/messages");
const { logErrorWithSource } = require("../config/logger");

const sendSkillError = (res, error) => {
  if (error instanceof HttpError) {
    return responseHandler(res, error.status, null, { message: error.message });
  }
  // Unique index on name_key — two requests raced past the duplicate check.
  if (error?.code === 11000) {
    return responseHandler(res, 'CONFLICT', null, { message: 'A skill with this name already exists.' });
  }
  logErrorWithSource(error);
  return responseHandler(res, 'INTERNAL_SERVER_ERROR', null, { message: messages.error.INTERNAL_SERVER_ERROR });
}

// Public — active skills only, for the website and the maid form.
const getSkillsController = async (req, res) => {
  try {
    const skills = await listSkillsService();
    responseHandler(res, 'OK', { skills }, { message: messages.success.RETRIEVED_SUCCESSFULLY });
  } catch (error) {
    sendSkillError(res, error);
  }
}

// Admin — every skill, including inactive ones.
const getAdminSkillsController = async (req, res) => {
  try {
    const skills = await listSkillsService({ includeInactive: true });
    responseHandler(res, 'OK', { skills }, { message: messages.success.RETRIEVED_SUCCESSFULLY });
  } catch (error) {
    sendSkillError(res, error);
  }
}

const createSkillController = async (req, res) => {
  try {
    const skill = await createSkillService(req.body);
    responseHandler(res, 'CREATED', { skill }, { message: 'Skill created successfully' });
  } catch (error) {
    sendSkillError(res, error);
  }
}

const updateSkillController = async (req, res) => {
  try {
    const { skill, maidsUpdated } = await updateSkillService(req.params.id, req.body);
    const message = maidsUpdated
      ? `Skill updated. Renamed on ${maidsUpdated} maid profile${maidsUpdated === 1 ? '' : 's'}.`
      : messages.success.UPDATED_SUCCESSFULLY;
    responseHandler(res, 'OK', { skill, maidsUpdated }, { message });
  } catch (error) {
    sendSkillError(res, error);
  }
}

const deleteSkillController = async (req, res) => {
  try {
    const { skill, maidsUsing } = await deleteSkillService(req.params.id);
    responseHandler(res, 'OK', { skill, maidsUsing }, { message: messages.success.DELETED_SUCCESSFULLY });
  } catch (error) {
    sendSkillError(res, error);
  }
}

module.exports = {
  getSkillsController,
  getAdminSkillsController,
  createSkillController,
  updateSkillController,
  deleteSkillController,
};
