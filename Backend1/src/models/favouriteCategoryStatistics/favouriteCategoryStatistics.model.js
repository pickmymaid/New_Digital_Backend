const mongoose = require("mongoose");

const favouriteCategoryStatistics = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    user_id: {
        type: String
    },
    maid_id: {
        type: String,
        required: true
    },
}, {timestamps: true})

favouriteCategoryStatistics.index({ user_id: 1, maid_id: 1 })
favouriteCategoryStatistics.index({ createdAt: 1 })

const FavStatics = mongoose.model('favouriteCategoryStatistics', favouriteCategoryStatistics)

module.exports = { FavStatics };
