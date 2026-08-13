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

/* =========================================================
   UPLOADS DIRECTORY
   ========================================================= */

const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* =========================================================
   CORS CONFIGURATION
   ========================================================= */

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without Origin header.
    // Example: Postman, server-to-server requests, etc.
    if (!origin) {
      return callback(null, true);
    }

    // Allow all Vercel deployments
    if (origin.endsWith(".vercel.app")) {
      console.log("✅ CORS allowed:", origin);
      return callback(null, true);
    }

    // Allow local development
    if (
      origin === "http://localhost:5173" ||
      origin === "http://localhost:3000"
    ) {
      console.log("✅ CORS allowed:", origin);
      return callback(null, true);
    }

    // Block unknown origins
    console.log("❌ CORS blocked origin:", origin);

    // Return false instead of throwing an error.
    // This prevents the CORS middleware from generating
    // an unwanted server error response.
    return callback(null, false);
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],

  optionsSuccessStatus: 204,
};

// Apply CORS globally.
// This also handles OPTIONS preflight requests.
app.use(cors(corsOptions));

/* =========================================================
   BODY PARSING
   ========================================================= */

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
  }),
);

/* =========================================================
   STATIC FILES
   ========================================================= */

app.use("/uploads", express.static(uploadDir));

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Label Creator Pro API is running",
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   API ROUTES
   ========================================================= */

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/labels", labelRoutes);

app.use("/api/templates", templateRoutes);

app.use("/api/prints", printRoutes);

app.use("/api/settings", settingRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/import", importRoutes);

app.use("/api/render", renderRoutes);

/* =========================================================
   API 404 HANDLER
   ========================================================= */

app.use("/api", (req, res, next) => {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      "NOT_FOUND",
    ),
  );
});

/* =========================================================
   GLOBAL ERROR HANDLER
   ========================================================= */

app.use(errorHandler);

/* =========================================================
   EXPORT APP
   ========================================================= */

module.exports = app;
