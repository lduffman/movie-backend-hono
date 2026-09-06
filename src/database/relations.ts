import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.js";

export const relations = defineRelations(schema, (r) => ({
  users: {
    comments: r.many.comments(),
    libraryEntries: r.many.libraryEntries(),
    library: r.many.movies({
      from: r.users.id.through(r.libraryEntries.userId),
      to: r.movies.id.through(r.libraryEntries.movieId),
    }),
  },
  movies: {
    comments: r.many.comments(),
    libraryEntries: r.many.libraryEntries(),
  },
  comments: {
    user: r.one.users({
      from: r.comments.userId,
      to: r.users.id,
      optional: false,
    }),
    movie: r.one.movies({
      from: r.comments.movieId,
      to: r.movies.id,
      optional: false,
    }),
  },
  libraryEntries: {
    user: r.one.users({
      from: r.libraryEntries.userId,
      to: r.users.id,
      optional: false,
    }),
    movie: r.one.movies({
      from: r.libraryEntries.movieId,
      to: r.movies.id,
      optional: false,
    }),
  },
}));
