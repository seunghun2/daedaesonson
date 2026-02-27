const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ==========================================
// Park 50 - 광주공원묘원
// ==========================================
const park50 = data.find(p => p.id === 'park-0050');
if (park50) {
    park50.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '묘지사용료 (1평)', price: 1895100, groupType: '기본비용', note: '1평 기준' },
                { name: '묘지관리비 (1평/년)', price: 15400, groupType: '기본비용', note: '1년간 관리비', feeType: 'MAINTENANCE' },
                { name: '1단 미니묘테', price: 2156000, groupType: '단장묘', note: '60cm비석, 60cm화강상석, 화병 포함' },
                { name: '1단 (1.1×2.1 묘테)', price: 2304500, groupType: '단장묘', note: '60cm비석, 60cm화강상석, 화병 포함' },
                { name: '합장묘 각묘테 (중)', price: 4474800, groupType: '합장묘', note: '90cm갓비석, 75cm화강상석, 화병 포함' },
                { name: '합장묘 각묘테 (대)', price: 4990700, groupType: '합장묘', note: '90cm갓비석, 75cm화강상석, 화병 포함' },
                { name: '합장묘 각묘테 (특)', price: 7200600, groupType: '합장묘', note: '90cm갓비석, 90cm화강상석, 화병 포함' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '봉안묘',
            rows: [
                { name: '봉안묘 2인', price: 4032600, groupType: '', note: '60cm피아노비석, 60cm화강상석, 화병 포함' },
                { name: '봉안묘 4인', price: 6103900, groupType: '', note: '75cm화강비석, 75cm화강상석, 화병 포함' },
                { name: '봉안묘 6인', price: 7604300, groupType: '', note: '75cm화강비석, 75cm화강상석, 화병 포함' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '석물',
            rows: [
                { name: '비석', price: 200000, groupType: '', note: '53cm×38cm×12cm' },
                { name: '석관', price: 200000, groupType: '', note: '분묘 비탈을 제외한 모든곳에 7개 설치' },
            ]
        }
    ];
    console.log('✅ park-0050 fixed');
}

// ==========================================
// Park 51 - 영모묘원
// ==========================================
const park51 = data.find(p => p.id === 'park-0051');
if (park51) {
    park51.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '묘지 사용료 (하단구역)', price: 20000000, groupType: '', note: '5㎡ / 30년간 사용' },
                { name: '묘지 사용료 (상단구역)', price: 15000000, groupType: '', note: '5㎡ / 30년간 사용' },
                { name: '관리비 (10년 선납)', price: 600000, groupType: '', note: '1년 60,000원 × 10년', feeType: 'MAINTENANCE' },
                { name: '부부합장묘 추가비용', price: 1500000, groupType: '', note: '' },
                { name: '자연장', price: 1500000, groupType: '', note: '30cm×30cm / 표석없음 / 관리비없음 / 기간 영구' },
            ]
        },
        {
            serviceType: 'BONGSAN',
            subType: '봉안당',
            rows: [
                { name: '봉안당 (개인함/부부함)', price: 0, groupType: '', note: '호실과 단의 높이에 따라 정함' },
                { name: '관리비 (10년 선납)', price: 500000, groupType: '', note: '1년 50,000원 × 10년', feeType: 'MAINTENANCE' },
            ]
        }
    ];
    console.log('✅ park-0051 fixed');
}

// ==========================================
// Park 52 - 칠량자연공원묘원
// ==========================================
const park52 = data.find(p => p.id === 'park-0052');
if (park52) {
    park52.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '매장묘 (상단구역)', price: 6000000, groupType: '', note: '1구당 26.4㎡ / 최장 60년' },
                { name: '매장묘 (하단구역)', price: 3000000, groupType: '', note: '1구당 26.4㎡ / 최장 60년' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '봉안묘',
            rows: [
                { name: '미래형 봉안묘 (상단)', price: 10000000, groupType: '미래형', note: '1기당 33㎡ / 기간없음(영구)' },
                { name: '미래형 봉안묘 (하단)', price: 3000000, groupType: '미래형', note: '1기당 33㎡ / 기간없음(영구)' },
                { name: '한국형 봉안묘 (상단)', price: 10000000, groupType: '한국형', note: '1기당 33㎡ / 기간없음(영구)' },
                { name: '한국형 봉안묘 (하단)', price: 3000000, groupType: '한국형', note: '1기당 33㎡ / 기간없음(영구)' },
                { name: '석실 봉안묘 (상단)', price: 10000000, groupType: '석실형', note: '1기당 33㎡ / 기간없음(영구)' },
                { name: '석실 봉안묘 (하단)', price: 3000000, groupType: '석실형', note: '1기당 33㎡ / 기간없음(영구)' },
            ]
        },
        {
            serviceType: 'BONGSAN',
            subType: '봉안담',
            rows: [
                { name: '봉안담', price: 800000, groupType: '', note: '1위 / 기간없음(영구)' },
            ]
        }
    ];
    console.log('✅ park-0052 fixed');
}

