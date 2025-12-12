const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const XLSX = require('xlsx');

const SOURCE_DIR = path.join(__dirname, '../archive3/공원묘지');
const OUTPUT_FILE = path.join(__dirname, '../park_price_master.xlsx');

(async () => {
    console.log(`=== Generating Master Excel for Park Cemeteries ===`);
    console.log(`Source: ${SOURCE_DIR}`);

    if (!fs.existsSync(SOURCE_DIR)) {
        console.error("Source directory not found!");
        return;
    }

    const files = fs.readdirSync(SOURCE_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    console.log(`Found ${files.length} PDF files.`);

    const sheetItems = [];
    const sheetRaw = [];

    for (let i = 0; i < files.length; i++) {
        const filename = files[i];
        const filePath = path.join(SOURCE_DIR, filename);

        // Extract Facility Name from filename (Naive)
        // Filename format: Name_ID_price.pdf
        const namePart = filename.split('_')[0];

        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            const text = data.text;

            // Sheet 2: Raw Text
            sheetRaw.push({
                FileName: filename,
                FacilityName: namePart,
                FullText: text.substring(0, 32000) // Excel limit safety
            });

            // Sheet 1: Items
            const lines = text.split('\n');
            lines.forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) return;

                // Try to match price
                const priceMatch = trimmed.match(/(.+?)\s*([\d,]+)(원|만원)?$/);
                let extractedName = '';
                let extractedPrice = '';

                if (priceMatch) {
                    extractedName = priceMatch[1].trim();
                    extractedPrice = priceMatch[2].replace(/,/g, '');
                    // Ignore small numbers usually page numbers
                    if (parseInt(extractedPrice) < 1000) {
                        extractedName = '';
                        extractedPrice = '';
                    }
                }

                sheetItems.push({
                    FileName: filename,
                    FacilityName: namePart,
                    RawLine: trimmed,
                    ExtractedName: extractedName,
                    ExtractedPrice: extractedPrice
                });
            });

            if (i % 50 === 0) process.stdout.write('.');

        } catch (err) {
            console.error(`Error parsing ${filename}: ${err.message}`);
            sheetRaw.push({ FileName: filename, FacilityName: namePart, FullText: `ERROR: ${err.message}` });
        }
    }

    console.log(`\nprocessed all files. Writing Excel...`);

    const wb = XLSX.utils.book_new();

    // Items Sheet
    const wsItems = XLSX.utils.json_to_sheet(sheetItems);
    XLSX.utils.book_append_sheet(wb, wsItems, "Price Items");

    // Raw Text Sheet
    const wsRaw = XLSX.utils.json_to_sheet(sheetRaw);
    XLSX.utils.book_append_sheet(wb, wsRaw, "Full Text");

    XLSX.writeFile(wb, OUTPUT_FILE);
    console.log(`✅ Saved Master Excel to: ${OUTPUT_FILE}`);
})();
