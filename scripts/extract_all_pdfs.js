const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const ARCHIVE_DIR = '/Users/el/Desktop/daedaesonson/archive';
const OUTPUT_FILE = '/Users/el/Desktop/daedaesonson/data/pdf_extracted_pricing.json';

// Utility to parse price string to number
function parsePrice(str) {
    if (!str) return 0;
    // Remove "원", ",", "부터", whitespace
    const cleanStr = str.replace(/[^0-9]/g, '');
    return parseInt(cleanStr, 10) || 0;
}

// Utility to categorize items based on keywords
function categorizeItem(itemName) {
    if (!itemName) return { category1: '', category2: '' };

    let cat1 = '기타';
    let cat2 = '';

    if (itemName.includes('매장') || itemName.includes('묘지')) cat1 = '매장묘';
    else if (itemName.includes('봉안') || itemName.includes('납골')) cat1 = '봉안당';
    else if (itemName.includes('수목') || itemName.includes('자연') || itemName.includes('잔디') || itemName.includes('평장') || itemName.includes('화초')) cat1 = '자연장';

    if (itemName.includes('부부')) cat2 = '부부단';
    else if (itemName.includes('가족')) cat2 = '가족단';
    else if (itemName.includes('개인') || itemName.includes('1위') || itemName.includes('1인')) cat2 = '개인단';

    return { category1: cat1, category2: cat2 };
}

// Utility to detect "Gwan-nae" (Local) vs "Gwan-oe" (Non-local)
function detectCategory3(textLine) {
    if (textLine.includes('관내') || textLine.includes('주민') || textLine.includes('시민') || textLine.includes('군민')) return '관내';
    if (textLine.includes('관외') || textLine.includes('타지역') || textLine.includes('타시군')) return '관외';
    return '';
}

async function processAllPdfs() {
    const facilities = fs.readdirSync(ARCHIVE_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    console.log(`Found ${facilities.length} facility directories.`);

    const allData = [];
    let successCount = 0;
    let failCount = 0;

    for (const folderName of facilities) {
        // Extract basic info from folder name "1.(재)낙원추모공원" -> ID: 1, Name: (재)낙원추모공원
        const match = folderName.match(/^(\d+)\.(.+)$/);
        if (!match) continue;
        const facilityId = match[1];
        const facilityName = match[2];

        // Find PDF file
        const folderPath = path.join(ARCHIVE_DIR, folderName);
        const files = fs.readdirSync(folderPath);
        const pdfFile = files.find(f => f.toLowerCase().endsWith('_price_info.pdf'));

        if (!pdfFile) {
            console.log(`[SKIP] No PDF in ${folderName}`);
            continue;
        }

        const pdfPath = path.join(folderPath, pdfFile);

        try {
            const dataBuffer = fs.readFileSync(pdfPath);
            const data = await pdf(dataBuffer);
            const text = data.text;

            // Simple Parsing Logic (Line by Line)
            const lines = text.split('\n');
            let currentCategory3 = ''; // Contextual category 3

            lines.forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) return;

                // Update context if line looks like a header for Local/Non-local
                const detectedCat3 = detectCategory3(trimmed);
                if (detectedCat3 && trimmed.length < 20) { // Short header line
                    currentCategory3 = detectedCat3;
                }

                // Check if line contains a price-like pattern (e.g., "3,000,000", "300,000원")
                // And some item name text
                // Regex: Text... Number...
                // This is heuristic and might need tuning
                if (/[0-9,]{3,}/.test(trimmed)) {
                    // Extract potential price
                    const numbers = trimmed.match(/[0-9,]+/g);
                    if (!numbers) return;

                    // Assume the last large number is the price, or the one followed by '원'
                    const priceStr = numbers[numbers.length - 1]; // Simply take the last number sequence
                    const price = parsePrice(priceStr);

                    if (price < 10000) return; // Ignore small fees

                    // Extract Item Name (everything before the price)
                    // This is tricky because "원" might be separated
                    let itemName = trimmed;

                    // Crude exclusion of common non-item lines
                    if (itemName.includes('합계') || itemName.includes('Total') || itemName.includes('전화')) return;
                    if (itemName.includes('사업자') || itemName.includes('등록번호')) return;

                    const { category1, category2 } = categorizeItem(itemName);

                    // Final Category 3 check (inline or contextual)
                    const lineCat3 = detectCategory3(itemName) || currentCategory3;

                    allData.push({
                        id: facilityId,
                        parkName: facilityName,
                        institutionType: '불명', // Can be refined later
                        category1,
                        category2,
                        category3: lineCat3,
                        itemName1: '', // To be filled by "Representative Logic" later
                        itemName2: itemName.replace(/[0-9,]+원?/, '').trim(), // Remove price from name
                        rawText: trimmed, // Full line for reference
                        price: price
                    });
                }
            });

            successCount++;
            if (successCount % 50 === 0) console.log(`Processed ${successCount} files...`);

        } catch (err) {
            console.error(`[ERROR] Failed to parse ${pdfFile}:`, err.message);
            failCount++;
        }
    }

    console.log(`\nDone! Success: ${successCount}, Failed: ${failCount}`);
    console.log(`Extracted ${allData.length} total pricing items.`);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
}

processAllPdfs();
