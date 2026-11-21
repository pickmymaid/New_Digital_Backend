const mongoose = require("mongoose");

// Admin-managed catalog of maid skills. Maid profiles store skills by name
// (jobApplications.skills is an array of strings), so `name` is the value
// that ends up on a maid document.
const SkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60,
  },
  // Lower-cased copy of `name` so "Cooking" and "cooking" can't both exist.
  name_key: {
    type: String,
    required: true,
    unique: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  // Admin-chosen display position (0 = first). Skills without one sort after the
  // ordered ones, alphabetically.
  sort_order: {
    type: Number,
    default: null,
  },
}, { timestamps: true })

SkillSchema.pre('validate', function (next) {
  if (this.name) this.name_key = this.name.trim().toLowerCase();
  next();
});

const SkillModel = mongoose.model('Skill', SkillSchema)

module.exports = { SkillModel };
