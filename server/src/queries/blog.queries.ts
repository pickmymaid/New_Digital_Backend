import mongoose from "mongoose";
import { BlogModel } from "../models/blogs/blog.model";
import { IBlogBody, ICommentBody } from "../types/requestBody.types";
const ObjectId = mongoose.Types.ObjectId

/**
 * The function saves a blog post by creating a new instance of the BlogModel and saving it to the
 * database.
 * @param {IBlogBody} body - The `body` parameter is of type `IBlogBody`, which is likely an interface
 * or type that defines the structure of the blog data being passed to the function. It contains the
 * necessary information to create a new blog post, such as the title, content, author, date, etc.
 * @returns the result of the `save()` method called on the `blogData` object.
 */
export const saveBlog = async (body: IBlogBody ) => {
    let blogData = new BlogModel({
        ...body
    })
    return await blogData.save();
}

/**
 * The `editBlog` function updates a blog post with the given slug, using the provided body and
 * thumbnail file, and returns the response from the update operation.
 * @param {string} slug - The slug parameter is a string that represents the unique identifier of the
 * blog post you want to edit.
 * @param {IBlogBody} body - The `body` parameter is an object of type `IBlogBody` which contains the
 * properties `content`, `description`, `title`, and `thumbnail`. These properties represent the
 * updated values for the blog post.
 * @param {any} thumbnailFile - The `thumbnailFile` parameter is the file object that represents the
 * new thumbnail image for the blog. It can be an image file uploaded by the user.
 * @returns the response from the updateOne method, which is a promise.
 */
export const editBlog = async (slug: string, body: IBlogBody, thumbnailFile: any) => {
    const updateData: any = {
        content: body?.content,
        description: body?.description,
        title: body?.title,
        thumbnail: thumbnailFile || body?.thumbnail,
        meta_title: body?.meta_title,
        meta_description: body?.meta_description,
        meta_keywords: body?.meta_keywords,
        og_title: body?.og_title,
        og_description: body?.og_description,
        canonical_url: body?.canonical_url,
        editedAt: Date.now()
    };

    if (body.slug) {
        updateData.slug = body.slug;
    }

    const response = await BlogModel.updateOne({slug},{
        $set: updateData
    })

    console.log(response);
    

    return response
}

/**
 * The function adds a comment to a blog post in a MongoDB database.
 * @param {ICommentBody} body - The `body` parameter is an object that contains the following
 * properties:
 * @returns The response from the findOneAndUpdate operation is being returned.
 */
export const addCommentToBlog = async (body: ICommentBody) => {
    const response = await BlogModel.findOneAndUpdate({slug: body.blog_id}, {
        $push: {comments: [{
            user_id: body.user_id,
            comment: body.comment,
            createdAt: new Date()
        }]}
    })
    return response;
}

/**
 * The function getAllBlogsPaginated retrieves a paginated list of blogs from the database.
 * @param {number} page - The `page` parameter is used to specify the page number of the paginated
 * results. It determines which set of results to retrieve from the database.
 * @returns a response which is an array of blog objects. Each blog object contains the fields: slug,
 * title, thumbnail, description, and editedAt.
 */
export const getAllBlogsPaginated = async (page: number) => {
    const response = await BlogModel.find({},{ slug: 1,title: 1, thumbnail: 1, description: 1, editedAt: 1}).sort({editedAt: -1}).skip((page - 1) * 10).limit(10)
    const count = await BlogModel.find({}).count();

    return {
        response,
        total_count: count
    };
}

export const getAllBlogsForAdmin = async () => {
    const response = await BlogModel.find({},{slug: 1,title: 1,thumbnail: 1,editedAt: 1}).sort({editedAt: -1})
    return response
}


/**
 * The function `getBlogById` retrieves a blog post by its slug and includes the comments and user
 * information associated with it.
 * @param {string} slug - The `slug` parameter is a string that represents the unique identifier of a
 * blog post. It is used to match the blog post with the specified slug in the database.
 * @returns the response from the aggregation pipeline.
 */
export const getBlogById = async (slug:string, user_id:string) => {

    const pipeline = [
        {
            $match: {
                slug
            }
        },
        {
            $project: {
              _id: 0,
              slug: 1,
              title: 1,
              description: 1,
              content: 1,
              thumbnail: 1,
              meta_title: 1,
              meta_description: 1,
              meta_keywords: 1,
              og_title: 1,
              og_description: 1,
              canonical_url: 1,
              editedAt: 1,
              likes: {
                $size: '$likes' // Count the number of likes in the array
              },
              isUserLiked: {
                $cond:[
                    {
                        $in: [user_id,'$likes']
                    },
                    true,
                    false
                ]
              }
            }
          }
    ]

    const response = await BlogModel.aggregate(pipeline);
    
    return response;
}

export const getComments = async (slug: string) => {
    const pipeline = [
        {
            $match: {slug}
        },
        {
            $unwind: '$comments'
        },
        {
            $lookup:{
                from: 'customers',
                localField: 'comments.user_id',
                foreignField: 'user_id',
                as: 'comments.user'
            }
        },
        {
            $unwind: '$comments.user'
        },
        {
            $project: {
                _id: '$comments._id',
                comment: '$comments.comment',
                user_id: '$comments.user._id',
                user_name: '$comments.user.first_name',
                createdAt: '$comments.createdAt'
            }
        }
    ]
    const response = await BlogModel.aggregate(pipeline);
    return response;
}

/**
 * The function `likeBlog` updates the likes array of a blog post by adding or removing the user_id
 * based on whether they have already liked the post or not.
 * @param {string} slug - The slug parameter is a string that represents the unique identifier of a
 * blog post. It is typically used in the URL to identify and access a specific blog post.
 * @param {string} user_id - The `user_id` parameter is the unique identifier of the user who is liking
 * the blog.
 * @returns a promise that resolves to the response of the update operation.
 */
export const likeBlog = async (slug:string, user_id: string) => {
    const response = BlogModel.updateOne({slug},[
        {
            $set:{
                likes:{
                    $cond: [
                        {
                            $in: [user_id,'$likes']
                        },
                        {
                            $setDifference: ['$likes',[user_id]]
                        },
                        {
                            $concatArrays: ['$likes',[user_id]]
                        }
                    ]
                }
            }
        }
    ])
    return response;
}

/**
 * The function `deleteBlog` deletes a blog post from the database based on its slug.
 * @param {string} slug - The `slug` parameter is a string that represents the unique identifier of a
 * blog post. It is used to locate and delete the corresponding blog post from the database.
 * @returns The response from the deleteOne method of the BlogModel.
 */
export const deleteBlog = async (slug:string) => {
    let response = await BlogModel.deleteOne({slug});
    return response
}

export const deleteCommentId = async (slug: string, comment_id:string) => {
    const response = await BlogModel.updateOne({slug},{
        $pull:{
            comments: {
                _id: comment_id
            }
        }
    })
    
    return response;
}
export const checkSlugExists = async (slug: string) => {
    const count = await BlogModel.countDocuments({ slug });
    return count > 0;
}
