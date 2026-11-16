const mongoose = require("mongoose");

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

// Every maid card runs a $lookup on (user_id, maid_id) to set is_in_wishlist;
// without this each one scanned the whole collection.
WishtlistSchema.index({ user_id: 1, maid_id: 1 })

const WishtListModel = mongoose.model('Wishlist', WishtlistSchema)

module.exports = { WishtListModel };
