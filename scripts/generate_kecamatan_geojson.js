const fs = require('fs');
const topojson = require('topojson-server');
const topojsonClient = require('topojson-client');

console.log("Reading demak.geojson...");
const raw = fs.readFileSync('./src/assets/demak.geojson', 'utf-8');
const geojson = JSON.parse(raw);

console.log("Converting to TopoJSON...");
// Convert to TopoJSON with high quantization to snap nearby points together (eliminates slivers)
const topology = topojson.topology({ demak: geojson }, { quantization: 1e5 });

console.log("Grouping by district...");
const districts = {};
topology.objects.demak.geometries.forEach(geom => {
    const d = geom.properties.district;
    if (!districts[d]) districts[d] = [];
    districts[d].push(geom);
});

console.log("Merging geometries by district...");
const features = [];
for (const d in districts) {
    // merge() merges the arcs of the specified geometries into a single Geometry Object
    const mergedGeom = topojsonClient.merge(topology, districts[d]);
    features.push({
        type: "Feature",
        properties: { district: d },
        geometry: mergedGeom
    });
}

const outGeojson = {
    type: "FeatureCollection",
    features: features
};

console.log("Writing demak_kecamatan.geojson...");
fs.writeFileSync('./src/assets/demak_kecamatan.geojson', JSON.stringify(outGeojson));
console.log("Done!");
