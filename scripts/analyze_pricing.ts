import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Define Paths
const DATA_DIR = path.join(process.cwd(), 'data');
const OUT_DIR = path.join(DATA_DIR, 'analyzed');

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR);
}

// ------------------------------------------------------------------
// Type Definitions
// ------------------------------------------------------------------
interface RawPricingRow {
    ParkID: string;
    ParkName: string;
    Category: string; // e.g., "기본비용", "화장비"
    ItemName: string;
    Price: string; // CSV reads as string usually
    RawText: string;
}

// ------------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------------
function cleanPrice(priceStr: string): number {
    if (!priceStr) return 0;
    // Remove commas, spaces, currency symbols
    const cleaned = priceStr.toString().replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
}

function writeCsv(filename: string, headers: string[], rows: any[]) {
    const headerLine = headers.join(',');
    const lines = rows.map(r => {
        return headers.map(h => {
            const val = r[h];
            if (val === undefined || val === null) return '';
            const str = String(val);
            if (str.includes(',')) return `"${str}"`;
            return str;
        }).join(',');
    });

    const content = [headerLine, ...lines].join('\n');
    fs.writeFileSync(path.join(OUT_DIR, filename), content, 'utf-8');
    console.log(`✅ Generated: ${filename} (${rows.length} rows)`);
}

// Filter out common non-price items (accessories, services, maintenance)
function isExcludedItem(category: string, item: string): boolean {
    // Strip all non-alphanumeric (keep Hangul)
    const raw = (category + " " + item).replace(/[^가-힣0-9a-zA-Z]/g, '');

    // Management Fees
    if (raw.includes('관리비')) return true;

    // Stones / Markers / Nameplates
    if (raw.includes('석물') || raw.includes('비석') || raw.includes('상석') ||
        raw.includes('표지석') || raw.includes('명패') || raw.includes('위패') || raw.includes('각인')) return true;

    // Ritual / Service / Labor
    if (raw.includes('제례') || raw.includes('제사') || raw.includes('안장') ||
        raw.includes('작업') || raw.includes('이장') || raw.includes('개장')) return true;

    // Flowers / Decor / Supplies
    if (raw.includes('꽃') || raw.includes('화병') || raw.includes('조화') ||
        raw.includes('헌화') || raw.includes('액자') || raw.includes('사진') ||
        raw.includes('국화') || raw.includes('카네이션') || raw.includes('장식') || raw.includes('조명')) return true;

    // Urns / Caskets (Supplies)
    if (raw.includes('유골함') || raw.includes('봉안함') || raw.includes('자연함')) return true;

    // Consumables (Ritual food/drink, mats)
    if (raw.includes('소주') || raw.includes('정종') || raw.includes('포') || raw.includes('돗자리')) return true;

    // Broad Categories
    if (raw.includes('부대비용')) return true;

    return false;
}

