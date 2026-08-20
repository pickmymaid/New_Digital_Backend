import mongoose from 'mongoose';

const refNumberSchema = new mongoose.Schema(
  {
   
    _id:{
        type:String,
        required:true
    },
    sequence_value:{
        type:Number,
        required:true
    },
    status:{
        type:Number,
        default:1
    }

  },
  { timestamps: true }
);



export const refNumberModel = mongoose.model('refNumber', refNumberSchema);