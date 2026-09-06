const express = require("express");
const router = express.Router();
const { scrapeProvinsiDemographics, scrapeKabupatenDemographics } = require("../services/bpsScraperService");
const dbService = require('../services/dbService');

/**
 * Route: GET /api/scrape/demographics
 * Mengambil data demografi (provinsi atau kabupaten) dari DB JSON Statis
 */
router.get('/demographics', async (req, res) => {
  try {
    const { level, kab, year } = req.query;

    if (level === 'kabupaten') {
      if (!kab) {
        return res.status(400).json({ error: "Parameter 'kab' wajib diisi untuk level kabupaten." });
      }
      const data = await dbService.getKabupatenDemographicsFromDB(kab, year);
      return res.json(data);
    } else if (level === 'all-kabupaten') {
      const yearStr = year || "2024";
      const data = await dbService.getAllKabupatenDemographicsFromDB(yearStr);
      return res.json(data);
    } else if (level === 'provinsi') {
      const yearStr = year || "2024";
      const data = await dbService.getProvinsiDemographicsFromDB(yearStr);
      return res.json(data);
    } else {
      return res.status(400).json({ error: "Parameter 'level' harus 'provinsi' atau 'kabupaten'." });
    }
  } catch (error) {
    console.error("Error di route scrape /demographics:", error);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat mengambil data dari DB' });
  }
});

/**
 * Route: GET /api/scrape/available-years
 * Mengembalikan daftar tahun yang datanya tersedia di DB untuk wilayah tersebut
 */
router.get('/available-years', async (req, res) => {
  try {
    const { level, kab } = req.query;
    
    if (!level) {
      return res.status(400).json({ error: "Parameter 'level' wajib diisi (provinsi, kabupaten, atau ipm)." });
    }
    
    const years = await dbService.getAvailableYears(level, kab);
    return res.json(years);
  } catch (error) {
    console.error("Error Cek Tahun API BPS:", error);
    return res.status(500).json({ error: error.message || "Terjadi kesalahan internal" });
  }
});

/**
 * Route: GET /api/scrape/ipm
 * Mengambil data Indeks Pembangunan Manusia (IPM) Provinsi Jateng dari DB JSON Statis
 */
router.get('/ipm', async (req, res) => {
  try {
    const { year } = req.query;
    const data = await dbService.getIpmDataFromDB(year);
    return res.json(data);
  } catch (error) {
    console.error("Error Scrape IPM API BPS:", error);
    return res.status(500).json({ error: error.message || "Terjadi kesalahan internal" });
  }
});

/**
 * Route: GET /api/scrape/tpt
 */
router.get('/tpt', async (req, res) => {
  try {
    const data = await dbService.getTptDataFromDB(req.query.year);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Terjadi kesalahan" });
  }
});

/**
 * Route: GET /api/scrape/tpak
 */
router.get('/tpak', async (req, res) => {
  try {
    const data = await dbService.getTpakDataFromDB(req.query.year);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Terjadi kesalahan" });
  }
});

/**
 * Route: GET /api/scrape/kemiskinan
 */
router.get('/kemiskinan', async (req, res) => {
  try {
    const data = await dbService.getKemiskinanDataFromDB(req.query.year);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Terjadi kesalahan" });
  }
});

module.exports = router;
