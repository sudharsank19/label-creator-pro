const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Papa = require("papaparse");
const XLSX = require("xlsx");
const { z } = require("zod");
const { validate } = require("../lib/validate");
const { AppError, asyncHandler } = require("../lib/errors");
const { authenticate } = require("../middleware/auth");
const prisma = require("../lib/prisma");

const uploadDir = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".csv", ".xlsx", ".xls", ".json"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(
        new AppError(
          "Only CSV, Excel or JSON files are allowed",
          400,
          "BAD_FILE_TYPE",
        ),
      );
    }
    cb(null, true);
  },
});

const parseSchema = z.object({
  body: z.object({
    map: z.record(z.string(), z.string()).optional().default({}),
  }),
});

// POST /api/import/parse — parse file and return rows
router.post(
  "/parse",
  authenticate,
  upload.single("file"),
  validate(parseSchema),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError("No file uploaded", 422, "NO_FILE");
    }
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];

    try {
      if (ext === ".csv") {
        const content = fs.readFileSync(filePath, "utf8");
        const result = Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
        });
        if (result.errors.length) {
          console.warn("CSV parse warnings:", result.errors.slice(0, 3));
        }
        rows = result.data;
      } else if (ext === ".xlsx" || ext === ".xls") {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      } else if (ext === ".json") {
        const content = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(content);
        rows = Array.isArray(parsed)
          ? parsed
          : parsed.rows || parsed.data || [];
      }
    } catch (err) {
      throw new AppError(
        `Failed to parse file: ${err.message}`,
        422,
        "PARSE_ERROR",
      );
    } finally {
      fs.unlink(filePath, () => {});
    }

    const columns = [];
    if (rows.length > 0) {
      for (const key of Object.keys(rows[0])) {
        columns.push(String(key));
      }
    }

    res.json({ success: true, data: { columns, rows, count: rows.length } });
  }),
);

// POST /api/import/labels — create labels from parsed rows using field mapping
router.post(
  "/labels",
  authenticate,
  asyncHandler(async (req, res) => {
    const {
      rows,
      map,
      nameColumn,
      width = 50,
      height = 25,
      elements = [],
    } = req.body || {};
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new AppError("No rows to import", 422, "VALIDATION_ERROR");
    }
    if (!map || typeof map !== "object") {
      throw new AppError("Field mapping is required", 422, "VALIDATION_ERROR");
    }

    const fields = [
      "model",
      "product",
      "quality",
      "color",
      "barcode",
      "warranty",
      "description",
      "category",
      "supplier",
      "batchNumber",
      "price",
      "stock",
    ];

    const created = [];
    for (const row of rows) {
      const data = {};
      for (const field of fields) {
        const src = map[field];
        if (src && row[src] !== undefined && row[src] !== "") {
          data[field] = String(row[src]).trim();
        }
      }
      const nameSrc = map[nameColumn || "name"] || "name";
      const labelName = row[nameSrc]
        ? String(row[nameSrc]).trim()
        : data.barcode || data.model || "Label";
      const label = await prisma.label.create({
        data: {
          name: labelName.slice(0, 200),
          width: Number(width) || 50,
          height: Number(height) || 25,
          elements: JSON.stringify(elements || []),
          data: JSON.stringify(data),
          createdById: req.user.id,
        },
      });
      created.push(label);
    }

    res.status(201).json({
      success: true,
      data: { created, count: created.length },
    });
  }),
);

module.exports = router;
