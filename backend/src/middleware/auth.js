const { verifyToken } = require("../lib/jwt");
const { AppError, asyncHandler } = require("../lib/errors");
const prisma = require("../lib/prisma");

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw new AppError("Invalid or expired token", 401, "UNAUTHORIZED");
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    throw new AppError("User not found or deactivated", 401, "UNAUTHORIZED");
  }
  req.user = user;
  next();
});

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403, "FORBIDDEN"));
    }
    next();
  };
}

module.exports = { authenticate, authorize };
