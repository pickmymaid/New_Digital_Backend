const mongoose = require("mongoose");

const customerPreference = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    emirate_of_residence: {
        type: String
    },
    position_required: {
        type: String
    },
    proposed_salary: {
        type: String
    },
    area: {
        type: String
    },
    number_of_family: {
        type: String
    },
    accomodation_type: {
        type: String
    },
    heared_from: {
        type: String
    },
    nationality_preference: {
        type: String
    },
    additional_requirement: {
        type: String
    },
    child_category: {
        type: String
    }
}, {timestamps: true})

customerPreference.index({ user_id: 1 });

const CustomerPreferenceModel = mongoose.model('customerpreference', customerPreference)

module.exports = { CustomerPreferenceModel };
