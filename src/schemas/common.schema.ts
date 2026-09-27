import { z } from "zod";

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("0")
    .transform((val) => parseInt(val, 10)),
  size: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10)),
});

export const paginationWithSortSchema = paginationSchema.extend({
  sort: z
    .string()
    .regex(/^[a-zA-Z0-9]+,(asc|desc)$/)
    .optional()
    .default("title,asc"),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
export type PaginationWithSortParams = z.infer<typeof paginationWithSortSchema>;