// ==========================================
// Park 53 - (재)봉황공원묘지
// ==========================================
const park53 = data.find(p => p.id === 'park-0053');
if (park53) {
    park53.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '묘지 사용료 (1평)', price: 840400, groupType: '', note: '평당 기준' },
                { name: '연간 관리비 (1평)', price: 15200, groupType: '', note: '평당 / 부가세 별도', feeType: 'MAINTENANCE' },
                { name: '용역비 (매장 작업비)', price: 1194000, groupType: '', note: '직원 인건비 포함' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '[필수]석물',
            rows: [
                { name: '상석', price: 705000, groupType: '석물', note: '800×500×140mm / 국산 황등석' },
                { name: '오석 (비석)', price: 926000, groupType: '석물', note: '국산' },
                { name: '둘레석', price: 1145000, groupType: '석물', note: '1400×180×100mm / 국산 황등석' },
                { name: '석관', price: 143000, groupType: '석물', note: '국산' },
                { name: '좌대', price: 321000, groupType: '석물', note: '900×250×200mm / 국산 황등석' },
                { name: '잔디', price: 100000, groupType: '장례용품', note: '국산' },
                { name: '꽃병', price: 66000, groupType: '장례용품', note: '국산' },
            ]
        }
    ];
    console.log('✅ park-0053 fixed');
}

// ==========================================
// Park 54 - (재)우성공원묘원
// ==========================================
const park54 = data.find(p => p.id === 'park-0054');
if (park54) {
    park54.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '묘지사용료 (3.3㎡/1년)', price: 1600000, groupType: '기본비용', note: '1평 기준 / 1년' },
                { name: '연간 관리비 (3.3㎡)', price: 17000, groupType: '기본비용', note: '1평 기준 / 1년', feeType: 'MAINTENANCE' },
                { name: '고급실 부부 (평균가)', price: 15210000, groupType: '고급실', note: '석물 포함 평균가' },
                { name: '고급실 개인 (평균가)', price: 7280000, groupType: '고급실', note: '석물 포함 평균가' },
                { name: '고급실 부부 관리비', price: 92000, groupType: '고급실', note: '1년 기준', feeType: 'MAINTENANCE' },
                { name: '고급실 개인 관리비', price: 51000, groupType: '고급실', note: '1년 기준', feeType: 'MAINTENANCE' },
                { name: '일반실 부부 (평균가)', price: 9510000, groupType: '일반실', note: '석물 포함 평균가' },
                { name: '일반실 개인 (평균가)', price: 4940000, groupType: '일반실', note: '석물 포함 평균가' },
                { name: '일반실 부부 관리비', price: 82000, groupType: '일반실', note: '1년 기준', feeType: 'MAINTENANCE' },
                { name: '일반실 개인 관리비', price: 41000, groupType: '일반실', note: '1년 기준', feeType: 'MAINTENANCE' },
            ]
        }
    ];
    console.log('✅ park-0054 fixed');
}

