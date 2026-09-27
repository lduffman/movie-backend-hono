import argon2 from "argon2";

const PASSWORD_HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 4,
} as const;

export const hashPassword = (password: string) =>
  argon2.hash(password, PASSWORD_HASH_OPTIONS);

export const verifyPassword = (password: string, hash: string) =>
  argon2.verify(hash, password);
