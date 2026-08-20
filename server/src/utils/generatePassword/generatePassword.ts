export function generatePassword(): string {
  const length: number = 8;
  const charset: string = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let password: string = "";

  for (let i: number = 0; i < length; i++) {
    const randomIndex: number = Math.floor(Math.random() * charset.length);
    password += charset.charAt(randomIndex);
  }

  return password;
}