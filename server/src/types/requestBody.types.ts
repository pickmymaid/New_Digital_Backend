// Declare the type of body of customer registration form
export type ICustomerRegisterBody = {
  user_id?: string;
  first_name?: string;
  account_id?: string;
  last_name?: string;
  profile?: string;
  type?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
  phone?: string;
  emirate_of_residence: string;
  position_required: string;
  proposed_salary: string;
  area: string;
  number_of_family: string;
  accomodation_type: string;
  heared_from: string;
  nationality_preference: string;
  additional_requirement: string;
  child_category: string;
}

// Declare the type of body of customer login form
export type ICustomerLoginBody = {
  email: string;
  password: string;
}

// Declare the type of forget pass body
export type ICustomerForgetPassBody = {
  email: string;
}

// Declare the type of reset pass body
export type ICustomerResetPassBody = {
  password: string;
  confirm_password: string;
}

// Declare the type of adminRegisterBody 
export type IAdminRegisterBody = {
  name: string;
  email: string;
  is_super_admin: boolean;
  role?: string;
  password: string;
  confirm_password?: string;
}

// Declare the type of admin login body
export type IAdminLoginBody = {
  email: string;
  password: string;
}

// Declare the type of admin logout body
export type IAdminLogoutBody = {
  user_id: string;
}

// Declare the type of Job Application Client Form
export type IJobApplicationClientBody = {
  name: string;
  mobile: string;
  email?: string;
}

// Declare the type of Job 
export type IJobBody = {
  title: string;
  image: string;
  commitment: string;
  location:string;
  service:string;
  nationality: string;
}


export type IJobSearchBody = {
  location?: string;
  service?: string;
  nationality?: string;
  page?: number;
  limit?: number;
}



// Declare the type of Job Application Dashboard Form
export type IJobApplicationDashboardBody = {
  id?: string;
  name: string;
  mobile: string;
  email?: string;
  age?: number;
  marital_status: string;
  nationality: string;
  location: string;
  religion: string;
  salary: object;
  uae_no: string;
  whatsapp_no: string;
  botim_number: string;
  current_location: string;
  is_negotiable_salary: boolean;
  youtube_link: string;
  visa_status: string;
  availability: boolean;
  skills: string;
  language: Array<object>;
  option: object;
  employmentHistory: Array<object>;
  wordfiles: Array<object>;
  education: string;
  notes: string;
  references: boolean;
  available_from:string,
  visa_expire:string,
  day_of: string
  status?: number;
  service: string;
  profile?: string;
date?:Date;
}


export type IPaymentBody = {
  type: number;
  token:string;
  amount?:number;
  user_id?:string;
  Tid?:string
  expiryDate?:Date;
}

export type IPaymentTokenBody = {
  ref?:string;
}

// Body for v2 of payment
export type IPaymentCreateBody = {
  type: 0 | 1 | 2;
}

export type IPaymentCl = {
  type: number;
  amount:number;
  user_id:string;
  expiryDate:Date;
}

export interface UploadedFile {
  originalname: string;
  path: string;
}

// Declare the type of contact Body
export type IContactBody = {
  name?: string;
  email?: string;
  mobile?: string;
  message?: string;
}

// Declare the type of blog body
export type IBlogBody = {
  slug?: string;
  title: string;
  thumbnail: any;
  description: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  canonical_url?: string;
  editedAt?: Date;
}

// Declare the type of body of comments of blog
export type ICommentBody = {
  user_id?: string;
  blog_id?: string;
  comment: string;
  createdAt?: Date;
}

export type IPaymentCredentials = {
  transactionToken: string,
  transRef: string,
  type: 0 | 1 | 2 | 3,
  user_id: string;
}

export type ICategoryAnalyticsBody = {
  category: string;
  user_id?: string;
  maid_id?: string;
}

export type ICategoryAnalyticsDataReturn = {
  _id: string;
  count: number;
}