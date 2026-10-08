const { jobApplicationModel } = require('../models/jobApplication/jobApplication.model');
const { MaidHistory } = require('../models/maidsHistory/maidHistory.model');
const { WishtListModel } = require('../models/wishlist/wishlist.model');
const {
  addToWishlist,
  changeAssuredStatus,
  changeAvailabilityStatus,
  changeStatusofJobApplication,
  createJobApplication,
  createJobApplicationClientForm,
  createJobApplicationFrontend,
  createNewJob,
  deleteJobApplication,
  deleteNewJob,
  deleteWishlistItem,
  getAllFavoriteMaids,
  getAlljobApplication,
  getCountsJobApplication,
  getFeaturedMaids,
  getJobApplication,
  getJobApplicationbyid,
  getJobApplicationbyidDashboard,
  getNewJob,
  getVerifiedAndReferenceJobApplication,
  getWishlistItem,
  searchNewJob,
  updateJobApplication,
  uploadMaidHistory,
} = require('../queries/jobapplication.queries');
const { compareObjects } = require('../utils/compareObject/compareObject');
const { sanitizeRichText } = require('../utils/sanitizeHtml/sanitizeHtml');
const messages = require('../utils/constants/messages');
const { HttpError } = require('../utils/httpError');

const triggerMaidRevalidation = (refNumber) => {
  if (!refNumber) return;
  fetch(`${process.env.BASE_URL}/api/revalidate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: refNumber,
      secret: process.env.REVALIDATE_SECRET,
    }),
  }).catch((err) => console.error("Revalidation failed:", err));
};

const postJobApplicationClientFormService = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      await createJobApplicationClientForm(data);
      return resolve(messages.success.ACCOUNT_CREATED);
    } catch (error) {
      return reject(error.message);
    }
  });
};

const getJobApplicationFormService = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getJobApplication(0);
      return resolve(data);
    } catch (error) {
      return reject(error.message);
    }
  });
};

const getAllJobApplicationFormService = (page, limit, search, filter) => {
  return new Promise(async (resolve, reject) => {
    try {
      let {data, count} = await getAlljobApplication(page, limit, search, filter);
      return resolve({data, count});
    } catch (error) {

      return reject(error.message);
    }
  });
};

const getVerifiedAndReferenceApplicationFormService = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getVerifiedAndReferenceJobApplication(1);
      return resolve(data);
    } catch (error) {
      return reject(error.message);
    }
  });
};

const getApprovedJobApplicationFormService = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getVerifiedAndReferenceJobApplication();
      return resolve(data);
    } catch (error) {
      return reject(error.message);
    }
  });
};

const getJobApplicationbyIdFormService = (id,userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getJobApplicationbyid(id,userId);
      return resolve(data);
    } catch (error) {
      return reject(error.message);
    }
  });
};

const getJobApplicationbyIdDashboardFormService = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getJobApplicationbyidDashboard(id);
      return resolve(data);
    } catch (error) {
      return reject(error.message);
    }
  });
};

const updateJobApplicationFormService = (data, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let prevDetails;
      if(data.id){
        prevDetails = await getJobApplicationbyid(data.id, userId)
      }
      const updated = await updateJobApplication(data);
      if (!updated) {
        throw new HttpError('NOT_FOUND', 'Maid profile not found.');
      }
      const newDetails = await getJobApplicationbyid(data.id, userId)
      const changes = compareObjects(prevDetails, newDetails)

      if(Object.keys(changes).length > 0){
        const lastRevision = await MaidHistory.findOne({ maid_id: prevDetails?._id }).sort({ revision: -1 });
        const newRevision = lastRevision ? lastRevision.revision + 1 : 1;
        const history = {
          revision: newRevision,
          maid_id: prevDetails?._id?.toString(),
          updated_by: userId,
          changes
        }
        await uploadMaidHistory(history)
      }

      triggerMaidRevalidation(newDetails?.ref_number);

      return resolve(messages.success.UPDATED_SUCCESSFULLY);
    } catch (error) {
      return reject(error);
    }
  });
};

const createJobApplicationDashboardService = (data, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let maidDetails = await createJobApplication(data);
      maidDetails = maidDetails.toObject()
      const changes = compareObjects({}, maidDetails);
      const history = {
        revision: 0,
        maid_id: maidDetails?._id?.toString(),
        updated_by: userId,
        changes
      }
      await uploadMaidHistory(history)

      triggerMaidRevalidation(maidDetails?.ref_number);

      return resolve(messages.success.ACCOUNT_CREATED);
    } catch (error) {
      return reject(error);
    }
  });
};

// Fields a job seeker may set from the public /register?as=job form — every
// field of the admin Add Maid form plus the video. Admin-only fields (status,
// is_assured, ref_number, ...) are dropped; `references` is self-reported and
// checked by the admin before verifying (the profile is saved as status 0).
const FRONTEND_FORM_FIELDS = [
  'name', 'email', 'mobile', 'age', 'nationality', 'marital_status', 'religion',
  'service', 'location', 'current_location', 'uae_no', 'whatsapp_no', 'botim_number',
  'youtube_link', 'visa_status', 'visa_expire', 'available_from', 'day_of',
  'option', 'availability', 'references', 'is_negotiable_salary', 'salary', 'skills', 'language',
  'employmentHistory', 'education', 'notes',
  'profile', 'wordfiles', 'video',
];

// Clone of createJobApplicationDashboardService for the public website form.
// Saved unapproved (status 0), so no revalidation until an admin verifies it.
const createJobApplicationFrontendService = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const allowed = {};
      FRONTEND_FORM_FIELDS.forEach((field) => {
        if (data[field] !== undefined) allowed[field] = data[field];
      });

      // The application date is always the day it was submitted, whatever the client sends.
      allowed.date = new Date();

      // Rich-text fields from an untrusted public form; the admin panel renders them as HTML.
      allowed.notes = sanitizeRichText(allowed.notes);
      if (Array.isArray(allowed.employmentHistory)) {
        allowed.employmentHistory = allowed.employmentHistory.map((job) => ({
          ...job,
          job_description: sanitizeRichText(job?.job_description),
        }));
      }

      let maidDetails = await createJobApplicationFrontend(allowed);
      maidDetails = maidDetails.toObject()
      const changes = compareObjects({}, maidDetails);
      const history = {
        revision: 0,
        maid_id: maidDetails?._id?.toString(),
        updated_by: 'website',
        changes
      }
      await uploadMaidHistory(history)

      return resolve(messages.success.ACCOUNT_CREATED);
    } catch (error) {
      return reject(error);
    }
  });
};

const verifyJobApplicationService = (id, status) => {
  return new Promise(async (resolve, reject) => {
    try {
      let updateStatus;
      console.log(status, 'status');
      if (status === '0') {
        updateStatus = 0;

      } else {
        updateStatus = 1;

      }
      const prevDetails = await changeStatusofJobApplication(id,updateStatus);
      triggerMaidRevalidation(prevDetails?.ref_number);
      return resolve(messages.success.UPDATED_SUCCESSFULLY);
    } catch (error) {
      return reject(error.message);
    }
  });
};

const assureJobApplicationService = (id, status) => {
  return new Promise(async (resolve, reject) => {
    try {
      let updateStatus;
      console.log(status, 'status');
      if (status === '0') {
        updateStatus = false

      } else {
        updateStatus = true

      }
      const prevDetails = await changeAssuredStatus(id, updateStatus);
      triggerMaidRevalidation(prevDetails?.ref_number);
      return resolve(messages.success.UPDATED_SUCCESSFULLY);
    } catch (error) {
      return reject(error.message);
    }
  });
};

const deleteJobApplicationService = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      await deleteJobApplication(id);
      return resolve(messages.success.DELETED_SUCCESSFULLY);
    } catch (error) {
      return reject(error.message);
    }
  });
};

//disable jobApplication

const disableJobApplicationService = (id, status) => {
  return new Promise(async (resolve, reject) => {
    try {
      let updateStatus;

      if (status === '0') {
        updateStatus = 1;
      } else {
        updateStatus = 3;
      }
      const prevDetails = await changeStatusofJobApplication(id, updateStatus);
      triggerMaidRevalidation(prevDetails?.ref_number);
      return resolve(messages.success.UPDATED_SUCCESSFULLY);
    } catch (error) {
      return reject(error.message);
    }
  });
};

///HIRE OR NOT HIRE
const changeAvailabilityJobApplicationService = (id, status) => {
  return new Promise(async (resolve, reject) => {
    try {
      let updateStatus;

      if (status === '0') {
        updateStatus = false;
      } else {
        updateStatus = true;
      }

      const prevDetails = await changeAvailabilityStatus(id, updateStatus);
      triggerMaidRevalidation(prevDetails?.ref_number);
      return resolve(messages.success.UPDATED_SUCCESSFULLY);
    } catch (error) {
      return reject(error.message);
    }
  });
};

const getCountsJobApplicationService = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getCountsJobApplication();
      return resolve(data);
    } catch (error) {
      return reject(error.message);
    }
  });
};

const getFeaturedMaidsService = (user_id, type) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getFeaturedMaids(user_id, type);
      return resolve(data);
    } catch (error) {
      return reject(error.message);
    }
  });
};

const createNewjobService = (body) => {
  return new Promise(async (resolve, reject) => {
    try {
      await createNewJob(body);
      return resolve(messages.success.ACCOUNT_CREATED);
    } catch (error) {
      console.log(error)
      return reject(error.message);
    }
  });
};

const getNewjobService = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getNewJob();
      return resolve(data);
    } catch (error) {
      return reject(error.message);
    }
  });
};

const deleteNewjobService = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      deleteNewJob(id);
      return resolve(messages.success.DELETED_SUCCESSFULLY);
    } catch (error) {
      return reject(error.message);
    }
  });
};



const searchNewjobService = (body) => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await searchNewJob(body);
      return resolve(data);
    } catch (error) {
      return reject(error.message);
    }
  });
};


const toggleWishlistItemService = (user_id, maid_id) => {
  return new Promise(async (resolve, reject) => {
    try{
      const maid = await jobApplicationModel.findOne({_id: maid_id})
      const isWishlistExist = await getWishlistItem(user_id, maid_id);
      if(isWishlistExist){
        await deleteWishlistItem(user_id, maid_id);
        return resolve({update: -1, message : `Removed from all favorites list`})
      }else{
        await addToWishlist(user_id, maid_id);
        return resolve({update: 1, message : `Added to all favorites list`})
      }
    }catch(error){
      return reject(error.message);
    }
  })
}

const listAllWishlistService = (user_id) => {
  return new Promise(async (resolve, reject) => {
    try{
      const wishlist = await getAllFavoriteMaids(user_id)
      return resolve(wishlist)
    }catch(error){
      return reject(error.message)
    }
  })
}

module.exports = {
  postJobApplicationClientFormService,
  createJobApplicationFrontendService,
  getJobApplicationFormService,
  getAllJobApplicationFormService,
  getVerifiedAndReferenceApplicationFormService,
  getApprovedJobApplicationFormService,
  getJobApplicationbyIdFormService,
  getJobApplicationbyIdDashboardFormService,
  updateJobApplicationFormService,
  createJobApplicationDashboardService,
  verifyJobApplicationService,
  assureJobApplicationService,
  deleteJobApplicationService,
  disableJobApplicationService,
  changeAvailabilityJobApplicationService,
  getCountsJobApplicationService,
  getFeaturedMaidsService,
  createNewjobService,
  getNewjobService,
  deleteNewjobService,
  searchNewjobService,
  toggleWishlistItemService,
  listAllWishlistService,
};
