const jwt = require("jsonwebtoken");

class JWTUtils {
  static generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "24h",
    });
  }

  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  }
}

module.exports = JWTUtils;
