const router = require("express").Router();
const bwipjs = require("bwip-js");
const QRCode = require("qrcode");
const { z } = require("zod");
const { validate } = require("../lib/validate");
const { AppError, asyncHandler } = require("../lib/errors");

const barcodeSchema = z.object({
  query: z.object({
    value: z.string().min(1, "Barcode value is required"),
    bcid: z.string().default("code128"),
    heightmm: z.coerce.number().min(5).max(50).default(12),
    scale: z.coerce.number().min(1).max(5).default(2),
    includetext: z.string().optional(),
    text: z.string().optional(),
  }),
});

const qrSchema = z.object({
  query: z.object({
    value: z.string().min(1, "QR value is required"),
    errorLevel: z.enum(["L", "M", "Q", "H"]).default("M"),
    size: z.coerce.number().min(100).max(1024).default(300),
    color: z.string().default("#000000"),
    bg: z.string().default("#ffffff"),
  }),
});

// GET /api/render/barcode?value=...&bcid=code128
router.get(
  "/barcode",
  validate(barcodeSchema),
  asyncHandler(async (req, res) => {
    const { value, bcid, heightmm, scale, includetext, text } = req.query;
    try {
      const png = await bwipjs.toBuffer({
        bcid,
        text: value,
        scale,
        height: heightmm,
        includetext: includetext === "true",
        textxalign: "center",
        textyoffset: 2,
        paddingwidth: 2,
        paddingheight: 2,
        ...(text ? { text: `${text}` } : {}),
        backgroundcolor: "FFFFFF",
        barcolor: "000000",
      });
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-cache");
      res.send(png);
    } catch (err) {
      throw new AppError(
        `Barcode generation failed: ${err.message}`,
        422,
        "BARCODE_ERROR",
      );
    }
  }),
);

// GET /api/render/qr?value=...&errorLevel=M
router.get(
  "/qr",
  validate(qrSchema),
  asyncHandler(async (req, res) => {
    const { value, errorLevel, size, color, bg } = req.query;
    try {
      const png = await QRCode.toBuffer(value, {
        errorCorrectionLevel: errorLevel,
        width: Number(size),
        margin: 1,
        color: { dark: color, light: bg },
      });
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-cache");
      res.send(png);
    } catch (err) {
      throw new AppError(
        `QR generation failed: ${err.message}`,
        422,
        "QR_ERROR",
      );
    }
  }),
);

module.exports = router;
