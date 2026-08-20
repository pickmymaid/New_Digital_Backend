import { paymentModel } from './../models/payment/payment.model';
import { jobApplicationModel } from '../models/jobApplication/jobApplication.model';
import { jobModel } from '../models/Jobs/jobs.model';
import { IJobApplicationCollection, IjobCollection } from '../types/dbStructureTypes';
import {
  IJobApplicationClientBody,
  IJobApplicationDashboardBody,
  IJobBody,
  IJobSearchBody,
} from '../types/requestBody.types';

import { generateUniqueId } from '../utils/GenerateRandomId/GenerateRandomId';
import { WishtListModel } from '../models/wishlist/wishlist.model';
import mongoose from 'mongoose';
import { isValidMongoId } from '../utils/isValidMongoId/isValidMongoId';
import { getCustomerWithID } from './user.queries';
import { MaidHistory } from '../models/maidsHistory/maidHistory.model';

export const createJobApplicationClientForm = async (body: IJobApplicationClientBody) => {
  const clientForm = new jobApplicationModel({
    ref_number: generateUniqueId(),
    ...body,
  });
  return await clientForm.save();
};

export const getJobApplication = async (status: number) => {
  const result = await jobApplicationModel
    .find({ status: status })
    .select('_id email name ref_number status mobile profile')
    .sort({ _id: -1 })
    .lean()


  return result as unknown as IJobApplicationCollection;
};

