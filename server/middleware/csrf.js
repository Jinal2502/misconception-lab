import { HttpError } from "../lib/httpErrors.js";

const stateChangingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function enforceTrustedOrigin(request, _response, next) {
  if (!stateChangingMethods.has(request.method)) return next();
  const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  const allowedOrigins = new Set([
    allowedOrigin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);

  if (!request.get("origin") || !allowedOrigins.has(request.get("origin"))) {
    next(new HttpError(403, "Request origin could not be verified."));
    return;
  }

  next();
}
