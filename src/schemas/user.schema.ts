import z from "zod";

export const userSchema = z.object({
  id: z.uuid(),
  username: z.email().nonempty(),
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
});

export type UserDto = z.infer<typeof userSchema>;