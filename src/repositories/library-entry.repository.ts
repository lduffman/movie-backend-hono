import type { DbExecutor } from "#database/client.js";
import {
  libraryEntries,
  movies,
  type LibraryEntry,
  type LibraryEntryWithMovie,
  type NewLibraryEntry,
} from "#database/schema.js";
import type { PaginationParams } from "#schemas/common.schema.js";
import type { LibrarySortProperty } from "#schemas/library.schema.js";
import type { Page } from "#types/common.types.js";
import { and, asc, desc, eq, sql } from "drizzle-orm";

const sortColumns = {
  createdAt: libraryEntries.createdAt,
  rating: libraryEntries.rating,
  watched: libraryEntries.watched,
  "movie.title": movies.title,
  "movie.year": movies.year,
} satisfies Record<LibrarySortProperty, unknown>;

export const createLibraryRepository = ({ db }: { db: DbExecutor }) => {
  const findByUserIdAndMovieId = async (
    userId: string,
    movieId: string,
  ): Promise<LibraryEntryWithMovie | undefined> => {
    return db.query.libraryEntries.findFirst({
      where: {
        userId: userId,
        movieId: movieId,
      },
      with: {
        movie: true,
      },
    });
  };

  const findLibraryEntriesByUserId = async (
    userId: string,
    watched: boolean | undefined,
    pageable: PaginationParams,
    sortBy: LibrarySortProperty = "createdAt",
    direction: "asc" | "desc" = "desc",
  ): Promise<Page<LibraryEntryWithMovie>> => {
    const conditions = [eq(libraryEntries.userId, userId)];

    if (watched !== undefined) {
      conditions.push(eq(libraryEntries.watched, watched));
    }

    const sortColumn = sortColumns[sortBy];
    const orderBy = direction === "desc" ? desc(sortColumn) : asc(sortColumn);

    // select + join (et non db.query...findMany) : on doit pouvoir trier sur une
    // colonne du film (movie.title, movie.year)
    const [rows, count] = await Promise.all([
      db
        .select({ entry: libraryEntries, movie: movies })
        .from(libraryEntries)
        .innerJoin(movies, eq(libraryEntries.movieId, movies.id))
        .where(and(...conditions))
        .orderBy(orderBy, asc(libraryEntries.id)) // id : ordre stable entre deux pages
        .limit(pageable.size)
        .offset(pageable.size * pageable.page),
      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(libraryEntries)
        .where(and(...conditions)),
    ]);

    return {
      items: rows.map(({ entry, movie }) => ({ ...entry, movie })),
      page: pageable.page,
      size: pageable.size,
      total: Number(count[0]?.count ?? 0),
    };
  };

  const createLibraryRepository = async (
    libraryEntry: NewLibraryEntry,
  ): Promise<LibraryEntry> => {
    const [createdLibraryEntry] = await db
      .insert(libraryEntries)
      .values(libraryEntry)
      .returning();
    return createdLibraryEntry;
  };

  const deleteByUserIdAndMovieId = async (
    userId: string,
    movieId: string,
  ): Promise<void> => {
    await db
      .delete(libraryEntries)
      .where(
        and(
          eq(libraryEntries.userId, userId),
          eq(libraryEntries.movieId, movieId),
        ),
      );
  };

  return {
    findByUserIdAndMovieId,
    findLibraryEntriesByUserId,
    createLibraryRepository,
    deleteByUserIdAndMovieId,
  };
};