// ==========================================
// Park 55 - 동해시하늘정원묘지
// ==========================================
const park55 = data.find(p => p.id === 'park-0055');
if (park55) {
    park55.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '사용료 (단장)', price: 660000, groupType: '단장', residency: 'LOCAL', note: '15년' },
                { name: '관리비 (단장)', price: 240000, groupType: '단장', residency: 'LOCAL', note: '15년', feeType: 'MAINTENANCE' },
                { name: '석물비 (단장)', price: 938000, groupType: '단장', residency: 'LOCAL', note: '15년' },
                { name: '매장비 (단장, 하절기)', price: 360000, groupType: '단장', residency: 'LOCAL', note: '15년' },
                { name: '매장비 (단장, 동절기)', price: 400000, groupType: '단장', residency: 'LOCAL', note: '15년' },
                { name: '사용료 (합장)', price: 960000, groupType: '합장', residency: 'LOCAL', note: '15년' },
                { name: '관리비 (합장)', price: 360000, groupType: '합장', residency: 'LOCAL', note: '15년', feeType: 'MAINTENANCE' },
                { name: '석물비 (합장)', price: 1060000, groupType: '합장', residency: 'LOCAL', note: '15년' },
                { name: '매장비 (합장, 하절기)', price: 360000, groupType: '합장', residency: 'LOCAL', note: '15년' },
                { name: '매장비 (합장, 동절기)', price: 400000, groupType: '합장', residency: 'LOCAL', note: '15년' },
            ]
        }
    ];
    console.log('✅ park-0055 fixed');
}

// ==========================================
// Park 56 - (재)용인공원(묘지)
// ==========================================
const park56 = data.find(p => p.id === 'park-0056');
if (park56) {
    park56.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '매장지', price: 3180000, groupType: '', note: '묘지조성에 대한 원가요소별 산정금액' },
                { name: '천명지', price: 5340000, groupType: '', note: '묘지조성에 대한 원가요소별 산정금액' },
                { name: '정명지', price: 2620000, groupType: '', note: '묘지조성에 대한 원가요소별 산정금액' },
                { name: '연간 관리비 (1평)', price: 25000, groupType: '', note: '1년 평당 단가', feeType: 'MAINTENANCE' },
                { name: '조경관리비', price: 25000, groupType: '', note: '조경관리 대상 묘역 추가 청구', feeType: 'MAINTENANCE' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '봉안묘',
            rows: [
                { name: '봉안묘', price: 4170000, groupType: '', note: '묘지조성에 대한 원가요소별 산정금액' },
            ]
        }
    ];
    console.log('✅ park-0056 fixed');
}

// ==========================================
// Park 57 - 함안군공설추모공원
// ==========================================
const park57 = data.find(p => p.id === 'park-0057');
if (park57) {
    park57.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '평장묘',
            rows: [
                { name: '사용료 (단장)', price: 270000, groupType: '단장', residency: 'LOCAL', note: '1기당 / 최초 15년' },
                { name: '관리비 (단장)', price: 100000, groupType: '단장', residency: 'LOCAL', note: '1기당 / 최초 15년', feeType: 'MAINTENANCE' },
                { name: '사용료 (단장)', price: 1250000, groupType: '단장', residency: 'NON_LOCAL', note: '1기당 / 최초 15년' },
                { name: '관리비 (단장)', price: 300000, groupType: '단장', residency: 'NON_LOCAL', note: '1기당 / 최초 15년', feeType: 'MAINTENANCE' },
                { name: '사용료 (합장, 관내+관내)', price: 420000, groupType: '합장', residency: 'LOCAL', note: '1기당 / 최초 15년' },
                { name: '관리비 (합장, 관내+관내)', price: 200000, groupType: '합장', residency: 'LOCAL', note: '1기당 / 최초 15년', feeType: 'MAINTENANCE' },
                { name: '사용료 (합장, 관내+관외)', price: 1400000, groupType: '합장', note: '1기당 / 최초 15년' },
                { name: '관리비 (합장, 관내+관외)', price: 400000, groupType: '합장', note: '1기당 / 최초 15년', feeType: 'MAINTENANCE' },
                { name: '사용료 (합장, 관외+관외)', price: 2000000, groupType: '합장', residency: 'NON_LOCAL', note: '1기당 / 최초 15년' },
                { name: '관리비 (합장, 관외+관외)', price: 600000, groupType: '합장', residency: 'NON_LOCAL', note: '1기당 / 최초 15년', feeType: 'MAINTENANCE' },
            ]
        }
    ];
    console.log('✅ park-0057 fixed');
}

