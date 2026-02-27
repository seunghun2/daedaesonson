const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ==========================================
// Park 61 - 고성군 공설묘원 (공설)
// 이미지: 단장/합장 사용료+관리비, 봉안분묘 사용료+관리비
// 기존: 단장형/합장형/봉안묘 — 봉안묘 serviceType이 BONGSAN이므로 BURIAL로 변경 필요
// ==========================================
const park61 = data.find(p => p.id === 'park-0061');
if (park61) {
    park61.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '단장형',
            rows: [
                { name: '사용료', price: 447870, groupType: '', note: '15년간' },
                { name: '관리비', price: 360000, groupType: '', note: '15년간', feeType: 'MAINTENANCE' },
                { name: '사용료 (기초수급자/국가유공자)', price: 0, groupType: '', note: '전액 감면' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '합장형',
            rows: [
                { name: '사용료', price: 746460, groupType: '', note: '15년간' },
                { name: '관리비', price: 600000, groupType: '', note: '15년간', feeType: 'MAINTENANCE' },
                { name: '사용료 (기초수급자/국가유공자)', price: 0, groupType: '', note: '전액 감면' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '봉안분묘',
            rows: [
                { name: '사용료', price: 74640, groupType: '', note: '1.65㎡ (1.5×1.1)' },
                { name: '관리비', price: 60000, groupType: '', note: '', feeType: 'MAINTENANCE' },
            ]
        }
    ];
    console.log('✅ park-0061 fixed');
}

// ==========================================
// Park 62 - 초동교회공원묘원
// 이미지: 묘지사용료 1,300,000 (1평기준) / 관리비 25,000 (1평/1년기준)
// + 서비스항목: 2단묘 3,300,000 / 3단묘 4,500,000 / 설치작업비 1,500,000 / 묘테보수 500,000 / 개장작업비(단장) 1,600,000 / 개장작업비(합장) 2,200,000
// ==========================================
const park62 = data.find(p => p.id === 'park-0062');
if (park62) {
    park62.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '묘지 사용료', price: 1300000, groupType: '', note: '1평 기준' },
                { name: '관리비', price: 25000, groupType: '', note: '1평/1년 기준', feeType: 'MAINTENANCE' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '석물',
            rows: [
                { name: '2단묘', price: 3300000, groupType: '', note: '기본 석물 (묘테, 비석, 화병 포함)' },
                { name: '3단묘', price: 4500000, groupType: '', note: '기본 석물 (묘테, 비석, 화병 포함)' },
                { name: '설치 작업비', price: 1500000, groupType: '', note: '장비 대여, 인건비 포함' },
                { name: '묘테 보수', price: 500000, groupType: '', note: '묘테, 잔디 재정비' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '개장',
            rows: [
                { name: '개장작업비 (단장묘)', price: 1600000, groupType: '', note: '개장 및 화장 인계비 포함' },
                { name: '개장작업비 (합장묘)', price: 2200000, groupType: '', note: '개장 및 화장 인계비 포함' },
            ]
        }
    ];
    console.log('✅ park-0062 fixed');
}

// ==========================================
// Park 63 - 태백공원묘원 (공설)
// 이미지: 단장(하절기/동절기) 일반/기초수급자, 합장(하절기/동절기) 일반/기초수급자
// 기존 데이터 구조 OK, note만 보강
// ==========================================
const park63 = data.find(p => p.id === 'park-0063');
if (park63) {
    park63.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '단장형',
            rows: [
                { name: '하절기', price: 2273000, groupType: '일반', note: '매장' },
                { name: '동절기', price: 2493000, groupType: '일반', note: '매장' },
                { name: '하절기 (기초수급자/국가유공자)', price: 1650000, groupType: '감면', note: '매장' },
                { name: '동절기 (기초수급자/국가유공자)', price: 1870000, groupType: '감면', note: '매장' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '합장형',
            rows: [
                { name: '하절기', price: 2844000, groupType: '일반', note: '매장' },
                { name: '동절기', price: 3064000, groupType: '일반', note: '매장' },
                { name: '하절기 (기초수급자/국가유공자)', price: 1930000, groupType: '감면', note: '매장' },
                { name: '동절기 (기초수급자/국가유공자)', price: 2150000, groupType: '감면', note: '매장' },
            ]
        }
    ];
    console.log('✅ park-0063 fixed');
}

// ==========================================
// Park 64 - 진천군공설묘지 (공설)
// 이미지: 관내/관외 거주자, 단장/합장, 30년(15년1회연장가능)
// 기존: feeType=EXTENSION → USAGE로, groupType 관내/관외 → residency
// 4행씩 2개가 있는데, 각각 금액이 다름: 15년/연장 구분?
// 이미지 보면: 관내 단장 327,000 / 201,000, 관외 단장 425,000 / 261,000
//              관내 합장 528,000 / 226,000, 관외 합장 686,000 / 294,000
// 큰 금액이 30년, 작은 금액이 15년(1회 연장) → 가격 순서 맞추기
// ==========================================
const park64 = data.find(p => p.id === 'park-0064');
if (park64) {
    park64.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '단장형',
            rows: [
                { name: '사용료 (30년)', price: 327000, groupType: '', residency: 'LOCAL', note: '30년 (15년 1회 연장 가능)' },
                { name: '사용료 (15년 연장)', price: 201000, groupType: '', residency: 'LOCAL', note: '15년 연장' },
                { name: '사용료 (30년)', price: 425000, groupType: '', residency: 'NON_LOCAL', note: '30년 (15년 1회 연장 가능)' },
                { name: '사용료 (15년 연장)', price: 261000, groupType: '', residency: 'NON_LOCAL', note: '15년 연장' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '합장형',
            rows: [
                { name: '사용료 (30년)', price: 528000, groupType: '', residency: 'LOCAL', note: '30년 (15년 1회 연장 가능)' },
                { name: '사용료 (15년 연장)', price: 226000, groupType: '', residency: 'LOCAL', note: '15년 연장' },
                { name: '사용료 (30년)', price: 686000, groupType: '', residency: 'NON_LOCAL', note: '30년 (15년 1회 연장 가능)' },
                { name: '사용료 (15년 연장)', price: 294000, groupType: '', residency: 'NON_LOCAL', note: '15년 연장' },
            ]
        }
    ];
    console.log('✅ park-0064 fixed');
}

// ==========================================
// Park 65 - (재)광주구천주교공원묘원
// 이미지: 묘지대1,000,000 / 관리비400,000(20년) / 매장비300,000 / 비석대400,000(외비) / 조경비200,000 / 조성비800,000 + 평장분묘1위형4,000,000(30년) / 2위형7,000,000(30년)
// ==========================================
const park65 = data.find(p => p.id === 'park-0065');
if (park65) {
    park65.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '묘지대', price: 1000000, groupType: '', note: '' },
                { name: '매장비', price: 300000, groupType: '', note: '' },
                { name: '조성비', price: 800000, groupType: '', note: '' },
                { name: '조경비', price: 200000, groupType: '', note: '' },
                { name: '비석대', price: 400000, groupType: '', note: '외비' },
                { name: '관리비', price: 400000, groupType: '', note: '20년', feeType: 'MAINTENANCE' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '평장묘',
            rows: [
                { name: '평장분묘 1위형', price: 4000000, groupType: '', note: '30년' },
                { name: '평장분묘 2위형', price: 7000000, groupType: '', note: '30년' },
            ]
        }
    ];
    console.log('✅ park-0065 fixed');
}

