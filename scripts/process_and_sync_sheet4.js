const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// --- CONFIG ---
const SHEET_ID = '1de1ZjYEp7E8rSnwGmCJjcXWfCFZ5GyBP_NZcnA7lOko';
const TARGET_SHEET_TITLE = '시트3';
const SOURCE_FILE = 'data/pricing_class_final.json';
const CREDENTIALS_PATH = 'credentials.json';
const GEMINI_RESULTS_PATH = 'data/gemini_results.json';

// --- LOGIC HELPER ---
function loadGeminiResults() {
    if (fs.existsSync(GEMINI_RESULTS_PATH)) {
        const raw = fs.readFileSync(GEMINI_RESULTS_PATH, 'utf8');
        try {
            return JSON.parse(raw);
        } catch (e) { return []; }
    }
    return [];
}
const geminiResults = loadGeminiResults();
const geminiMap = {}; // { '123': '봉안당...' }
geminiResults.forEach(r => geminiMap[r.id] = r.result);
function determineCategory(text, parkName) {
    if (!text) return '기타';

    // Explicit Keywords
    if (text.includes('수목') || text.includes('자연') || text.includes('잔디') || text.includes('화초')) return '수목장';
    if (text.includes('봉안') || text.includes('납골') || text.includes('담') || text.includes('부부단') || text.includes('개인단')) return '봉안당';
    if (text.includes('매장') || text.includes('묘지') || text.includes('봉분') || text.includes('평장') || text.includes('합장') || text.includes('쌍분')) return '공원묘지';

    // Fallback based on typical fees
    if (text.includes('관리비') || text.includes('임대료')) return '기타(관리비)';

    return '기타';
}

