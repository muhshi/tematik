const { runAutoUpdater } = require('./autoUpdater');

async function testAutoUpdater() {
  console.log("\n### MEMULAI SIMULASI AUTO-UPDATER (ROLLING WINDOW 3 TAHUN) ###\n");
  
  // Simulasi 1: Tahun 2026 rilis di BPS (BPS Punya 2026, 2025, 2024)
  console.log(">> SIMULASI 1: Tahun 2026 Baru Dirilis oleh BPS");
  await runAutoUpdater([2026, 2025, 2024]);
  
  // Simulasi 2: Tahun 2027 rilis di BPS (BPS Punya 2027, 2026, 2025)
  console.log(">> SIMULASI 2: Satu Tahun Berlalu, Tahun 2027 Dirilis oleh BPS");
  await runAutoUpdater([2027, 2026, 2025]);

  // Simulasi 3: Tahun 2028 rilis di BPS (BPS Punya 2028, 2027, 2026)
  console.log(">> SIMULASI 3: Satu Tahun Berlalu Lagi, Tahun 2028 Dirilis oleh BPS");
  await runAutoUpdater([2028, 2027, 2026]);
  
  console.log("\n### SIMULASI SELESAI ###\n");
}

testAutoUpdater();
