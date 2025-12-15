const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';

const TARGET_SHEET_TITLE = 'data_on';
const SHEET6_TITLE = '시트6';

// Columns in data_on (0-indexed)
const COL_NAME = 1; // 시설명
const COL_OPER = 3; // 운영 (Update Target)
const COL_RELI = 4; // 종교 (Update Target)
const COL_TAGS = 5; // 필터 (Source for keywords)
const COL_TITLE = 10; // 제목 (Source for Name)

async function main() {
    console.log("🚀 Starting Update of data_on (Operator/Religion)...");

    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();

    // 1. Load Sheet 6 for Verified Metadata
    console.log("📥 Loading Sheet 6 (Reference)...");
    const sheet6 = doc.sheetsByTitle[SHEET6_TITLE];
    const rows6 = await sheet6.getRows();

    // Map: Normalized Name -> { oper: '...', reli: '...' }
    const norm = (n) => n ? n.replace(/\s+/g, '').replace(/\(.*\)/g, '').trim() : "";
    const metaMap = {};

    rows6.forEach(r => {
        const name = r.get('시설명');
        if (!name) return;
        const key = norm(name);

        // Priority: Use the last non-empty value if multiple rows exist
        const oper = r.get('운영');
        const reli = r.get('종교');

        if (!metaMap[key]) metaMap[key] = { oper: '', reli: '' };
        if (oper && oper !== '-') metaMap[key].oper = oper;
        if (reli && reli !== '-') metaMap[key].reli = reli;
    });

    // 2. Load data_on
    console.log(`📥 Loading ${TARGET_SHEET_TITLE}...`);
    const sheetDataOn = doc.sheetsByTitle[TARGET_SHEET_TITLE];
    // Load generous range to cover all data
    await sheetDataOn.loadCells('A1:M9500');

    const rowCount = sheetDataOn.rowCount;
    let updateCount = 0;

    console.log(`🛠️ Processing ${rowCount} rows...`);

    for (let r = 1; r < rowCount; r++) { // Skip header
        const nameVal = sheetDataOn.getCell(r, COL_NAME).value;
        const titleVal = sheetDataOn.getCell(r, COL_TITLE).value;

        if (!nameVal && !titleVal) continue; // Skip empty rows

        const key = norm(nameVal || titleVal);
        const tags = (sheetDataOn.getCell(r, COL_TAGS).value || "") + " " + (nameVal || "") + " " + (titleVal || "");

        // A. Current Values
        let currentOper = sheetDataOn.getCell(r, COL_OPER).value;
        let currentReli = sheetDataOn.getCell(r, COL_RELI).value;

        // B. Determine New Values
        let newOper = currentOper; // Default keep
        let newReli = currentReli;

        // Source 1: Sheet 6 Map
        if (metaMap[key]) {
            if (metaMap[key].oper) newOper = metaMap[key].oper;
            if (metaMap[key].reli) newReli = metaMap[key].reli;
        }

        // Source 2: Keyword Logic (Fallback or Override if empty)
        // Operator Keywords
        if (!newOper || newOper === 'null') {
            if (tags.includes('공설') || tags.includes('시립') || tags.includes('군립')) newOper = '공설';
            else if (tags.includes('재단')) newOper = '재단법인';
            else if (tags.includes('사단')) newOper = '사단법인';
            else if (tags.includes('사설')) newOper = '사설';
        }

        // Religion Keywords (Sensitive Check)
        if (!newReli || newReli === 'null') {
            const combined = (tags + " " + nameVal + " " + titleVal).toLowerCase();

            // 1. Catholic (High Priority distinctive terms)
            if (['성당', '천주교', '가톨릭', '카톨릭', '성모', '마리아', '베드로', '바오로', '요셉', '주교', '교구', '수녀', '신부', '연령회'].some(k => combined.includes(k))) {
                newReli = '천주교';
            }
            // 2. Protestant (Common terms)
            else if (['교회', '기독', '예수', '주님', '십자가', '부활', '순복음', '장로', '감리', '성결', '침례', '은혜', '소망', '영락', '평강', '할렐루야', '동산', '사랑', '믿음', '선교', '복음', '구세군', '여호와'].some(k => combined.includes(k))) {
                newReli = '기독교';
            }
            // 3. Buddhist (Terms often found in names)
            else if (['불교', '사찰', '스님', '보살', '정사', '선원', '암', '약사', '관음', '미륵', '극락', '연화', '대웅', '탑', '조계', '천태', '진각', '태고', '원불교', '용궁', '산신', '지장', '선방', '불사'].some(k => combined.includes(k))) {
                // Warning: '암' might match '암센터' (Cancer center) but unlikely in this context. '탑' might be '탑차'.
                // Refinements: Check explicit word boundaries or strong keywords.
                // For simplicity + sensitivity requested: Match loosely but exclude safe words.
                if (!combined.includes('암센터')) newReli = '불교';
            }
            // 4. Secular/None (Explicit)
            else if (combined.includes('무관') || combined.includes('종교없음')) {
                newReli = '종교무관';
            }
        }

        // C. Update if changed and valid
        let changed = false;
        if (newOper && newOper !== currentOper) {
            sheetDataOn.getCell(r, COL_OPER).value = newOper;
            changed = true;
        }
        if (newReli && newReli !== currentReli) {
            sheetDataOn.getCell(r, COL_RELI).value = newReli;
            changed = true;
        }

        if (changed) updateCount++;
    }

    // 3. Save
    if (updateCount > 0) {
        console.log(`💾 Saving updates for ${updateCount} rows...`);
        await sheetDataOn.saveUpdatedCells();
    } else {
        console.log("✨ No updates needed.");
    }
    console.log("🎉 Done!");
}

main().catch(console.error);
