const { unlink } = require("fs");
const { addCommentToBlog, checkSlugExists, deleteBlog, deleteCommentId, editBlog, getAllBlogsForAdmin, getAllBlogsPaginated, getBlogById, getComments, likeBlog, saveBlog } = require("../queries/blog.queries");
const messages = require("../utils/constants/messages");
const { uploadimage } = require("../utils/fileUpload/fileUpload");
const path = require('path');
const appModule = require("../app");
const { slugify } = require("../utils/slugify.utils");

/**
 * The function `createBlogService` takes in blog data and a thumbnail image, generates a slug for the
 * blog, uploads the thumbnail image, adds additional data to the blog object, saves the blog, and
 * returns a success message with the slug.
 * @param {object} blogData - The data for the blog post. It typically includes properties such as `title`, `content`, `author`, etc.
 * @param {any} thumbnail - The `thumbnail` parameter is an image file that represents the thumbnail
 * image for the blog.
 * @returns a Promise that resolves to an object with a "message" property and a "slug" property.
 */
const createBlogService = (blogData, thumbnail) => {
    return new Promise(async (resolve, reject) => {
        try{
            if (!blogData.slug) {
                return reject("Slug is required");
            }
            thumbnail = await uploadimage(thumbnail);
            blogData = {
                ...blogData,
                thumbnail,
                editedAt: new Date()
            }
            await saveBlog(blogData);
            resolve({
                message: messages.success.SUBMIT,
                slug: blogData.slug
            })
        }catch (error){
            console.log(error);

            return reject(error)
        }
    })
}

/**
 * The `editBlogService` function takes in blog data, a slug, and a
 * thumbnail file, and returns a promise that resolves with a success message after editing the blog.
 * @param {object} blogData - The data to be edited for the blog. It typically includes properties such as title, content, author, etc.
 * @param {string} slug - The slug parameter is a string that represents the unique identifier or URL
 * of the blog post that needs to be edited.
 * @param {any} thumbnailFile - The `thumbnailFile` parameter is an optional file that represents the
 * thumbnail image for the blog. It can be any file type, such as an image file (e.g., JPEG, PNG) or
 * any other supported file format.
 * @returns a Promise that resolves to an object with a "message" property.
 */
const editBlogService = (blogData,slug, thumbnailFile) => {
    return new Promise(async (resolve, reject) => {
        try{
            thumbnailFile = thumbnailFile && await uploadimage(thumbnailFile);
            await editBlog(slug,blogData,thumbnailFile);
            if(thumbnailFile){
                unlink(`${appModule.rootDir.replace(/\/src$/, '')}/public/uploads/${blogData.thumbnail.replace("images/", "")}`, (err) => {
                    console.log(err);
                })
            }
            return resolve({
                message: messages.success.SUBMIT
            })
        }catch(error){
            return reject(error.message)
        }
    })
}

/**
 * The `addCommentService` function adds a comment to a blog and returns
 * a promise that resolves with a success message if the comment is added successfully, or rejects with
 * an error message if there is an error.
 * @param {object} data - The comment data.
 * @returns The function `addCommentService` is returning a Promise.
 */
const addCommentService = (data) => {
    return new Promise( async (resolve,reject) => {
        try{
            await addCommentToBlog(data);
            resolve(messages.success.UPDATED_SUCCESSFULLY)
        }catch(error){
            return reject(error.message)
        }
    })
}

/**
 * The function `getAlBlogsService` retrieves all blogs paginated and returns them along with a success
 * message.
 * @param {number} page - The `page` parameter is used to specify the page number of the paginated
 * results. It determines which set of blogs should be retrieved from the database.
 * @returns The function `getAlBlogsService` returns a Promise that resolves to an object with the
 * properties `blogs` and `message`.
 */
const getAlBlogsService = (page) => {
    return new Promise(async (resolve, reject) => {
        try{
            let blogs = await getAllBlogsPaginated( (page || 0))
            return resolve({
                blogs: blogs.response,
                count: blogs.total_count,
                message: messages.success.RETRIEVED_SUCCESSFULLY
            })
        }catch(error){
            return reject(error.message)
        }
    })
}

const getAllBlogsForAdminService = () => {
    return new Promise(async (resolve, reject) => {
        try{
            const blogs = await getAllBlogsForAdmin();
            return resolve(blogs)
        }catch(error){
            return reject(error.message)
        }
    })
}

/**
 * The function `getBlogByIdService` retrieves a blog by its slug and returns it along with a success
 * message, or rejects with an error message if an error occurs.
 * @param {string} slug - The `slug` parameter is a string that represents the unique identifier of a
 * blog. It is used to retrieve a specific blog from the database.
 * @returns The function `getBlogByIdService` returns a Promise that resolves to an object with the
 * properties `blog` and `message`.
 */
const getBlogByIdService = (slug, user_id) => {
    return new Promise(async (resolve, reject) => {
        try{
            const blog = await getBlogById(slug,user_id);
            const comments = await getComments(slug)
            console.log(comments,'this is comments');

            return resolve({
                blog: {
                    ...blog?.[0],
                    comments
                },
                message: messages.success.RETRIEVED_SUCCESSFULLY
            })
        }catch(error){
            return reject(error.message)
        }
    })
}

/**
 * The `likeBlogService` function takes a blog slug and user ID as
 * parameters, and returns a promise that resolves with a success message if the blog is successfully
 * liked, or rejects with an error message if there is an error.
 * @param {string} slug - The `slug` parameter is a string that represents the unique identifier of a
 * blog post. It is typically used in URLs to identify a specific blog post.
 * @param {string} user_id - The `user_id` parameter is a string that represents the unique identifier
 * of the user who is liking the blog.
 * @returns a Promise.
 */
const likeBlogService = (slug, user_id) => {
    return new Promise (async (resolve, reject) => {
        try{
            await likeBlog(slug, user_id);
            return resolve(messages.success.LIKED)
        }catch(error){
            console.log({error});

            return reject(error.message)
        }
    })
}

/**
 * The `deleteBlogService` function is an asynchronous function that deletes a blog post by its slug
 * and returns a success message if the deletion is successful, or an error message if there is an
 * error.
 * @param {string} slug - The `slug` parameter is a string that represents the unique identifier of a
 * blog post. It is typically used in the URL to identify and retrieve a specific blog post.
 * @returns a Promise.
 */
const deleteBlogService = async (slug) => {
    return new Promise(async(resolve, reject) => {
        try{
            await deleteBlog(slug);
            return resolve(messages.success.DELETED_SUCCESSFULLY)
        }catch(error){
            return reject(error.message)
        }
    })
}

const deleteCommentService = async (slug, comment_id) => {
    return new Promise(async(resolve, reject) => {
        try{
            console.log(slug,comment_id);

            await deleteCommentId(slug, comment_id);
            return resolve(messages.success.DELETED_SUCCESSFULLY)
        }catch(error){
            return reject(error.message)
        }
    })
}
const generateUniqueSlugService = async (title) => {
    const slug = slugify(title);
    let uniqueSlug = slug;
    let counter = 1;

    while (await checkSlugExists(uniqueSlug)) {
        uniqueSlug = `${slug}_${counter}`;
        counter++;
    }

    return uniqueSlug;
}

module.exports = {
    createBlogService,
    editBlogService,
    addCommentService,
    getAlBlogsService,
    getAllBlogsForAdminService,
    getBlogByIdService,
    likeBlogService,
    deleteBlogService,
    deleteCommentService,
    generateUniqueSlugService,
};
