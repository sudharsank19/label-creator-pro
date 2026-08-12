const { Prisma } = require("@prisma/client");
const multer = require("multer");

// Central error handler — every route error funnels through here
function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  void next;

  let statusCode = err.statusCode || 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message || "Something went wrong";
  let details = err.details || null;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    code = "DATABASE_ERROR";
    if (err.code === "P2002") {
      message = "A record with this unique value already exists";
      code = "UNIQUE_CONSTRAINT";
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
      code = "NOT_FOUND";
    } else {
      message = `Database error: ${err.message}`;
    }
  }

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    code = "UPLOAD_ERROR";
    message = `Upload error: ${err.message}`;
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    code = "UNAUTHORIZED";
    message = "Invalid or expired token";
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 422;
    code = "VALIDATION_ERROR";
    message = "Invalid data provided to database";
  }

  if (statusCode >= 500) {
    console.error("❌ Server error:", err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}

module.exports = errorHandler;
