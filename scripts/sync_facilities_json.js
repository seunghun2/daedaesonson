const fs = require('fs');
const path = require('path');

const ESKY_FILE = path.join(__dirname, '../esky_full_with_details.json');
const OUTPUT_FILE = path.join(__dirname, '../data/facilities.json');

if (!fs.existsSync(ESKY_FILE)) {
    console.error("Source file not found!");
    process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(ESKY_FILE, 'utf-8'));
const list = rawData.list || rawData;

console.log(`Loaded ${list.length} facilities from full list.`);

const newFacilities = list.map(item => {
    // Map category code to ENUM-like string if needed
    // TBC0700001: Funeral Home
    // TBC0700002: Cemetery?
    // Let's infer simple Category string
    let category = "OTHER";
    if (item.companyname.includes('장례식장')) category = "FUNERAL_HOME";
    else if (item.companyname.includes('추모공원') || item.companyname.includes('묘지')) category = "FAMILY_GRAVE";
    else if (item.companyname.includes('봉안') || item.companyname.includes('납골')) category = "CHARNEL_HOUSE";
    else if (item.companyname.includes('화장')) category = "CREMATORIUM";
    else if (item.companyname.includes('자연장')) category = "NATURAL_BURIAL";

    return {
        id: String(item.rno), // Use RNO as ID to sync with Admin/Archive
        name: item.companyname,
        category: category,
        address: item.fulladdress || "",
        phone: item.telephone || "",
        priceRange: {
            min: 0,
            max: 0
        },
        hasParking: item.parkyn === "TBC1300001", // Assuming code TBC1300001 means Yes (based on other scripts/context)
        coordinates: {
            lat: parseFloat(item.latitude) || 0,
            lng: parseFloat(item.longitude) || 0
        },
        fileUrl: item.fileurl || "" // Use original web URL
    };
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(newFacilities, null, 2));
console.log(`Saved ${newFacilities.length} facilities to ${OUTPUT_FILE}`);
