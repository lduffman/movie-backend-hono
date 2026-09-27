import type { DbExecutor } from "#database/client.js";
import { movies, type Movie } from "#database/schema.js";
import type { PaginationParams } from "#schemas/common.schema.js";
import type { MovieSortProperty } from "#schemas/movie.schema.js";
import type { Page } from "#types/common.types.js";
import { and, asc, desc, ilike, sql } from "drizzle-orm";

export const createMovieRepository = (db: DbExecutor) => {
  const findById = async (id: string): Promise<Movie | undefined> => {
    const movie = await db.query.movies.findFirst({
      where: {
        id,
      },
    });

    return movie;
  };

  const findAllDistinctMovieGenres = async (): Promise<string[]> => {
    const res = await db
      .selectDistinct({
        genres: sql<string>`unnest(${movies.genres})`,
      })
      .from(movies);

    return res.map((r) => r.genres);
  };

  const searchMovies = async (
    title: string,
    genre: string,
    pageable: PaginationParams,
    sortBy: MovieSortProperty = "title",
    direction: "asc" | "desc" = "asc",
  ): Promise<Page<Movie>> => {
    const conditions = [];

    if (title) {
      conditions.push(ilike(movies.title, `%${title}%`));
    }

    if (genre) {
      conditions.push(sql`
        EXISTS (
          SELECT 1
          FROM unnest(${movies.genres}) AS g
          WHERE LOWER(g) = LOWER(${genre})
        )
      `);
    }

    const sortColumn = {
      title: movies.title,
      year: movies.year,
      rating: movies.rating,
      runtime: movies.runtime,
      votes: movies.votes,
    }[sortBy];

    const orderBy = direction === "desc" ? desc(sortColumn) : asc(sortColumn);

    const [items, count] = await Promise.all([
      db
        .select()
        .from(movies)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(pageable.size)
        .offset(pageable.page * pageable.size),

      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(movies)
        .where(and(...conditions)),
    ]);

    return {
      items,
      page: pageable.page,
      size: pageable.size,
      total: Number(count[0]?.count ?? 0),
    };
  };

  return {
    findById,
    findAllDistinctMovieGenres,
    searchMovies,
  };
};
