import type { LibraryEntryWithMovie } from "#database/schema.js";
import type { LibraryEntryDto } from "#schemas/library.schema.js";
import { mapToMovieDto } from "./movie.converter.js";

export const mapToLibraryEntryDto = (
  entry: LibraryEntryWithMovie,
): LibraryEntryDto => {
  return {
    id: entry.id,
    movie: mapToMovieDto(entry.movie),
    watched: entry.watched,
    rating: entry.rating,
    createdAt: entry.createdAt.toISOString(),
  };
};
