const fs = require('fs');
const path = require('path');

const facilitiesPath = path.join(__dirname, '../data/facilities.json');

try {
    const rawData = fs.readFileSync(facilitiesPath, 'utf8');
    const facilities = JSON.parse(rawData);

    console.log(`Original count: ${facilities.length}`);

    const seenIds = new Set();
    const uniqueFacilities = [];
    const duplicates = [];

    // Process from end to start to keep the "latest" occurrence if we assume append-only updates
    // OR process start to end and keep first.
    // Let's go with: Keep the ONE that seems most complete? 
    // Actually, usually in these cases, we just want to dedup.
    // Let's use a Map to keep the *last* occurrence found in the array.

    // Map: ID -> Facility
    const facilityMap = new Map();

    facilities.forEach(fac => {
        if (facilityMap.has(fac.id)) {
            duplicates.push(fac.id);
        }
        facilityMap.set(fac.id, fac);
    });

    const cleanedFacilities = Array.from(facilityMap.values());

    console.log(`Unique count: ${cleanedFacilities.length}`);
    console.log(`Removed ${facilities.length - cleanedFacilities.length} duplicates.`);
    if (duplicates.length > 0) {
        console.log('Duplicate IDs found (sample):', duplicates.slice(0, 10));
    }

    // Sort by ID to keep it tidy
    cleanedFacilities.sort((a, b) => a.id.localeCompare(b.id));

    fs.writeFileSync(facilitiesPath, JSON.stringify(cleanedFacilities, null, 2), 'utf8');
    console.log('Successfully cleaned facilities.json');

} catch (error) {
    console.error('Error processing file:', error);
}
