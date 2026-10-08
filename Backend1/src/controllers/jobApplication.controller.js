const { responseHandler } = require('../utils/responseHandler/responseHandler');
const {
  assureJobApplicationService,
  changeAvailabilityJobApplicationService,
  createJobApplicationDashboardService,
  createJobApplicationFrontendService,
  createNewjobService,
  deleteJobApplicationService,
  deleteNewjobService,
  disableJobApplicationService,
  getAllJobApplicationFormService,
  getApprovedJobApplicationFormService,
  getCountsJobApplicationService,
  getFeaturedMaidsService,
  getJobApplicationbyIdDashboardFormService,
  getJobApplicationbyIdFormService,
  getJobApplicationFormService,
  getNewjobService,
  getVerifiedAndReferenceApplicationFormService,
  listAllWishlistService,
  postJobApplicationClientFormService,
  searchNewjobService,
  toggleWishlistItemService,
  updateJobApplicationFormService,
  verifyJobApplicationService,
} = require('../services/jobApplication.service');
const { uploadimage, uploadvideo } = require('../utils/fileUpload/fileUpload');
const { uploadmultipleImages } = require('../utils/fileUpload/mutifileUpload');
const logger = require('../config/logger');
const { logErrorWithSource } = logger;
const { jobApplicationModel } = require('../models/jobApplication/jobApplication.model');
const { HttpError } = require('../utils/httpError');

// Multipart forms send these fields as JSON strings. Parses them in place on `data`.
// A missing field gets `defaults[field]` (pass none on update so existing values are kept).
// Returns an error message for the first malformed field, or null when all are valid.
const parseJsonFields = (data, defaults = {}) => {
  for (const field of ['salary', 'language', 'skills', 'employmentHistory']) {
    const raw = data[field];
    if (raw === undefined || raw === null || raw === '') {
      if (field in defaults) data[field] = defaults[field];
      else delete data[field];
      continue;
    }
    if (typeof raw !== 'string') continue;
    try {
      data[field] = JSON.parse(raw);
    } catch (error) {
      return `${field} must be valid JSON`;
    }
  }
  return null;
};

// Uploads the profile photo and documents (if sent) onto `data`.
// Bad file types become 400s; storage failures become 502s instead of a generic 500.
const uploadMaidFiles = async (req, data) => {
  try {
    if (req?.files?.profile) {
      data.profile = await uploadimage(req.files.profile);
    }
    if (req?.files?.wordfiles) {
      data.wordfiles = await uploadmultipleImages(req.files.wordfiles);
    }
  } catch (error) {
    if (error?.message?.startsWith('Invalid file type')) {
      throw new HttpError('BAD_REQUEST', error.message);
    }
    logErrorWithSource(error, { meta: { files: Object.keys(req.files || {}) } });
    throw new HttpError('BAD_GATEWAY', 'File upload failed. Please try again.');
  }
};

// Turns a create/update failure into a response with a status and message the admin panel can show.
const sendMaidSaveError = (res, req, error) => {
  if (error instanceof HttpError) {
    return responseHandler(res, error.status, null, { message: error.message });
  }
  if (error?.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((e) => (e.name === 'CastError' ? `${e.path} has an invalid value` : e.message))
      .join(', ');
    return responseHandler(res, 'BAD_REQUEST', null, { message });
  }
  if (error?.name === 'CastError') {
    return responseHandler(res, 'BAD_REQUEST', null, { message: `${error.path} has an invalid value` });
  }
  logErrorWithSource(error, { meta: { body: req.body } });
  return responseHandler(res, 'INTERNAL_SERVER_ERROR', null, {
    message: 'Could not save the maid profile. Please try again.',
  });
};

