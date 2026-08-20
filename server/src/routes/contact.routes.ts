import express, { Router } from 'express';
import { createContactController, getContactController } from '../controllers/contact.controller';
import { validateJwtToken } from '../middleware/jwtValidator';
import { roleValidator } from '../middleware/roleValidator';

const router: Router = express.Router();

/**
 * @openapi
 * /api/v1/contact/:
 *   post:
 *     tags: [Contact V1]
 *     summary: Submit a contact form message
 *     description: Public endpoint for customers or visitors to submit enquiries or support requests.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactRequest'
 *     responses:
 *       201:
 *         description: Message submitted successfully
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
 *   get:
 *     tags: [Contact V1]
 *     summary: Get all contact form submissions
 *     description: Returns all submitted contact messages. Requires SA or A role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of contact submissions
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
 *                       _id: { type: string }
 *                       name: { type: string }
 *                       email: { type: string }
 *                       subject: { type: string }
 *                       message: { type: string }
 *                       createdAt: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', createContactController)
router.get('/', validateJwtToken, roleValidator(['SA','A']), getContactController)

export default router;
