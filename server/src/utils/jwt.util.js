import jwt from "jsonwebtoken";
import config from "../config/index.js";

// payload shape: { sub, companyId, accountType: "INTERNAL"|"CUSTOMER", role: UserRole|null }
export function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret);
}
