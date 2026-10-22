import User from "../models/User.js";
import { HttpError, asyncHandler } from "../lib/httpErrors.js";

export const requireAuth = asyncHandler(async (request, _response, next) => {
  const userId = request.session?.userId;
  if (!userId) throw new HttpError(401, "Please sign in to continue.");

  const user = await User.findById(userId).select("name email role");
  if (!user) {
    request.session.destroy(() => {});
    throw new HttpError(401, "Please sign in to continue.");
  }

  request.user = user;
  next();
});

export function requireRole(role) {
  return (request, _response, next) => {
    if (request.user?.role !== role) {
      next(new HttpError(403, "You do not have permission to access this resource."));
      return;
    }
    next();
  };
}
