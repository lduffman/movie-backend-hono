import { createApp } from "#app.js";
import {
  ConflictError,
  UnauthorizedError,
} from "#core/errors/http-errors.js";
import { createServices } from "#services/index.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { USER_ID } from "../fixtures/test-data.js";
import { json, services } from "./helpers.js";

vi.mock("#services/index.js", () => ({ createServices: vi.fn() }));

const app = createApp();

const validRegistration = {
  username: "jane.doe@example.com",
  password: "Secret1!",
  firstName: "Jane",
  lastName: "Doe",
};

describe("auth routes", () => {
  beforeEach(() => {
    vi.mocked(createServices).mockReturnValue(services as never);
  });

  describe("POST /auth/register", () => {
    it("returns 201 without the password", async () => {
      services.users.createUser.mockResolvedValue({
        id: USER_ID,
        username: "jane.doe@example.com",
        firstName: "Jane",
        lastName: "Doe",
      });

      const res = await app.request("/auth/register", json(validRegistration));

      expect(res.status).toBe(201);
      expect(await res.json()).not.toHaveProperty("password");
    });

    it("returns 400 when the email and password are invalid", async () => {
      const res = await app.request(
        "/auth/register",
        json({ ...validRegistration, username: "nope", password: "weak" }),
      );

      expect(res.status).toBe(400);
      const fields = (await res.json()).errors.map(
        (e: { field: string }) => e.field,
      );
      expect(fields).toEqual(expect.arrayContaining(["username", "password"]));
      expect(services.users.createUser).not.toHaveBeenCalled();
    });

    it("returns 409 when the user already exists", async () => {
      services.users.createUser.mockRejectedValue(
        new ConflictError("User already exists"),
      );

      const res = await app.request("/auth/register", json(validRegistration));

      expect(res.status).toBe(409);
    });
  });

  describe("POST /auth/login", () => {
    it("returns 200 with the token", async () => {
      services.auth.login.mockResolvedValue({
        accessToken: "jwt",
        tokenType: "Bearer",
        expiresIn: 3600,
      });

      const res = await app.request(
        "/auth/login",
        json({ username: "jane.doe@example.com", password: "Secret1!" }),
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        accessToken: "jwt",
        tokenType: "Bearer",
        expiresIn: 3600,
      });
    });

    it("returns 401 when the credentials are invalid", async () => {
      services.auth.login.mockRejectedValue(
        new UnauthorizedError("Invalid username or password"),
      );

      const res = await app.request(
        "/auth/login",
        json({ username: "jane.doe@example.com", password: "Wrong123!" }),
      );

      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({
        message: "Invalid username or password",
      });
    });
  });
});
