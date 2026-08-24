const mongoose = require("mongoose");

const ClickSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  }
}, { timestamps: true })

const ClickSchemaModel = mongoose.model('click', ClickSchema)

module.exports = { ClickSchemaModel };
