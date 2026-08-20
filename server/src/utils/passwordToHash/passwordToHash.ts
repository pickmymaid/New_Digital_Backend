import bcrypt from 'bcrypt';

export const passwordToHash = async (password: string) => {
  return await bcrypt.hash(password, 10);
}