// ==========================================
// Park 66 - (재)개나리추모공원
// 이미지: 묘지사용료 3.3㎡/평 1,066,000 / 관리비 3.3㎡/평/년 15,000
//         묘지사용료 3.3㎡/평 724,000 / 관리비 년 28,000
// + 서비스: 단장형(2단묘테세트) 4,629,000 / 단장형(4단묘테세트) 6,449,000
//           합장형(2단묘테세트) 6,219,000 / 합장형(4단묘테세트) 9,899,000
// 두 묘지사용료는 구역이 다른듯 (큰/작은)
// ==========================================
const park66 = data.find(p => p.id === 'park-0066');
if (park66) {
    park66.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '묘지사용료 (A구역)', price: 1066000, groupType: '', note: '3.3㎡/평' },
                { name: '묘지사용료 (B구역)', price: 724000, groupType: '', note: '3.3㎡/평' },
                { name: '관리비 (A구역)', price: 15000, groupType: '', note: '3.3㎡/평/년', feeType: 'MAINTENANCE' },
                { name: '관리비 (B구역)', price: 28000, groupType: '', note: '년', feeType: 'MAINTENANCE' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '석물 Set',
            rows: [
                { name: '단장형 (2단묘테세트)', price: 4629000, groupType: '단장형', note: '둘레석, 3자오비, 상석(3.0자), 장묘화병외' },
                { name: '단장형 (4단묘테세트)', price: 6449000, groupType: '단장형', note: '둘레석, 3자오비, 상석(3.0자), 장묘화병외' },
                { name: '합장형 (2단묘테세트)', price: 6219000, groupType: '합장형', note: '둘레석, 피아노오비, 상석(3.0자), 향로화병외' },
                { name: '합장형 (4단묘테세트)', price: 9899000, groupType: '합장형', note: '둘레석, 피아노오비, 상석(3.5자), 향로화병외' },
            ]
        }
    ];
    console.log('✅ park-0066 fixed');
}

