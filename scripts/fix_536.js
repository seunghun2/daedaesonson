const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0536');
const sp = p.priceInfo.standardizedPrices;

// 기존 봉안당[0]에 국가유공자 감면 + 유택동산 추가
const bong = sp[0];
const hasYugong = bong.rows.some(r => r.grade === '국가유공자');
if (!hasYugong) {
    bong.rows.push(
        { name: '개인단', price: 250000, feeType: 'USAGE', groupType: '감면', residency: 'LOW_INCOME', grade: '국가유공자' },
        { name: '부부단', price: 500000, feeType: 'USAGE', groupType: '감면', residency: 'LOW_INCOME', grade: '국가유공자' },
        { name: '유택동산(산골처리)', price: 20000, feeType: 'USAGE', groupType: '기타' },
    );
}

// 자연장 탭 추가
const nat = sp.find(s => s.serviceType === 'NATURAL');
if (!nat) {
    sp.push({
        serviceType: 'NATURAL',
        subType: '자연장',
        rows: [
            { name: '자연장', price: 500000, feeType: 'USAGE', groupType: '관내', residency: 'RESIDENT', isRepresentative: true, grade: '정읍시' },
            { name: '자연장', price: 800000, feeType: 'USAGE', groupType: '도내', grade: '도내' },
            { name: '자연장', price: 1000000, feeType: 'USAGE', groupType: '관외', residency: 'NON_RESIDENT' },
            { name: '자연장(감면)', price: 250000, feeType: 'USAGE', groupType: '감면', residency: 'LOW_INCOME', grade: '수급자' },
            { name: '자연장(감면)', price: 250000, feeType: 'USAGE', groupType: '감면', residency: 'LOW_INCOME', grade: '국가유공자' },
            { name: '명패비용 (1인당)', price: 230000, feeType: 'USAGE', groupType: '부가옵션' },
        ]
    });
}

console.log('✅ 536 서남권추모공원 수정:');
console.log('   봉안당: ' + sp[0].rows.length + '개 (국가유공자/유택동산 추가)');
console.log('   자연장: ' + sp[1].rows.length + '개 (신규 탭)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
