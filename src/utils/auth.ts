import * as argon2 from 'argon2';

export const verifyPassword = async (
  hash: string,
  password: string,
): Promise<boolean> => {
  return await argon2.verify(hash, password);
};

export const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(password);
};
