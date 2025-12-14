const fs = require('fs');
const path = require('path');

const PRICING_DB_PATH = path.join(__dirname, '../data/pricing_db.json');
const FACILITIES_PATH = path.join(__dirname, '../data/facilities.json');

// --- 5. Blacklist (Absolute Exclusion) ---
const BLACKLIST_KEYWORDS = [
    '관리비', '연관리비', '유지비',
    '옵션', '추가', '선택',
    '석물', '비석', '상석', '시공', '설치', '둘레석', '묘테',
    '운반', '인도', '수수료',
    '연장', '갱신',
    '납골함', '유골함', '명패',
    '기본 1평', '이론상', '참고', // Formal minimums
    '식대', '작업', '개장', '이장', '화장', '안치', '제례'
];

const BLACKLIST_CATEGORIES = [
    '관리비', '석물비', '작업비', '부대비용', '용품', '식대', '장례용품', '제례비'
];

// --- 2. Category Keywords ---
const KEYWORDS_MAEJANG = ['매장', '묘지', '단장', '합장', '봉분', '평장']; // '평장' is tricky, context matters.
const KEYWORDS_BONGAN = ['봉안', '납골', '안치단', '부부단', '개인단'];
const KEYWORDS_SUMOK = ['수목', '자연장', '잔디', '화초', '나무'];

// Helper: Parse Korean Price String (e.g. "1,500,000" -> 1500000)
function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const num = parseInt(priceStr.toString().replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
}

// Helper: Extract Area (Pyeong)
function extractArea(name) {
    const match = name.match(/(\d+(\.\d+)?)평/);
    if (match) return parseFloat(match[1]);
    return null;
}

