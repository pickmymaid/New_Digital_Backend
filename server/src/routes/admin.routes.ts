import { getCustomersController, getMaidHistory, teamMemberRoleChangeController, toggleUserBlockController, updateCustomerPasswordController, verifyCustomerPaymentController } from './../controllers/admin.controllers';
import express, { Router } from 'express';
import { deleteTeamMemberController, getTeamMembersController } from '../controllers/admin.controllers';
import { validateJwtToken } from '../middleware/jwtValidator';
import { roleValidator } from '../middleware/roleValidator';

const router: Router = express.Router();

/**
 * @openapi
 * /api/v1/admin/team:
 *   get:
 *     tags: [Admin V1]
 *     summary: Get all admin team members
 *     description: Returns the full list of admin accounts. Requires Super Admin (SA) role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of team members
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
 *                       role: { type: string, enum: [SA, A, Marketing] }
 *                       status: { type: string }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/team', validateJwtToken, roleValidator(['SA']), getTeamMembersController)

/**
 * @openapi
 * /api/v1/admin/team-member/{id}:
 *   delete:
 *     tags: [Admin V1]
 *     summary: Delete a team member
 *     description: Permanently removes an admin account. Requires SA role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the admin account
 *     responses:
 *       200:
 *         description: Team member deleted
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
 *   patch:
 *     tags: [Admin V1]
 *     summary: Change a team member's role
 *     description: Updates the role of an existing admin account. Requires SA role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the admin account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [A, Marketing, Admin]
 *                 example: Marketing
 *     responses:
 *       200:
 *         description: Role updated successfully
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
router.delete('/team-member/:id', validateJwtToken, roleValidator(['SA']), deleteTeamMemberController);
router.patch('/team-member/:id', validateJwtToken, roleValidator(['SA']), teamMemberRoleChangeController)

/**
 * @openapi
 * /api/v1/admin/history/{maid_id}:
 *   get:
 *     tags: [Admin V1]
 *     summary: Get employment history for a maid
 *     description: Returns all recorded job assignments and interactions for a given maid profile. Requires SA role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: maid_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reference number or MongoDB ObjectId of the maid application
 *     responses:
 *       200:
 *         description: Maid history records
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
router.get('/history/:maid_id', validateJwtToken, roleValidator(['SA']), getMaidHistory)

/**
 * @openapi
 * /api/v1/admin/customer-password:
 *   put:
 *     tags: [Admin V1]
 *     summary: Update a customer's password
 *     description: Allows SA to directly set a customer's password. Requires SA role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, password]
 *             properties:
 *               user_id: { type: string, example: USR-001 }
 *               password: { type: string, example: newPassword123 }
 *     responses:
 *       200:
 *         description: Password updated
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
router.put('/customer-password', validateJwtToken, roleValidator(['SA']), updateCustomerPasswordController)

/**
 * @openapi
 * /api/v1/admin/customer:
 *   get:
 *     tags: [Admin V1]
 *     summary: Get paginated customer list
 *     description: Returns a paginated list of customers with optional search. Requires SA role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Paginated customer list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/customer', validateJwtToken, roleValidator(['SA']), getCustomersController)

/**
 * @openapi
 * /api/v1/admin/verify-payment:
 *   post:
 *     tags: [Admin V1]
 *     summary: Manually verify a customer payment
 *     description: Marks a payment as verified and activates the customer's subscription. Requires SA role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, ref]
 *             properties:
 *               user_id: { type: string, example: USR-001 }
 *               ref: { type: string, example: REF-12345 }
 *     responses:
 *       200:
 *         description: Payment verified
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
router.post('/verify-payment', validateJwtToken, roleValidator(['SA']), verifyCustomerPaymentController)

/**
 * @openapi
 * /api/v1/admin/block-user/{user_id}:
 *   get:
 *     tags: [Admin V1]
 *     summary: Toggle customer block status
 *     description: >
 *       Toggles `is_blocked` on a customer account (block if unblocked, unblock if blocked).
 *       **Note:** Uses GET for historical reasons — this is a state-changing operation.
 *       Requires SA role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The customer's user_id
 *     responses:
 *       200:
 *         description: Block status toggled
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
router.get('/block-user/:user_id', validateJwtToken, roleValidator(['SA']), toggleUserBlockController)

export default router;
