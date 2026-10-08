const express = require('express');
const {
  getSkillsController,
  getAdminSkillsController,
  createSkillController,
  updateSkillController,
  deleteSkillController,
} = require('../controllers/skill.controller');
const { validateJwtToken } = require('../middleware/jwtValidator');
const { roleValidator } = require('../middleware/roleValidator');

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Skill:
 *       type: object
 *       properties:
 *         _id: { type: string, example: '66f1c2a9e4b0a1b2c3d4e5f6' }
 *         name: { type: string, example: 'Cooking' }
 *         is_active: { type: boolean, example: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     SkillRequest:
 *       type: object
 *       properties:
 *         name: { type: string, maxLength: 60, example: 'Cooking' }
 *         is_active: { type: boolean, example: true }
 *
 * /api/v1/skills/:
 *   get:
 *     tags: [Skills V1]
 *     summary: List active skills
 *     description: Public. Returns the active skills offered on maid profiles, sorted by name.
 *     responses:
 *       200:
 *         description: Active skills
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     skills:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Skill' }
 *   post:
 *     tags: [Skills V1]
 *     summary: Create a skill
 *     description: Requires SA or A role. Names are unique case-insensitively.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/SkillRequest'
 *             required: [name]
 *     responses:
 *       201:
 *         description: Skill created
 *       400:
 *         description: Missing or invalid name
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: A skill with this name already exists
 *
 * /api/v1/skills/admin:
 *   get:
 *     tags: [Skills V1]
 *     summary: List all skills (including inactive)
 *     description: Requires SA or A role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All skills
 *       401:
 *         description: Unauthorized
 *
 * /api/v1/skills/{id}:
 *   patch:
 *     tags: [Skills V1]
 *     summary: Update a skill
 *     description: >
 *       Requires SA or A role. Send `name` to rename (the new name is also applied to
 *       every maid profile that had the old one) and/or `is_active` to show or hide it.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SkillRequest'
 *     responses:
 *       200:
 *         description: Skill updated
 *       400:
 *         description: Invalid id or body
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Skill not found
 *       409:
 *         description: A skill with this name already exists
 *   delete:
 *     tags: [Skills V1]
 *     summary: Delete a skill
 *     description: >
 *       Requires SA or A role. Removes the skill from the catalog only — maid profiles
 *       that already list it keep it. `data.maidsUsing` reports how many do.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Skill deleted
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Skill not found
 */
router.get('/', getSkillsController)
router.get('/admin', validateJwtToken, roleValidator(['SA', 'A']), getAdminSkillsController)
router.post('/', validateJwtToken, roleValidator(['SA', 'A']), createSkillController)
router.patch('/:id', validateJwtToken, roleValidator(['SA', 'A']), updateSkillController)
router.delete('/:id', validateJwtToken, roleValidator(['SA', 'A']), deleteSkillController)

module.exports = router;
