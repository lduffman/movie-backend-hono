import type {
  CommentWithUser,
  LibraryEntryWithMovie,
  Movie,
  User,
} from "#database/schema.js";

// Jeux de données réutilisables (équivalent de fixtures/TestData.java côté Spring).
// Chaque fabrique accepte des surcharges : on ne précise que ce qui compte pour le test.

export const USER_ID = "00246abd-d425-4cc6-837a-62c16a22b7f7";
export const MOVIE_ID = "7f1c2b0e-3d4a-4b5c-9e8f-1a2b3c4d5e6f";

const CREATED_AT = new Date("2026-01-15T10:00:00Z");

export const aUser = (overrides: Partial<User> = {}): User => ({
  id: USER_ID,
  username: "john.doe@example.com",
  password: "$argon2id$hashed-password",
  firstName: "John",
  lastName: "Doe",
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  ...overrides,
});

export const aMovie = (overrides: Partial<Movie> = {}): Movie => ({
  id: MOVIE_ID,
  externalId: "tt0133093",
  title: "The Matrix",
  year: 1999,
  genres: ["Action", "Sci-Fi"],
  plot: "A hacker discovers the true nature of reality.",
  rating: 8.7,
  votes: 2_000_000,
  runtime: 136,
  directors: ["Lana Wachowski", "Lilly Wachowski"],
  writers: ["Lana Wachowski", "Lilly Wachowski"],
  posterUrl: "https://example.com/matrix.jpg",
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  ...overrides,
});

export const aComment = (
  overrides: Partial<CommentWithUser> = {},
): CommentWithUser => ({
  id: "c0000000-0000-4000-8000-000000000001",
  movieId: MOVIE_ID,
  userId: USER_ID,
  title: "Masterpiece",
  content: "Still holds up today.",
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  user: aUser(),
  ...overrides,
});

export const aLibraryEntry = (
  overrides: Partial<LibraryEntryWithMovie> = {},
): LibraryEntryWithMovie => ({
  id: "e0000000-0000-4000-8000-000000000001",
  userId: USER_ID,
  movieId: MOVIE_ID,
  watched: true,
  rating: 9,
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  movie: aMovie(),
  ...overrides,
});