// ==========================================
// Park 67 - 금호동성당 천보묘원(묘지)
// 이미지: 관리비(매장)3평 1,350,000 (10000원×평×45Y)
//         관리비(매장)6평 2,700,000 (10000원×평×45Y)
//         관리비(납골) 210,000 (21000원/20년)
// 서비스: 상석(오석) 484,000 / 비석/3평 616,000 / 화병 110,000 / 봉잔디 397,000 / 2단 사각묘테(합장) 1,617,000
// 기존: 봉안당(유연납골280,000) + 봉안묘(관리비210,000) — 봉안묘는 야외이므로 BURIAL
// 매장묘 관리비만 있고 사용료 없음! 이미지에도 사용료 없음
// ==========================================
const park67 = data.find(p => p.id === 'park-0067');
if (park67) {
    park67.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '관리비 (3평)', price: 1350000, groupType: '', note: '10,000원×평×45년', feeType: 'MAINTENANCE' },
                { name: '관리비 (6평)', price: 2700000, groupType: '', note: '10,000원×평×45년', feeType: 'MAINTENANCE' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '석물',
            rows: [
                { name: '상석 (오석)', price: 484000, groupType: '', note: '가로600cm, 세로420cm, 두께120cm' },
                { name: '비석 (3평)', price: 616000, groupType: '', note: '가로600cm, 세로440cm, 두께120cm' },
                { name: '화병', price: 110000, groupType: '', note: '' },
                { name: '봉잔디', price: 397000, groupType: '', note: '' },
                { name: '2단 사각묘테 (합장)', price: 1617000, groupType: '', note: '가로2100cm, 세로1800cm, 높이600cm' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '봉안묘',
            rows: [
                { name: '관리비 (납골)', price: 210000, groupType: '', note: '21,000원/20년', feeType: 'MAINTENANCE' },
            ]
        },
        {
            serviceType: 'BONGSAN',
            subType: '봉안당',
            rows: [
                { name: '유연 납골 사용료', price: 280000, groupType: '', note: '' },
            ]
        }
    ];
    console.log('✅ park-0067 fixed');
}

