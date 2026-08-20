import { jobApplicationModel } from '../models/jobApplication/jobApplication.model';
import { IMaidHistory, MaidHistory } from '../models/maidsHistory/maidHistory.model';
import { WishtListModel } from '../models/wishlist/wishlist.model';
import {
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
} from '../queries/jobapplication.queries';
import { IJobApplicationClientBody, IJobApplicationDashboardBody, IJobBody, IJobSearchBody } from '../types/requestBody.types';
import { compareObjects } from '../utils/compareObject/compareObject';
import messages from '../utils/constants/messages';

export const postJobApplicationClientFormService = (data: IJobApplicationClientBody) => {
  return new Promise(async (resolve, reject) => {
    try {
      await createJobApplicationClientForm(data);
      return resolve(messages.success.ACCOUNT_CREATED);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const getJobApplicationFormService = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getJobApplication(0);
      return resolve(data);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const getAllJobApplicationFormService = (page: number, limit: number, search: string, filter?: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      let {data, count} = await getAlljobApplication(page, limit, search, filter);
      return resolve({data, count});
    } catch (error: any) {
      
      return reject(error.message);
    }
  });
};

export const getVerifiedAndReferenceApplicationFormService = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getVerifiedAndReferenceJobApplication(1);
      return resolve(data);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const getApprovedJobApplicationFormService = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getVerifiedAndReferenceJobApplication();
      return resolve(data);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const getJobApplicationbyIdFormService = (id: number,userId:string) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getJobApplicationbyid(id,userId);
      return resolve(data);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const getJobApplicationbyIdDashboardFormService = (id: number) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getJobApplicationbyidDashboard(id);
      return resolve(data);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const updateJobApplicationFormService = (data: IJobApplicationDashboardBody, userId: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      let prevDetails;
      if(data.id){
        prevDetails = await getJobApplicationbyid(data.id, userId)
      }
      await updateJobApplication(data);
      const newDetails = await getJobApplicationbyid(data.id as string, userId)
      const changes = compareObjects(prevDetails, newDetails)
      
      if(Object.keys(changes).length > 0){
        const lastRevision = await MaidHistory.findOne({ maid_id: prevDetails?._id }).sort({ revision: -1 });
        const newRevision = lastRevision ? lastRevision.revision + 1 : 1;
        const history = {
          revision: newRevision,
          maid_id: prevDetails?._id?.toString() as string,
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
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const createJobApplicationDashboardService = (data: IJobApplicationDashboardBody, userId: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      let maidDetails: any = await createJobApplication(data);
      maidDetails = maidDetails.toObject()
      const changes = compareObjects({}, maidDetails);
      const history = {
        revision: 0,
        maid_id: maidDetails?._id?.toString() as string,
        updated_by: userId,
        changes
      }
      await uploadMaidHistory(history)

      return resolve(messages.success.ACCOUNT_CREATED);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const verifyJobApplicationService = (id: string, status: string) => {
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
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const assureJobApplicationService = (id: string, status: string) => {
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
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const deleteJobApplicationService = (id: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      await deleteJobApplication(id);
      return resolve(messages.success.DELETED_SUCCESSFULLY);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

//disable jobApplication

export const disableJobApplicationService = (id: string, status: string) => {
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
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

///HIRE OR NOT HIRE
export const changeAvailabilityJobApplicationService = (id: string, status: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      let updateStatus: boolean;

      if (status === '0') {
        updateStatus = false;
      } else {
        updateStatus = true;
      }

      await changeAvailabilityStatus(id, updateStatus);
      return resolve(messages.success.UPDATED_SUCCESSFULLY);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const getCountsJobApplicationService = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getCountsJobApplication();
      return resolve(data);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const getFeaturedMaidsService = (user_id: string | null, type: string | null) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getFeaturedMaids(user_id, type);
      return resolve(data);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const createNewjobService = (body: IJobBody) => {
  return new Promise(async (resolve, reject) => {
    try {
      await createNewJob(body);
      return resolve(messages.success.ACCOUNT_CREATED);
    } catch (error: any) {
      console.log(error)
      return reject(error.message);
    }
  });
};

export const getNewjobService = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await getNewJob();
      return resolve(data);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};

export const deleteNewjobService = (id: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      deleteNewJob(id);
      return resolve(messages.success.DELETED_SUCCESSFULLY);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};



export const searchNewjobService = (body: IJobSearchBody) => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await searchNewJob(body);
      return resolve(data);
    } catch (error: any) {
      return reject(error.message);
    }
  });
};


export const toggleWishlistItemService = (user_id: string, maid_id: string) => {
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
    }catch(error:any){
      return reject(error.message);
    }
  })
}

export const listAllWishlistService = (user_id: string) => {
  return new Promise(async (resolve, reject) => {
    try{
      const wishlist = await getAllFavoriteMaids(user_id)
      return resolve(wishlist)
    }catch(error: any){
      return reject(error.message)
    }
  })
}