async function main() {
    console.log(`🚀 Processing & Syncing to "${TARGET_SHEET_TITLE}"...`);

    // 1. Load & Process Data
    const rawData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

    // Pass 1: Determine category1 (Item Category) for all rows
    rawData.forEach(item => {
        let catText = (item.rawText || '') + ' ' + (item.itemName2 || '');
        let detected = determineCategory(catText, item.parkName);

        if (detected === '기타') {
            if (item.parkName.includes('수목장') || item.parkName.includes('자연장') || item.parkName.includes('림')) detected = '수목장';
            else if (item.parkName.includes('납골') || item.parkName.includes('봉안') || item.parkName.includes('추모') || item.parkName.includes('영락')) detected = '봉안당';
            else if (item.parkName.includes('묘지') || item.parkName.includes('묘원') || item.parkName.includes('공원')) detected = '공원묘지';
        }
        item.category1 = detected;
    });

    // Pass 2: Aggregate & Determine Category 0 (Allow Multiple)
    const parkCategories = {};

    rawData.forEach(item => {
        const name = item.parkName;
        if (!parkCategories[name]) parkCategories[name] = new Set();

        let c1 = item.category1 || '';

        // Map detailed items to Big 3 Categories
        if (c1.includes('수목') || c1.includes('자연') || c1.includes('잔디')) parkCategories[name].add('수목장');
        else if (c1.includes('봉안') || c1.includes('납골') || c1.includes('추모')) parkCategories[name].add('봉안당');
        else if (c1.includes('묘지') || c1.includes('매장') || c1.includes('공원')) parkCategories[name].add('공원묘지');
    });

    // Finalize Category 0:
    // If multiple exist (e.g. Park & Charnel), keep both -> "공원묘지, 봉안당"
    // If NONE exist, infer from Park Name.
    Object.keys(parkCategories).forEach(name => {
        const cats = parkCategories[name];

        // If empty, infer from Name
        if (cats.size === 0) {
            if (name.includes('수목') || name.includes('자연') || name.includes('숲')) cats.add('수목장');
            else if (name.includes('납골') || name.includes('봉안') || name.includes('추모') || name.includes('영락') || name.includes('스카이')) cats.add('봉안당');
            else if (name.includes('묘지') || name.includes('묘원')) cats.add('공원묘지');

            // Still empty? Default to Grave
            if (cats.size === 0) cats.add('공원묘지');
        }

        // Sort order: Grave > Charnel > Tree
        // (But user wanted multiple handling, comma separated)
    });

    // Pass 3: Assign category0 to all rows
    // Sorting Order for Summary: 공원묘지 > 봉안당 > 수목장
    const sortOrder = ['공원묘지', '봉안당', '수목장'];

    let processedData = rawData.map(item => {
        const cats = Array.from(parkCategories[item.parkName] || []);
        cats.sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b));

        let price = parseInt(item.price) || 0;

        // CLEANING RULE: If price ends in 1 (e.g. 30001), change to 0 (30000)
        if (price % 10 === 1) {
            price -= 1;
        }

        return {
            ...item,
            parkId: item.parkId || item.id, // Ensure parkId exists
            price: price, // Updated cleaned price
            category0: cats.join(', '), // Column D
            // Ensure category1 is Column E
        };
    });

    // Helper to remove trailing price-like numbers
    function removeTrailingPrice(text) {
        if (!text) return '';
        // Regex: Matches sequence of digits/commas/spaces at the end of string
        return text.replace(/[\s,0-9]+원?$/, '').trim();
    }

    // --- SORTING LOGIC ---
    console.log('🔄 Sorting data: Park -> [Grave, Charnel, Tree, Other] -> Price...');

    const CATEGORY_ORDER = ['공원묘지', '봉안당', '수목장']; // Others will get index -1 -> handled to be last

    processedData.sort((a, b) => {
        // 1. Park ID (Ascending)
        const parkIdA = parseInt(String(a.parkId).replace(/[^0-9]/g, '')) || 0;
        const parkIdB = parseInt(String(b.parkId).replace(/[^0-9]/g, '')) || 0;
        if (parkIdA !== parkIdB) return parkIdA - parkIdB;

        // 2. Category Priority (Specific Order)
        let catA = a.category1 || '';
        let catB = b.category1 || '';

        // If category is vague/empty, treat as Other
        if (!CATEGORY_ORDER.includes(catA)) catA = '기타';
        if (!CATEGORY_ORDER.includes(catB)) catB = '기타';

        // Get index (0, 1, 2). '기타' is getting a high number to be last.
        let idxA = CATEGORY_ORDER.indexOf(catA);
        let idxB = CATEGORY_ORDER.indexOf(catB);

        // If '기타' (not in list), give it rank 99
        if (idxA === -1) idxA = 99;
        if (idxB === -1) idxB = 99;

        if (idxA !== idxB) return idxA - idxB;

        // 3. Price (Ascending: Low -> High) - As a final tie-breaker
        return a.price - b.price;
    });

    // Helper to detect Location (Gwan-nae/Gwan-oe)
    function detectLocation(text) {
        if (!text) return '';
        if (text.includes('관내') || text.includes('지역내') || text.includes('해당지역') || text.includes('시민')) return '관내';
        if (text.includes('관외') || text.includes('타지역') || text.includes('지역외') || text.includes('타시')) return '관외';
        return '';
    }

    // Clean Text & Detect Location
    processedData = processedData.map(item => {
        // Just clean independently
        let newItemName2 = removeTrailingPrice(item.itemName2);
        let newRawText = removeTrailingPrice(item.rawText);

        // Detect Category 3 from combined text context
        const contextText = (newItemName2 + ' ' + newRawText).trim();
        const cat3 = detectLocation(contextText) || item.category3 || '';

        // SMART CLEANUP: Separate Title vs Note
        // 1. If Title is empty but RawText exists, move RawText to Title
        if (!newItemName2 && newRawText) {
            newItemName2 = newRawText;
            newRawText = '';
        }
        // 2. If Title and RawText are identical, clear RawText to avoid redundancy
        if (newItemName2 === newRawText) {
            newRawText = '';
        }

        // FOOTER DETECTION (Garbage Data)
        const combined = (newItemName2 + newRawText).replace(/\s/g, '');
        if (combined.includes('한국장례문화진흥원') || combined.includes('1577-4129') || combined.includes('인농빌딩')) {
            return {
                ...item,
                category1: '정보없음',
                category2: '',
                category3: '정보없음',
                itemName2: '정보없음',
                rawText: '자동 추출 실패 (푸터 텍스트)',
                price: 0
            };
        }

        return {
            ...item,
            itemName2: newItemName2,
            rawText: newRawText,
            category3: cat3
        };
    });

    // 2. Auth & Connect
    const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const serviceAccountAuth = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    // 3. Prepare Sheet
    let sheet = doc.sheetsByTitle[TARGET_SHEET_TITLE];
    if (!sheet) {
        sheet = await doc.addSheet({ title: TARGET_SHEET_TITLE });
    } else {
        await sheet.clear();
    }

    // 4. Force Column Order (A, B, C, D, E...)
    const headers = [
        'id',               // A
        'parkName',         // B
        'parkId',           // C (Optional, inserting to shift columns if needed, or institutionType)
        'institutionType',  // C (Let's stick to user's implied layout)
        'category0',        // D (종합: 공원묘지, 봉안당)
        'category0_1',      // <--- AI Image Analysis
        'category1',        // E (개별: 공원묘지)
        'category2',        // F
        'category3',        // <--- Added logic here
        '제목',             // G (Renamed from itemName2)
        '비고',             // H (Renamed from rawText)
        'price'             // I
    ];

    console.log('📝 Setting Headers:', headers);
    await sheet.setHeaderRow(headers);

    // 5. Upload
    console.log('📤 Uploading processed data...');
    const BATCH_SIZE = 500;
    for (let i = 0; i < processedData.length; i += BATCH_SIZE) {
        const chunk = processedData.slice(i, i + BATCH_SIZE);
        const rows = chunk.map(item => ({
            id: item.id || '',
            parkName: item.parkName || '',
            parkId: item.parkId || item.id, // Fallback
            institutionType: item.institutionType || '',
            category0: Array.from(parkCategories[item.parkName] || []).join(', ') || '',
            category0_1: geminiMap[item.parkId || item.id] || '', // AI Analysis Result
            category1: item.category1 || '',
            category2: item.category2 || '',
            category3: item.category3 || '', // Map it
            '제목': item.itemName2 || '', // Map to Korean header
            '비고': item.rawText || '', // Map to '비고'
            price: item.price || ''
        }));

        await sheet.addRows(rows);
        console.log(`   Processed ${Math.min(i + BATCH_SIZE, processedData.length)} / ${processedData.length}...`);
    }

    console.log('✨ Done! Check logic for Col D and E.');
}

main().catch(console.error);
