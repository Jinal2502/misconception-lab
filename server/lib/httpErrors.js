export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function asyncHandler(handler) {
  return (request, response, next) =>
    Promise.resolve(handler(request, response, next)).catch(next);
}

export function errorHandler(error, _request, response, _next) {
  if (response.headersSent) return;
  if (error.type === "entity.too.large") {
    response.status(413).json({ error: "Request body is too large." });
    return;
  }

  if (error.name === "ValidationError") {
    response.status(400).json({ error: error.message });
    return;
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error(`API error: ${error.message}`);
  response.status(status).json({
    error: status >= 500 ? "An unexpected server error occurred." : error.message,
    ...(error.details ? { details: error.details } : {}),
  });
}
