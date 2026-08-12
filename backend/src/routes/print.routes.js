const router = require("express").Router();
const { z } = require("zod");
const { validate } = require("../lib/validate");
const { AppError, asyncHandler } = require("../lib/errors");
const { authenticate } = require("../middleware/auth");
const prisma = require("../lib/prisma");

const idParams = z.object({
  params: z.object({ id: z.string().min(1) }),
});

const logPrintSchema = z.object({
  body: z.object({
    labelId: z.string().optional().nullable(),
    labelName: z.string().min(1, "Label name is required"),
    copies: z.number().int().min(1).max(999).default(1),
    printerType: z.enum(["thermal", "laser", "inkjet"]).default("thermal"),
    status: z.enum(["completed", "failed"]).default("completed"),
    format: z.string().default("pdf"),
    count: z.number().int().min(1).default(1),
    details: z.string().optional().nullable(),
  }),
});

// GET /api/prints
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { labelId, status, from, to, limit = 100, offset = 0 } = req.query;
    const where = {};
    if (labelId) where.labelId = String(labelId);
    if (status) where.status = String(status);
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    const limitNum = Math.min(parseInt(limit, 10) || 100, 500);
    const offsetNum = parseInt(offset, 10) || 0;
    const [prints, total] = await Promise.all([
      prisma.printHistory.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limitNum,
        skip: offsetNum,
        include: {
          createdBy: { select: { id: true, fullName: true, username: true } },
        },
      }),
      prisma.printHistory.count({ where }),
    ]);
    res.json({
      success: true,
      data: prints,
      meta: { total, limit: limitNum, offset: offsetNum },
    });
  }),
);

// GET /api/prints/stats
router.get(
  "/stats",
  authenticate,
  asyncHandler(async (req, res) => {
    const [totalPrints, todayPrints, totalLabels] = await Promise.all([
      prisma.printHistory.count(),
      prisma.printHistory.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.label.count(),
    ]);
    const byPrinter = await prisma.printHistory.groupBy({
      by: ["printerType"],
      _count: { _all: true },
    });
    const recent = await prisma.printHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });
    res.json({
      success: true,
      data: { totalPrints, todayPrints, totalLabels, byPrinter, recent },
    });
  }),
);

// POST /api/prints/log
router.post(
  "/log",
  authenticate,
  validate(logPrintSchema),
  asyncHandler(async (req, res) => {
    const {
      labelId,
      labelName,
      copies,
      printerType,
      status,
      format,
      count,
      details,
    } = req.body;
    const record = await prisma.printHistory.create({
      data: {
        labelId: labelId || null,
        labelName,
        copies,
        printerType,
        status,
        format,
        count,
        details: details ? JSON.stringify(details) : null,
        createdById: req.user.id,
      },
    });
    res.status(201).json({ success: true, data: record });
  }),
);

// GET /api/prints/:id
router.get(
  "/:id",
  authenticate,
  validate(idParams),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const record = await prisma.printHistory.findUnique({ where: { id } });
    if (!record) {
      throw new AppError("Print record not found", 404, "NOT_FOUND");
    }
    res.json({ success: true, data: record });
  }),
);

// DELETE /api/prints/:id
router.delete(
  "/:id",
  authenticate,
  validate(idParams),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.printHistory.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Print record not found", 404, "NOT_FOUND");
    }
    await prisma.printHistory.delete({ where: { id } });
    res.json({ success: true, data: { message: "Print record deleted" } });
  }),
);

module.exports = router;
