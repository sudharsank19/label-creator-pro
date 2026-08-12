const router = require("express").Router();
const { z } = require("zod");
const { validate } = require("../lib/validate");
const { AppError, asyncHandler } = require("../lib/errors");
const { authenticate } = require("../middleware/auth");
const prisma = require("../lib/prisma");

const idParams = z.object({
  params: z.object({ id: z.string().min(1) }),
});

const categorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Category name is required"),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color")
      .default("#0a84ff"),
  }),
});

// GET /api/categories
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: categories });
  }),
);

// POST /api/categories
router.post(
  "/",
  authenticate,
  validate(categorySchema),
  asyncHandler(async (req, res) => {
    const { name, color } = req.body;
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      throw new AppError("Category already exists", 409, "DUPLICATE");
    }
    const category = await prisma.category.create({ data: { name, color } });
    res.status(201).json({ success: true, data: category });
  }),
);

// PUT /api/categories/:id
router.put(
  "/:id",
  authenticate,
  validate(idParams),
  validate(categorySchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, color } = req.body;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Category not found", 404, "NOT_FOUND");
    }
    const dup = await prisma.category.findFirst({
      where: { name, NOT: { id } },
    });
    if (dup) {
      throw new AppError("Category name already exists", 409, "DUPLICATE");
    }
    const category = await prisma.category.update({
      where: { id },
      data: { name, color },
    });
    res.json({ success: true, data: category });
  }),
);

// DELETE /api/categories/:id
router.delete(
  "/:id",
  authenticate,
  validate(idParams),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Category not found", 404, "NOT_FOUND");
    }
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, data: { message: "Category deleted" } });
  }),
);

module.exports = router;
