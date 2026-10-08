const express = require('express');
const { createJobApplicationFrontendController } = require('../controllers/jobApplication.controller');
const { jobApplicationFrontendFormSchema } = require('../middleware/requestValidators/jobApplication.validator');
const { validator } = require('../middleware/validator');

const router = express.Router();

/**
 * @openapi
 * /api/v1/jobfrontend:
 *   post:
 *     tags: [Maids V1]
 *     summary: Job seeker registration from the website (public)
 *     description: >
 *       Public clone of POST /api/v1/job (admin create maid), used by the website's
 *       /register?as=job form. Accepts the same fields and files plus an intro video.
 *       The profile is always saved unapproved (status 0) until an admin verifies it via
 *       POST /api/v1/job/verify. Admin-only fields (status, references, ...) are ignored.
 *       Whole request must stay under 50 MB.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, mobile, email]
 *             properties:
 *               name: { type: string, example: Maria Santos }
 *               mobile: { type: string, example: '+971501234567' }
 *               email: { type: string, format: email }
 *               age: { type: integer, example: 30 }
 *               nationality: { type: string, example: Filipino }
 *               marital_status: { type: string, example: Single }
 *               religion: { type: string }
 *               education: { type: string }
 *               uae_no: { type: string }
 *               whatsapp_no: { type: string }
 *               botim_number: { type: string }
 *               service: { type: string, example: Nanny }
 *               location: { type: string, example: Dubai, description: Preferred work location }
 *               current_location: { type: string, example: Dubai }
 *               visa_status: { type: string, example: Visit Visa }
 *               visa_expire: { type: string, format: date }
 *               available_from: { type: string, format: date }
 *               day_of: { type: string, example: Friday }
 *               availability: { type: boolean }
 *               is_negotiable_salary: { type: boolean }
 *               youtube_link: { type: string }
 *               notes: { type: string }
 *               salary: { type: string, description: 'JSON string, e.g. {"from":1500,"to":2000}' }
 *               skills: { type: string, description: JSON array string }
 *               language: { type: string, description: 'JSON array string of {name, read, write, speak}' }
 *               employmentHistory: { type: string, description: 'JSON array string of {title, job_description, experiance, reason_leaving, location}' }
 *               profile:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo (jpg, jpeg, png, webp)
 *               wordfiles:
 *                 type: array
 *                 items: { type: string, format: binary }
 *                 description: Supporting documents (jpg, jpeg, png, webp, pdf)
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Intro video (mp4, mov, webm, m4v)
 *     responses:
 *       201:
 *         description: Application registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error, bad file type or file too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       502:
 *         description: File upload to storage failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', validator(jobApplicationFrontendFormSchema), createJobApplicationFrontendController);

module.exports = router;
