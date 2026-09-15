const yup = require('yup');
const regularExpressions = require('../../utils/constants/regularExpressions');
const responseMessages = require('../../utils/constants/responseMessages');

const CustomerRegisterSchema = yup.object({
  first_name: yup.string().min(3, responseMessages.min('First Name', 3)).required(responseMessages.required('First Name')),
  last_name: yup.string().min(2, responseMessages.min('Last Name', 2)),
  email: yup.string().matches(regularExpressions.isEmail, responseMessages.validity('Email address')).required(responseMessages.required('Email')),
  password: yup.string().min(6, responseMessages.min('Password', 6)).max(16, responseMessages.max('Password', 16)).required(responseMessages.required('Password'))
})

const CustomerLoginSchema = yup.object({
  email: yup.string().matches(regularExpressions.isEmail, responseMessages.validity('Email address')).required(responseMessages.required('Email')),
  // No min/max here: login only checks presence. Length rules belong to
  // registration/reset; enforcing them here rejects any account created
  // before a policy change with a misleading "Incorrect password" message
  // instead of the real bcrypt comparison result.
  password: yup.string().required(responseMessages.required('Password')),
})

const CustomerForgetPasswordSchema = yup.object({
  email: yup.string().matches(regularExpressions.isEmail, 'User does not exist!').required(responseMessages.required('Email')),
})

const CustomerResetPasswordSchema = yup.object({
  password: yup.string().min(6, responseMessages.min('Password', 6)).max(16, responseMessages.max('Password', 16)).required(responseMessages.required('Password')),
  confirm_password: yup.string().required('Confirm Password is required')
})

const AdminRegisterSchema = yup.object({
  name: yup.string().min(3, responseMessages.min('First Name', 3)).required(responseMessages.required('First Name')),
  email: yup.string().matches(regularExpressions.isEmail, responseMessages.validity('Email address')).required(responseMessages.required('Email')),
  is_super_admin: yup.boolean().required(),
  role: yup.string().oneOf(['A', 'Marketing', 'Admin']).required(),
  password: yup.string().min(6, responseMessages.min('Password', 6)).max(16, responseMessages.max('Password', 16)).required(responseMessages.required('Password')),
  confirm_password: yup.string().required('Confirm Password is required')
})


const AdminLoginScheme = yup.object({
  email: yup.string().matches(regularExpressions.isEmail, responseMessages.validity('Email address')).required(responseMessages.required('Email')),
  password: yup.string().required(responseMessages.required('Password')),
})

module.exports = {
  CustomerRegisterSchema,
  CustomerLoginSchema,
  CustomerForgetPasswordSchema,
  CustomerResetPasswordSchema,
  AdminRegisterSchema,
  AdminLoginScheme,
};
