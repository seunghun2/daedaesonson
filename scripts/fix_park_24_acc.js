const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkId = 'park-0024';
const park = data.find(f => f.id === parkId);

const burialGroup = park.priceInfo.standardizedPrices.find(s => s.serviceType === 'BURIAL' && s.subType === '매장묘');
if (burialGroup) {
    const index = burialGroup.rows.findIndex(r => r.name === '축대작업비');
    if (index !== -1) {
        const item = burialGroup.rows[index];

        // 1. feeType을 USAGE로 변경해야 '안내 및 규정'으로 빠지지 않고 동일 아코디언에 묶임
        item.feeType = "USAGE";

        // 2. grade에서 '평당' 제거
        if (item.grade === '평당') {
            item.grade = null;
        }

        // 3. note 설명 끝에 '평당' 정보 추가
        if (!item.note.includes('평당')) {
            item.note = item.note.replace('기초 공사 비용입니다.', '기초 공사 비용입니다. (기준: 평당)');
        }

        // 4. 배열 내에서 항목 순서를 '유골매장작업비' 바로 아래로 이동
        burialGroup.rows.splice(index, 1);
        const targetIndex = burialGroup.rows.findIndex(r => r.name === '유골매장작업비');

        if (targetIndex !== -1) {
            burialGroup.rows.splice(targetIndex + 1, 0, item);
        } else {
            burialGroup.rows.push(item);
        }
    }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Fixed park-0024 축대작업비 위치 및 설명.');
