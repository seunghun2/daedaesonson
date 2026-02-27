const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let subTypeCount = 0;
let groupTypeCount = 0;
let nameCount = 0;

// "분양금액" 제거 함수 - 앞뒤 공백도 정리
function removeBunyangText(str) {
    if (!str) return str;
    return str
        .replace(/\s*분양금액\s*/g, '')  // "분양금액" 제거
        .replace(/\s+/g, ' ')            // 다중 공백 정리
        .trim();
}

data.forEach(park => {
    if (!park.priceInfo || !park.priceInfo.standardizedPrices) return;

    park.priceInfo.standardizedPrices.forEach(sp => {
        // subType에서 제거
        if (sp.subType && sp.subType.includes('분양금액')) {
            const before = sp.subType;
            sp.subType = removeBunyangText(sp.subType);
            console.log(`[${park.id}] subType: "${before}" → "${sp.subType}"`);
            subTypeCount++;
        }

        // rows 내 groupType, name에서 제거
        if (sp.rows) {
            sp.rows.forEach(row => {
                if (row.groupType && row.groupType.includes('분양금액')) {
                    const before = row.groupType;
                    row.groupType = removeBunyangText(row.groupType);
                    console.log(`[${park.id}] groupType: "${before}" → "${row.groupType}"`);
                    groupTypeCount++;
                }
                if (row.name && row.name.includes('분양금액')) {
                    const before = row.name;
                    row.name = removeBunyangText(row.name);
                    console.log(`[${park.id}] name: "${before}" → "${row.name}"`);
                    nameCount++;
                }
            });
        }
    });
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log(`\n✅ 완료: subType ${subTypeCount}건, groupType ${groupTypeCount}건, name ${nameCount}건 수정`);
