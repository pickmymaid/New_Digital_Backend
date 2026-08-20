import bcrypt from 'bcrypt'

export const passwordValidator = async (givenPassword:string, dbPassword: string) => {
  return await bcrypt.compare(givenPassword, dbPassword);
}