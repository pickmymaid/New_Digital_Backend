import { getApprovedJobApplicationFormController, getJobApplicationbyidFormController, getAllJobApplicationFormController, getVerifiedAndReferenceJobApplicationFormController, disableJobApplicationController, changeAvailabilityStatusController, getThecountsJobApplicationController, getFeaturedMaidsController, createNewJobController, getNewJobController, deleteNewjobController, searchNewJobController, assureJobApplicationController, getJobApplicationbyidDashboardFormController, toggleWishlistItemController, listAllWishlist, getAllMaidsForSEO } from './../controllers/jobApplication.controller';
import express, { Router } from 'express';
import {
  createJobApplicationClientController,
  createJobApplicationDashboardController,
  deleteJobApplicationController,
  getJobApplicationFormController,
  updateJobApplicationFormController,
  verifyJobApplicationController,
} from '../controllers/jobApplication.controller';
import { validateJwtToken } from '../middleware/jwtValidator';
import { jobApplicationClientFormSchema } from '../middleware/requestValidators/jobApplication.validator';
import { roleValidator } from '../middleware/roleValidator';
import { validator } from '../middleware/validator';


const router: Router = express.Router();

/**
 * @openapi
 * /api/v1/job/register:
 *   post:
 *     tags: [Maids V1]
 *     summary: Client maid registration (public lead form)
 *     description: Submitted by prospective maids from the public frontend form. Creates an initial application record.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobApplicationClientRequest'
 *     responses:
 *       201:
 *         description: Application registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', validator(jobApplicationClientFormSchema), createJobApplicationClientController);

/**
 * @openapi
 * /api/v1/job/:
 *   get:
 *     tags: [Maids V1]
 *     summary: Get all job applications (basic list)
 *     description: Returns all maid applications with basic info (name, email, mobile, status, ref_number). Requires JWT.
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
 *         description: Search by name, email, or ref_number
 *     responses:
 *       200:
 *         description: List of applications
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MaidProfile'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags: [Maids V1]
 *     summary: Create a new maid application (admin dashboard)
 *     description: Admin creates a full maid profile. Accepts multipart/form-data including profile image and document files. Requires SA or A role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: Maria Santos }
 *               email: { type: string, format: email }
 *               mobile: { type: string, example: '+971501234567' }
 *               age: { type: integer, example: 30 }
 *               nationality: { type: string, example: Filipino }
 *               marital_status: { type: string, example: Single }
 *               location: { type: string, example: Dubai }
 *               religion: { type: string, example: Christian }
 *               salary: { type: number, example: 1500 }
 *               availability: { type: string, example: Immediate }
 *               skills: { type: string, description: JSON array string }
 *               languages: { type: string, description: JSON array string }
 *               profile:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo file
 *               word_file:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Supporting document files
 *     responses:
 *       201:
 *         description: Application created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MaidProfile'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags: [Maids V1]
 *     summary: Update a maid application (admin dashboard)
 *     description: Updates an existing maid profile. Same multipart/form-data format as POST. Requires SA or A role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               _id: { type: string, description: MongoDB ObjectId of the application }
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               mobile: { type: string }
 *               age: { type: integer }
 *               nationality: { type: string }
 *               salary: { type: number }
 *               availability: { type: string }
 *               skills: { type: string, description: JSON array string }
 *               profile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Application updated
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
 *   delete:
 *     tags: [Maids V1]
 *     summary: Delete a maid application
 *     description: Permanently deletes a maid profile. Requires SA role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id: { type: string, example: 64a1b2c3d4e5f6a7b8c9d0e1 }
 *     responses:
 *       200:
 *         description: Application deleted
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
router.get('/', validateJwtToken,getJobApplicationFormController);
router.post('/',validateJwtToken,roleValidator(['SA','A']),createJobApplicationDashboardController);
router.put('/', validateJwtToken,roleValidator(['SA','A']),updateJobApplicationFormController);
router.delete('/',validateJwtToken,roleValidator(['SA']), deleteJobApplicationController);

/**
 * @openapi
 * /api/v1/job/id:
 *   post:
 *     tags: [Maids V1]
 *     summary: Get a maid application by ID (public)
 *     description: Fetches a single maid profile by its MongoDB ObjectId. Public endpoint — no auth required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id: { type: string, example: 64a1b2c3d4e5f6a7b8c9d0e1 }
 *     responses:
 *       200:
 *         description: Maid profile
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MaidProfile'
 *       404:
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/id', getJobApplicationbyidFormController);

/**
 * @openapi
 * /api/v1/job/id-dashboard:
 *   post:
 *     tags: [Maids V1]
 *     summary: Get a maid application by ID (admin enriched view)
 *     description: Returns full maid profile including admin-only fields. Requires SA or A role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id: { type: string, example: 64a1b2c3d4e5f6a7b8c9d0e1 }
 *     responses:
 *       200:
 *         description: Full maid profile
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MaidProfile'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/id-dashboard',validateJwtToken,roleValidator(['SA','A']), getJobApplicationbyidDashboardFormController);

/**
 * @openapi
 * /api/v1/job/verify:
 *   post:
 *     tags: [Maids V1]
 *     summary: Verify a maid application
 *     description: Marks an application as verified (sets is_verified to true). Requires SA role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id: { type: string, example: 64a1b2c3d4e5f6a7b8c9d0e1 }
 *     responses:
 *       200:
 *         description: Application verified
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
router.post('/verify',validateJwtToken,roleValidator(['SA']), verifyJobApplicationController);

/**
 * @openapi
 * /api/v1/job/approved:
 *   get:
 *     tags: [Maids V1]
 *     summary: Get approved applications (admin)
 *     description: Returns paginated list of verified maid applications. Requires SA role.
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
 *     responses:
 *       200:
 *         description: Paginated approved applications
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MaidProfile'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/approved',validateJwtToken,roleValidator(['SA']),getApprovedJobApplicationFormController)

/**
 * @openapi
 * /api/v1/job/all:
 *   get:
 *     tags: [Maids V1]
 *     summary: Get all maid applications (public, paginated)
 *     description: Public endpoint returning paginated maid profiles with optional filters.
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
 *         description: Search by name, nationality, or skills
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *       - in: query
 *         name: nationality
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated maid profiles
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MaidProfile'
 */
