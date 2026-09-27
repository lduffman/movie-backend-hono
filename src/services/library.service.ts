import type { CurrentUser } from "#core/context/current-user.js";
import { NotFoundError } from "#core/errors/http-errors.js";
import type { Database } from "#database/client.js";
import { libraryEntries, type NewLibraryEntry } from "#database/schema.js";
import { createLibraryRepository } from "#repositories/library-entry.repository.js";
import { createMovieRepository } from "#repositories/movie.repository.js";
import type { PaginationParams } from "#schemas/common.schema.js";
import type {
  LibraryEntryDto,
  LibrarySortProperty,
  UpsertLibraryEntryDto,
} from "#schemas/library.schema.js";
import type { Page } from "#types/common.types.js";
import { mapToLibraryEntryDto } from "#types/converters/library.converter.js";
import { eq } from "drizzle-orm";

export const createLibraryService = ({
  db,
  currentUser,
}: {
  db: Database;
  currentUser: CurrentUser;
}) => {
  const libraryRepository = createLibraryRepository({ db });
  const movieRepository = createMovieRepository(db);

  const getMyLibrary = async (
    pageable: PaginationParams & { sort: string },
    watched?: boolean,
  ): Promise<Page<LibraryEntryDto>> => {
    // le format "propriété,direction" est garanti par searchLibrarySchema
    const [sortBy, direction] = pageable.sort.split(",") as [
      LibrarySortProperty,
      "asc" | "desc",
    ];

    const entries = await libraryRepository.findLibraryEntriesByUserId(
      currentUser.id(),
      watched,
      pageable,
      sortBy,
      direction,
    );

    const convertedEntries: LibraryEntryDto[] = entries.items.map((entry) =>
      mapToLibraryEntryDto(entry),
    );

    return {
      items: convertedEntries,
      page: entries.page,
      size: entries.size,
      total: entries.total,
    };
  };

  const getMyLibraryEntry = async (
    movieId: string,
  ): Promise<LibraryEntryDto> => {
    const entry = await libraryRepository.findByUserIdAndMovieId(
      currentUser.id(),
      movieId,
    );

    if (!entry) {
      throw new NotFoundError(`Library entry for movie ${movieId} not found`);
    }

    return mapToLibraryEntryDto(entry);
  };

  const upsertLibraryEntry = async (
    movieId: string,
    watched: boolean,
    rating?: number,
  ): Promise<LibraryEntryDto> => {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {
      throw new NotFoundError("Movie not found");
    }

    const entryToUpsert: NewLibraryEntry = {
      userId: currentUser.id(),
      movieId,
      watched,
      rating,
    };

    const upsertedEntry = await db.transaction(async (tx) => {
      const [entry] = await tx
        .insert(libraryEntries)
        .values(entryToUpsert)
        .onConflictDoUpdate({
          target: [libraryEntries.userId, libraryEntries.movieId],
          set: {
            watched: watched,
            rating: rating,
          },
        })
        .returning();

      const result = await tx.query.libraryEntries.findFirst({
        where: {
          id: entry.id,
        },
        with: {
          movie: true,
        },
      });

      if (!result) {
        throw new NotFoundError("Library entry not found after upsert");
      }

      return result;
    });

    return mapToLibraryEntryDto(upsertedEntry);
  };

  const removeMovieFromMyLibrary = async (movieId: string): Promise<void> => {
    const entry = await libraryRepository.findByUserIdAndMovieId(
      currentUser.id(),
      movieId,
    );
    if (!entry) {
      throw new NotFoundError(`Library entry for movie ${movieId} not found`);
    }

    return db.transaction(async (tx) => {
      // repository lié à la transaction : il doit utiliser `tx`, pas `db`
      await createLibraryRepository({
        db: tx,
      }).deleteByUserIdAndMovieId(currentUser.id(), movieId);
    });
  };

  return {
    getMyLibraryEntry,
    getMyLibrary,
    upsertLibraryEntry,
    removeMovieFromMyLibrary,
  };
};
