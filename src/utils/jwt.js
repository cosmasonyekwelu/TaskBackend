const jwt = require("jsonwebtoken");
const config = require("../config/env");

class JWTUtils {
  static generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });
  }

  static verifyToken(token) {
    return jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });
  }

  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTUtils;