// ------------------------------------------------------------------
// 1. Analyze Cremation (General)
// Logic: Extract Resident vs Non-Resident
// ------------------------------------------------------------------
function analyzeCremation() {
    const file = path.join(DATA_DIR, 'pricing_cremation.csv');
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf-8');
    const records: RawPricingRow[] = parse(content, { columns: true, skip_empty_lines: true });

    const grouped: Record<string, { ParkName: string, Resident: number[], NonResident: number[] }> = {};

    records.forEach(row => {
        // FILTER INVALID ROWS
        if (row.RawText && row.RawText.includes("한국장례문화진흥원")) return;
        if (row.Price === '1475') return; // This is a known footer value from scraping
        if (isExcludedItem(row.Category || '', row.ItemName || '')) return;

        const item = row.ItemName || '';
        const price = cleanPrice(row.Price);

        // Filter: Focus on Adult/General (Exclude Child, Stillborn, etc if possible)
        // Usually contains "대인", "15세 이상" or just "일반"
        if (item.includes('소인') || item.includes('아동') || item.includes('유아') || item.includes('태아') || item.includes('개장유골') || item.includes('사산아')) {
            return;
        }

        const id = row.ParkID;
        if (!grouped[id]) grouped[id] = { ParkName: row.ParkName, Resident: [], NonResident: [] };

        // Classify Resident vs Non-Resident
        if (item.includes('관내') || item.includes('도민') || item.includes('시민') || item.includes('구민')) {
            // Check if it implies "Not" Resident (e.g. "관내 아님" - unlikely phrasing but "준관내" exists)
            // "준관내" or "인접" is usually higher than Resident but lower than Outsider. Treat as Resident tier or separate?
            // For simplicity, lowest price containing "관내" is Resident Fee.
            grouped[id].Resident.push(price);
        } else if (item.includes('관외') || item.includes('타지역')) {
            grouped[id].NonResident.push(price);
        } else {
            // Fallback: if "일반" and not marked as resident/non-resident? 
            // Usually cremation centers correspond to "Resident" vs "Non-Resident".
            // If unlabeled, maybe add to both or ignore?
            // Let's assume unlabeled is "Standard" (likely non-resident price or flat fee).
            grouped[id].NonResident.push(price);
        }
    });

    const outputRows = Object.entries(grouped).map(([id, data]) => {
        const resMin = data.Resident.length > 0 ? Math.min(...data.Resident) : 0;
        const nonResMin = data.NonResident.length > 0 ? Math.min(...data.NonResident) : 0;

        return {
            ParkID: id,
            ParkName: data.ParkName,
            ResidentFee: resMin,
            NonResidentFee: nonResMin
        };
    });

    writeCsv('analyzed_pricing_cremation.csv', ['ParkID', 'ParkName', 'ResidentFee', 'NonResidentFee'], outputRows);
}

// ------------------------------------------------------------------
// 2. Analyze Enshrinement (Bongan - Charnel House)
// ------------------------------------------------------------------
function analyzeEnshrinement() {
    const file = path.join(DATA_DIR, 'pricing_enshrinement.csv');
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf-8');
    const records: RawPricingRow[] = parse(content, { columns: true, skip_empty_lines: true });

    const grouped: Record<string, { ParkName: string, Prices: number[] }> = {};

    records.forEach(row => {
        // FILTER INVALID ROWS
        if (row.RawText && row.RawText.includes("한국장례문화진흥원")) return;
        if (row.Price === '1475') return; // This is a known footer value from scraping
        if (isExcludedItem(row.Category || '', row.ItemName || '')) return;

        // Enshrinement fees are usually "Anchi-dan" usage fees.
        // Some might be Management fees ("Gwanli-bi"). 
        // Filter for Usage Fees.
        if (row.Category && row.Category.includes('관리비')) return;
        if (row.ItemName && row.ItemName.includes('관리비')) return;

        const price = cleanPrice(row.Price);
        if (price === 0) return;

        const id = row.ParkID;
        if (!grouped[id]) grouped[id] = { ParkName: row.ParkName, Prices: [] };
        grouped[id].Prices.push(price);
    });

    const outputRows = Object.entries(grouped).map(([id, data]) => {
        const minAttr = data.Prices.length > 0 ? Math.min(...data.Prices) : 0;
        const maxAttr = data.Prices.length > 0 ? Math.max(...data.Prices) : 0;

        return {
            ParkID: id,
            ParkName: data.ParkName,
            MinPrice: minAttr,
            MaxPrice: maxAttr,
            Label: minAttr === maxAttr ? `${minAttr}` : `${minAttr}~${maxAttr}`
        };
    });

    writeCsv('analyzed_pricing_enshrinement.csv', ['ParkID', 'ParkName', 'MinPrice', 'MaxPrice', 'Label'], outputRows);
}

