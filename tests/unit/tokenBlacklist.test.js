const tokenBlacklist = require("../../src/services/tokenBlacklist");

describe("tokenBlacklist service", () => {
  beforeEach(() => {
    tokenBlacklist.revokedTokens.clear();
  });

  test("revokes a token and returns revoked status", () => {
    const token = "abc";
    const exp = Math.floor(Date.now() / 1000) + 60;

    tokenBlacklist.revoke(token, exp);
    expect(tokenBlacklist.isRevoked(token)).toBe(true);
  });

  test("supports logout-all user marker", () => {
    const userId = "user-1";
    tokenBlacklist.revokeAllForUser(userId, 100);

    expect(tokenBlacklist.isUserLoggedOutAfter(userId, 99)).toBe(true);
    expect(tokenBlacklist.isUserLoggedOutAfter(userId, 101)).toBe(false);
  });
});
