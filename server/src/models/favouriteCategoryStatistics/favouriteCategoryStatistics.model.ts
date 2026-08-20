import mongoose from "mongoose";

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

export const FavStatics = mongoose.model('favouriteCategoryStatistics', favouriteCategoryStatistics)