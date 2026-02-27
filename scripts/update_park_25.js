const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkId = 'park-0025';
const parkIndex = data.findIndex(f => f.id === parkId);
if (parkIndex === -1) {
    console.error('Park not found');
    process.exit(1);
}

const park = data[parkIndex];
const prices = park.priceInfo.standardizedPrices;

// 1. 매장묘 묘지 사용료 설명 수정 (m2 -> 1평형)
const burialGroup = prices.find(s => s.serviceType === 'BURIAL' && s.subType === '매장묘');
if (burialGroup) {
    const usageFee = burialGroup.rows.find(r => r.name === '묘지 사용료');
    if (usageFee) {
        usageFee.grade = '1평형';
        usageFee.note = usageFee.note.replace('m²당 단가', '1평형 단가').replace('m²', '1평형');
    }
}

// 2. 기타 탭에 있는 석물 항목들을 필수로 바꾸고 매장묘지 탭(BURIAL)으로 이동
const otherGroupIndex = prices.findIndex(s => s.serviceType === 'OTHER' && s.subType === '부가 항목');
let movedStoneRows = [];

if (otherGroupIndex !== -1) {
    const otherGroup = prices[otherGroupIndex];
    // 석물 관련 행 찾기
    const stoneRows = otherGroup.rows.filter(r => r.name.startsWith('석물_'));
    
    // 석물 항목들을 otherGroup에서 제거
    otherGroup.rows = otherGroup.rows.filter(r => !r.name.startsWith('석물_'));

    // 필수로 수정
    movedStoneRows = stoneRows.map(r => ({
        ...r,
        groupType: '석물 구매 및 조경 공사 (필수)',
        note: '묘지 조성에 필요한 필수 석물 구매 및 설치 비용입니다.'
    }));
}

// 석물용 새로운 아코디언(subType) 생성 후 BURIAL에 추가
if (movedStoneRows.length > 0) {
    // BURIAL 맨 끝에 추가 (매장묘, 평장묘 아래)
    const newGroup = {
        serviceType: 'BURIAL',
        subType: '석물 구매 및 조경 공사 (필수)',
        unit: '원',
        rows: movedStoneRows
    };
    
    // BURIAL 평장묘 뒤에 넣기 위해 매장묘, 평장묘 다음 인덱스를 찾음
    const lastBurialIndex = prices.reduce((acc, current, idx) => {
        return current.serviceType === 'BURIAL' ? idx : acc;
    }, -1);
    
    if (lastBurialIndex !== -1) {
        prices.splice(lastBurialIndex + 1, 0, newGroup);
    } else {
        prices.push(newGroup);
    }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated park-0025 in facilities.json');
