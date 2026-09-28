import { createCurrentUser } from "#core/context/current-user.js";
import { UnauthorizedError } from "#core/errors/http-errors.js";
import { describe, expect, it } from "vitest";

describe("createCurrentUser", () => {
  it("exposes the id and username of the authenticated user", () => {
    const currentUser = createCurrentUser({
      id: "00246abd-d425-4cc6-837a-62c16a22b7f7",
      username: "john.doe@example.com",
    });

    expect(currentUser.isAuthenticated()).toBe(true);
    expect(currentUser.id()).toBe("00246abd-d425-4cc6-837a-62c16a22b7f7");
    expect(currentUser.username()).toBe("john.doe@example.com");
  });

  it("throws Unauthorized when nobody is authenticated", () => {
    const currentUser = createCurrentUser(undefined);

    expect(currentUser.isAuthenticated()).toBe(false);
    expect(() => currentUser.id()).toThrow(UnauthorizedError);
    expect(() => currentUser.username()).toThrow("No authenticated user");
  });
});
