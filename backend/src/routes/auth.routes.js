const router = require("express").Router();
const bcrypt = require("bcrypt");
const { z } = require("zod");
const { validate } = require("../lib/validate");
const { signToken } = require("../lib/jwt");
const { AppError, asyncHandler } = require("../lib/errors");
const { authenticate } = require("../middleware/auth");
const prisma = require("../lib/prisma");

const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
  }),
});

// POST /api/auth/login
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) {
      throw new AppError(
        "Invalid username or password",
        401,
        "INVALID_CREDENTIALS",
      );
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError(
        "Invalid username or password",
        401,
        "INVALID_CREDENTIALS",
      );
    }
    const token = signToken({
      sub: user.id,
      role: user.role,
      username: user.username,
    });
    const { password: _pw, ...safeUser } = user;
    res.json({ success: true, data: { token, user: safeUser } });
  }),
);

// GET /api/auth/me
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const { password: _pw, ...safeUser } = req.user;
    res.json({ success: true, data: safeUser });
  }),
);

// POST /api/auth/change-password
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new AppError(
        "Current password is incorrect",
        401,
        "INVALID_CREDENTIALS",
      );
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    res.json({
      success: true,
      data: { message: "Password updated successfully" },
    });
  }),
);

module.exports = router;
