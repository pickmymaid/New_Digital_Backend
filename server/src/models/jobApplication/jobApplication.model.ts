import mongoose, { Types } from 'mongoose';
import { getSequenceNextValue, insertCounter } from '../../utils/sequencing/sequencing';
import { IJobApplicationCollection } from '../../types/dbStructureTypes';

const ExperianceSubSchema = new mongoose.Schema({
  job_description: {
    type: String,
  },
  title: {
    type: String,
  },
  experiance: {
    type: Number,
  },
  reason_leaving: {
    type: String,
  },
  location: {
    type: String,
  },
});

const languageSubSchema = new mongoose.Schema({
  id: { type: String },
  name: {
    type: String,
  },
  read: {
    type: Number, // 0 good // 1 excellent // 2 fair //3 No
  },
  write: {
    type: Number,
  },
  speak: {
    type: Number,
  },
});

const wordFileSubSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  image: {
    type: String,
  },
});

const jobapplicationSchema = new mongoose.Schema(
  {
    ref_number: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    mobile: {
      type: String,
    },
    profile: {
      type: String,
    },
    is_negotiable_salary: {
      type: Boolean
    },
    age: {
      type: Number,
    },
    marital_status: {
      type: String, //MARITAL STATUS
    },
    nationality: {
      type: String,
    },
    location: {
      type: String,
    },
    religion: {
      type: String,
    },
    salary: {
      from: {
        type: Number,
      },
      to: {
        type: Number,
      },
    },
    uae_no: {
      type: String,
    },
    whatsapp_no: {
      type: String,
    },
    botim_number: {
      type: String,
    },
    service: {
      type: String,
    },
    current_location: {
      type: String,
    },
    youtube_link: {
      type: String,
    },
    visa_status: {
      type: String,
    },
    availability: {
      type: Boolean,
    },
    skills: {
      type: Array,
    },
    language: [languageSubSchema],
    option: {
      type: String,
    },
    employmentHistory: [ExperianceSubSchema],

    word_file: [wordFileSubSchema],

    education: {
      type: String,
    },
    notes: {
      type: String,
    },
    available_from: {
      type: String,
    },
    visa_expire: {
      type: String,
    },
    references: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Number,
      default: 0, //0 is just added //1 is approved  //3 is disabled
    },
    day_of: {
      type: String,
    },
    date: {
      type: Date,
    },
  },
  { timestamps: true }
);

jobapplicationSchema.pre('save', async function (next) {
    //@ts-ignore
  const doc:IJobApplicationCollection = this ;
      //@ts-ignore
  if (!doc.isNew) {
    // If the document is not new, skip the pre-save middleware
    return next();
  }
try{
  const counter = await getSequenceNextValue('ref_number');

  console.log(counter, 'This is counter');
  if (counter === null) {
    const newCounter = await insertCounter('ref_number');
      //@ts-ignore
    doc.ref_number = newCounter;
  } else {
      //@ts-ignore
    doc.ref_number = counter;
  }
  next();
}catch (err:any) {
  next(err);
}
});
 
export const jobApplicationModel = mongoose.model('jobApplications', jobapplicationSchema);
