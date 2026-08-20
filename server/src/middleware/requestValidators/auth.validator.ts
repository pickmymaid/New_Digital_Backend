import * as yup from 'yup'
import regularExpressions from '../../utils/constants/regularExpressions';
import responseMessages from '../../utils/constants/responseMessages';

export const CustomerRegisterSchema = yup.object({
  first_name: yup.string().min(3, responseMessages.min('First Name', 3)).required(responseMessages.required('First Name')),
  last_name: yup.string().min(2, responseMessages.min('Last Name', 2)),
  email: yup.string().matches(regularExpressions.isEmail, responseMessages.validity('Email address')).required(responseMessages.required('Email')),
  password: yup.string().min(4, responseMessages.min('Password', 4)).max(16, responseMessages.max('Password', 16)).required(responseMessages.required('Password'))
})

export const CustomerLoginSchema = yup.object({
  email: yup.string().matches(regularExpressions.isEmail, 'User does not exist!').required(responseMessages.required('Email')),
  password: yup.string().min(6, 'Incorrect password').max(16, 'Incorrect password').required(responseMessages.required('Password')),
})

export const CustomerForgetPasswordSchema = yup.object({
  email: yup.string().matches(regularExpressions.isEmail, 'User does not exist!').required(responseMessages.required('Email')),
})

export const CustomerResetPasswordSchema = yup.object({
  password: yup.string().min(6, responseMessages.min('Password', 6)).max(16, responseMessages.max('Password', 16)).required(responseMessages.required('Password')),
  confirm_password: yup.string().required('Confirm Password is required')
})

export const AdminRegisterSchema = yup.object({
  name: yup.string().min(3, responseMessages.min('First Name', 3)).required(responseMessages.required('First Name')),
  email: yup.string().matches(regularExpressions.isEmail, responseMessages.validity('Email address')).required(responseMessages.required('Email')),
  is_super_admin: yup.boolean().required(),
  role: yup.string().oneOf(['A', 'Marketing', 'Admin']).required(),
  password: yup.string().min(6, responseMessages.min('Password', 6)).max(16, responseMessages.max('Password', 16)).required(responseMessages.required('Password')),
  confirm_password: yup.string().required('Confirm Password is required')
})


export const AdminLoginScheme = yup.object({
  email: yup.string().matches(regularExpressions.isEmail, 'User not found').required(responseMessages.required('Email')),
  password: yup.string().min(6, 'Invalid password').max(16, 'Invalid Password').required(responseMessages.required('Password')),
})