// ------------------------------------------------------------------
// 3. Analyze Natural Burial (Sumok/Jayeon)
// ------------------------------------------------------------------
function analyzeNatural() {
    const file = path.join(DATA_DIR, 'pricing_natural.csv');
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf-8');
    const records: RawPricingRow[] = parse(content, { columns: true, skip_empty_lines: true });

    const grouped: Record<string, { ParkName: string, Joint: number[], Individual: number[], Couple: number[] }> = {};

    records.forEach(row => {
        // FILTER INVALID ROWS
        if (row.RawText && row.RawText.includes("한국장례문화진흥원")) return;
        if (row.Price === '1475') return; // This is a known footer value from scraping
        if (isExcludedItem(row.Category || '', row.ItemName || '')) return;

        if (row.Category && row.Category.includes('관리비')) return;

        const item = row.ItemName || '';
        const price = cleanPrice(row.Price);
        if (price === 0) return;

        const id = row.ParkID;
        if (!grouped[id]) grouped[id] = { ParkName: row.ParkName, Joint: [], Individual: [], Couple: [] };

        if (item.includes('부부') || item.includes('2인') || item.includes('가족')) {
            grouped[id].Couple.push(price);
        } else if (item.includes('공동') || item.includes('합동') || item.includes('대지')) {
            grouped[id].Joint.push(price);
        } else if (item.includes('개인') || item.includes('1인') || item.includes('단독')) {
            grouped[id].Individual.push(price);
        } else {
            // Unclassified, put in Individual if not specified? 
            // Or ignore? Let's assume standard is individual.
            grouped[id].Individual.push(price);
        }
    });

    const outputRows = Object.entries(grouped).map(([id, data]) => {
        const jointMin = data.Joint.length > 0 ? Math.min(...data.Joint) : '';
        const indMin = data.Individual.length > 0 ? Math.min(...data.Individual) : '';
        const coupleMin = data.Couple.length > 0 ? Math.min(...data.Couple) : '';

        return {
            ParkID: id,
            ParkName: data.ParkName,
            JointMinPrice: jointMin,
            IndividualMinPrice: indMin,
            CoupleMinPrice: coupleMin
        };
    });

    writeCsv('analyzed_pricing_natural.csv', ['ParkID', 'ParkName', 'JointMinPrice', 'IndividualMinPrice', 'CoupleMinPrice'], outputRows);
}

// ------------------------------------------------------------------
// 4. Analyze Cemetery (Gongwon/Burial)
// ------------------------------------------------------------------
function analyzeCemetery() {
    const file = path.join(DATA_DIR, 'pricing_cemetery.csv');
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf-8');
    const records: RawPricingRow[] = parse(content, { columns: true, skip_empty_lines: true });

    const grouped: Record<string, { ParkName: string, LandFee: number[] }> = {};

    records.forEach(row => {
        // FILTER INVALID ROWS
        if (row.RawText && row.RawText.includes("한국장례문화진흥원")) return;
        if (row.Price === '1475') return; // This is a known footer value from scraping
        if (isExcludedItem(row.Category || '', row.ItemName || '')) return;

        // Exclude management fees, stone costs, etc.
        const cat = row.Category || '';
        const item = row.ItemName || '';

        if (cat.includes('관리비') || item.includes('관리비')) return;
        if (cat.includes('석물') || item.includes('석물') || item.includes('상석') || item.includes('비석')) return;
        if (item.includes('작업비') || item.includes('제례비')) return;

        const price = cleanPrice(row.Price);
        if (price === 0) return;

        const id = row.ParkID;
        if (!grouped[id]) grouped[id] = { ParkName: row.ParkName, LandFee: [] };

        grouped[id].LandFee.push(price);
    });

    const outputRows = Object.entries(grouped).map(([id, data]) => {
        const minFee = data.LandFee.length > 0 ? Math.min(...data.LandFee) : 0;

        return {
            ParkID: id,
            ParkName: data.ParkName,
            MinLandFee: minFee
        };
    });

    writeCsv('analyzed_pricing_cemetery.csv', ['ParkID', 'ParkName', 'MinLandFee'], outputRows);
}

// Run All
console.log('🚀 Starting Pricing Analysis...');
analyzeCremation();
analyzeEnshrinement();
analyzeNatural();
analyzeCemetery();
console.log('✅ All done.');
