import { InternalServerError } from "#core/errors/http-errors.js";
import { env } from "#env.js";
import {
  externalMovieSchema,
  type ExternalMovieDto,
} from "#schemas/movie.schema.js";

// Miroir de l'interface @HttpExchange ExternalApi côté Spring :
// GET {baseUrl}/movies/search?q=... avec la clé d'API dans le header API_KEY.
export const externalMovieClient = () => {
  const searchMovie = async (query: string): Promise<ExternalMovieDto[]> => {
    const url = new URL("/movies/search", env.EXTERNAL_MOVIE_API_BASE_URL);
    url.searchParams.set("q", query);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        API_KEY: env.EXTERNAL_MOVIE_API_KEY,
      },
    });

    if (!response.ok) {
      throw new InternalServerError(
        `Failed to search external movies: ${response.status} ${response.statusText}`,
      );
    }

    const data: unknown = await response.json();

    // Le format externe n'est pas le nôtre : on valide chaque film et on ignore
    // ceux qui ne respectent pas le schéma attendu.
    const parsed = externalMovieSchema.array().safeParse(data);
    if (parsed.success) {
      return parsed.data;
    }

    return (Array.isArray(data) ? data : []).flatMap((movie) => {
      const result = externalMovieSchema.safeParse(movie);
      if (!result.success) {
        console.warn("Ignoring invalid external movie", result.error.issues);
        return [];
      }
      return [result.data];
    });
  };

  return {
    searchMovie,
  };
};
