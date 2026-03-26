class InMemoryTokenBlacklist {
  constructor() {
    this.revokedTokens = new Map();
  }

  revoke(token, expSeconds) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const ttlMs = Math.max((expSeconds - nowSeconds) * 1000, 1000);
    const expiresAt = Date.now() + ttlMs;
    this.revokedTokens.set(token, expiresAt);
  }

  isRevoked(token) {
    const expiresAt = this.revokedTokens.get(token);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
      this.revokedTokens.delete(token);
      return false;
    }
    return true;
  }

  revokeAllForUser(userId, beforeEpochSeconds) {
    this.revokedTokens.set(`logoutAll:${userId}`, beforeEpochSeconds);
  }

  isUserLoggedOutAfter(userId, tokenIssuedAtSeconds) {
    const logoutAfter = this.revokedTokens.get(`logoutAll:${userId}`);
    return logoutAfter ? tokenIssuedAtSeconds <= logoutAfter : false;
  }
}

module.exports = new InMemoryTokenBlacklist();
