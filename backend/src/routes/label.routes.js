const router = require("express").Router();
const { z } = require("zod");
const { validate } = require("../lib/validate");
const { AppError, asyncHandler } = require("../lib/errors");
const { authenticate } = require("../middleware/auth");
const prisma = require("../lib/prisma");

const idParams = z.object({
  params: z.object({ id: z.string().min(1) }),
});

const labelSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Label name is required"),
    width: z.number().min(20).max(200).default(50),
    height: z.number().min(10).max(150).default(25),
    background: z.string().default("#ffffff"),
    elements: z.any().default([]),
    data: z.any().default({}),
    settings: z.any().default({}),
  }),
});

// GET /api/labels
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const labels = await prisma.label.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });
    res.json({ success: true, data: labels });
  }),
);

// GET /api/labels/recent
router.get(
  "/recent",
  authenticate,
  asyncHandler(async (req, res) => {
    const recent = await prisma.recentLabel.findMany({
      where: { userId: req.user.id },
      orderBy: { openedAt: "desc" },
      take: 10,
      include: { label: true },
    });
    res.json({ success: true, data: recent.map((r) => r.label) });
  }),
);

// GET /api/labels/:id
router.get(
  "/:id",
  authenticate,
  validate(idParams),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const label = await prisma.label.findUnique({ where: { id } });
    if (!label) {
      throw new AppError("Label not found", 404, "NOT_FOUND");
    }
    // Record recent access
    await prisma.recentLabel.upsert({
      where: { userId_labelId: { userId: req.user.id, labelId: id } },
      update: { openedAt: new Date() },
      create: { userId: req.user.id, labelId: id },
    });
    res.json({ success: true, data: label });
  }),
);

// POST /api/labels
router.post(
  "/",
  authenticate,
  validate(labelSchema),
  asyncHandler(async (req, res) => {
    const { name, width, height, background, elements, data, settings } =
      req.body;
    const label = await prisma.label.create({
      data: {
        name,
        width,
        height,
        background,
        elements: JSON.stringify(elements || []),
        data: JSON.stringify(data || {}),
        settings: JSON.stringify(settings || {}),
        createdById: req.user.id,
      },
    });
    res.status(201).json({ success: true, data: label });
  }),
);

// POST /api/labels/batch
router.post(
  "/batch",
  authenticate,
  asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (items.length === 0) {
      throw new AppError("No labels provided", 422, "VALIDATION_ERROR");
    }
    const created = [];
    for (const item of items) {
      const name = (item.name || "").toString().slice(0, 200);
      const width = Number(item.width) || 50;
      const height = Number(item.height) || 25;
      const label = await prisma.label.create({
        data: {
          name,
          width: Math.min(200, Math.max(20, width)),
          height: Math.min(150, Math.max(10, height)),
          background: item.background || "#ffffff",
          elements: JSON.stringify(item.elements || []),
          data: JSON.stringify(item.data || {}),
          createdById: req.user.id,
        },
      });
      created.push(label);
    }
    res.status(201).json({ success: true, data: created });
  }),
);

// PUT /api/labels/:id
router.put(
  "/:id",
  authenticate,
  validate(idParams),
  validate(labelSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.label.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Label not found", 404, "NOT_FOUND");
    }
    const { name, width, height, background, elements, data, settings } =
      req.body;
    const label = await prisma.label.update({
      where: { id },
      data: {
        name,
        width,
        height,
        background,
        elements: JSON.stringify(elements || []),
        data: JSON.stringify(data || {}),
        settings: JSON.stringify(settings || {}),
      },
    });
    res.json({ success: true, data: label });
  }),
);

// DELETE /api/labels/:id
router.delete(
  "/:id",
  authenticate,
  validate(idParams),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.label.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Label not found", 404, "NOT_FOUND");
    }
    await prisma.label.delete({ where: { id } });
    res.json({ success: true, data: { message: "Label deleted" } });
  }),
);

module.exports = router;
