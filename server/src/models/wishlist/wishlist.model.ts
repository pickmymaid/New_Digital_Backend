import mongoose from "mongoose";

const WishtlistSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    maid_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'jobApplications'
    }
})

export const WishtListModel = mongoose.model('Wishlist', WishtlistSchema)