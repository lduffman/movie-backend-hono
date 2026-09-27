import type { Movie } from "#database/schema.js";
import type { ExternalMovieDto, MovieDto } from "#schemas/movie.schema.js";

export const mapToMovieDto = (movie: Movie): MovieDto => {
  return {
    id: movie.id,
    externalId: movie.externalId,
    title: movie.title,
    plot: movie.plot,
    year: movie.year,
    votes: movie.votes,
    runtime: movie.runtime,
    genres: movie.genres,
    directors: movie.directors,
    writers: movie.writers,
    rating: movie.rating,
    posterUrl: movie.posterUrl,
  };
};

export const mapExternalToMovieDto = (movie: ExternalMovieDto): MovieDto => {
  return {
    id: null, // pas encore en base
    externalId: movie.external_id,
    title: movie.title,
    plot: movie.plot,
    year: movie.year,
    votes: movie.votes,
    runtime: movie.runtime,
    genres: movie.genres,
    directors: movie.directors,
    writers: movie.writers,
    rating: movie.rating,
    posterUrl: movie.poster_url,
  };
};
