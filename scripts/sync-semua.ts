import { executeBpsSync } from "../src/services/bpsScheduler";

async function main() {
  console.log("Menjalankan Manual BPS Sync (Logika Terbaru)...");
  const result = await executeBpsSync();
  console.log("Selesai!", result);
  process.exit(result.success ? 0 : 1);
}

main().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