// ==========================================
// Park 68 - 전농동성당 평화묘원
// 이미지: 합장 - 봉안5,000,000 / 석비2,400,000 / 관리비1,950,000(15년분) / 작업비1,400,000
//         단장 - 봉안3,000,000 / 석비2,000,000 / 관리비1,350,000(15년분) / 작업비1,400,000
// ==========================================
const park68 = data.find(p => p.id === 'park-0068');
if (park68) {
    park68.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '단장형',
            rows: [
                { name: '묘지봉안 (사용료)', price: 3000000, groupType: '', note: '' },
                { name: '묘지석비', price: 2000000, groupType: '', note: '묘비, 묘테' },
                { name: '묘지작업비', price: 1400000, groupType: '', note: '잔디, 봉분 외' },
                { name: '관리비 (15년분)', price: 1350000, groupType: '', note: '15년분', feeType: 'MAINTENANCE' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '합장형',
            rows: [
                { name: '묘지봉안 (사용료)', price: 5000000, groupType: '', note: '' },
                { name: '묘지석비', price: 2400000, groupType: '', note: '묘비, 묘테' },
                { name: '묘지작업비', price: 1400000, groupType: '', note: '잔디, 봉분 외' },
                { name: '관리비 (15년분)', price: 1950000, groupType: '', note: '15년분', feeType: 'MAINTENANCE' },
            ]
        }
    ];
    console.log('✅ park-0068 fixed');
}

// ==========================================
// Park 69 - (재)천주교평내공원묘원
// 이미지: 매장묘사용료(분양종지) 9.9㎡(3평) 1,000,000
//         매장묘관리비(연) 3.3㎡ 6,000
//         매장묘사용료(분양중지) 9.9㎡ 1,000,000
//         매장묘관리비 3.3㎡ 6,000
//         장례작업비 1인매장 500,000
//         개장작업비 1인개장 500,000
//         개장작업비 2인(합장)개장 800,000
// 분양종지와 분양중지 두 구역 같은 가격
// ==========================================
const park69 = data.find(p => p.id === 'park-0069');
if (park69) {
    park69.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '매장묘 사용료', price: 1000000, groupType: '', note: '9.9㎡(3평)' },
                { name: '관리비 (연)', price: 6000, groupType: '', note: '3.3㎡ 기준', feeType: 'MAINTENANCE' },
                { name: '장례작업비', price: 500000, groupType: '', note: '1인 매장' },
                { name: '개장작업비 (1인)', price: 500000, groupType: '', note: '1인 개장' },
                { name: '개장작업비 (합장)', price: 800000, groupType: '', note: '2인 합장 개장' },
            ]
        }
    ];
    console.log('✅ park-0069 fixed');
}

// ==========================================
// Park 70 - 재림공원묘원
// 이미지: 묘지사용료(3평기준) 1평당 1,250,000
//         잔디 350,000 (매장시 잔디 식재비)
//         5년관리비 200,000 (매장시 5년(1년4만원))
//         1년관리비 40,000 (5년후 3평기준)
//         비석 600,000 (오석 55×38×10 글자와 설치비 포함)
//         장대 400,000 (가로121×세로164 설치비 포함)
//         작업인건비 600,000 (매장시 인력2명 + 사무실 인력2명)
// ==========================================
const park70 = data.find(p => p.id === 'park-0070');
if (park70) {
    park70.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            rows: [
                { name: '묘지 사용료 (3평 기준)', price: 1250000, groupType: '', note: '1평당' },
                { name: '잔디 식재비', price: 350000, groupType: '', note: '매장시 잔디 식재비' },
                { name: '작업 인건비', price: 600000, groupType: '', note: '매장시 인력 2명 + 사무실 인력 2명' },
                { name: '5년 관리비', price: 200000, groupType: '', note: '매장시 5년 (1년 4만원) 선납', feeType: 'MAINTENANCE' },
                { name: '1년 관리비', price: 40000, groupType: '', note: '5년 후 3평 기준', feeType: 'MAINTENANCE' },
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '석물',
            rows: [
                { name: '비석', price: 600000, groupType: '', note: '오석 55×38×10, 글자와 설치비 포함' },
                { name: '장대', price: 400000, groupType: '', note: '가로 121 × 세로 164, 설치비 포함' },
            ]
        }
    ];
    console.log('✅ park-0070 fixed');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('\n✅ ALL parks 61-70 fixed!');
