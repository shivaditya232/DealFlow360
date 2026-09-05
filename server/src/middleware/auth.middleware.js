import { verifyAccessToken } from "../utils/jwt.util.js";

// Verifies the JWT and attaches { sub, companyId, accountType, role } to req.auth
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = header.slice(7);
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Usage: router.get("/x", authenticate, authorize("MANAGER", "FINANCE"), handler)
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: "Not authenticated" });
    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}
