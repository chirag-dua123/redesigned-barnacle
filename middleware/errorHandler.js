/**
 * Centralized error-handling middleware.
 *
 * Normalizes Mongoose and application errors into a consistent JSON envelope:
 *   { success: false, message: "...", errors: [...] }
 *
 * This replaces the inline error handler that was previously defined in index.js.
 */

const errorHandler = (err, req, res, _next) => {
  // ── Mongoose validation error (e.g. missing required fields, enum mismatch) ──
  if (err.name === "ValidationError") {
    const fieldErrors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: fieldErrors,
    });
  }

  // ── Mongoose CastError (e.g. invalid ObjectId in a URL param) ──
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid value for ${err.path}: ${err.value}`,
    });
  }

  // ── MongoDB duplicate-key error (code 11000) ──
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${duplicateField}`,
    });
  }

  // ── Application errors with an explicit status code ──
  if (err.status && err.status >= 400 && err.status < 600) {
    return res.status(err.status).json({
      success: false,
      message: err.message || "Something went wrong",
    });
  }

  // ── Fallback: unexpected / unhandled errors ──
  const statusCode = err.status || 500;
  const isDev = process.env.NODE_ENV !== "production";

  console.error("[ErrorHandler]", err);

  return res.status(statusCode).json({
    success: false,
    message: isDev ? err.message : "Internal Server Error",
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
