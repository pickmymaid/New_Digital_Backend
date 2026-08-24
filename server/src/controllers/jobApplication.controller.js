const { responseHandler } = require('../utils/responseHandler/responseHandler');
const {
  assureJobApplicationService,
  changeAvailabilityJobApplicationService,
  createJobApplicationDashboardService,
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
const { uploadimage } = require('../utils/fileUpload/fileUpload');
const { uploadmultipleImages } = require('../utils/fileUpload/mutifileUpload');
const logger = require('../config/logger');
const { logErrorWithSource } = logger;
const { jobApplicationModel } = require('../models/jobApplication/jobApplication.model');

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

    const user = req.user;
    const userId = user?.user_id;
    data.language = JSON.parse(data.language);
    data.skills = JSON.parse(data.skills);
    data.salary = JSON.parse(data.salary)
    data.employmentHistory = JSON.parse(data.employmentHistory);
    let profile = req?.files?.profile;
    let wordfiles = req?.files?.wordfiles;
    if (profile) {
      data.profile = await uploadimage(req?.files?.profile || '');
    }

    if (wordfiles) {
      data.wordfiles = await uploadmultipleImages(req?.files?.wordfiles || []);
    }

    updateJobApplicationFormService(data, userId)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    logErrorWithSource(error, {meta: {body: req.body}})
    console.log(error, 'this is error');

    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//creating new job application from adminpanel
const createJobApplicationDashboardController = async (req, res) => {
  try {
    let data = req.body;
    const user = req.user;
    const userId = user.user_id;

    data.salary = JSON.parse(data.salary)
    data.language = JSON.parse(data.language);
    data.skills = JSON.parse(data.skills);
    data.employmentHistory = JSON.parse(data.employmentHistory);

    if (req?.files?.profile) {
      data.profile = await uploadimage(req?.files?.profile || '');
    }

    if (req?.files?.wordfiles) {
      data.wordfiles = await uploadmultipleImages(req?.files?.wordfiles || []);
    }

    createJobApplicationDashboardService(data, userId)
      .then((message) => {
        fetch(`${process.env.BASE_URL}/api/revalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: process.env.REVALIDATE_SECRET,
            path: "/" // or any path you want to revalidate
          })
        })

        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error) {
    console.error(error);
    logErrorWithSource(error, {meta: {body: req.body}})

    responseHandler(res, 'INTERNAL_SERVER_ERROR');
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

const createNewJobController = (req, res) => {
  try {
    const data = req.body;

    if (req.files && req.files.image) {
      data.image = uploadimage(req?.files?.image);
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
