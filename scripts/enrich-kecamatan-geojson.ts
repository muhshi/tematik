const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src', 'assets');
const desaPath = path.join(srcDir, 'demak.geojson');
const kecPath = path.join(srcDir, 'demak_kecamatan.geojson');

console.log('Reading files...');
const desaGeojson = JSON.parse(fs.readFileSync(desaPath, 'utf8'));
const kecGeojson = JSON.parse(fs.readFileSync(kecPath, 'utf8'));

// Extract mapping from desa geojson
const kecCodes = new Map();
desaGeojson.features.forEach((f: any) => {
  const code = f.properties.district_code?.replace('id', '');
  const name = f.properties.district;
  if (code && name && !kecCodes.has(name)) {
    kecCodes.set(name, code);
  }
});

console.log('Found kecamatan codes:', kecCodes);

// Update kecamatan geojson
let updatedCount = 0;
kecGeojson.features.forEach((f: any) => {
  const name = f.properties.district;
  
  // Special handling for Karangtengah name mismatch
  const lookupName = name === 'Karang Tengah' ? 'Karangtengah' : name;
  let code = kecCodes.get(lookupName) || kecCodes.get(name);
  
  // If still not found, check if Karangtengah exists
  if (!code && name === 'Karang Tengah') {
      code = '3321050'; // Hardcoded fallback for Karangtengah if missing
  }

  if (code) {
    f.properties.code = code;
    updatedCount++;
  } else {
    console.warn('Code not found for kecamatan:', name);
  }
});

console.log(`Updated ${updatedCount} features.`);

fs.writeFileSync(kecPath, JSON.stringify(kecGeojson, null, 2));
console.log('Saved demak_kecamatan.geojson successfully.');
