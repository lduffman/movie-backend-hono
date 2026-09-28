import { UnauthorizedError } from "#core/errors/http-errors.js";
import { verifyPassword } from "#core/utils/auth.utils.js";
import type { Database } from "#database/client.js";
import { createUserRepository } from "#repositories/user.repository.js";
import { createAuthService } from "#services/auth.service.js";
import { issueToken } from "#services/token.service.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { aUser } from "../fixtures/test-data.js";

// vi.mock remplace le module entier par des fonctions espions (≈ @Mock de Mockito)
vi.mock("#repositories/user.repository.js", () => ({
  createUserRepository: vi.fn(),
}));
vi.mock("#core/utils/auth.utils.js", () => ({ verifyPassword: vi.fn() }));
vi.mock("#services/token.service.js", () => ({ issueToken: vi.fn() }));

const userRepository = {
  findById: vi.fn(),
  findByUsername: vi.fn(),
  createUser: vi.fn(),
};

describe("auth.service — login", () => {
  let authService: ReturnType<typeof createAuthService>;

  beforeEach(() => {
    vi.mocked(createUserRepository).mockReturnValue(userRepository);
    // les repositories sont mockés : la base n'est jamais utilisée
    authService = createAuthService({ db: {} as Database });
  });

  it("returns a Bearer token when the credentials are valid", async () => {
    // Given
    const user = aUser();
    userRepository.findByUsername.mockResolvedValue(user);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(issueToken).mockResolvedValue("jwt-token");

    // When
    const result = await authService.login(user.username, "Secret1!");

    // Then
    expect(result).toEqual({
      accessToken: "jwt-token",
      tokenType: "Bearer",
      expiresIn: 3600,
    });
    expect(verifyPassword).toHaveBeenCalledWith("Secret1!", user.password);
  });

  it("throws Unauthorized when the user does not exist", async () => {
    userRepository.findByUsername.mockResolvedValue(undefined);

    await expect(
      authService.login("unknown@example.com", "Secret1!"),
    ).rejects.toThrow(UnauthorizedError);

    expect(issueToken).not.toHaveBeenCalled();
  });

  it("throws Unauthorized with the same message when the password is wrong", async () => {
    userRepository.findByUsername.mockResolvedValue(aUser());
    vi.mocked(verifyPassword).mockResolvedValue(false);

    // même message que pour un utilisateur inconnu : on ne révèle pas quels comptes existent
    await expect(
      authService.login("john.doe@example.com", "wrong"),
    ).rejects.toThrow("Invalid username or password");

    expect(issueToken).not.toHaveBeenCalled();
  });
});
