import { issueToken } from "#services/token.service.js";
import { vi } from "vitest";
import { aUser } from "../fixtures/test-data.js";

// Services factices renvoyés par le createServices mocké : chaque test choisit
// leur réponse (≈ @MockitoBean dans un @WebMvcTest).
export const services = {
  auth: { login: vi.fn() },
  users: { createUser: vi.fn() },
  movies: {
    getMovieById: vi.fn(),
    searchMovies: vi.fn(),
    retrieveMovieComments: vi.fn(),
    addMovieComment: vi.fn(),
    searchMovieByExternalClient: vi.fn(),
    getGenres: vi.fn(),
  },
  library: {
    getMyLibrary: vi.fn(),
    getMyLibraryEntry: vi.fn(),
    upsertLibraryEntry: vi.fn(),
    removeMovieFromMyLibrary: vi.fn(),
  },
};

// Un vrai JWT, signé avec le secret de test : le middleware `authenticate` le vérifie pour de bon.
export const bearer = async () => ({
  Authorization: `Bearer ${await issueToken(aUser())}`,
});

export const json = (body: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
