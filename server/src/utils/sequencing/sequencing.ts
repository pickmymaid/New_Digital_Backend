
import { refNumberModel } from '../../models/refNumber/refNumber.model';

export const getSequenceNextValue = (seqname: string) => {
  return new Promise((resolve, reject) => {
    refNumberModel.findByIdAndUpdate({ _id: seqname }, { $inc: { sequence_value: 1 } }).then((res:any)=>{
        if(res){
            resolve(res.sequence_value + 1);
        }else{
            resolve(null)
        }
    }).catch((err)=>{
        reject(err)
    })
  });
};

export const insertCounter = (seqname: string) => {
  const newCounter = new refNumberModel({ _id: seqname, sequence_value: 1 });
  return new Promise((resolve, reject) => {
    newCounter
      .save()
      .then((res) => {
        resolve(res.sequence_value);
      })
      .catch((err) => reject(err));
  });
};

