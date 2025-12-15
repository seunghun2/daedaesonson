const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { execSync } = require('child_process');

// Configuration
const START_ID = 36;
const END_ID = 45;
const ARCHIVE_DIR = 'archive';

// Load Facilities JSON to get Names
const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));

async function findPdfPath(id) {
    // Try finding directory starting with ID
    try {
        const cmd = `find "${ARCHIVE_DIR}" -name "${id}.*" -o -name "*park-00${id}*" | grep ".pdf" | head -n 1`;
        const result = execSync(cmd).toString().trim();
        return result;
    } catch (e) {
        return null;
    }
}

async function extractPriceFromPdf(pdfPath) {
    if (!pdfPath || !fs.existsSync(pdfPath)) return { status: 'NO_FILE', candidates: [] };

    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        const text = data.text;

        // Simple Heuristic Regex for Prices
        // Look for lines containing keywords and numbers like '100,000' or '100000'
        const lines = text.split('\n');
        const candidates = [];

        for (const line of lines) {
            if (line.match(/(사용료|분양|매장|봉안|관리비|합계|소계)/) && line.match(/[0-9,]{4,}원?/)) {
                // Extract number
                const priceMatch = line.match(/([0-9,]+)(원?)/);
                if (priceMatch) {
                    const priceStr = priceMatch[1].replace(/,/g, '');
                    const price = parseInt(priceStr);
                    if (price > 10000) { // Filter out small numbers
                        candidates.push({ line: line.trim(), price: price });
                    }
                }
            }
        }

        // Sort candidates by price (asc) to find potential entry price
        candidates.sort((a, b) => a.price - b.price);

        if (candidates.length === 0 && text.length < 100) {
            return { status: 'IMAGE_PDF', candidates: [] };
        }

        return { status: 'SUCCESS', candidates: candidates.slice(0, 5) }; // Top 5 cheapest

    } catch (e) {
        return { status: 'ERROR', candidates: [] };
    }
}

async function run() {
    console.log(`| ID | 시설명 | 상태 | 추정 최저가 | 비고 (추출된 텍스트) |`);
    console.log(`|---|---|---|---|---|`);

    for (let i = START_ID; i <= END_ID; i++) {
        const idStr = i.toString();
        // Find facility in JSON to get name
        // Usually IDs in JSON are park-00xx.
        // We need to map numerical ID to facility object.
        // Assuming park-0036 is index 36 (or close).

        // Let's just find by string ID match in JSON
        const facId = `park-00${i}`;
        const facility = facilities.find(f => f.id === facId);
        const name = facility ? facility.name : "Unknown";

        const pdfPath = await findPdfPath(i);

        let result = await extractPriceFromPdf(pdfPath);

        let statusIcon = '❓';
        let estimatedPrice = '-';
        let note = '';

        if (result.status === 'NO_FILE') {
            statusIcon = '❌';
            note = '파일 없음';
        } else if (result.status === 'IMAGE_PDF') {
            statusIcon = '🖼️';
            note = '이미지형 PDF (OCR 필요)';
        } else if (result.status === 'SUCCESS') {
            if (result.candidates.length > 0) {
                statusIcon = '✅';
                estimatedPrice = result.candidates[0].price.toLocaleString() + '원';
                // Pick the description of the lowest price
                note = result.candidates[0].line.substring(0, 30) + '...';
            } else {
                statusIcon = '⚠️';
                note = '텍스트는 있으나 가격패턴 못찾음';
            }
        }

        console.log(`| ${i} | ${name} | ${statusIcon} | ${estimatedPrice} | ${note} |`);
    }
}

run();