router.get('/all',getAllJobApplicationFormController)

/**
 * @openapi
 * /api/v1/job/client-approved:
 *   get:
 *     tags: [Maids V1]
 *     summary: Get verified and referenced maid applications (public)
 *     description: Returns maids that are both verified and have references — suitable for public display.
 *     responses:
 *       200:
 *         description: Verified and referenced maid profiles
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MaidProfile'
 */
router.get('/client-approved',getVerifiedAndReferenceJobApplicationFormController)

/**
 * @openapi
 * /api/v1/job/disabled:
 *   post:
 *     tags: [Maids V1]
 *     summary: Toggle disable status on a maid application
 *     description: Enables or disables a maid profile from appearing in listings. Requires SA or A role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id: { type: string, example: 64a1b2c3d4e5f6a7b8c9d0e1 }
 *               is_disabled: { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: Status updated
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
router.post('/disabled', validateJwtToken,roleValidator(['SA','A']),disableJobApplicationController);

/**
 * @openapi
 * /api/v1/job/hire:
 *   post:
 *     tags: [Maids V1]
 *     summary: Change a maid's availability/hire status
 *     description: Updates whether the maid is currently available for hire. Requires SA or A role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id: { type: string, example: 64a1b2c3d4e5f6a7b8c9d0e1 }
 *               availability: { type: string, example: On hold }
 *     responses:
 *       200:
 *         description: Availability updated
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
router.post('/hire',validateJwtToken, roleValidator(['SA','A']),changeAvailabilityStatusController);

/**
 * @openapi
 * /api/v1/job/featured:
 *   get:
 *     tags: [Maids V1]
 *     summary: Get featured maids (public)
 *     description: Returns maid profiles flagged as featured (is_featured is true).
 *     responses:
 *       200:
 *         description: Featured maid profiles
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MaidProfile'
 */
router.get('/featured',getFeaturedMaidsController)

