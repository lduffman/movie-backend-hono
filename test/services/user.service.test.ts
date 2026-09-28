import { ConflictError } from "#core/errors/http-errors.js";
import { hashPassword } from "#core/utils/auth.utils.js";
import type { Database } from "#database/client.js";
import { createRepositories } from "#repositories/index.js";
import { createUserService } from "#services/user.service.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { aUser } from "../fixtures/test-data.js";

vi.mock("#repositories/index.js", () => ({ createRepositories: vi.fn() }));
vi.mock("#core/utils/auth.utils.js", () => ({ hashPassword: vi.fn() }));

const userRepository = {
  findById: vi.fn(),
  findByUsername: vi.fn(),
  createUser: vi.fn(),
};

// Faux `db` : transaction() exécute simplement le callback avec un faux `tx`
const tx = {};
const db = {
  transaction: vi.fn((callback: (tx: unknown) => unknown) => callback(tx)),
} as unknown as Database;

const request = {
  username: "Jane.Doe@Example.com",
  password: "Secret1!",
  firstName: "Jane",
  lastName: "Doe",
};

describe("user.service — createUser", () => {
  beforeEach(() => {
    vi.mocked(createRepositories).mockReturnValue({ users: userRepository });
  });

  it("saves the user with a hashed password and a lowercased username", async () => {
    // Given
    userRepository.findByUsername.mockResolvedValue(undefined);
    vi.mocked(hashPassword).mockResolvedValue("hashed");
    userRepository.createUser.mockResolvedValue(
      aUser({ username: "jane.doe@example.com", firstName: "Jane" }),
    );

    // When
    const result = await createUserService({ db }).createUser(request);

    // Then — on inspecte ce qui a été passé au repository (≈ ArgumentCaptor)
    expect(userRepository.createUser).toHaveBeenCalledWith({
      username: "jane.doe@example.com",
      password: "hashed", // jamais le mot de passe en clair
      firstName: "Jane",
      lastName: "Doe",
    });
    expect(result).not.toHaveProperty("password");
    // les repositories sont bien créés sur la transaction, pas sur `db`
    expect(createRepositories).toHaveBeenCalledWith(tx);
  });

  it("throws Conflict when the username is already taken", async () => {
    userRepository.findByUsername.mockResolvedValue(aUser());

    await expect(createUserService({ db }).createUser(request)).rejects.toThrow(
      ConflictError,
    );

    expect(hashPassword).not.toHaveBeenCalled();
    expect(userRepository.createUser).not.toHaveBeenCalled();
  });
});
