/**
 * Reusable request-validation middleware factories.
 *
 * These keep validation logic DRY across routes while producing consistent
 * 400 responses that match the project's error envelope.
 */
const mongoose = require("mongoose");

/**
 * Reject the request if any of the listed body fields are missing or empty.
 *
 * Usage:
 *   router.post("/foo", requireFields("bar", "baz"), handler);
 */
const requireFields = (...fields) => (req, res, next) => {
  const missing = fields.filter((f) => {
    const val = req.body[f];
    return val === undefined || val === null || val === "";
  });

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required field(s): ${missing.join(", ")}`,
    });
  }

  return next();
};

/**
 * Reject the request if :id (or a custom param) is not a valid Mongo ObjectId.
 *
 * Usage:
 *   router.patch("/status/:id", validateObjectId(), handler);
 *   router.get("/item/:itemId", validateObjectId("itemId"), handler);
 */
const validateObjectId = (paramName = "id") => (req, res, next) => {
  const value = req.params[paramName];

  if (!mongoose.Types.ObjectId.isValid(value)) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${paramName}: ${value}`,
    });
  }

  return next();
};

module.exports = {
  requireFields,
  validateObjectId,
};
