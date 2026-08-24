const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    meta_title: String,
    meta_description: String,
    meta_keywords: String,
    og_title: String,
    og_description: String,
    canonical_url: String,
    editedAt: Date,
    comments: [{
        user_id: {
            type: String,
            required: true
        },
        comment: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            required: true
        }
    }],
    likes: [String],
}, {timestamps: true})

const BlogModel = mongoose.model('Blog',BlogSchema)

module.exports = { BlogModel };
