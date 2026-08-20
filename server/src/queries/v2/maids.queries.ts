import { jobApplicationModel } from "../../models/jobApplication/jobApplication.model"
const PER_PAGE = 9


export const getPaginatedMaids = async (page: string | number, pipeline: { [key: string]: any }, sort: string | null, user_id: string | null, primaryService?: string | null) => {

    page = parseInt(page as string)

    let sortPipeline: any = {
        date: -1,
        _id: -1,
    }

    if(sort){
        switch(sort){
            case 'location':
                sortPipeline.location = 1
                break;
            case 'position':
                sortPipeline.option = 1
                break;
            case 'salary high to low':
                sortPipeline['salary.from'] = -1
                delete sortPipeline._id
                break;
            case 'salary low to high':
                sortPipeline['salary.from'] = 1
                delete sortPipeline._id
                break;
            default:
                break;
        }
    }

    if (primaryService) {
        sortPipeline = { _servicePriority: 1, ...sortPipeline };
    }

    const data = await jobApplicationModel.aggregate([
        {
            $match: { status: 1, ...pipeline }
        },
        {
            $project: {
                _id: 1,
                visa_status: 1,
                ref_number: 1,
                name: 1,
                age: 1,
                availability: 1,
                profile: 1,
                date: 1,
                option: 1,
                service: 1,
                nationality: 1,
                salary: 1,
                employmentHistory: 1,
                references: 1,
                language: 1,
                youtube_link: 1
            }
        },
        ...(primaryService ? [{ $addFields: { _servicePriority: { $cond: [{ $eq: ['$service', primaryService] }, 0, 1] } } }] : []),
        {
            $sort: sortPipeline
        },
        {
            $skip: (page - 1) * PER_PAGE
        },
        {
            $limit: PER_PAGE
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
              wishlist_status: 0,
              _servicePriority: 0
            }
          }
    ])
        
    const count = await jobApplicationModel.countDocuments({ status: 1, ...pipeline });
    
    return {
        maids: data,
        count
    };

}

