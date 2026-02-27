const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ============================================================
// park-0607: 수암사 영혼의쉼터
// 이미지 기반 - groupType으로 층/타입 분리
// ============================================================
const p607 = data.find(x => x.id === 'park-0607');
if (p607) {
    p607.priceInfo = {
        representativePrice: 3000000,
        standardizedPrices: [
            {
                serviceType: 'BONGSAN',
                subType: '봉안당',
                groupType: '법당식(1층)',
                rows: [
                    { name: '특별단', price: 12000000, feeType: 'USAGE', grade: '개인단 1구좌 가격', isRepresentative: false },
                    { name: '1~8단', price: 6000000, feeType: 'USAGE', isRepresentative: false },
                    { name: '9~13단', price: 5000000, feeType: 'USAGE', isRepresentative: false },
                    { name: '14~15단', price: 4000000, feeType: 'USAGE', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '봉안당',
                groupType: '옷장식(1층)',
                rows: [
                    { name: '1단', price: 3000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '6단', price: 3000000, feeType: 'USAGE', isRepresentative: false },
                    { name: '2~5단', price: 4000000, feeType: 'USAGE', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '봉안당',
                groupType: '2층',
                rows: [
                    { name: '특별단', price: 12000000, feeType: 'USAGE', grade: '개인단 1구좌 가격', isRepresentative: false },
                    { name: '1단', price: 4900000, feeType: 'USAGE', isRepresentative: false },
                    { name: '2단', price: 5500000, feeType: 'USAGE', isRepresentative: false },
                    { name: '5단', price: 5500000, feeType: 'USAGE', isRepresentative: false },
                    { name: '3단', price: 6500000, feeType: 'USAGE', isRepresentative: false },
                    { name: '4단', price: 6500000, feeType: 'USAGE', isRepresentative: false },
                    { name: '6단', price: 4900000, feeType: 'USAGE', isRepresentative: false },
                    { name: '가족단(1~5단) 10칸', price: 50000000, feeType: 'USAGE', grade: '가족단 10구좌 가격', isRepresentative: false },
                ]
            }
        ]
    };
    console.log('✅ park-0607 수암사 영혼의쉼터 업데이트 완료');
}

// ============================================================
// park-0608: (사)민족불교해동조계종 해동사
// 이미지 기반 - 현재 데이터 완전히 잘못됨 (607 데이터가 들어가있음)
// ============================================================
const p608 = data.find(x => x.id === 'park-0608');
if (p608) {
    p608.priceInfo = {
        representativePrice: 1000000,
        standardizedPrices: [
            {
                serviceType: 'BONGSAN',
                subType: '봉안당',
                rows: [
                    { name: '1단', price: 1000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '2단', price: 1500000, feeType: 'USAGE', isRepresentative: false },
                    { name: '3단', price: 2000000, feeType: 'USAGE', isRepresentative: false },
                    { name: '4~6단', price: 3000000, feeType: 'USAGE', isRepresentative: false },
                    { name: '7단', price: 1800000, feeType: 'USAGE', isRepresentative: false },
                    { name: '8단', price: 1500000, feeType: 'USAGE', isRepresentative: false },
                    { name: '별도상담', price: 0, feeType: 'USAGE', grade: '별도 상담', isRepresentative: false },
                    { name: '특별단', price: 0, feeType: 'USAGE', grade: '별도 상담', isRepresentative: false },
                    { name: '관리비 5년', price: 100000, feeType: 'MAINTENANCE', grade: '5년', isRepresentative: false },
                    { name: '관리비 10년', price: 200000, feeType: 'MAINTENANCE', grade: '10년', isRepresentative: false },
                    { name: '관리비 15년', price: 300000, feeType: 'MAINTENANCE', grade: '15년', isRepresentative: false },
                    { name: '영구관리', price: 500000, feeType: 'MAINTENANCE', grade: '영구', isRepresentative: false },
                ]
            }
        ]
    };
    console.log('✅ park-0608 해동사 업데이트 완료');
}

// ============================================================
// park-0609: 천주교하늘공원 봉안당
// 이미지 기반 - 현재 관리비 30,000만 있음 → 전체 가격 추가
// ============================================================
const p609 = data.find(x => x.id === 'park-0609');
if (p609) {
    p609.priceInfo = {
        representativePrice: 2500000,
        standardizedPrices: [
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(개인)',
                rows: [
                    { name: '1층 1/2/7/8단', price: 2500000, feeType: 'USAGE', grade: '1위형 / 관리비 별도', isRepresentative: true },
                    { name: '1층 3/4/5/6단, 2층전체', price: 3000000, feeType: 'USAGE', grade: '1위형 / 관리비 별도', isRepresentative: false },
                    { name: '관리비(1년)', price: 30000, feeType: 'MAINTENANCE', grade: '연간', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(부부)',
                rows: [
                    { name: '1층 1/2/7/8단', price: 5000000, feeType: 'USAGE', grade: '2위형 / 관리비 별도', isRepresentative: false },
                    { name: '1층 3/4/5/6단, 2층전체', price: 6000000, feeType: 'USAGE', grade: '2위형 / 관리비 별도', isRepresentative: false },
                    { name: '관리비(1년)', price: 40000, feeType: 'MAINTENANCE', grade: '연간', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(가족)',
                rows: [
                    { name: '1층 1/4단', price: 9000000, feeType: 'USAGE', grade: '4위형 / 관리비 별도', isRepresentative: false },
                    { name: '1층 2/3단, 2층전체', price: 10000000, feeType: 'USAGE', grade: '4위형 / 관리비 별도', isRepresentative: false },
                    { name: '관리비(1년)', price: 50000, feeType: 'MAINTENANCE', grade: '연간', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '가족봉안담(6위)',
                rows: [
                    { name: '6위형', price: 12000000, feeType: 'USAGE', grade: '6위형 / 관리비 별도', isRepresentative: false },
                    { name: '관리비(1년)', price: 40000, feeType: 'MAINTENANCE', grade: '연간', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '가족봉안담(8위)',
                rows: [
                    { name: '8위형', price: 15000000, feeType: 'USAGE', grade: '8위형 / 관리비 별도', isRepresentative: false },
                    { name: '관리비(1년)', price: 50000, feeType: 'MAINTENANCE', grade: '연간', isRepresentative: false },
                ]
            }
        ]
    };
    console.log('✅ park-0609 천주교하늘공원 봉안당 업데이트 완료');
}

// ============================================================
// park-0610: 추모공원 하늘문
// 이미지 기반 - groupType으로 관별 분리, 관리비 추가
// websiteUrl: http://www.hi1009.com
// ============================================================
const p610 = data.find(x => x.id === 'park-0610');
if (p610) {
    p610.websiteUrl = 'http://www.hi1009.com';
    p610.priceInfo = {
        representativePrice: 2000000,
        standardizedPrices: [
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(개인)',
                groupType: '민음관',
                rows: [
                    { name: '일반실', price: 2000000, feeType: 'USAGE', grade: '관리비 5년 35만원', isRepresentative: true },
                    { name: 'VIP실', price: 4000000, feeType: 'USAGE', grade: '관리비 5년 35만원', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(부부)',
                groupType: '민음관',
                rows: [
                    { name: '일반실', price: 4000000, feeType: 'USAGE', grade: '관리비 5년 70만원', isRepresentative: false },
                    { name: 'VIP실', price: 8000000, feeType: 'USAGE', grade: '관리비 5년 70만원', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(개인)',
                groupType: '소망관',
                rows: [
                    { name: '일반 스페셜실', price: 3500000, feeType: 'USAGE', grade: '관리비 5년 35만원', isRepresentative: false },
                    { name: 'VIP/VVIP실', price: 5500000, feeType: 'USAGE', grade: '관리비 5년 35만원', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(부부)',
                groupType: '소망관',
                rows: [
                    { name: '일반 스페셜실', price: 7000000, feeType: 'USAGE', grade: '관리비 5년 70만원', isRepresentative: false },
                    { name: 'VIP/VVIP실', price: 11000000, feeType: 'USAGE', grade: '관리비 5년 70만원', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(개인)',
                groupType: '사랑관',
                rows: [
                    { name: '일반실', price: 2000000, feeType: 'USAGE', grade: '관리비 5년 35만원', isRepresentative: false },
                    { name: '특별단', price: 4000000, feeType: 'USAGE', grade: '관리비 5년 35만원', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(부부)',
                groupType: '사랑관',
                rows: [
                    { name: '일반실', price: 4000000, feeType: 'USAGE', grade: '관리비 5년 70만원', isRepresentative: false },
                    { name: '특별단', price: 8000000, feeType: 'USAGE', grade: '관리비 5년 70만원', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '봉안당',
                groupType: '사랑관 VIP',
                rows: [
                    { name: '특별단 VIP', price: 18000000, feeType: 'USAGE', grade: '1위 / 관리비 5년 35만원', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '관리비',
                rows: [
                    { name: '개인단(5년)', price: 350000, feeType: 'MAINTENANCE', grade: '5년', isRepresentative: false },
                    { name: '부부단(5년)', price: 700000, feeType: 'MAINTENANCE', grade: '5년', isRepresentative: false },
                ]
            }
        ]
    };
    console.log('✅ park-0610 추모공원 하늘문 업데이트 완료');
}

// ============================================================
// park-0611: 은하수공원 달님의집(봉안당)
// 유저 이미지 + 공홈 배너 기반
// websiteUrl: https://www.sjfmc.or.kr/eunhasu.do
// 관내/관외 residency, 사용료/관리비 분리
// ============================================================
const p611 = data.find(x => x.id === 'park-0611');
if (p611) {
    p611.websiteUrl = 'https://www.sjfmc.or.kr/eunhasu.do';
    p611.priceInfo = {
        representativePrice: 270000,
        standardizedPrices: [
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(개인)',
                rows: [
                    { name: '사용료', price: 270000, feeType: 'USAGE', residency: 'RESIDENT', grade: '최초 15년 / 연장 15년(1회) / 총 30년', isRepresentative: true },
                    { name: '관리비', price: 110000, feeType: 'MAINTENANCE', residency: 'RESIDENT', grade: '15년', isRepresentative: false },
                    { name: '사용료', price: 1080000, feeType: 'USAGE', residency: 'NON_RESIDENT', grade: '최초 15년 / 연장 15년(1회) / 총 30년', isRepresentative: false },
                    { name: '관리비', price: 440000, feeType: 'MAINTENANCE', residency: 'NON_RESIDENT', grade: '15년', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(부부)',
                rows: [
                    { name: '사용료', price: 410000, feeType: 'USAGE', residency: 'RESIDENT', grade: '최초 15년 / 연장 15년(1회) / 총 30년', isRepresentative: false },
                    { name: '관리비', price: 160000, feeType: 'MAINTENANCE', residency: 'RESIDENT', grade: '15년', isRepresentative: false },
                    { name: '사용료', price: 1640000, feeType: 'USAGE', residency: 'NON_RESIDENT', grade: '최초 15년 / 연장 15년(1회) / 총 30년', isRepresentative: false },
                    { name: '관리비', price: 640000, feeType: 'MAINTENANCE', residency: 'NON_RESIDENT', grade: '15년', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(개장유골)',
                groupType: '세종시 건설관련',
                rows: [
                    { name: '개인단 사용료', price: 190000, feeType: 'USAGE', residency: 'RESIDENT', grade: '최초 15년 / 연장 15년(1회) / 총 30년', isRepresentative: false },
                    { name: '개인단 관리비', price: 110000, feeType: 'MAINTENANCE', residency: 'RESIDENT', grade: '15년', isRepresentative: false },
                    { name: '부부단 사용료', price: 280000, feeType: 'USAGE', residency: 'RESIDENT', grade: '최초 15년 / 연장 15년(1회) / 총 30년', isRepresentative: false },
                    { name: '부부단 관리비', price: 160000, feeType: 'MAINTENANCE', residency: 'RESIDENT', grade: '15년', isRepresentative: false },
                ]
            }
        ]
    };
    console.log('✅ park-0611 은하수공원 달님의집 업데이트 완료');
}

// ============================================================
// park-0612: 속초시추모의집
// e하늘 + 유저 이미지 기반
// websiteUrl: https://www.sokchosiseol.or.kr/biz/welfare.do
// 봉안당 관내/관외, 공설봉안묘 관내/관외+관리비
// ============================================================
const p612 = data.find(x => x.id === 'park-0612');
if (p612) {
    p612.websiteUrl = 'https://www.sokchosiseol.or.kr/biz/welfare.do';
    p612.priceInfo = {
        representativePrice: 200000,
        standardizedPrices: [
            {
                serviceType: 'BONGSAN',
                subType: '봉안당',
                rows: [
                    { name: '개인단', price: 200000, feeType: 'USAGE', residency: 'RESIDENT', isRepresentative: true },
                    { name: '개인단', price: 600000, feeType: 'USAGE', residency: 'NON_RESIDENT', isRepresentative: false },
                    { name: '부부단', price: 300000, feeType: 'USAGE', residency: 'RESIDENT', isRepresentative: false },
                    { name: '부부단', price: 900000, feeType: 'USAGE', residency: 'NON_RESIDENT', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BURIAL',
                subType: '봉안묘',
                rows: [
                    { name: '개인단 사용료', price: 460000, feeType: 'USAGE', residency: 'RESIDENT', grade: '최초 15년 / 연장 2회(15년 단위) / 총 45년', isRepresentative: false },
                    { name: '개인단 관리비', price: 350000, feeType: 'MAINTENANCE', residency: 'RESIDENT', grade: '최초 15년', isRepresentative: false },
                    { name: '개인단 사용료', price: 690000, feeType: 'USAGE', residency: 'NON_RESIDENT', grade: '최초 15년 / 연장 2회(15년 단위) / 총 45년', isRepresentative: false },
                    { name: '개인단 관리비', price: 525000, feeType: 'MAINTENANCE', residency: 'NON_RESIDENT', grade: '최초 15년', isRepresentative: false },
                    { name: '부부단 사용료', price: 690000, feeType: 'USAGE', residency: 'RESIDENT', grade: '최초 15년 / 연장 2회(15년 단위) / 총 45년', isRepresentative: false },
                    { name: '부부단 관리비', price: 480000, feeType: 'MAINTENANCE', residency: 'RESIDENT', grade: '최초 15년', isRepresentative: false },
                    { name: '부부단 사용료', price: 1035000, feeType: 'USAGE', residency: 'NON_RESIDENT', grade: '최초 15년 / 연장 2회(15년 단위) / 총 45년', isRepresentative: false },
                    { name: '부부단 관리비', price: 720000, feeType: 'MAINTENANCE', residency: 'NON_RESIDENT', grade: '최초 15년', isRepresentative: false },
                ]
            }
        ]
    };
    console.log('✅ park-0612 속초시추모의집 업데이트 완료');
}

// ============================================================
// park-0613: 예산군추모의집 제1관
// e하늘 이미지 기반 (3단계 거주구분)
// websiteUrl: https://www.yesan.go.kr/kor/sub06_13_04_02_04.do
// ============================================================
const p613 = data.find(x => x.id === 'park-0613');
if (p613) {
    p613.websiteUrl = 'https://www.yesan.go.kr/kor/sub06_13_04_02_04.do';
    p613.priceInfo = {
        representativePrice: 250000,
        standardizedPrices: [
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(개인)',
                rows: [
                    { name: '사용료', price: 250000, feeType: 'USAGE', residency: 'RESIDENT', grade: '예산군 3년이상 주민등록', isRepresentative: true },
                    { name: '사용료', price: 350000, feeType: 'USAGE', grade: '예산군 6월이상~3년미만 주민등록 또는 6월이상 등록기준지', isRepresentative: false },
                    { name: '사용료', price: 500000, feeType: 'USAGE', residency: 'NON_RESIDENT', grade: '예산군 이외 사용자', isRepresentative: false },
                    { name: '관리비', price: 100000, feeType: 'MAINTENANCE', residency: 'RESIDENT', grade: '예산군 3년이상 주민등록', isRepresentative: false },
                    { name: '관리비', price: 150000, feeType: 'MAINTENANCE', grade: '예산군 6월이상~3년미만', isRepresentative: false },
                    { name: '관리비', price: 250000, feeType: 'MAINTENANCE', residency: 'NON_RESIDENT', grade: '예산군 이외 사용자', isRepresentative: false },
                ]
            },
            {
                serviceType: 'BONGSAN',
                subType: '봉안당(부부)',
                rows: [
                    { name: '사용료', price: 700000, feeType: 'USAGE', residency: 'RESIDENT', grade: '예산군 3년이상 주민등록', isRepresentative: false },
                    { name: '사용료', price: 1150000, feeType: 'USAGE', grade: '예산군 6월이상~3년미만 주민등록 또는 6월이상 등록기준지', isRepresentative: false },
                    { name: '사용료', price: 1500000, feeType: 'USAGE', residency: 'NON_RESIDENT', grade: '예산군 이외 사용자', isRepresentative: false },
                    { name: '관리비', price: 300000, feeType: 'MAINTENANCE', residency: 'RESIDENT', grade: '예산군 3년이상 주민등록', isRepresentative: false },
                    { name: '관리비', price: 350000, feeType: 'MAINTENANCE', grade: '예산군 6월이상~3년미만', isRepresentative: false },
                    { name: '관리비', price: 500000, feeType: 'MAINTENANCE', residency: 'NON_RESIDENT', grade: '예산군 이외 사용자', isRepresentative: false },
                ]
            }
        ]
    };
    console.log('✅ park-0613 예산군추모의집 제1관 업데이트 완료');
}

// 저장
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('\n✅ facilities.json 저장 완료');
