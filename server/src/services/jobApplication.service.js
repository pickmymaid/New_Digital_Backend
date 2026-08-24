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
const messages = require('../utils/constants/messages');

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
      await updateJobApplication(data);
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

      fetch(`${process.env.BASE_URL}/api/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newDetails?.ref_number,
          secret: process.env.NEXTJS_REVALIDATE_SECRET,
        }),
      }).catch((err) => console.error("Revalidation failed:", err));

      return resolve(messages.success.UPDATED_SUCCESSFULLY);
    } catch (error) {
      return reject(error.message);
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

      return resolve(messages.success.ACCOUNT_CREATED);
    } catch (error) {
      return reject(error.message);
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
      await changeStatusofJobApplication(id,updateStatus);
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
      await changeAssuredStatus(id, updateStatus);
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
      await changeStatusofJobApplication(id, updateStatus);
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

      await changeAvailabilityStatus(id, updateStatus);
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
