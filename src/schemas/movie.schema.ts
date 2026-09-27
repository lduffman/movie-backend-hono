import z from "zod";
import { paginationSchema } from "./common.schema.js";

export const movieSchema = z.object({
  id: z.uuid().nullable(),
  externalId: z.string(),
  title: z.string().min(1).max(255),
  plot: z.string().min(1).max(Infinity),
  year: z.number(),
  votes: z.number().nullable(),
  genres: z.array(z.string()),
  rating: z.number().min(0).max(10).nullable(),
  directors: z.array(z.string()),
  writers: z.array(z.string()),
  runtime: z.number().nullable(),
  posterUrl: z.url().nullable(),
});

export const commentSchema = z.object({
  id: z.uuid(),
  movieId: z.uuid(),
  title: z.string().nonempty().max(255),
  content: z.string().nonempty(),
  author: z.string().min(1).max(255),
  createdAt: z.string(),
});

export const commentUpsertSchema = z.object({
  title: z.string().nonempty().max(255),
  content: z.string().nonempty(),
});

export const MOVIE_SORT_PROPERTIES = [
  "title",
  "year",
  "rating",
  "runtime",
  "votes",
] as const;

export const searchMoviesSchema = paginationSchema.extend({
  q: z.string().trim().optional(),
  genre: z.string().trim().optional(),
  sort: z
    .string()
    .regex(
      new RegExp(`^(${MOVIE_SORT_PROPERTIES.join("|")}),(asc|desc)$`),
      `sort must be one of: ${MOVIE_SORT_PROPERTIES.join(", ")} (e.g. year,desc)`,
    )
    .optional()
    .default("title,asc"),
});

export type MovieSortProperty = (typeof MOVIE_SORT_PROPERTIES)[number];

export const externalMovieSchema = z.object({
  external_id: z.string(),
  title: z.string(),
  plot: z.string(),
  year: z.number(),
  poster_url: z.url(),
  rating: z.number(),
  runtime: z.number(),
  votes: z.number(),
  genres: z.array(z.string()),
  directors: z.array(z.string()),
  writers: z.array(z.string()),
});

export type MovieDto = z.infer<typeof movieSchema>;
export type CommentDto = z.infer<typeof commentSchema>;
export type CommentUpsertDto = z.infer<typeof commentUpsertSchema>;
export type ExternalMovieDto = z.infer<typeof externalMovieSchema>;
