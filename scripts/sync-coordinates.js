const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

function main() {
    console.log('📍 Synchronizing location -> coordinates fields...\n');

    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ facilities.json not found!');
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    let updated = 0;

    facilities.forEach((facility, idx) => {
        // location 필드가 있고 (우리가 열심히 업데이트한 필드)
        if (facility.location && facility.location.lat && facility.location.lng) {

            // coordinates 필드가 없거나, 값이 다르다면 업데이트
            const loc = facility.location;
            const coord = facility.coordinates;

            if (!coord || Math.abs(coord.lat - loc.lat) > 0.0001 || Math.abs(coord.lng - loc.lng) > 0.0001) {
                facilities[idx].coordinates = {
                    lat: loc.lat,
                    lng: loc.lng
                };
                updated++;
            }
        }
    });

    if (updated > 0) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
        console.log(`✅ Fixed ${updated} facilities by syncing coordinates.`);
    } else {
        console.log('✨ All coordinates are already in sync.');
    }
}

main();
