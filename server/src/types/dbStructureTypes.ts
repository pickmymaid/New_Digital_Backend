import { Types } from 'mongoose';
import { ObjectId } from 'mongoose';

// Declare the type of customer collection;
export type ICustomerCollection = {
  _id?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  profile?: string;
  type?: string;
  email?: string;
  account_id?: string;
  password?: string;
  reset_token?: string | null;
};

// Declare the type of admin collection
export type IAdminCollection = {
  _id?: ObjectId;
  user_id?: string;
  name?: string;
  email?: string;
  is_super_admin?: boolean;
  role?: 'SA' | 'A' | 'Marketing';
  status: 'active' | 'deleted';
  password?: string;
};

export type IJobApplicationCollection = {
  _id?: Types.ObjectId;
  ref_number?: string | undefined;
  name: string;
  mobile?: string | '';
  email?: string;
  age?: number;
  marital_status?: string | undefined;
  nationality?: string | undefined;
  location?: string | undefined;
  religion?: string | undefined;
  salary: object;
  uae_no: string;
  whatsapp_no: string;
  botim_number: string;
  current_location: string;
  youtube_link: string;
  visa_status: string;
  availability: boolean;
  skills: string;
  language: object;
  option: object;
  word_file: Array<string>;
  education: string;
  service: string;
  notes: string;
  references: boolean;

  createdAt: Date;
  updatedAt: Date;
  status: number;
  day_of: string;
  available_from: string;
  visa_expire: string;


};

export type IjobCollection = {
  _id?: string;
  title: string;
  image: string;
  commitment: string;
  location: string;
  service: string;
  jobCount?: number;
  resultCount?: number;
};

export type IPaymentCollection = {
  _id?: string;
  status: string;
  userId: string;
  transactionToken: string;
  transRef: string;
  type: string;
  jobCount?: number;
  resultCount?: number;
  expiryDate: Date;
};
