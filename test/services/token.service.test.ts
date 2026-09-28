import { issueToken, verifyToken } from "#services/token.service.js";
import { sign } from "hono/jwt";
import { describe, expect, it } from "vitest";
import { aUser } from "../fixtures/test-data.js";

// Pas de mock : sign/verify sont des fonctions pures, on vérifie le vrai token.
describe("token.service", () => {
  it("issues a token that verifyToken accepts, with the user's claims", async () => {
    const user = aUser();

    const claims = await verifyToken(await issueToken(user));

    expect(claims).toMatchObject({
      sub: user.id,
      username: user.username,
      iss: "movie-backend-hono-test",
    });
    expect(claims!.exp - claims!.iat).toBe(3600);
  });

  it("rejects a token signed with another secret", async () => {
    const forged = await sign(
      { sub: "someone", username: "x", iss: "x", iat: 0, exp: 9_999_999_999 },
      "not-the-right-secret",
    );

    expect(await verifyToken(forged)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const now = Math.floor(Date.now() / 1000);
    const expired = await sign(
      {
        sub: "someone",
        username: "x",
        iss: "movie-backend-hono-test",
        iat: now - 7200,
        exp: now - 3600,
      },
      "test-secret-that-is-long-enough-for-hs256",
    );

    expect(await verifyToken(expired)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await verifyToken("not.a.jwt")).toBeNull();
  });
});
