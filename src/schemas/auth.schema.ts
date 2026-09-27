import { z } from "zod";

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const loginSchema = z.object({
  username: z.email().nonempty(),
  password: z.string().min(8).nonempty(),
});

export const registerUserSchema = z.object({
  username: z.email().nonempty(),
  password: z.string().regex(passwordPattern),
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
});

export type RegisterUserDto = z.infer<typeof registerUserSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
