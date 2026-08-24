const { addCommentService, createBlogService, deleteBlogService, deleteCommentService, editBlogService, generateUniqueSlugService, getAlBlogsService, getAllBlogsForAdminService, getBlogByIdService, likeBlogService } = require("../services/blog.service");
const { responseHandler } = require("../utils/responseHandler/responseHandler");
const { validateJwtToken } = require("../utils/validateJWT/validateJWT");
const { getBlogById } = require("../queries/blog.queries");
const messages = require("../utils/constants/messages");

/**
 * The `createBlogController` function handles the creation of a blog by receiving a request,
 * extracting the request body and thumbnail file, and then calling the `createBlogService` function to
 * create the blog.
 * @param {object} req - The `req` parameter is the request object that contains information about the
 * incoming HTTP request. It includes properties such as headers, query parameters, request body, and
 * files uploaded with the request.
 * @param {object} res - The `res` parameter is the response object that is used to send the response
 * back to the client. It contains methods and properties that allow you to control the response, such
 * as setting the status code, headers, and sending the response body.
 */
const createBlogController = (req, res) => {
    const {body} = req;
    const thumbnail = (req?.files)?.thumbnail

    createBlogService(body,thumbnail).then((data) => {
        responseHandler(res,'CREATED',{slug: data?.slug},{message: data.message})
    }).catch((error) => {
        responseHandler(res,'INTERNAL_SERVER_ERROR',null,{message: error})
    })
}

const editBlogController = (req, res) => {
    const {body} = req;
    const {params} = req;
    const thumbnailFile = (req?.files)?.thumbnailFile

    editBlogService(body, params?.id, thumbnailFile)
        .then((data) => {
            responseHandler(res,'OK',null,{message: data.message})
        })
        .catch((error) => {
            responseHandler(res,'INTERNAL_SERVER_ERROR')
        })
}


/**
 * The addCommentController function handles the request to add a comment by validating the JWT token,
 * extracting the user ID from the token, and calling the addCommentService to add the comment.
 * @param {object} req - The `req` parameter is an object that represents the HTTP request made to the
 * server. It contains information such as the request headers, request body, request method, and
 * request URL.
 * @param {object} res - The `res` parameter is the response object that is used to send the response
 * back to the client. It contains methods and properties that allow you to set the status code,
 * headers, and body of the response.
 */
const addCommentController = async (req, res) => {
    const user = req.user
    const data = {
        user_id: user?._id,
        ...req.body
    }
    addCommentService(data).then((message) => {
        responseHandler(res,'CREATED',{...req.body},{message})
    }).catch((error) => {
        responseHandler(res,'INTERNAL_SERVER_ERROR', null, {message: error})
    })
}

/**
 * The above function is an asynchronous controller function that retrieves all blogs and
 * sends a response with the blogs data.
 * @param {object} req - The `req` parameter is an object that represents the HTTP request made by the
 * client. It contains information such as the request headers, request body, request method, request
 * URL, and other relevant details.
 * @param {object} res - The `res` parameter is the response object that is used to send the HTTP
 * response back to the client. It contains methods and properties that allow you to control the
 * response, such as setting the status code, headers, and sending the response body.
 */
const getAllBlogsController= async (req, res) => {
    const {params} = req;

    getAlBlogsService(parseInt(params?.page))
        .then((data) => {
            responseHandler(res,'OK',{blogs: data.blogs, total_counts: data.count},{message: data.message})
        }).catch((error) => {
            responseHandler(res,'INTERNAL_SERVER_ERROR')
        })
}

/**
 * The function `getBlogByIdController` is an asynchronous function that handles a request to get a
 * blog by its ID and sends a response with the blog data or an error message.
 * @param {object} req - The `req` parameter is an object that represents the HTTP request made to the
 * server. It contains information such as the request headers, request body, request method, request
 * URL, and other relevant details.
 * @param {object} res - The `res` parameter is the response object that is used to send the response
 * back to the client. It contains methods and properties that allow you to control the response, such
 * as setting the status code, headers, and sending the response body.
 */
const getBlogByIdController = async (req, res) => {
    const {params} = req;
    let user_id = '';

    if(req.user){
        const user = req.user
        user_id = user?._id || ''
    }



    getBlogByIdService(params?.id,user_id)
        .then((data) => {
            responseHandler(res,'OK',{blog: data.blog}, {message: data.message})
        })
        .catch((error) => {
            responseHandler(res,'INTERNAL_SERVER_ERROR')
        })
}

const getAllBlogsForAdminController = async (req, res) => {
    getAllBlogsForAdminService()
        .then((blogs) => {
            responseHandler(res, 'OK', {blogs},{message: messages.success.RETRIEVED_SUCCESSFULLY})
        })
        .catch((error) => {
            responseHandler(res, 'INTERNAL_SERVER_ERROR')
        })
}

/**
 * The `likeBlogController` function handles the request to like a blog post and returns an appropriate
 * response.
 * @param {object} req - The `req` parameter is an object that represents the HTTP request made to the
 * server. It contains information such as the request headers, request body, request method, and
 * request URL.
 * @param {object} res - The `res` parameter is the response object that is used to send the response
 * back to the client. It contains methods and properties that allow you to control the response, such
 * as setting the status code, headers, and sending the response body.
 */
const likeBlogController = async (req, res) => {
    const {body} = req;
    const user = req.user

    likeBlogService(body?.slug, user?._id)
        .then(data => {
            responseHandler(res,'OK')
        })
        .catch((error) => {
            responseHandler(res,'INTERNAL_SERVER_ERROR')
        })
}

/**
 * The deleteBlogController function is an asynchronous function that handles the deletion of a blog
 * post and sends an appropriate response to the client.
 * @param {object} req - The `req` parameter is an object that represents the HTTP request made to the
 * server. It contains information such as the request headers, request body, request method, request
 * URL, and other relevant details.
 * @param {object} res - The `res` parameter is the response object that is used to send the response
 * back to the client. It contains methods and properties that allow you to control the response, such
 * as setting the status code, headers, and sending the response body.
 */
const deleteBlogController = async (req, res) => {
    const {params} = req;
    deleteBlogService(params?.id)
        .then(message => {
            responseHandler(res,'OK',null,{message})
        })
        .catch((error) => {
            responseHandler(res,'INTERNAL_SERVER_ERROR',null,{message: error})
        })
}

const deleteCommentController = (req, res) => {
    const {body} = req;

    deleteCommentService(body?.slug, body?.comment_id)
        .then(message => {
            responseHandler(res, 'OK', { deleted: body}, {message })
        })
        .catch((error) => {
            responseHandler(res, 'INTERNAL_SERVER_ERROR',null,{message: error})
        })
}

const getUniqueSlugController = (req, res) => {
    const { title } = req.query;
    if (!title) {
        return responseHandler(res, 'BAD_REQUEST', null, { message: "Title is required" });
    }

    generateUniqueSlugService(title)
        .then((slug) => {
            responseHandler(res, 'OK', { slug });
        })
        .catch((error) => {
            responseHandler(res, 'INTERNAL_SERVER_ERROR', null, { message: error.message || error });
        });
}

module.exports = {
    createBlogController,
    editBlogController,
    addCommentController,
    getAllBlogsController,
    getBlogByIdController,
    getAllBlogsForAdminController,
    likeBlogController,
    deleteBlogController,
    deleteCommentController,
    getUniqueSlugController,
};
