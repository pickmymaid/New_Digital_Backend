import {
  IJobApplicationClientBody,
  IJobApplicationDashboardBody,
  IJobBody,
  IJobSearchBody,
} from '../types/requestBody.types';
import { responseHandler } from '../utils/responseHandler/responseHandler';
import { Request, Response } from 'express';
import {
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
} from '../services/jobApplication.service';
import { uploadimage } from '../utils/fileUpload/fileUpload';
import { uploadmultipleImages } from '../utils/fileUpload/mutifileUpload';
import logger, { logErrorWithSource } from '../config/logger';
import { jobApplicationModel } from '../models/jobApplication/jobApplication.model';

//Client form that only accepting name mobile email
export const createJobApplicationClientController = (req: Request, res: Response) => {
  try {
    const data: IJobApplicationClientBody = req.body;
    postJobApplicationClientFormService(data)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//it will return only email name mobile status refnumb
export const getJobApplicationFormController = (req: Request, res: Response) => {
  try {
    getJobApplicationFormService()
      .then((data: any) => {
        responseHandler(res, 'OK', { jobApplication: data });
      })
      .catch((error: any) => {
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

export const getAllJobApplicationFormController = (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 30;
    const search = req.query.search as string;
    const filter = req.query.filter as string;
    getAllJobApplicationFormService(page, limit, search, filter)
      .then((data: any) => {
        responseHandler(res, 'OK', { jobApplication: data.data, count: data.count });
      })
      .catch((error: any) => {
        logErrorWithSource(error, {meta: {body: req}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//api for client side to get both verified and refered applications
export const getVerifiedAndReferenceJobApplicationFormController = (req: Request, res: Response) => {
  try {
    getVerifiedAndReferenceApplicationFormService()
      .then((data: any) => {
        responseHandler(res, 'OK', { jobApplication: data });
      })
      .catch((error: any) => {
        logErrorWithSource(error, {meta: {body: req}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

// it will get only email name mobile status refnumb  but its verified status
export const getApprovedJobApplicationFormController = (req: Request, res: Response) => {
  try {
    getApprovedJobApplicationFormService()
      .then((data: any) => {
        responseHandler(res, 'OK', { jobApplication: data });
      })
      .catch((error: any) => {
        logErrorWithSource(error, {meta: {body: req}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

// it will get all the data but using id for client side
export const getJobApplicationbyidFormController = async (req: Request, res: Response) => {
  try {
    let id: number = req.body.id;
    const user:any = req.user;
    let userID: string = user?._id || null;
    getJobApplicationbyIdFormService(id, userID || '')
      .then((data: any) => {
        responseHandler(res, 'OK', { jobApplication: data });
      })
      .catch((error: any) => {
        logErrorWithSource(error, {meta: {body: req.body, user: req.user}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {id: req.body.id, user: req.user}})
    console.log(error);
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//adminside
export const getJobApplicationbyidDashboardFormController = async (req: Request, res: Response) => {
  try {
    let id: number = req.body.id;
   

    getJobApplicationbyIdDashboardFormService(id)
      .then((data: any) => {
        responseHandler(res, 'OK', { jobApplication: data });
      })
      .catch((error: any) => {
        logErrorWithSource(error, {meta: {body: req.body}})
        responseHandler(res, 'INTERNAL_SERVER_ERROR', null, error);
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    console.log(error);
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

// Updating job application from Dashboard

export const updateJobApplicationFormController = async (req: Request, res: Response) => {
  try {
    const data: IJobApplicationDashboardBody = req.body;

    const user: any = req.user;
    const userId: string = user?.user_id;
    //@ts-ignore
    data.language = JSON.parse(data.language);
    data.skills = JSON.parse(data.skills);
    //@ts-ignore
    data.salary = JSON.parse(data.salary)
    //@ts-ignore
    data.employmentHistory = JSON.parse(data.employmentHistory);
    //@ts-ignore
    let profile = req?.files?.profile;
    //@ts-ignore
    let wordfiles = req?.files?.wordfiles;
    //@ts-ignore
    if (profile) {
      //@ts-ignore
      data.profile = await uploadimage(req?.files?.profile || '');
    }

    //@ts-ignore
    if (wordfiles) {
      //@ts-ignore
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
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    console.log(error, 'this is error');
    
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//creating new job application from adminpanel
export const createJobApplicationDashboardController = async (req: Request, res: Response) => {
  try {
    let data: IJobApplicationDashboardBody = req.body;
    const user: any = req.user;
    const userId = user.user_id;

    //@ts-ignore
    data.salary = JSON.parse(data.salary)
    //@ts-ignore
    data.language = JSON.parse(data.language);
    data.skills = JSON.parse(data.skills);
    //@ts-ignore
    data.employmentHistory = JSON.parse(data.employmentHistory);

    //@ts-ignore
    if (req?.files?.profile) {
      //@ts-ignore
      data.profile = await uploadimage(req?.files?.profile || '');
    }

    //@ts-ignore
    if (req?.files?.wordfiles) {
      //@ts-ignore
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
  } catch (error: any) {
    console.error(error);
    logErrorWithSource(error, {meta: {body: req.body}})
    
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//verifying by admin
export const verifyJobApplicationController = (req: Request, res: Response) => {
  try {
    const id: string = req.body.id;
    const status: string = req.body.status;
    verifyJobApplicationService(id, status)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};
//assure
export const assureJobApplicationController = (req: Request, res: Response) => {
  try {
    const id: string = req.body.id;
    const status: string = req.body.status;
    assureJobApplicationService(id, status)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

export const getAllMaidsForSEO = async (req: Request, res:Response) => {
  try{
    const data = await jobApplicationModel.find({status: 1}, {ref_number: 1, name: 1, _id: -1})
    responseHandler(res, 'OK', data)
  }catch(error: any){
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
}

export const deleteJobApplicationController = (req: Request, res: Response) => {
  try {
    const id: string = req.query.id as string;

    deleteJobApplicationService(id)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//disable the job application
export const disableJobApplicationController = (req: Request, res: Response) => {
  try {
    let id: string = req.body.id as string;
    let status: string = req.body.status as string;
    disableJobApplicationService(id, status)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {

    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//hire or not hire
export const changeAvailabilityStatusController = (req: Request, res: Response) => {
  try {
    let id: string = req.body.id as string;
    let status: string = req.body.status as string;
    changeAvailabilityJobApplicationService(id, status)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

//count api for nationality , baseed on service etc...

export const getThecountsJobApplicationController = (req: Request, res: Response) => {
  try {
    getCountsJobApplicationService()
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

export const getFeaturedMaidsController = (req: Request, res: Response) => {
  let user:any = req.user
  let user_id = user?.user_id || null
  let type:any = req.query?.from || null

  try {
    getFeaturedMaidsService(user_id, type)
      .then((data) => {
        responseHandler(res, 'CREATED', null, { data });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

export const createNewJobController = (req: Request, res: Response) => {
  try {
    const data: IJobBody = req.body;
    
    
    //@ts-ignore
    if (req.files && req.files.image) {
      //@ts-ignore
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
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    console.log(error,"eror")
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

export const getNewJobController = (req: Request, res: Response) => {
  try {
    getNewjobService()
      .then((data: any) => {
        responseHandler(res, 'OK', { jobs: data });
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

export const deleteNewjobController = (req: Request, res: Response) => {
  try {
    let id: string = req?.query?.id as string;

    deleteNewjobService(id)
      .then((message) => {
        responseHandler(res, 'CREATED', null, { message });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};

export const searchNewJobController = (req: Request, res: Response) => {
  try {
    const body: IJobSearchBody = {
      ...req.body,
      page: req.body.page ? Number(req.body.page) : 1,
      limit: req.body.limit ? Number(req.body.limit) : 10,
    };

    searchNewjobService(body)
      .then((result: any) => {
        const { jobs, total, page, limit, totalPages } = result;
        responseHandler(res, 'OK', { jobs }, { total, page, limit, totalPages });
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  } catch (error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
};


export const toggleWishlistItemController = (req: Request, res: Response) => {
  const {body} = req;
  let user:any = req?.user
  try{
    toggleWishlistItemService(user._id, body.maidId)
      .then((data: any) => {
        responseHandler(res, 'OK', {update: data.update }, {message: data.message});
      })
      .catch((message) => {
        logger.error(message, {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  }catch(error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }
}


export const listAllWishlist = (req: Request, res: Response) => {
  let user:any = req?.user
  try{
    listAllWishlistService(user?._id)
      .then((data: any) => {
        responseHandler(res, 'OK', {favorites: data});
      })
      .catch((message) => {
        logger.error(message , {meta: {body: req.body}})
        responseHandler(res, 'BAD_REQUEST', null, { message });
      });
  }catch(error: any) {
    logErrorWithSource(error, {meta: {body: req.body}})
    responseHandler(res, 'INTERNAL_SERVER_ERROR');
  }

}
