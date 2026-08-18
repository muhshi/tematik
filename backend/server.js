const express = require("express");
const cors = require("cors");
const { BPS_CONFIG } = require("./config/bpsConfig");
const apiRouter = require("./routes/api");
const { syncBpsCatalog } = require("./services/indicatorService");

const app = express();

app.use(cors());
app.use(express.json());

// Register API Routes
app.use("/api", apiRouter);

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    server: "WebGIS Demak Standalone Backend API (No Prisma)",
    time: new Date().toISOString(),
    scheduler: "24-Hour Automated BPS Sync Active",
  });
});

// Automated 24-Hour BPS Data Sync Scheduler
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
setInterval(async () => {
  console.log("[Scheduler] ⏰ Menjalankan sinkronisasi otomatis 24-jam data BPS...");
  try {
    const result = await syncBpsCatalog();
    console.log("[Scheduler] ✅ Hasil sinkronisasi 24-jam:", result.message);
  } catch (error) {
    console.error("[Scheduler] ❌ Gagal sinkronisasi otomatis:", error.message);
  }
}, TWENTY_FOUR_HOURS_MS);

app.listen(BPS_CONFIG.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 WebGIS Demak Backend Server running on port ${BPS_CONFIG.PORT}`);
  console.log(`🌐 Base URL: http://localhost:${BPS_CONFIG.PORT}/api`);
  console.log(`⏰ 24-Hour Automated Sync Scheduler: ACTIVE`);
  console.log(`=======================================================`);
});