/**
 * @openapi
 * /api/v1/job/assured:
 *   post:
 *     tags: [Maids V1]
 *     summary: Mark/unmark a maid as assured
 *     description: Toggles the `is_assured` flag on a maid profile. Requires SA or A role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id: { type: string, example: 64a1b2c3d4e5f6a7b8c9d0e1 }
 *     responses:
 *       200:
 *         description: Assured status updated
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
router.post('/assured',validateJwtToken,roleValidator(['SA','A']),assureJobApplicationController)

/**
 * @openapi
 * /api/v1/job/all-maids-seo:
 *   get:
 *     tags: [Maids V1]
 *     summary: Get all maid profiles for SEO (public)
 *     description: Returns a minimal set of fields (ref_number, name, nationality, slug) for all active maids. Used for SEO sitemap and structured data generation.
 *     responses:
 *       200:
 *         description: SEO-optimised maid listing
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ref_number: { type: string }
 *                       name: { type: string }
 *                       nationality: { type: string }
 */
router.get('/all-maids-seo', getAllMaidsForSEO)

/**
 * @openapi
 * /api/v1/job/counts:
 *   get:
 *     tags: [Maids V1]
 *     summary: Get application statistics (public)
 *     description: Returns aggregate counts — total applications, verified, featured, etc.
 *     responses:
 *       200:
 *         description: Application count statistics
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     verified: { type: integer }
 *                     featured: { type: integer }
 */
router.get('/counts',getThecountsJobApplicationController)

/**
 * @openapi
 * /api/v1/job/toggle-wishlist:
 *   post:
 *     tags: [Maids V1]
 *     summary: Add or remove a maid from a user's wishlist
 *     description: Toggles wishlist membership. No auth middleware — user_id is passed in the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [maid_id, user_id]
 *             properties:
 *               maid_id: { type: string, example: 64a1b2c3d4e5f6a7b8c9d0e1 }
 *               user_id: { type: string, example: USR-001 }
 *     responses:
 *       200:
 *         description: Wishlist updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/toggle-wishlist',toggleWishlistItemController)

/**
 * @openapi
 * /api/v1/job/wishlist:
 *   get:
 *     tags: [Maids V1]
 *     summary: Get a user's wishlist
 *     description: Returns all maid profiles that a user has wishlisted. user_id is passed as a query param.
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The customer's user_id
 *     responses:
 *       200:
 *         description: Wishlist items
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MaidProfile'
 */
router.get('/wishlist', listAllWishlist)

/**
 * @openapi
 * /api/v1/job/findjob:
 *   post:
 *     tags: [Maids V1]
 *     summary: Create a new job listing
 *     description: Admin creates a job opportunity that maids can apply to. Requires SA or A role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: Live-in Maid Required }
 *               description: { type: string }
 *               location: { type: string, example: Dubai }
 *               salary: { type: number, example: 2000 }
 *               skills: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Job created
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
 *   get:
 *     tags: [Maids V1]
 *     summary: Get job listings (admin)
 *     description: Returns all job listings for admin management. Requires SA or A role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Job listings
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
 *   delete:
 *     tags: [Maids V1]
 *     summary: Delete a job listing
 *     description: Permanently removes a job listing. Requires SA role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id: { type: string, example: 64a1b2c3d4e5f6a7b8c9d0e1 }
 *     responses:
 *       200:
 *         description: Job deleted
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
router.post('/findjob',validateJwtToken,roleValidator(['SA','A']),createNewJobController)
router.get('/findjob',validateJwtToken,roleValidator(['SA','A']),getNewJobController)
router.delete('/findjob',validateJwtToken,roleValidator(['SA']),deleteNewjobController)

/**
 * @openapi
 * /api/v1/job/find:
 *   get:
 *     tags: [Maids V1]
 *     summary: Get job listings (public, for clients)
 *     description: Returns all active job listings visible to customers browsing the platform.
 *     responses:
 *       200:
 *         description: Active job listings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/find',getNewJobController)

/**
 * @openapi
 * /api/v1/job/find-search:
 *   post:
 *     tags: [Maids V1]
 *     summary: Search job listings
 *     description: Text search across job listings.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [search]
 *             properties:
 *               nationality: { type: string, example: Filipino }
 *               location: { type: string, example: Dubai }
 *               service: { type: string, example: Maid }
 *               page: { type: number, example: 1 }
 *               limit: { type: number, example: 10 }
 *     responses:
 *       200:
 *         description: Matching job listings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/find-search',searchNewJobController)

export default router;
