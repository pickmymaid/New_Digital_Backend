import express, {Router} from 'express';
import { addCommentController, createBlogController, deleteBlogController, deleteCommentController, editBlogController, getAllBlogsController, getAllBlogsForAdminController, getBlogByIdController, getUniqueSlugController, likeBlogController } from '../controllers/blog.controllers';
import { validateJwtToken } from '../middleware/jwtValidator';
import { roleValidator } from '../middleware/roleValidator';
import { validateUser } from '../middleware/validateUser';

const router: Router = express.Router();

// Admin side

/**
 * @openapi
 * /api/v1/blog/:
 *   post:
 *     tags: [Blog V1]
 *     summary: Create a new blog post
 *     description: Creates a blog post with a thumbnail image upload. Requires SA or Marketing role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, content, slug]
 *             properties:
 *               title: { type: string, example: How to Hire a Maid in Dubai }
 *               slug: { type: string, example: how-to-hire-a-maid-in-dubai }
 *               description: { type: string }
 *               content: { type: string, description: HTML or markdown content }
 *               meta_title: { type: string }
 *               meta_description: { type: string }
 *               meta_keywords: { type: string }
 *               og_title: { type: string }
 *               og_description: { type: string }
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Blog thumbnail image
 *     responses:
 *       201:
 *         description: Blog post created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/BlogResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', validateJwtToken, roleValidator(['SA', 'Marketing']), createBlogController)

/**
 * @openapi
 * /api/v1/blog/edit/{id}:
 *   put:
 *     tags: [Blog V1]
 *     summary: Edit an existing blog post
 *     description: Updates blog content and optionally replaces the thumbnail. Requires SA or Marketing role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the blog post
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               slug: { type: string }
 *               description: { type: string }
 *               content: { type: string }
 *               meta_title: { type: string }
 *               meta_description: { type: string }
 *               thumbnailFile:
 *                 type: string
 *                 format: binary
 *                 description: Optional new thumbnail image
 *     responses:
 *       200:
 *         description: Blog post updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/edit/:id', validateJwtToken, roleValidator(['SA', 'Marketing']), editBlogController)

/**
 * @openapi
 * /api/v1/blog/{id}:
 *   delete:
 *     tags: [Blog V1]
 *     summary: Delete a blog post
 *     description: Permanently removes a blog post and its thumbnail. Requires SA or Marketing role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the blog post
 *     responses:
 *       200:
 *         description: Blog post deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', validateJwtToken, roleValidator(['SA', 'Marketing']), deleteBlogController)

/**
 * @openapi
 * /api/v1/blog/delete-comment:
 *   put:
 *     tags: [Blog V1]
 *     summary: Delete a comment from a blog post
 *     description: Removes a specific comment by ID. Requires SA or Marketing role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [blog_id, comment_id]
 *             properties:
 *               blog_id: { type: string, example: 64a1b2c3d4e5f6a7b8c9d0e1 }
 *               comment_id: { type: string, example: 64a1b2c3d4e5f6a7b8c9d0e2 }
 *     responses:
 *       200:
 *         description: Comment deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/delete-comment', validateJwtToken, roleValidator(['SA', 'Marketing']), deleteCommentController)

/**
 * @openapi
 * /api/v1/blog/blogs-admin:
 *   get:
 *     tags: [Blog V1]
 *     summary: Get all blog posts (admin view)
 *     description: Returns paginated blog list including drafts and unpublished posts. Requires SA or Marketing role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or slug
 *     responses:
 *       200:
 *         description: Paginated blog list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/blogs-admin', validateJwtToken, roleValidator(['SA', 'Marketing']), getAllBlogsForAdminController)

/**
 * @openapi
 * /api/v1/blog/slug-check:
 *   get:
 *     tags: [Blog V1]
 *     summary: Check if a blog slug is unique
 *     description: Returns whether a given slug is available for use. Used during blog creation to prevent duplicate slugs. Requires SA or Marketing role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug to check
 *     responses:
 *       200:
 *         description: Slug availability result
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     isUnique: { type: boolean }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/slug-check', validateJwtToken, roleValidator(['SA', 'Marketing']), getUniqueSlugController)

// Customer side

/**
 * @openapi
 * /api/v1/blog/comment:
 *   put:
 *     tags: [Blog V1]
 *     summary: Add a comment to a blog post
 *     description: Adds a comment from the authenticated customer. Requires an active customer session (`CookieAuth`).
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [blog_id, comment]
 *             properties:
 *               blog_id: { type: string, example: 64a1b2c3d4e5f6a7b8c9d0e1 }
 *               comment: { type: string, example: Really helpful article! }
 *     responses:
 *       200:
 *         description: Comment added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized — no active session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/comment',validateUser, addCommentController)

/**
 * @openapi
 * /api/v1/blog/page/{page}:
 *   get:
 *     tags: [Blog V1]
 *     summary: Get paginated blog posts (public)
 *     description: Returns published blog posts for the given page number. Publicly accessible.
 *     parameters:
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Paginated blog list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogResponse'
 */
router.get('/page/:page',getAllBlogsController)

/**
 * @openapi
 * /api/v1/blog/id/{id}:
 *   get:
 *     tags: [Blog V1]
 *     summary: Get a blog post by ID or slug (public)
 *     description: >
 *       Returns a single blog post. If a customer session is present, the response includes
 *       whether the current user has liked the post.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId or slug of the blog post
 *     responses:
 *       200:
 *         description: Blog post
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/BlogResponse'
 *       404:
 *         description: Blog post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/id/:id',getBlogByIdController)

/**
 * @openapi
 * /api/v1/blog/like:
 *   put:
 *     tags: [Blog V1]
 *     summary: Toggle like on a blog post
 *     description: Adds or removes a like from the authenticated customer. Requires an active customer session.
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [blog_id]
 *             properties:
 *               blog_id: { type: string, example: 64a1b2c3d4e5f6a7b8c9d0e1 }
 *     responses:
 *       200:
 *         description: Like toggled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized — no active session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/like',validateUser, likeBlogController)

export default router;
