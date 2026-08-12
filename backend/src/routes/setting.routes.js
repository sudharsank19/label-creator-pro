const router = require("express").Router();
const { z } = require("zod");
const { validate } = require("../lib/validate");
const { AppError, asyncHandler } = require("../lib/errors");
const { authenticate } = require("../middleware/auth");
const prisma = require("../lib/prisma");

const settingsSchema = z.object({
  body: z.record(z.string(), z.any()),
});

// GET /api/settings/export
router.get(
  "/export",
  authenticate,
  asyncHandler(async (req, res) => {
    const [labels, templates, prints, settings, categories, users] =
      await Promise.all([
        prisma.label.findMany(),
        prisma.template.findMany(),
        prisma.printHistory.findMany(),
        prisma.setting.findMany(),
        prisma.category.findMany(),
        prisma.user.findMany(),
      ]);

    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        app: "Label Creator Pro",
        labels,
        templates,
        printHistory: prints,
        settings,
        categories,
        users: safeUsers,
      },
    });
  }),
);

// GET /api/settings
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const settings = await prisma.setting.findMany();
    const map = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    res.json({ success: true, data: map });
  }),
);

// PUT /api/settings
router.put(
  "/",
  authenticate,
  authorizeOnlyAdmin(),
  validate(settingsSchema),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const keys = Object.keys(body);
    if (keys.length === 0) {
      throw new AppError("No settings provided", 422, "VALIDATION_ERROR");
    }
    const upserted = [];
    for (const key of keys) {
      const value =
        typeof body[key] === "object"
          ? JSON.stringify(body[key])
          : String(body[key]);
      const record = await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      upserted.push(record);
    }
    res.json({ success: true, data: upserted });
  }),
);

function authorizeOnlyAdmin() {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
    }
    if (req.user.role !== "admin") {
      return next(new AppError("Insufficient permissions", 403, "FORBIDDEN"));
    }
    next();
  };
}

module.exports = router;
