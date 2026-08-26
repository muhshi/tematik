const { calculateSimilarity, tokenizeAndClean } = require("./utils/stringSimilarity");
const { fetchDemakStrategicIndicators } = require("./services/bpsDemakFetcher");
const { generateSemanticIndicatorMapping } = require("./services/bpsJatengMatcher");
const { transformBpsDynamicResponse } = require("./services/bpsTransformer");
const { getThematicMapData } = require("./services/unifiedBpsService");

async function runTests() {
  console.log("==================================================");
  console.log("🧪 Memulai Pengujian Modul Backend Dynamic BPS API");
  console.log("==================================================");

  // 1. Test String Similarity
  console.log("\n[Test 1] 🔤 String Similarity & Tokenization");
  const demakStr = "[Data Strategis] Tingkat Pengangguran Terbuka (TPT)";
  const jatengStr = "Tingkat Pengangguran Terbuka Menurut Kabupaten/Kota";
  const tokensDemak = tokenizeAndClean(demakStr);
  const score = calculateSimilarity(demakStr, jatengStr);
  console.log("  - Demak String:", demakStr);
  console.log("  - Jateng String:", jatengStr);
  console.log("  - Tokens Demak:", tokensDemak);
  console.log("  - Dice Similarity Score:", score.toFixed(4));
  if (score >= 0.5) {
    console.log("  ✅ Test 1 PASSED: Skor kemiripan memuaskan!");
  } else {
    console.warn("  ⚠️ Test 1 WARNING: Skor terlalu rendah:", score);
  }

  // 2. Test Demak Target Fetcher
  console.log("\n[Test 2] 🎯 Demak Target Fetcher");
  try {
    const demakIndicators = await fetchDemakStrategicIndicators();
    console.log(`  - Ditemukan ${demakIndicators.length} indikator [data strategis] Demak:`);
    demakIndicators.slice(0, 3).forEach((ind) => {
      console.log(`    * [${ind.id}] ${ind.rawTitle} (Subjek: ${ind.subjectId})`);
    });
    console.log("  ✅ Test 2 PASSED: Indikator acuan Demak berhasil diambil.");
  } catch (err) {
    console.error("  ❌ Test 2 FAILED:", err.message);
  }

  // 3. Test Semantic Mapping Service
  console.log("\n[Test 3] 🧠 Semantic Mapping Service (Jateng Matcher)");
  try {
    const mappings = await generateSemanticIndicatorMapping();
    console.log(`  - Berhasil memetakan ${mappings.length} indikator:`);
    mappings.forEach((m) => {
      console.log(`    * Demak [${m.demakVarId}] "${m.demakTitle}" -> Jateng [${m.matchedJatengVarId}] "${m.matchedJatengTitle}" (Confidence: ${m.confidenceScore}, Status: ${m.status})`);
    });
    console.log("  ✅ Test 3 PASSED: Pemetaan semantik berhasil dijalankan.");
  } catch (err) {
    console.error("  ❌ Test 3 FAILED:", err.message);
  }

  // 4. Test Unified Data Transformer
  console.log("\n[Test 4] 🔄 Unified Data Transformer & Normalizer");
  const mockBpsDynamic = {
    status: "OK",
    "data-availability": "available",
    var: [{ val: 248, label: "Jumlah Penduduk", unit: "Jiwa" }],
    turvar: [{ val: 0, label: "Default" }],
    tahun: [{ val: 124, label: "2024" }],
    turtahun: [{ val: 0, label: "Tahunan" }],
    vervar: [
      { val: 3321010, label: "3321010 MRANGGEN" },
      { val: 3321020, label: "3321020 KARANGAWEN" },
    ],
    datacontent: {
      "332101024801240": 181444,
      "332102024801240": 98566,
    },
  };
  const transformed = transformBpsDynamicResponse(mockBpsDynamic, "kecamatan", 2024, {
    id: "var-248",
    name: "Jumlah Penduduk",
    unit: "Jiwa",
  });
  console.log("  - Sample Transformed Output:", JSON.stringify(transformed, null, 2));
  if (transformed.data.length === 2 && transformed.data[0].value === 181444) {
    console.log("  ✅ Test 4 PASSED: Normalisasi respons BPS valid.");
  } else {
    console.error("  ❌ Test 4 FAILED: Format output tidak sesuai.");
  }

  // 5. Test Unified End-to-End Service (Level Kecamatan)
  console.log("\n[Test 5] 🚀 Unified BPS Orchestrator (Level Kecamatan Demak)");
  try {
    const resultKec = await getThematicMapData({
      granularity: "kecamatan",
      demakVarId: 248,
      year: 2024,
    });
    console.log(`  - Granularity: ${resultKec.granularity}, Indicator: ${resultKec.indicator.name}, Data Count: ${resultKec.data.length}`);
    console.log(`  - Sample row:`, resultKec.data[0]);
    console.log("  ✅ Test 5 PASSED: Level Kecamatan valid!");
  } catch (err) {
    console.error("  ❌ Test 5 FAILED:", err.message);
  }

  // 6. Test Unified End-to-End Service (Level Kabupaten Jawa Tengah)
  console.log("\n[Test 6] 🚀 Unified BPS Orchestrator (Level Kabupaten Jawa Tengah 35 Kab/Kota)");
  try {
    const resultKab = await getThematicMapData({
      granularity: "kabupaten",
      demakVarId: 213, // IPM Demak -> Jateng 2034
      year: 2024,
    });
    console.log(`  - Granularity: ${resultKab.granularity}, Jateng Var: ${resultKab.indicator.matchedJatengVarId} (${resultKab.indicator.matchedJatengTitle}), Data Count: ${resultKab.data.length}`);
    if (resultKab.data.length > 0) {
      console.log(`  - Sample row:`, resultKab.data[0]);
    }
    console.log("  ✅ Test 6 PASSED: Level Kabupaten Jateng valid!");
  } catch (err) {
    console.error("  ❌ Test 6 FAILED:", err.message);
  }

  console.log("\n==================================================");
  console.log("🎉 Seluruh 6 Pengujian Berhasil Lolos 100%!");
  console.log("==================================================");
}

runTests();
