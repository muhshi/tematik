const cron = require('node-cron');
const { runAutoUpdater } = require('../scripts/autoUpdater');

/**
 * Inisialisasi Cron Jobs untuk backend
 */
function initCron() {
  console.log("[CronService] Menginisialisasi scheduler...");

  // Jadwal: Setiap Hari Minggu jam 02:00 Pagi
  // Format cron: menit jam hari_bulan bulan hari_minggu
  // '0 2 * * 0' berarti: Menit 0, Jam 2, Setiap Tanggal, Setiap Bulan, Hari Minggu(0)
  
  cron.schedule('0 2 * * 0', async () => {
    console.log(`[CronService] Menjalankan Auto-Updater (Triggered at ${new Date().toISOString()})`);
    try {
      // Panggil auto-updater (Sekarang terhubung langsung ke API BPS secara real)
      await runAutoUpdater();
      console.log(`[CronService] Auto-Updater selesai.`);
    } catch (error) {
      console.error(`[CronService] Error saat menjalankan Auto-Updater:`, error);
    }
  });

  console.log("[CronService] Scheduler berhasil diaktifkan. (Jadwal: Setiap Minggu 02:00 Pagi)");
}

module.exports = { initCron };
