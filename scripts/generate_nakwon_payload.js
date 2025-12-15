const fs = require('fs');
const path = require('path');

// 1. Read Nakwon Data
const nakwonPath = path.join(__dirname, '../nakwon_full_prices.json');
if (!fs.existsSync(nakwonPath)) {
    console.error('Error: nakwon_full_prices.json not found');
    process.exit(1);
}
const nakwonData = JSON.parse(fs.readFileSync(nakwonPath, 'utf8'));

const facilityId = 'park-0001';
const rows = [];

// 2. Classify Items & Create Rows matches Pricing V3 Structure
nakwonData.items.forEach((item, index) => {
    const name = item.name.trim();
    const desc = item.detail ? item.detail.trim() : '';
    let category = '기타';

    // Classification Logic matches User's View
    if (name.includes('다알리아') || name.includes('아이리스') || name.includes('플라타너스') || name.includes('클로버') || name.includes('봉안당') || name.includes('안치단') || name.includes('청여')) {
        category = '봉안당';
    }
    else if (name.includes('수목') || name.includes('정원형') || name.includes('잔디') || name.includes('화초')) {
        category = '수목장';
    }
    else if (name.includes('매장묘') || name.includes('봉분')) {
        category = '매장묘';
    }
    else if (name.includes('평장')) {
        // Based on UI screenshot, '프리미엄 부부 평장묘', '부부 수목형 평장묘' are in 수목장 section or similar.
        // But let's check keywords. '수목형' is already caught above.
        // '담장형 평장묘' -> Likley 수목장/자연장 category in this context (modern park).
        category = '수목장';
    }
    else if (name.includes('관리비') || name.includes('작업비') || name.includes('상석') || name.includes('비석') || name.includes('식당') || name.includes('개장') || name.includes('유골함') || name.includes('석물') || name.includes('표석') || name.includes('각자대') || name.includes('의전') || name.includes('제거') || name.includes('식재') || name.includes('철거') || name.includes('화분') || name.includes('향로') || name.includes('석곽') || name.includes('석관') || name.includes('구판') || name.includes('갓') || name.includes('판석') || name.includes('야간') || name.includes('메탈포토') || name.includes('천막') || name.includes('조경')) {
        category = '옵션';
    }

    const row = {
        id: `${facilityId}_${category}_${index}_${Date.now()}`, // Unique ID generation
        facilityId: facilityId,
        facilityName: '(재)낙원추모공원',
        category: category,
        name: name,
        desc: desc, // Maps 'detail' to 'desc'
        price: item.price,
        isDeleted: false,
        isRepresentative: false
    };
    rows.push(row);
});

// 3. Set Representative (Match Screenshot)
// 매장묘: 개인 매장묘 (3평형)
const repMaejang = rows.find(r => r.name === '개인 매장묘 (3평형)');
if (repMaejang) repMaejang.isRepresentative = true;

// 봉안당: 다알리아 (단품) - 3,500,000 (Cheapest/First in list usually)
const repBong = rows.find(r => r.name === '다알리아(단품)');
if (repBong) repBong.isRepresentative = true;

// 수목장: 부부 수목형 평장묘 - 8,500,000
const repTree = rows.find(r => r.name === '부부 수목형 평장묘');
if (repTree) repTree.isRepresentative = true;

// 4. Output Payload
const payload = {
    facilityId: facilityId,
    rows: rows
};

console.log(JSON.stringify(payload, null, 2));
