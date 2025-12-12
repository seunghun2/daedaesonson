const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const ID = "1"; // Target ID
const ARCHIVE_DIR = path.join(__dirname, '../archive');
const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const PUBLIC_DIR = path.join(__dirname, '../public');

// Find Facility Folder in Archive
const facilities = fs.readdirSync(ARCHIVE_DIR).filter(f => f.startsWith(`${ID}.`));
if (facilities.length === 0) {
    console.error(`Facility folder for ID ${ID} not found.`);
    process.exit(1);
}
const folderName = facilities[0];
// Extract Name from "1.FacilityName"
// Careful if name acts weird. roughly:
const facilityName = folderName.substring(folderName.indexOf('.') + 1).trim();
const facilityPath = path.join(ARCHIVE_DIR, folderName);

console.log(`Processing Archive #${ID}: ${folderName} (Name: ${facilityName})`);

// Load JSON
const jsonData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// Find by Name (Normalize spaces for safer match)
const facilityIndex = jsonData.findIndex(f => f.name.replace(/\s+/g, '') === facilityName.replace(/\s+/g, ''));

if (facilityIndex === -1) {
    console.error(`Facility "${facilityName}" (from Archive #${ID}) not found in facilities.json`);
    process.exit(1);
}

const facility = jsonData[facilityIndex];
const facilityId = facility.id; // Real ID in JSON
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads', facilityId); // Use Real ID for folder


(async () => {
    // 1. Image Processing
    console.log(`\n--- Processing Images ---`);
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const photosPath = path.join(facilityPath, 'photos');
    let imageList = [];
    if (fs.existsSync(photosPath)) {
        const files = fs.readdirSync(photosPath).filter(f => !f.startsWith('.'));
        files.forEach(file => {
            const src = path.join(photosPath, file);
            const dest = path.join(UPLOADS_DIR, file);
            fs.copyFileSync(src, dest);
            console.log(`Copied: ${file}`);
            imageList.push(`/uploads/${ID}/${file}`);
        });
    }

    // Update Images in JSON
    if (imageList.length > 0) {
        facility.images = imageList;
        // Set first image as main fileUrl if not exists or to update
        if (!facility.fileUrl || facility.fileUrl.startsWith('/BCUser')) {
            facility.fileUrl = imageList[0];
        }
    }
    console.log(`Total Images: ${imageList.length}`);


    // 2. PDF Processing
    console.log(`\n--- Processing PDF ---`);
    const pdfPath = path.join(facilityPath, `${folderName}_price_info.pdf`);
    let extractedText = "";

    if (fs.existsSync(pdfPath)) {
        const dataBuffer = fs.readFileSync(pdfPath);
        try {
            // Check what 'pdf' is
            // console.log('pdf import:', pdf); 
            // In some CommonJS/ESM interop scenarios, it might be pdf.default or similar.
            const parser = typeof pdf === 'function' ? pdf : pdf.default;

            const pdfData = await parser(dataBuffer);
            extractedText = pdfData.text;
            // console.log("Extracted Text Preview:", extractedText.substring(0, 200));

            // Simple Parsing Logic
            // Try to find lines with numbers and potential price keywords
            // This is heuristics-based.
            const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const priceItems = [];

            lines.forEach(line => {
                // Look for patterns like "Item Name ... 1,000,000"
                // Check if line contains a large number
                const numMatch = line.replace(/,/g, '').match(/(\d+000)/); // At least 1000
                if (numMatch) {
                    const price = parseInt(numMatch[0]);
                    // Try to get the text part
                    const textPart = line.replace(numMatch[0], '').replace(/[0-9,]/g, '').trim();
                    if (textPart.length > 2) { // meaningful text
                        priceItems.push({ name: textPart, price: price });
                    }
                }
            });

            // Update JSON with unstructured but parsed price data
            if (!facility.priceInfo) facility.priceInfo = {};
            facility.priceInfo.parsedFromPdf = priceItems;
            facility.priceInfo.rawPdfText = extractedText; // Save raw text for reference/debugging

            console.log(`Parsed ${priceItems.length} potential price items.`);

        } catch (e) {
            console.error("Failed to parse PDF:", e);
        }
    } else {
        console.log("PDF not found.");
    }

    // Save JSON
    jsonData[facilityIndex] = facility;
    fs.writeFileSync(DATA_FILE, JSON.stringify(jsonData, null, 2));
    console.log(`\nData updated in ${DATA_FILE}`);

})();
