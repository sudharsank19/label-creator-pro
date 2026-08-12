const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const errorHandler = require("./middleware/errorHandler");
const { AppError } = require("./lib/errors");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const labelRoutes = require("./routes/label.routes");
const templateRoutes = require("./routes/template.routes");
const printRoutes = require("./routes/print.routes");
const settingRoutes = require("./routes/setting.routes");
const categoryRoutes = require("./routes/category.routes");
const importRoutes = require("./routes/import.routes");
const renderRoutes = require("./routes/render.routes");

const app = express();

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Label Creator Pro API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/labels", labelRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/prints", printRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/import", importRoutes);
app.use("/api/render", renderRoutes);

// 404 for unknown API routes
app.use("/api", (req, res, next) => {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      "NOT_FOUND",
    ),
  );
});

// Global error handler
app.use(errorHandler);

module.exports = app;