function calculateRepresentative() {
    console.log('🔄 Loading data...');
    const pricingData = JSON.parse(fs.readFileSync(PRICING_DB_PATH, 'utf-8'));
    // const facilitiesData = JSON.parse(fs.readFileSync(FACILITIES_PATH, 'utf-8')); // If needed for extra metadata

    // Group by Park
    const parkGroups = {};
    pricingData.forEach((item, index) => {
        if (!parkGroups[item.parkId]) parkGroups[item.parkId] = {
            name: item.parkName,
            institutionType: item.institutionType,
            items: []
        };
        // Store reference to original item + index for updating
        parkGroups[item.parkId].items.push({ ...item, originalIndex: index });
    });

    const updates = new Map(); // index -> newItemName1

    Object.values(parkGroups).forEach(park => {
        // --- 3.1 Public vs Private Determination ---
        let isPublic = false;
        if (park.institutionType === '공설') isPublic = true;
        // Fallback check by name
        else if (['공설', '시립', '군립', '구립', '추모공원'].some(k => park.name.includes(k))) {
            // '추모공원' is ambiguous (many private ones imply public-sounding names).
            // Better stick to strict DB field or explicit public keywords.
            if (park.name.includes('공설') || park.name.includes('시립') || park.name.includes('군립')) {
                isPublic = true;
            }
        }

        // --- 3.1 Standard Area ---
        const targetArea = isPublic ? 1.5 : 3.0;

        // Categorize Items
        const cats = { maejang: [], bongan: [], sumok: [] };

        park.items.forEach(item => {
            // Filter Blacklist
            const rawCat = (item.category2 || '').trim();
            const rawName = (item.itemName || '').trim();
            const fullText = rawCat + ' ' + rawName;

            if (BLACKLIST_CATEGORIES.some(c => rawCat.includes(c))) return;
            if (BLACKLIST_KEYWORDS.some(k => rawName.includes(k))) return;

            const price = parsePrice(item.price);
            // Strict Filter: Price must be > 10000 (10,000 KRW) to be considering "Pricing"
            // Also exclude obvious dummy prices like 1475? No, just > 10000.
            if (price < 10000) return;

            // Classify
            let classified = false;
            // 1. Maejang
            if (KEYWORDS_MAEJANG.some(k => fullText.includes(k))) {
                // Ensure it's not Sumok-like (e.g. 수목형 평장)
                if (!fullText.includes('수목') && !fullText.includes('자연') && !fullText.includes('잔디')) {
                    const area = extractArea(rawName);
                    // Filter "1pyeong base" formal minimums if they are explicitly marked "Default" or "Base" & small?
                    // Rule 1.2: Exclude "1평 기준 기본가".
                    // Logic: If area == 1.0 AND Price is suspiciously low or categorized as "Usage Fee Only".
                    // But we excluded "Usage Fee" keyword in blacklist? No, "사용료" blacklist.
                    // If "묘지사용료 (1평)" -> Blacklisted by '사용료'. Correct.
                    // So we only look for "Product Packages" or explicit Graves.

                    cats.maejang.push({ item, price, area });
                    classified = true;
                }
            }

            // 2. Sumok (Priority over Bongan for 'Tree')
            if (!classified && KEYWORDS_SUMOK.some(k => fullText.includes(k))) {
                cats.sumok.push({ item, price });
                classified = true;
            }

            // 3. Bongan
            if (!classified && KEYWORDS_BONGAN.some(k => fullText.includes(k))) {
                cats.bongan.push({ item, price });
                classified = true;
            }
        });

        // --- Select Representatives ---

        // 1. Maejang Logic
        if (cats.maejang.length > 0) {
            let bestMaejang = null;

            // Sort keys: 
            // 1. Exact Area Match
            // 2. Larger Area (Lowest Price)
            // 3. Smaller Area (Best Rep?) -> Closest to target?

            const exactMatches = cats.maejang.filter(i => i.area === targetArea);
            if (exactMatches.length > 0) {
                exactMatches.sort((a, b) => a.price - b.price);
                bestMaejang = exactMatches[0];
            } else {
                // Larger areas
                const larger = cats.maejang.filter(i => i.area && i.area > targetArea);
                if (larger.length > 0) {
                    larger.sort((a, b) => a.price - b.price); // Lowest price of larger
                    bestMaejang = larger[0];
                } else {
                    // Smaller areas
                    const smaller = cats.maejang.filter(i => i.area && i.area < targetArea);
                    if (smaller.length > 0) {
                        smaller.sort((a, b) => Math.abs(a.area - targetArea) - Math.abs(b.area - targetArea)); // Closest to target
                        bestMaejang = smaller[0];
                    } else {
                        // Area unknown -> Lowest price but risky?
                        // If no area found, assume valid simple grave.
                        const unknownArea = cats.maejang.filter(i => !i.area);
                        if (unknownArea.length > 0) {
                            unknownArea.sort((a, b) => a.price - b.price);
                            bestMaejang = unknownArea[0];
                        }
                    }
                }
            }

            if (bestMaejang) {
                // Calculate Unit Price
                // If area unknown, cannot calc unit price. (Error condition in rule).
                // If area known, P = Price / Area.

                let label = "";
                const priceMan = Math.round(bestMaejang.price / 10000);

                if (bestMaejang.area) {
                    const unitPrice = Math.round((bestMaejang.price / bestMaejang.area) / 10000); // Manwon
                    label = `매장     ${priceMan}만원부터 (약 ${unitPrice}만원/평)`;
                } else {
                    // Rule 3.3: "Represent area required". If missing?
                    // Fallback: Display "Price Only" or Skip?
                    // Rule says "Any display error is bad".
                    // I will display price, omit unit price if strictly unknown.
                    label = `매장     ${priceMan}만원부터`;
                }

                updates.set(bestMaejang.item.originalIndex, label);
            }
        }

        // 2. Bongan Logic
        if (cats.bongan.length > 0) {
            cats.bongan.sort((a, b) => a.price - b.price);
            const best = cats.bongan[0];
            const priceMan = Math.round(best.price / 10000);
            const label = `봉안     ${priceMan}만원부터`;
            updates.set(best.item.originalIndex, label);
        }

        // 3. Sumok Logic
        if (cats.sumok.length > 0) {
            cats.sumok.sort((a, b) => a.price - b.price);
            const best = cats.sumok[0];
            const priceMan = Math.round(best.price / 10000);
            const label = `수목장   ${priceMan}만원부터`;
            updates.set(best.item.originalIndex, label);
        }
    });

    // Apply Updates to DB
    const finalData = pricingData.map((item, index) => {
        // Default to empty (Clean slate)
        let newItemName1 = "";

        if (updates.has(index)) {
            newItemName1 = updates.get(index);
        }

        return {
            ...item,
            itemName1: newItemName1
        };
    });

    console.log(`💾 Saving... Identified ${updates.size} representative items.`);
    fs.writeFileSync(PRICING_DB_PATH, JSON.stringify(finalData, null, 2));

    // Preview
    console.log("--- Preview Samples ---");
    let count = 0;
    finalData.forEach(item => {
        if (item.itemName1 && count < 10) {
            console.log(`[${item.parkName}] ${item.itemName1}`);
            count++;
        }
    });
}

calculateRepresentative();