//Client form that only accepting name mobile email
const createJobApplicationClientController = (req, res) => {
  try {
    const data = req.body;
    postJobApplicationClientFormService(data)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//it will return only email name mobile status refnumb
const getJobApplicationFormController = (req, res) => {
  try {
    getJobApplicationFormService()
      .then((data) => {
        responseHandler(res, 'OK', { jobApplication: data });
      })
      .catch((error) => {
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

const getAllJobApplicationFormController = (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 30;
    const search = req.query.search;
    const filter = req.query.filter;
    getAllJobApplicationFormService(page, limit, search, filter)
      .then((data) => {
        responseHandler(res, 'OK', { jobApplication: data.data, count: data.count });
      })
      .catch((error) => {
        logErrorWithSource(error, {meta: {body: req}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//api for client side to get both verified and refered applications
const getVerifiedAndReferenceJobApplicationFormController = (req, res) => {
  try {
    getVerifiedAndReferenceApplicationFormService()
      .then((data) => {
        responseHandler(res, 'OK', { jobApplication: data });
      })
      .catch((error) => {
        logErrorWithSource(error, {meta: {body: req}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

// it will get only email name mobile status refnumb  but its verified status
const getApprovedJobApplicationFormController = (req, res) => {
  try {
    getApprovedJobApplicationFormService()
      .then((data) => {
        responseHandler(res, 'OK', { jobApplication: data });
      })
      .catch((error) => {
        logErrorWithSource(error, {meta: {body: req}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

// it will get all the data but using id for client side
const getJobApplicationbyidFormController = async (req, res) => {
  try {
    let id = req.body.id;
    const user = req.user;
    let userID = user?._id || null;
    getJobApplicationbyIdFormService(id, userID || '')
      .then((data) => {
        responseHandler(res, 'OK', { jobApplication: data });
      })
      .catch((error) => {
        logErrorWithSource(error, {meta: {body: req.body, user: req.user}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {id: req.body.id, user: req.user}})
    console.log(error);
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//adminside
const getJobApplicationbyidDashboardFormController = async (req, res) => {
  try {
    let id = req.body.id;


    getJobApplicationbyIdDashboardFormService(id)
      .then((data) => {
        responseHandler(res, 'OK', { jobApplication: data });
      })
      .catch((error) => {
        logErrorWithSource(error, {meta: {body: req.body}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    console.log(error);
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

// Updating job application from Dashboard

const updateJobApplicationFormController = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.user_id;

    // The admin dashboard sends the maid's id as `_id`; older clients send `id`
    data.id = data.id || data._id;
    if (!data.id) {
      throw new HttpError('BAD_REQUEST', 'id is required to update a maid profile.');
    }

    const parseError = parseJsonFields(data);
    if (parseError) {
      throw new HttpError('BAD_REQUEST', parseError);
    }

    await uploadMaidFiles(req, data);

    const message = await updateJobApplicationFormService(data, userId);
    responseHandler(res, 'CREATED', null, { message });
  } catch (error) {
    sendMaidSaveError(res, req, error);
  }
};

//creating new job application from adminpanel
const createJobApplicationDashboardController = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.user_id;

    const parseError = parseJsonFields(data, { salary: {}, language: [], skills: [], employmentHistory: [] });
    if (parseError) {
      throw new HttpError('BAD_REQUEST', parseError);
    }

    await uploadMaidFiles(req, data);

    const message = await createJobApplicationDashboardService(data, userId);
    responseHandler(res, 'CREATED', null, { message });
  } catch (error) {
    sendMaidSaveError(res, req, error);
  }
};

// Public clone of createJobApplicationDashboardController for the website's
// /register?as=job form: same fields and files, plus an intro video.
const createJobApplicationFrontendController = async (req, res) => {
  try {
    const data = req.body;

    const parseError = parseJsonFields(data, { salary: {}, language: [], skills: [], employmentHistory: [] });
    if (parseError) {
      throw new HttpError('BAD_REQUEST', parseError);
    }

    // express-fileupload silently truncates files over its size limit instead of rejecting them
    const tooLarge = Object.values(req.files || {}).flat().some((file) => file.truncated);
    if (tooLarge) {
      throw new HttpError('BAD_REQUEST', 'File is too large. Maximum size is 50 MB.');
    }

    await uploadMaidFiles(req, data);
    if (req?.files?.video) {
      try {
        data.video = await uploadvideo(req.files.video);
      } catch (error) {
        if (error?.message?.startsWith('Invalid file type')) {
          throw new HttpError('BAD_REQUEST', error.message);
        }
        logErrorWithSource(error, { meta: { files: ['video'] } });
        throw new HttpError('BAD_GATEWAY', 'Video upload failed. Please try again.');
      }
    }

    const message = await createJobApplicationFrontendService(data);
    responseHandler(res, 'CREATED', null, { message });
  } catch (error) {
    sendMaidSaveError(res, req, error);
  }
};

//verifying by admin
const verifyJobApplicationController = (req, res) => {
  try {
    const id = req.body.id;
    const status = req.body.status;
    verifyJobApplicationService(id, status)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};
//assure
const assureJobApplicationController = (req, res) => {
  try {
    const id = req.body.id;
    const status = req.body.status;
    assureJobApplicationService(id, status)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

const getAllMaidsForSEO = async (req, res) => {
  try{
    const data = await jobApplicationModel.find({status: 1}, {ref_number: 1, name: 1, _id: -1})
    responseHandler(res, 'OK', data)
  }catch(error){
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
}

const deleteJobApplicationController = (req, res) => {
  try {
    const id = req.query.id;

    deleteJobApplicationService(id)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//disable the job application
const disableJobApplicationController = (req, res) => {
  try {
    let id = req.body.id;
    let status = req.body.status;
    disableJobApplicationService(id, status)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {

    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//hire or not hire
const changeAvailabilityStatusController = (req, res) => {
  try {
    let id = req.body.id;
    let status = req.body.status;
    changeAvailabilityJobApplicationService(id, status)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//count api for nationality , baseed on service etc...

const getThecountsJobApplicationController = (req, res) => {
  try {
    getCountsJobApplicationService()
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

const getFeaturedMaidsController = (req, res) => {
  let user = req.user
  let user_id = user?.user_id || null
  let type = req.query?.from || null

  try {
    getFeaturedMaidsService(user_id, type)
      .then((data) => {
        responseHandler(res, 'CREATED', null, { data });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

const createNewJobController = async (req, res) => {
  try {
    const data = req.body;

    if (req.files && req.files.image) {
      try {
        data.image = await uploadimage(req.files.image);
      } catch (error) {
        if (error?.message?.startsWith('Invalid file type')) {
          return responseHandler(res, 'BAD_REQUEST', null, { message: error.message });
        }
        logErrorWithSource(error, {meta: {body: req.body}})
        return responseHandler(res, 'BAD_GATEWAY', null, { message: 'File upload failed. Please try again.' });
      }
    }

    createNewjobService(data)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    console.log(error,"eror")
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

const getNewJobController = (req, res) => {
  try {
    getNewjobService()
      .then((data) => {
        responseHandler(res, 'OK', { jobs: data });
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

const deleteNewjobController = (req, res) => {
  try {
    let id = req?.query?.id;

    deleteNewjobService(id)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

const searchNewJobController = (req, res) => {
  try {
    const body = {
      ...req.body,
      page: req.body.page ? Number(req.body.page) : 1,
      limit: req.body.limit ? Number(req.body.limit) : 10,
    };

    searchNewjobService(body)
      .then((result) => {
        const { jobs, total, page, limit, totalPages } = result;
        responseHandler(res, 'OK', { jobs }, { total, page, limit, totalPages });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};


const toggleWishlistItemController = (req, res) => {
  const {body} = req;
  let user = req?.user
  try{
    toggleWishlistItemService(user._id, body.maidId)
      .then((data) => {
        responseHandler(res, 'OK', {update: data.update }, {message: data.message});
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  }catch(error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
}


const listAllWishlist = (req, res) => {
  let user = req?.user
  try{
    listAllWishlistService(user?._id)
      .then((data) => {
        responseHandler(res, 'OK', {favorites: data});
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  }catch(error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }

}

module.exports = {
  createJobApplicationClientController,
  createJobApplicationFrontendController,
  getJobApplicationFormController,
  getAllJobApplicationFormController,
  getVerifiedAndReferenceJobApplicationFormController,
  getApprovedJobApplicationFormController,
  getJobApplicationbyidFormController,
  getJobApplicationbyidDashboardFormController,
  updateJobApplicationFormController,
  createJobApplicationDashboardController,
  verifyJobApplicationController,
  assureJobApplicationController,
  getAllMaidsForSEO,
  deleteJobApplicationController,
  disableJobApplicationController,
  changeAvailabilityStatusController,
  getThecountsJobApplicationController,
  getFeaturedMaidsController,
  createNewJobController,
  getNewJobController,
  deleteNewjobController,
  searchNewJobController,
  toggleWishlistItemController,
  listAllWishlist,
};
