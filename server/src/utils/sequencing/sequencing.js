
const { refNumberModel } = require('../../models/refNumber/refNumber.model');

const getSequenceNextValue = (seqname) => {
  return new Promise((resolve, reject) => {
    refNumberModel.findByIdAndUpdate({ _id: seqname }, { $inc: { sequence_value: 1 } }).then((res)=>{
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

const insertCounter = (seqname) => {
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

module.exports = { getSequenceNextValue, insertCounter };
