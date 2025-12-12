
const fs = require('fs');
const turf = require('@turf/turf');

const dongData = JSON.parse(fs.readFileSync('./public/data/skorea_dong.json', 'utf8'));
const facilities = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf8'));

// 1. Check Suyu
const suyuFeatures = dongData.features.filter(f => f.properties.name.includes('수유'));
console.log(`Found ${suyuFeatures.length} Suyu features:`, suyuFeatures.map(f => f.properties.name));

if (suyuFeatures.length > 0) {
    // Calculate center of ALL Suyu features
    const center = turf.centerOfMass(turf.featureCollection(suyuFeatures));
    const [lng, lat] = center.geometry.coordinates;
    console.log(`Global Suyu Center: Lat ${lat}, Lng ${lng}`);

    // Check specific facility
    const suyuFac = facilities.find(f => f.name.includes('수유'));
    if (suyuFac) {
        console.log(`Suyu Facility: ${suyuFac.name} at Lat ${suyuFac.coordinates.lat}, Lng ${suyuFac.coordinates.lng}`);

        const distance = turf.distance(
            turf.point([lng, lat]),
            turf.point([suyuFac.coordinates.lng, suyuFac.coordinates.lat]),
            { units: 'kilometers' }
        );
        console.log(`Distance from global center to facility: ${distance.toFixed(3)} km`);

        // Check if facility is inside ANY Suyu feature
        let inside = false;
        suyuFeatures.forEach(f => {
            if (turf.booleanPointInPolygon(turf.point([suyuFac.coordinates.lng, suyuFac.coordinates.lat]), f)) {
                console.log(`Facility is inside ${f.properties.name}`);
                inside = true;
            }
        });
        if (!inside) console.log('Facility is NOT inside any Suyu feature polygon');
    }
}

// 2. Check Gangnam
const gangnamFacs = facilities.filter(f => f.address.includes('강남구') || f.name.includes('강남'));
console.log(`\nGangnam Facilities count: ${gangnamFacs.length}`);
gangnamFacs.forEach(f => console.log(`- ${f.name}`));
