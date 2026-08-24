const regularExpressions = require('../../utils/constants/regularExpressions');
const responseMessages = require('../../utils/constants/responseMessages');
const yup = require('yup');

const jobApplicationClientFormSchema = yup.object({
  name: yup.string().min(3, responseMessages.min('name', 3)).required(responseMessages.required('Name')),
  mobile: yup.string().min(4, responseMessages.min('mobile', 4)).required(responseMessages.required('Mobile Number')),
  email: yup.string().matches(regularExpressions.isEmail, responseMessages.validity('Email address')),
});

module.exports = { jobApplicationClientFormSchema };
