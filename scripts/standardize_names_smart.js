const fs = require('fs');
const path = require('path');

const PRICING_DB_PATH = path.join(__dirname, '../data/pricing_db.json');

// --- Configuration ---
// Exclude items if they contain these keywords in Name or Category
const BLACKLIST_KEYWORDS = [
    '관리비', '작업', '석물', '식대', '식당', '각자', '화장',
    '안치', '모시는', '제거', '식재', '수선', '철거', '운구',
    '임시', '사용료', '비석', '상석', '둘레석', '묘테', '평장상석',
    '와비', '표석', '월석', '걸방석', '성경', '명패', '유골함',
    '부대비용', '용품', '장례용품', '제례', '이장', '개장', '가봉분',
    '충곽', '파묘', '매매', '임대', '전지', '벌초', '제초'
];

const BLACKLIST_CATEGORIES = [
    '관리비', '석물비', '작업비', '부대비용', '용품', '식대', '장례용품', '제례비'
];

// Type Mappings
const TYPE_MAP = {
    '봉안묘': ['봉안묘'],
    '봉안당': ['봉안', '단', '납골', '안치단', '부부단', '개인단', '특별단', '부부단', '영구단'],
    '수목장': ['수목', '자연', '잔디', '화초', '나무', '공동목', '부부목', '가족목'],
    '평장묘': ['평장'], // Flat Grave distinct from Tree/Natural? Usually mixed context. keeping distinct for now.
    '매장묘': ['매장', '묘지', '봉분', '합장', '단장', '쌍분', '석관', '매장묘']
};

// Capacity Mappings
const CAPACITY_MAP = {
    '가족': ['가족', '패밀리', '문중', '종중', '단체', '4위', '6위', '8위', '12위', '16위', '24위', '30위', '50위', '100위'],
    '부부': ['부부', '2위', '2기', '쌍분', '합장'],
    '개인': ['개인', '1위', '1기', '단장', '독분', '홀', '1단', '2단', '3단', '4단', '5단', '6단', '7단', '8단', '9단'], // Tiers -> Individual
    '공동': ['공동', '합동']
};

// Premium Keywords
const PREMIUM_KEYWORDS = ['특별', 'VIP', '로얄', '임페리얼', '프리미엄', '노블', '특실', '왕실', '고급', '최고급'];

function standardizeNames() {
    console.log('🔄 Loading pricing database...');
    let pricingData = [];
    try {
        pricingData = JSON.parse(fs.readFileSync(PRICING_DB_PATH, 'utf-8'));
    } catch (err) {
        console.error('Failed to load pricing_db.json', err);
        return;
    }

    let keptCount = 0;
    let blankedCount = 0;

    const newPricingData = pricingData.map(item => {
        // Source is itemName (assuming it's the latest valid name)
        // Ensure itemName1 is reset first
        let standardName = "";

        const rawName = (item.itemName || "").trim();
        const rawCat2 = (item.category2 || "").trim();
        const fullText = (rawCat2 + " " + rawName);

        // 1. Blacklist Check
        const isBlacklisted = BLACKLIST_KEYWORDS.some(k => rawName.includes(k)) ||
            BLACKLIST_CATEGORIES.some(c => rawCat2.includes(c));

        if (!isBlacklisted) {
            // 2. Detect Type
            let type = "";

            // Check ItemName First
            for (const [t, keywords] of Object.entries(TYPE_MAP)) {
                if (keywords.some(k => rawName.includes(k))) {
                    type = t;
                    break;
                }
            }

            // Fallback to Category2
            if (!type) {
                // Heuristic: map category names to types
                if (rawCat2.includes('봉안')) type = '봉안당'; // 봉안묘 usually explicit in name
                else if (rawCat2.includes('납골')) type = '봉안당';
                else if (rawCat2.includes('매장')) type = '매장묘';
                else if (rawCat2.includes('묘지')) type = '매장묘';
                else if (rawCat2.includes('수목')) type = '수목장';
                else if (rawCat2.includes('자연')) type = '수목장';
                else if (rawCat2.includes('평장')) type = '평장묘';
            }

            // Fallback to Category1 (parsed earlier)
            if (!type && item.category1) {
                const c1 = item.category1.split(',')[0].trim(); // Use first if mixed
                type = c1;
            }

            // 3. Detect Capacity
            let capacity = "";
            for (const [c, keywords] of Object.entries(CAPACITY_MAP)) {
                if (keywords.some(k => rawName.includes(k))) {
                    capacity = c;
                    break;
                }
            }

            // Pyeong Detection (for Grave)
            if (!capacity && type === '매장묘') {
                const pyeongMatch = rawName.match(/(\d+(\.\d+)?)평/);
                if (pyeongMatch) {
                    const p = parseFloat(pyeongMatch[1]);
                    if (p <= 3) capacity = `개인`; // Small typically individual? Or 1-pyeong.
                    else if (p > 3 && p <= 6) capacity = `부부`;
                    else capacity = `가족`;

                    // Allow explicit Pyeong display if preferred
                    // capacity = `${pyeongMatch[0]}형`; 
                }
            }

            // 4. Detect Premium
            const isPremium = PREMIUM_KEYWORDS.some(k => rawName.toUpperCase().includes(k));

            // 5. Formulate Name
            if (type) {
                let suffix = "";
                if (capacity) suffix = capacity;
                else if (isPremium) suffix = "고급";
                else suffix = "기본";

                standardName = `${type} (${suffix})`;
            }
            // If still no type found (e.g. "General Management"), it remains empty -> blanked.
        }

        if (standardName) keptCount++;
        else blankedCount++;

        return {
            ...item,
            itemName1: standardName
        };
    });

    console.log(`💾 Saving... Kept (Products): ${keptCount}, Blanked (Extras): ${blankedCount}`);
    fs.writeFileSync(PRICING_DB_PATH, JSON.stringify(newPricingData, null, 2));

    // Preview
    console.log("--- Preview Top 20 Standard Names ---");
    const preview = new Set();
    newPricingData.forEach(i => {
        if (i.itemName1 && preview.size < 20) preview.add(i.itemName1);
    });
    console.log(Array.from(preview).join('\n'));
    console.log("-------------------------------------");
}

standardizeNames();