// ==========================================
// Park 58 - (재)경주공원묘원
// ==========================================
const park58 = data.find(p => p.id === 'park-0058');
if (park58) {
    park58.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '사용료 (0.3평)', price: 332748, groupType: '기본비용', note: '0.3평 기준 (1,100,000원/1평)' },
                { name: '관리비 (0.3평)', price: 4538, groupType: '기본비용', note: '0.3평 기준 (15,000원/1평)', feeType: 'MAINTENANCE' },
                { name: '장례비 (1평)', price: 500000, groupType: '기본비용', note: '매장 작업비' },
                { name: '매장묘 석물 SET (보급형)', price: 5000000, groupType: '매장묘 SET', note: '둘레석, 표석, 상석, 향로, 꽃병 포함' },
                { name: '매장묘 석물 SET (고급형)', price: 7500000, groupType: '매장묘 SET', note: '둘레석, 표석, 상석, 향로, 꽃병 포함' },
                { name: '보급형 SET', price: 3500000, groupType: '봉안묘/기타 SET', note: '' },
                { name: '고급형 SET', price: 5000000, groupType: '봉안묘/기타 SET', note: '' },
                { name: '예술보급형 SET', price: 7500000, groupType: '봉안묘/기타 SET', note: '' },
                { name: '구름보급형 SET', price: 6500000, groupType: '봉안묘/기타 SET', note: '' },
            ]
        }
    ];
    console.log('✅ park-0058 fixed');
}

// ==========================================
// Park 59 - 남한강공원묘원
// ==========================================
const park59 = data.find(p => p.id === 'park-0059');
if (park59) {
    park59.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '묘지사용료 (3.3㎡)', price: 1577000, groupType: '', note: '1평 기준' },
                { name: '관리비 (3.3㎡)', price: 18400, groupType: '', note: '1평 기준', feeType: 'MAINTENANCE' },
                { name: '매장 작업비', price: 1900000, groupType: '', note: '구당' },
                { name: '1단 합장 외 3종', price: 2920000, groupType: '석물 SET', note: '1단묘테, 비석, 상석, 화병 포함' },
                { name: '3단 합장 외 3종 (소)', price: 4320000, groupType: '석물 SET', note: '3단묘테, 비석, 상석, 화병 포함' },
                { name: '3단 합장 외 3종 (신)', price: 5240000, groupType: '석물 SET', note: '3단묘테, 비석, 상석, 화병 포함' },
                { name: '3단 합장 외 3종 (본)', price: 6030000, groupType: '석물 SET', note: '3단묘테, 비석, 상석, 화병 포함' },
                { name: '3단 합장 외 3종 (특)', price: 6280000, groupType: '석물 SET', note: '3단묘테, 비석, 상석, 화병 포함' },
            ]
        }
    ];
    console.log('✅ park-0059 fixed');
}

// ==========================================
// Park 60 - (재)조양공원
// ==========================================
const park60 = data.find(p => p.id === 'park-0060');
if (park60) {
    park60.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '묘지대 (3.3㎡)', price: 1300000, groupType: '', note: '1평당' },
                { name: '묘지관리비 (3.3㎡/년)', price: 14000, groupType: '', note: '1평당 / 1년', feeType: 'MAINTENANCE' },
                { name: '애석 (비석)', price: 900000, groupType: '석물', note: '66cm (2.2척)' },
                { name: '오석 (비석)', price: 700000, groupType: '석물', note: '75cm (2.5척)' },
            ]
        },
        {
            serviceType: 'CHARNEL',
            subType: '납골',
            rows: [
                { name: '유연납골 (10년간)', price: 280000, groupType: '유연납골', note: '10년 기준' },
                { name: '유연납골 관리비 (1기)', price: 50000, groupType: '유연납골', note: '1기당 / 1년', feeType: 'MAINTENANCE' },
                { name: '무연납골 (10년간)', price: 50000, groupType: '무연납골', note: '10년 기준' },
                { name: '무연납골 관리비 (1기)', price: 25000, groupType: '무연납골', note: '1기당 / 1년', feeType: 'MAINTENANCE' },
            ]
        }
    ];
    console.log('✅ park-0060 fixed');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('\n✅ ALL parks 50-60 fixed with row-level feeType!');
