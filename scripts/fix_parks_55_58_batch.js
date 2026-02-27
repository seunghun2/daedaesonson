const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ==========================================
// Park 55 - 동해시하늘정원묘지
// Fix: residency 필드로 관내 아이콘, 관리비→MAINTENANCE
// ==========================================
const park55 = data.find(p => p.id === 'park-0055');
if (park55) {
    park55.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            feeType: 'USAGE',
            rows: [
                { name: '사용료 (단장)', price: 660000, groupType: '단장', residency: 'LOCAL', note: '15년' },
                { name: '석물비 (단장)', price: 938000, groupType: '단장', residency: 'LOCAL', note: '15년' },
                { name: '매장비 (단장, 하절기)', price: 360000, groupType: '단장', residency: 'LOCAL', note: '15년' },
                { name: '매장비 (단장, 동절기)', price: 400000, groupType: '단장', residency: 'LOCAL', note: '15년' },
                { name: '사용료 (합장)', price: 960000, groupType: '합장', residency: 'LOCAL', note: '15년' },
                { name: '석물비 (합장)', price: 1060000, groupType: '합장', residency: 'LOCAL', note: '15년' },
                { name: '매장비 (합장, 하절기)', price: 360000, groupType: '합장', residency: 'LOCAL', note: '15년' },
                { name: '매장비 (합장, 동절기)', price: 400000, groupType: '합장', residency: 'LOCAL', note: '15년' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            feeType: 'MAINTENANCE',
            rows: [
                { name: '관리비 (단장)', price: 240000, groupType: '단장', residency: 'LOCAL', note: '15년' },
                { name: '관리비 (합장)', price: 360000, groupType: '합장', residency: 'LOCAL', note: '15년' },
            ]
        }
    ];
    console.log('✅ park-0055 fixed: residency + 관리비 MAINTENANCE');
}

// ==========================================
// Park 56 - (재)용인공원(묘지)
// Fix: 관리비→MAINTENANCE 분리
// ==========================================
const park56 = data.find(p => p.id === 'park-0056');
if (park56) {
    park56.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            feeType: 'USAGE',
            rows: [
                { name: '매장지', price: 3180000, groupType: '', note: '묘지조성에 대한 원가요소별 산정금액' },
                { name: '천명지', price: 5340000, groupType: '', note: '묘지조성에 대한 원가요소별 산정금액' },
                { name: '정명지', price: 2620000, groupType: '', note: '묘지조성에 대한 원가요소별 산정금액' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '봉안묘',
            feeType: 'USAGE',
            rows: [
                { name: '봉안묘', price: 4170000, groupType: '', note: '묘지조성에 대한 원가요소별 산정금액' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            feeType: 'MAINTENANCE',
            rows: [
                { name: '연간 관리비 (1평)', price: 25000, groupType: '', note: '1년 평당 단가' },
                { name: '조경관리비', price: 25000, groupType: '', note: '조경관리 대상 묘역 추가 청구' },
            ]
        }
    ];
    console.log('✅ park-0056 fixed: 관리비 MAINTENANCE 분리');
}

// ==========================================
// Park 57 - 함안군공설추모공원
// Fix: residency 필드 + 관리비→MAINTENANCE
// ==========================================
const park57 = data.find(p => p.id === 'park-0057');
if (park57) {
    park57.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '평장묘',
            feeType: 'USAGE',
            rows: [
                { name: '사용료 (단장)', price: 270000, groupType: '단장', residency: 'LOCAL', note: '1기당 / 최초 15년' },
                { name: '사용료 (단장)', price: 1250000, groupType: '단장', residency: 'NON_LOCAL', note: '1기당 / 최초 15년' },
                { name: '사용료 (합장, 관내+관내)', price: 420000, groupType: '합장', residency: 'LOCAL', note: '1기당 / 최초 15년' },
                { name: '사용료 (합장, 관내+관외)', price: 1400000, groupType: '합장', note: '1기당 / 최초 15년' },
                { name: '사용료 (합장, 관외+관외)', price: 2000000, groupType: '합장', residency: 'NON_LOCAL', note: '1기당 / 최초 15년' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '평장묘',
            feeType: 'MAINTENANCE',
            rows: [
                { name: '관리비 (단장)', price: 100000, groupType: '단장', residency: 'LOCAL', note: '1기당 / 최초 15년' },
                { name: '관리비 (단장)', price: 300000, groupType: '단장', residency: 'NON_LOCAL', note: '1기당 / 최초 15년' },
                { name: '관리비 (합장, 관내+관내)', price: 200000, groupType: '합장', residency: 'LOCAL', note: '1기당 / 최초 15년' },
                { name: '관리비 (합장, 관내+관외)', price: 400000, groupType: '합장', note: '1기당 / 최초 15년' },
                { name: '관리비 (합장, 관외+관외)', price: 600000, groupType: '합장', residency: 'NON_LOCAL', note: '1기당 / 최초 15년' },
            ]
        }
    ];
    console.log('✅ park-0057 fixed: residency + 관리비 MAINTENANCE');
}

// ==========================================
// Park 58 - (재)경주공원묘원
// Fix: 석물SET→매장묘에 통합(필수), 관리비→MAINTENANCE
// ==========================================
const park58 = data.find(p => p.id === 'park-0058');
if (park58) {
    park58.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            feeType: 'USAGE',
            rows: [
                { name: '사용료 (0.3평)', price: 332748, groupType: '기본비용', note: '0.3평 기준 (1,100,000원/1평)' },
                { name: '장례비 (1평)', price: 500000, groupType: '기본비용', note: '매장 작업비' },
                { name: '매장묘 석물 SET (보급형)', price: 5000000, groupType: '매장묘 SET', note: '둘레석, 표석, 상석, 향로, 꽃병 포함' },
                { name: '매장묘 석물 SET (고급형)', price: 7500000, groupType: '매장묘 SET', note: '둘레석, 표석, 상석, 향로, 꽃병 포함' },
                { name: '보급형 SET', price: 3500000, groupType: '봉안묘/기타 SET', note: '' },
                { name: '고급형 SET', price: 5000000, groupType: '봉안묘/기타 SET', note: '' },
                { name: '예술보급형 SET', price: 7500000, groupType: '봉안묘/기타 SET', note: '' },
                { name: '구름보급형 SET', price: 6500000, groupType: '봉안묘/기타 SET', note: '' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            feeType: 'MAINTENANCE',
            rows: [
                { name: '관리비 (0.3평)', price: 4538, groupType: '', note: '0.3평 기준 (15,000원/1평)' },
            ]
        }
    ];
    console.log('✅ park-0058 fixed: 석물→매장묘 통합 + 관리비 MAINTENANCE');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ All hotfixes complete (55, 56, 57, 58)');
