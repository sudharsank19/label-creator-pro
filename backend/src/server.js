require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Label Creator Pro API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(
      `   Another instance may be running — stop it, or set PORT=5001 in backend/.env`,
    );
    process.exit(1);
  }
  throw err;
});

// Graceful shutdown for nodemon / Ctrl+C
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down gracefully...");
  server.close(() => process.exit(0));
});
process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
