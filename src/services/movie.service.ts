import { externalMovieClient } from "#clients/externalMovie.client.js";
import type { CurrentUser } from "#core/context/current-user.js";
import { NotFoundError } from "#core/errors/http-errors.js";
import { createMemoryCache } from "#core/utils/memory-cache.js";
import type { Database } from "#database/client.js";
import { createCommentRepository } from "#repositories/comment.repository.js";
import { createMovieRepository } from "#repositories/movie.repository.js";
import { createUserRepository } from "#repositories/user.repository.js";
import type {
  PaginationParams,
  PaginationWithSortParams,
} from "#schemas/common.schema.js";
import type {
  CommentDto,
  CommentUpsertDto,
  MovieDto,
  MovieSortProperty,
} from "#schemas/movie.schema.js";
import type { Page } from "#types/common.types.js";
import { mapToCommentDto } from "#types/converters/comment.converter.js";
import {
  mapExternalToMovieDto,
  mapToMovieDto,
} from "#types/converters/movie.converter.js";

// Au niveau du module (et pas dans la factory) : les services sont recréés à
// chaque requête, le cache doit survivre entre les requêtes.
const genresCache = createMemoryCache<string[]>({ ttlMs: 10 * 60 * 1000 });

export const createMovieService = ({
  db,
  currentUser,
}: {
  db: Database;
  currentUser: CurrentUser;
}) => {
  const movieRepository = createMovieRepository(db);
  const commentRepository = createCommentRepository(db);
  const userRepository = createUserRepository(db);

  const getMovieById = async (id: string): Promise<MovieDto> => {
    const movie = await movieRepository.findById(id);

    if (!movie) {
      throw new NotFoundError("Movie not found");
    }

    return mapToMovieDto(movie);
  };

  const searchMovies = async (
    pageable: PaginationWithSortParams,
    query?: string,
    genre?: string,
  ): Promise<Page<MovieDto>> => {
    // le format "propriété,direction" est garanti par searchMoviesSchema
    const [sortBy, direction] = pageable.sort.split(",") as [
      MovieSortProperty,
      "asc" | "desc",
    ];

    const searchResult = await movieRepository.searchMovies(
      query ?? "",
      genre ?? "",
      pageable,
      sortBy,
      direction,
    );

    return {
      items: searchResult.items.map(mapToMovieDto),
      page: searchResult.page,
      size: searchResult.size,
      total: searchResult.total,
    };
  };

  const retrieveMovieComments = async (
    movieId: string,
    pageable: PaginationParams,
  ): Promise<Page<CommentDto>> => {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {
      throw new NotFoundError("Movie not found");
    }

    const comments = await commentRepository.findAllByMovieId(
      movieId,
      pageable,
    );

    return {
      items: comments.items.map((c) => mapToCommentDto(c)),
      page: comments.page,
      size: comments.size,
      total: comments.total,
    };
  };
  const addMovieComment = async (
    movieId: string,
    dto: CommentUpsertDto,
  ): Promise<CommentDto> => {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {
      throw new NotFoundError("Movie not found");
    }

    const user = await userRepository.findById(currentUser.id());
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const created = await commentRepository.createComment({
      movieId: movie.id,
      userId: user.id,
      title: dto.title,
      content: dto.content,
    });

    return mapToCommentDto({ ...created, user });
  };

  const searchMovieByExternalClient = async (query: string) => {
    const client = externalMovieClient();
    const result = await client.searchMovie(query);
    return result.map((m) => mapExternalToMovieDto(m));
  };

  const getGenres = (): Promise<string[]> =>
    genresCache.get("all", () =>
      movieRepository.findAllDistinctMovieGenres(),
    );

  return {
    getMovieById,
    searchMovies,
    retrieveMovieComments,
    addMovieComment,
    searchMovieByExternalClient,
    getGenres,
  };
};
