import regularExpressions from '../../utils/constants/regularExpressions';
import responseMessages from '../../utils/constants/responseMessages';
import * as yup from 'yup';

export const jobApplicationClientFormSchema = yup.object({
  name: yup.string().min(3, responseMessages.min('name', 3)).required(responseMessages.required('Name')),
  mobile: yup.string().min(4, responseMessages.min('mobile', 4)).required(responseMessages.required('Mobile Number')),
  email: yup.string().matches(regularExpressions.isEmail, responseMessages.validity('Email address')),
});
