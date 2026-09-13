const express = require("express");
const cors = require("cors");
const { BPS_CONFIG } = require("./config/bpsConfig");
const apiRouter = require("./routes/api");
const bpsRouter = require("./routes/bpsRoutes");
const { syncBpsCatalog } = require("./services/indicatorService");
const { initCron } = require("./services/cronService");

const app = express();

app.use(cors());
app.use(express.json());

// Register API Routes
app.use("/api", apiRouter);
app.use("/api/bps", bpsRouter);

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    server: "WebGIS Demak Standalone Backend API (No Prisma)",
    time: new Date().toISOString(),
    scheduler: "24-Hour Automated BPS Sync Active",
    modules: [
      "Demak Target Fetcher",
      "Semantic Mapping Service (Jateng Matcher)",
      "Unified Data Transformer & Normalizer",
      "In-Memory Multi-layer Cache Manager"
    ]
  });
});

// Automated 24-Hour BPS Data Sync Scheduler
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
setInterval(async () => {
  console.log("[Scheduler] [INFO] Menjalankan sinkronisasi otomatis 24-jam data BPS...");
  try {
    const result = await syncBpsCatalog();
    console.log("[Scheduler] [SUCCESS] Hasil sinkronisasi 24-jam:", result.message);
  } catch (error) {
    console.error("[Scheduler] [ERROR] Gagal sinkronisasi otomatis:", error.message);
  }
}, TWENTY_FOUR_HOURS_MS);

// Mulai Auto-Updater Scheduler (BPS Data Rolling Window)
initCron();

const server = app.listen(BPS_CONFIG.PORT, () => {
  console.log(`=======================================================`);
  console.log(`[INFO] WebGIS Demak Backend Server running on port ${BPS_CONFIG.PORT}`);
  console.log(`[INFO] Base URL: http://localhost:${BPS_CONFIG.PORT}/api`);
  console.log(`[INFO] Unified BPS API: http://localhost:${BPS_CONFIG.PORT}/api/bps`);
  console.log(`[INFO] 24-Hour Automated Sync Scheduler: ACTIVE`);
  console.log(`=======================================================`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[ERROR] Port ${BPS_CONFIG.PORT} sedang digunakan oleh proses lain.`);
    console.error(`[INFO] Pastikan tidak ada instance server.js atau terminal lain yang berjalan di port ${BPS_CONFIG.PORT}.`);
    process.exit(1);
  } else {
    console.error("[ERROR] Server listen error:", err);
  }
});

// Penanganan graceful shutdown saat restart/watch agar port langsung dilepas
const handleShutdown = () => {
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 1000).unref();
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);
