const router = require("express").Router();
const bcrypt = require("bcrypt");
const { z } = require("zod");
const { validate } = require("../lib/validate");
const { AppError, asyncHandler } = require("../lib/errors");
const { authenticate, authorize } = require("../middleware/auth");
const prisma = require("../lib/prisma");

const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    fullName: z.string().min(1, "Full name is required"),
    role: z.enum(["admin", "staff"]).default("staff"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    isActive: z.boolean().optional().default(true),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, "Full name is required").optional(),
    role: z.enum(["admin", "staff"]).optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    isActive: z.boolean().optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
  }),
});

const paramsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

// GET /api/users — list all users (admin only)
router.get(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ success: true, data: users });
  }),
);

// POST /api/users — create user (admin only)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const { username, password, fullName, role, email, phone, isActive } =
      req.body;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new AppError("Username already exists", 409, "DUPLICATE");
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        fullName,
        role,
        email,
        phone,
        isActive,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.status(201).json({ success: true, data: user });
  }),
);

// PUT /api/users/:id — update user (admin only)
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(updateUserSchema),
  validate(paramsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { fullName, role, email, phone, isActive, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }
    const data = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (role !== undefined) data.role = role;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (isActive !== undefined) data.isActive = isActive;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        email: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });
    res.json({ success: true, data: user });
  }),
);

// DELETE /api/users/:id — delete user (admin only)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(paramsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id === req.user.id) {
      throw new AppError(
        "You cannot delete your own account",
        400,
        "BAD_REQUEST",
      );
    }
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, data: { message: "User deleted" } });
  }),
);

module.exports = router;