export const getAlljobApplication = async (
  page: number,
  limit: number,
  search?: string,
  filterValue?: string
): Promise<{ data: IJobApplicationCollection[]; count: number }> => {
  page = page - 1
  const filter: any = {};

  if (search && search.trim() !== "") {
    const trimmed = search.trim();
    const words = trimmed.split(/\s+/);
    const fullEscaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (words.length > 1) {
      // Multi-word: match the full phrase against name only so "Fatima M"
      // doesn't match "Fatima alias Mus" just because "Mus" starts with M
      const nameRegex = new RegExp(`\\b${fullEscaped}`, "i");
      filter.$and = [{ name: { $regex: nameRegex } }];
    } else {
      // Single word: search across name, email, ref_number, mobile
      const escaped = words[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}`, "i");
      filter.$and = [{
        $or: [
          { name: { $regex: regex } },
          { email: { $regex: regex } },
          { ref_number: words[0] },
          { mobile: { $regex: regex } }
        ],
      }];
    }
  }

  if (!filter.$and && filterValue) filter.$and = [];

  if(filterValue === "hired"){
    filter.$and.push({
      availability: false
    })
  }else if(filterValue === "unhired"){
    filter.$and.push({
      availability: true
    })
  }else if(filterValue === "approved"){
    filter.$and.push({
      status: 1
    })
  }else if(filterValue === "unapproved"){
    filter.$and.push({status: {$ne: 1}})
  }

  const data:any = await jobApplicationModel
    .find(
      filter,
      { name: 1, email: 1, uae_no: 1, ref_number: 1, references: 1, availability: 1, status: 1 }
    )
    .sort({ date: -1, "salary.from": 1 })
    .limit(limit)
    .skip(page * limit);

  const count = await jobApplicationModel.countDocuments(filter);

  return { data, count };
};


export const uploadMaidHistory = async (history: any) => {
  const maidHistory = new MaidHistory(history)
  return (await maidHistory.save())
}

export const getJobApplicationbyid = async (id: number | string, userId: string) => {
  let isSubscriber = await paymentModel.find({ user_id: userId, status: 1 });
  console.log(isSubscriber, userId, 'user')
  let user = await getCustomerWithID(userId);
  
  let isMongoId = isValidMongoId(id)

  if(!isMongoId){
    let application = await jobApplicationModel.findOne({ref_number: id},{_id: 1});
    id = application?._id.toString() as string;
  }
  console.log(userId)
  let pipeline:any = [
    {
      $match: { _id: new mongoose.Types.ObjectId(id) }
    },
    {
      $lookup: {
        from: "wishlists",
        let: { user_id: userId, maid_id: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user_id", "$$user_id"] },
                  { $eq: ["$maid_id", "$$maid_id"] }
                ]
              }
            }
          }
        ],
        as: "wishlist_status"
      }
    },
    {
      $addFields: {
        is_in_wishlist: { $gt: [{ $size: "$wishlist_status" }, 0] }
      }
    },
  ]

  if(isSubscriber.length > 0 && !user?.is_blocked){
    pipeline.push({
      $project: {
        wishlist_status: 0
      }
    })
  }else{
    pipeline.push({
      $project: {
        wishlist_status: 0,
        mobile: 0,
        botim_number: 0,
        uae_no: 0,
        whatsapp_no: 0,
        email: 0,
      }
    })
  }

  return (await jobApplicationModel.aggregate(pipeline))?.[0] as unknown as IJobApplicationCollection;  
};

export const getJobApplicationbyidDashboard = async (id: number) => {
  let query:any = {ref_number: id}
  if(isValidMongoId(id)) query = {_id: id}

  return (await jobApplicationModel.findOne(query)) as unknown as IJobApplicationCollection;
};
export const updateJobApplication = async (body: IJobApplicationDashboardBody) => {
  let find:any = { ref_number: body.id };
  if(isValidMongoId(body.id as string | number)){
    find = {_id: body.id}
  }
  //@ts-ignore
  let imageData: any;
  if (!body.profile || !body.wordfiles) {
    imageData = await jobApplicationModel.findOne(find);
    if (!body.profile) {
      body.profile = imageData?.profile;
    } else if (!body.wordfiles) {
      body.wordfiles = imageData?.word_file;
    }
  }

  let updateble = {
    name: body.name,
    email: body.email,
    mobile: body.mobile,
    age: body.age,
    marital_status: body.marital_status,
    nationality: body.nationality,
    location: body.location,
    religion: body.religion,
    salary: body.salary,
    uae_no: body.uae_no,
    whatsapp_no: body.whatsapp_no,
    botim_number: body.botim_number,
    current_location: body.current_location,
    youtube_link: body.youtube_link,
    visa_status: body.visa_status,
    availability: body.availability,
    is_negotiable_salary: body.is_negotiable_salary,
    skills: body.skills,
    service: body.service,
    language: body.language,
    option: body.option,
    employmentHistory: body.employmentHistory,
    education: body.education,
    notes: body.notes,
    status: 1,
    available_from: body.available_from,
    visa_expire: body.visa_expire,
    day_of: body.day_of,
    word_file: body.wordfiles,
    profile: body.profile,
    date: body.date,
  };
  return await jobApplicationModel.findOneAndUpdate(find, updateble);
};

export const createJobApplication = async (body: IJobApplicationDashboardBody) => {
  const Dashboard = new jobApplicationModel({
    ref_number: generateUniqueId(),
    word_file: body.wordfiles,
    status: 1,
    ...body,
  });
  return await Dashboard.save();
};

export const changeStatusofJobApplication = async (id: string, status: any) => {
  let find = { _id: id };

  let update = { status: status };

  return await jobApplicationModel.findOneAndUpdate(find, update);
};

export const deleteJobApplication = async (id: string) => {
  return await jobApplicationModel.findOneAndDelete({ _id: id });
};

export const getVerifiedAndReferenceJobApplication = async (user?: number) => {
  if (user !== 1) {
    return await jobApplicationModel
      .find({
         status: 1 
      })
      .sort({ date: 1 });
  } else {
    return await jobApplicationModel
      .find(
        {
           status: 1 
        },
        {
          mobile: 0,
          botim_number: 0,
          uae_no: 0,
          whatsapp_no: 0,
          email: 0,
        }
      )
      .sort({ date: 1 });
  }
};

export const changeAvailabilityStatus = async (id: string, status: boolean) => {
  let find = { _id: id };
  let update = { availability: status };
  return await jobApplicationModel.findOneAndUpdate(find, update);
};

export const changeAssuredStatus = async (id: string, status: boolean) => {
  let find = { _id: id };
  let update = { references: status };
  return await jobApplicationModel.findOneAndUpdate(find, update);
};

export const getCountsJobApplication = async () => {
  return await jobApplicationModel.aggregate([
    {
      $facet: {
        nationalityCounts: [
          {
            $match: {
              status: {
                $ne: 3,
              },
            },
          },
          {
            $group: {
              _id: '$nationality',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              id: '$_id',
              count: 1,
            },
          },
        ],
        serviceCounts: [
          {
            $match: {
              status: {
                $ne: 3,
              },
            },
          },
          {
            $group: {
              _id: '$service',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              id: '$_id',
              count: 1,
            },
          },
        ],
        available_maids: [
          {
            $match: {
              status: 1
            }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 }
            }
          }
        ]
      },
    },
    {
      $addFields: {
        "available_maids": {
          $arrayElemAt: ["$available_maids.count", 0]
        }
      }
    }
  ]);
};

export const getFeaturedMaids = async (user_id: string | null, type: string | null) => {
  let pipeline:any = [
    {
      $match: {
        availability: true,
        status: 1
      }
    },
    {
      $sort: {
        date: -1
      }
    },
    {
      $limit: 10
    },
    {
      $lookup: {
        from: "wishlists",
        let: { user_id: user_id, maid_id: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user_id", "$$user_id"] },
                  { $eq: ["$maid_id", "$$maid_id"] }
                ]
              }
            }
          }
        ],
        as: "wishlist_status"
      }
    },
    {
      $addFields: {
        is_in_wishlist: { $gt: [{ $size: "$wishlist_status" }, 0] }
      }
    },
    {
      $project: {
        wishlist_status: 0
      }
    }
  ]

  if(type === 'campaign'){
    pipeline[1]["$sort"]["salary.from"] = 1
  }
  return await jobApplicationModel
    .aggregate(pipeline)
};

export const createNewJob = async (body: IJobBody) => {
  const newJob = new jobModel({
    ...body,
  });

  return await newJob.save();
};

export const getNewJob = async () => {
  return await jobModel.find().sort({createdAt: -1});
};

export const deleteNewJob = async (id: string) => {
  return await jobModel.findOneAndDelete({ _id: id });
};

export const searchNewJob = async (body: IJobSearchBody) => {
  const query: any = {};

  if (body.nationality) query.nationality = body.nationality;
  if (body.location) query.location = body.location;
  if (body.service) query.service = body.service;

  const page = Math.max(1, body.page ?? 1);
  const limit = Math.min(100, Math.max(1, body.limit ?? 10));
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    jobModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    jobModel.countDocuments(query),
  ]);

  return { jobs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const addToWishlist = async (user_id: string, maid_id: string) => {
  try{
    const WishtlistSchema = new WishtListModel({user_id, maid_id});
    return await WishtlistSchema.save(); 
  }catch(err:any){
    throw new Error(err?.message)
  }
}

export const deleteWishlistItem = async (user_id: string, maid_id: string) => {
  try{
    await WishtListModel.deleteOne({user_id, maid_id})
    return true
  }catch(err:any){
    throw new Error(err?.message)
  }
}

export const getWishlistItem = async (user_id: string, maid_id: string) => {
  try{
    const response = await WishtListModel.findOne({user_id, maid_id})
    return response
  }catch(err:any){
    throw new Error(err?.message)
  }
}

export const getAllFavoriteMaids = async(user_id:string) => {
  const data = await WishtListModel.aggregate([
    {
      $match: {
        user_id
      }
    },
    {
      $lookup: {
          from: 'jobapplications',
          localField: 'maid_id',
          foreignField: '_id',
          as: 'maids'
        }
    },
    {
      $unwind: '$maids'
    },
    {
      $project: {
        _id :'$maids._id',
        name:'$maids.name',
        employmentHistory:'$maids.employmentHistory',
        profile:'$maids.profile',
        salary :'$maids.salary',
        nationality :'$maids.nationality',
        option :'$maids.option',
        references :'$maids.references',
        availability :'$maids.availability', 
        youtube_link :'$maids.youtube_link',
        service :'$maids.service',
        date :'$maids.date',
        ref_number: '$maids.ref_number'
      }
    }
  ])
  
  return data;
}