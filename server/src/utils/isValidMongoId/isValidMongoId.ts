import mongoose from "mongoose"

export const isValidMongoId = (id: string | number) => {
    try {
        new mongoose.Types.ObjectId(id.toString());
        return true;
    } catch (error) {
        return false;
    }
}