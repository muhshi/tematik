// Mapping Kabupaten/Kota di Jateng ke Domain BPS
const KAB_DOMAIN_MAP = {
  "cilacap": 3301,
  "banyumas": 3302,
  "purbalingga": 3303,
  "banjarnegara": 3304,
  "kebumen": 3305,
  "purworejo": 3306,
  "wonosobo": 3307,
  "magelang": 3308, // Kab
  "boyolali": 3309,
  "klaten": 3310,
  "sukoharjo": 3311,
  "wonogiri": 3312,
  "karanganyar": 3313,
  "sragen": 3314,
  "grobogan": 3315,
  "blora": 3316,
  "rembang": 3317,
  "pati": 3318,
  "kudus": 3319,
  "jepara": 3320,
  "demak": 3321,
  "semarang": 3322, // Kab
  "temanggung": 3323,
  "kendal": 3324,
  "batang": 3325,
  "pekalongan": 3326, // Kab
  "pemalang": 3327,
  "tegal": 3328, // Kab
  "brebes": 3329,
  "kotamagelang": 3371,
  "kotasurakarta": 3372,
  "surakarta": 3372,
  "solo": 3372,
  "kotasalatiga": 3373,
  "salatiga": 3373,
  "kotasemarang": 3374,
  "kotapekalongan": 3375,
  "kotategal": 3376,
};

function getDomainForKabupaten(kabName) {
  if (!kabName) return null;
  
  // If it's just a number string like "3321", just return it back if it exists in values
  if (!isNaN(kabName)) {
    const domainNum = parseInt(kabName, 10);
    const isValid = Object.values(KAB_DOMAIN_MAP).includes(domainNum);
    return isValid ? domainNum : null;
  }

  // Hapus spasi dan prefix kabupaten/kota
  let cleanName = kabName.toLowerCase()
                         .replace(/^(kabupaten|kab\.?|kota)\s*/i, "") // \s* instead of \s+ to catch 'kotamagelang'
                         .replace(/\s+/g, "");
                         
  // Khusus untuk kota, mapping di KAB_DOMAIN_MAP menggunakan prefix "kota" untuk membedakan dengan kabupaten
  const isKota = kabName.toLowerCase().includes("kota");
  if (isKota) {
      cleanName = "kota" + cleanName;
  }
  
  return KAB_DOMAIN_MAP[cleanName] || null;
}

module.exports = { getDomainForKabupaten, KAB_DOMAIN_MAP };
