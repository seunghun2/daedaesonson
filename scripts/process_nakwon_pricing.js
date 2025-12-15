const fs = require('fs');
const path = require('path');

// 1. Read Nakwon Data
const nakwonPath = path.join(__dirname, 'nakwon_full_prices.json');
if (!fs.existsSync(nakwonPath)) {
    console.error('Error: nakwon_full_prices.json not found');
    process.exit(1);
}
const nakwonData = JSON.parse(fs.readFileSync(nakwonPath, 'utf8'));

// 2. Initialize Pricing Structure
const pricing = {
    '매장묘': { rows: [], unit: '원' },
    '봉안당': { rows: [], unit: '원' },
    '수목장/자연장': { rows: [], unit: '원' },
    '옵션/기타': { rows: [], unit: '원' }
};

// 3. Classify Items
nakwonData.items.forEach(item => {
    const name = item.name;
    const desc = item.detail || '';
    const row = {
        name: name,
        price: item.price,
        description: desc,
        isRepresentative: false
    };

    // Keyword based classification
    // Prioritize specific types
    if (name.includes('매장묘') || name.includes('봉분')) {
        pricing['매장묘'].rows.push(row);
    }
    else if (name.includes('평장')) {
        // 평장묘 is tricky, often categorized with natural burial or cemetery.
        // Given '수목형 평장묘' exists, let's put it in Nature/Tree for now, or check if user prefers Cemetery.
        // User's previous request implied 'Grade' and 'Price' structure.
        // Let's stick to '매장묘' for pure burial-like names, and '수목장' for nature-like.

        // If name has '수목형', go to 수목장
        if (name.includes('수목')) {
            pricing['수목장/자연장'].rows.push(row);
        } else {
            // "평장묘", "담장형 평장묘" -> usually considered modern cemetery (매장묘) or separate.
            // Let's put in '매장묘' as it uses stone markers often.
            pricing['매장묘'].rows.push(row);
        }
    }
    else if (name.includes('수목') || name.includes('자연장') || name.includes('잔디') || name.includes('화초') || name.includes('플라타너스') || name.includes('다알리아') || name.includes('클로버') || name.includes('아이리스')) {
        pricing['수목장/자연장'].rows.push(row);
    }
    else if (name.includes('봉안당') || name.includes('안치단') || name.includes('청여')) { // '청여'는 봉안담 이름인듯 (가격대 1700만~)
        pricing['봉안당'].rows.push(row);
    }
    else {
        // Options, Management, Stone, etc.
        pricing['옵션/기타'].rows.push(row);
    }
});

// 4. Set Representative (Heuristic)
// 매장묘: 개인 매장묘 3평형 -> Representative
const repMaejang = pricing['매장묘'].rows.find(r => r.name.includes('개인 매장묘'));
if (repMaejang) repMaejang.isRepresentative = true;

// 봉안당: 청여1 (4~8위) or similar. If ambiguous, skip.

// 수목장: 수목형 평장묘
const repTree = pricing['수목장/자연장'].rows.find(r => r.name.includes('수목형 평장묘'));
if (repTree) repTree.isRepresentative = true;


// 5. Output for review
console.log(JSON.stringify(pricing, null, 2));

// 6. (Optional) Save to dry run file
fs.writeFileSync('nakwon_pricing_dry_run.json', JSON.stringify(pricing, null, 2));
