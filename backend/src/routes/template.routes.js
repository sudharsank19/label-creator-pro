const router = require("express").Router();
const { z } = require("zod");
const { validate } = require("../lib/validate");
const { AppError, asyncHandler } = require("../lib/errors");
const { authenticate } = require("../middleware/auth");
const prisma = require("../lib/prisma");

const idParams = z.object({
  params: z.object({ id: z.string().min(1) }),
});

const templateSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Template name is required"),
    description: z.string().optional().or(z.literal("")),
    width: z.number().min(20).max(200).default(50),
    height: z.number().min(10).max(150).default(25),
    background: z.string().default("#ffffff"),
    elements: z.any().default([]),
    data: z.any().default({}),
    settings: z.any().default({}),
    isDefault: z.boolean().optional().default(false),
  }),
});

// GET /api/templates
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const templates = await prisma.template.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });
    res.json({ success: true, data: templates });
  }),
);

// GET /api/templates/default
router.get(
  "/default",
  authenticate,
  asyncHandler(async (req, res) => {
    const template = await prisma.template.findFirst({
      where: { isDefault: true },
    });
    res.json({ success: true, data: template });
  }),
);

// GET /api/templates/:id
router.get(
  "/:id",
  authenticate,
  validate(idParams),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) {
      throw new AppError("Template not found", 404, "NOT_FOUND");
    }
    res.json({ success: true, data: template });
  }),
);

// POST /api/templates
router.post(
  "/",
  authenticate,
  validate(templateSchema),
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      width,
      height,
      background,
      elements,
      data,
      settings,
      isDefault,
    } = req.body;
    if (isDefault) {
      await prisma.template.updateMany({ data: { isDefault: false } });
    }
    const template = await prisma.template.create({
      data: {
        name,
        description,
        width,
        height,
        background,
        elements: JSON.stringify(elements || []),
        data: JSON.stringify(data || {}),
        settings: JSON.stringify(settings || {}),
        isDefault: isDefault || false,
        createdById: req.user.id,
      },
    });
    res.status(201).json({ success: true, data: template });
  }),
);

// POST /api/templates/:id/duplicate
router.post(
  "/:id/duplicate",
  authenticate,
  validate(idParams),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const source = await prisma.template.findUnique({ where: { id } });
    if (!source) {
      throw new AppError("Template not found", 404, "NOT_FOUND");
    }
    const copy = await prisma.template.create({
      data: {
        name: `${source.name} (Copy)`,
        description: source.description,
        width: source.width,
        height: source.height,
        background: source.background,
        elements: source.elements,
        data: source.data,
        settings: source.settings,
        isDefault: false,
        createdById: req.user.id,
      },
    });
    res.status(201).json({ success: true, data: copy });
  }),
);

// PUT /api/templates/:id
router.put(
  "/:id",
  authenticate,
  validate(idParams),
  validate(templateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Template not found", 404, "NOT_FOUND");
    }
    const {
      name,
      description,
      width,
      height,
      background,
      elements,
      data,
      settings,
      isDefault,
    } = req.body;
    if (isDefault) {
      await prisma.template.updateMany({ data: { isDefault: false } });
    }
    const template = await prisma.template.update({
      where: { id },
      data: {
        name,
        description,
        width,
        height,
        background,
        elements: JSON.stringify(elements || []),
        data: JSON.stringify(data || {}),
        settings: JSON.stringify(settings || {}),
        isDefault: isDefault || false,
      },
    });
    res.json({ success: true, data: template });
  }),
);

// DELETE /api/templates/:id
router.delete(
  "/:id",
  authenticate,
  validate(idParams),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Template not found", 404, "NOT_FOUND");
    }
    await prisma.template.delete({ where: { id } });
    res.json({ success: true, data: { message: "Template deleted" } });
  }),
);

module.exports = router;
