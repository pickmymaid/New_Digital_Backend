const mongoose = require('mongoose');

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



const refNumberModel = mongoose.model('refNumber', refNumberSchema);

module.exports = { refNumberModel };
