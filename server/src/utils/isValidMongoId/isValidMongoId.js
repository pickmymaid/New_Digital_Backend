const mongoose = require("mongoose");

const isValidMongoId = (id) => {
    try {
        new mongoose.Types.ObjectId(id.toString());
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = { isValidMongoId };
