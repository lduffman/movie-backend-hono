import z from "zod";
import { movieSchema } from "./movie.schema.js";
import { paginationSchema } from "./common.schema.js";

export const librarySchema = z.object({
  id: z.uuid(),
  movie: movieSchema,
  watched: z.boolean(),
  rating: z.number().min(0).max(10).nullable(),
  createdAt: z.string(),
});

export const upsertLibrarySchema = z.object({
  watched: z.boolean().default(false),
  rating: z.number().min(0).max(10).nullable().default(null),
});

export const LIBRARY_SORT_PROPERTIES = [
  "createdAt",
  "rating",
  "watched",
  "movie.title",
  "movie.year",
] as const;

export type LibrarySortProperty = (typeof LIBRARY_SORT_PROPERTIES)[number];

const librarySortPattern = new RegExp(
  `^(${LIBRARY_SORT_PROPERTIES.map((p) => p.replace(".", "\\.")).join("|")}),(asc|desc)$`,
);

export const searchLibrarySchema = paginationSchema.extend({
  watched: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  sort: z
    .string()
    .regex(
      librarySortPattern,
      `sort must be one of: ${LIBRARY_SORT_PROPERTIES.join(", ")} (e.g. rating,desc)`,
    )
    .optional()
    .default("createdAt,desc"),
});

export type LibraryEntryDto = z.infer<typeof librarySchema>;
export type UpsertLibraryEntryDto = z.infer<typeof upsertLibrarySchema>;
