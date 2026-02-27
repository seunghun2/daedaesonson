const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkId = 'park-0027';
const parkIndex = data.findIndex(f => f.id === parkId);

if (parkIndex === -1) {
    console.error('park-0027 not found');
    process.exit(1);
}
const park = data[parkIndex];

const newStandardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        unit: '원',
        rows: [
            // 사용료 및 관리비
            {
                name: "토지사용료",
                price: 693000,
                feeType: "USAGE",
                grade: null,
                note: "1평 매장묘 필수 토지 사용료",
                isRepresentative: true,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "사용료 및 관리비"
            },
            {
                name: "매장비",
                price: 2000000,
                feeType: "USAGE",
                grade: null,
                note: "관을 땅에 묻는 굴착 및 기본 매장 작업비",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "사용료 및 관리비"
            },
            {
                name: "관리비",
                price: 20000,
                feeType: "MAINTENANCE",
                grade: null,
                note: "1년/1평 기준 (연 2회 제초제 및 벌초 포함)",
                isRepresentative: false,
                duration: 1,
                durationType: "YEAR",
                residency: "ALL",
                groupType: "사용료 및 관리비"
            },
            // 단장묘 / 쌍분묘 / 합장묘 (패키지)
            {
                name: "단장묘",
                price: 25000000,
                feeType: "USAGE",
                grade: null,
                note: "개인묘 1기를 안치하기 위해 테두리, 비석, 상석, 화병, 향로석 등 일체 포함하여 조성하는 토탈 공사비 (토지 사용료 별도)",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "단장묘 / 쌍분묘 / 합장묘"
            },
            {
                name: "쌍분묘",
                price: 40000000,
                feeType: "USAGE",
                grade: null,
                note: "쌍분묘(테두리 2벌, 비석, 상석, 화병, 향로석 등)를 조성하는 토탈 공사비 (토지 사용료 별도)",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "단장묘 / 쌍분묘 / 합장묘"
            },
            {
                name: "합장묘",
                price: 30000000,
                feeType: "USAGE",
                grade: null,
                note: "부부를 함께 모실 합장묘 (테두리, 비석, 상석, 화병, 향로석 등 일체) 조성 토탈 공사비 (토지 사용료 별도)",
                isRepresentative: true,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "단장묘 / 쌍분묘 / 합장묘"
            },
            // 석물 및 설치 비용 (선택)
            {
                name: "봉분잔디 단장묘",
                price: 50000,
                feeType: "USAGE",
                grade: null,
                note: "개인 단장묘의 봉분을 잔디로 꾸미고 보수하는 조경 작업비",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "석물 및 설치 비용 (선택)"
            },
            {
                name: "봉분잔디 합장묘",
                price: 100000,
                feeType: "USAGE",
                grade: null,
                note: "부부 합장묘의 봉분을 잔디로 꾸미고 보수하는 조경 작업비",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "석물 및 설치 비용 (선택)"
            },
            {
                name: "2단 단장묘테",
                price: 3000000,
                feeType: "USAGE",
                grade: null,
                note: "개인 단장묘의 봉분 주변을 2단 돌로 두르는 묘테 설치 작업비",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "석물 및 설치 비용 (선택)"
            },
            {
                name: "2단 합장묘테",
                price: 3500000,
                feeType: "USAGE",
                grade: null,
                note: "부부 합장묘의 봉분 주변을 2단 돌로 두르는 묘테 설치 작업비",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "석물 및 설치 비용 (선택)"
            },
            {
                name: "월석비 (입비)",
                price: 1000000,
                feeType: "USAGE",
                grade: null,
                note: "받침과 함께 세우는 일반적인 형태의 비석 (설치비 포함)",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "석물 및 설치 비용 (선택)"
            },
            {
                name: "피와비",
                price: 1000000,
                feeType: "USAGE",
                grade: null,
                note: "가로로 눕혀 설치하는 형태의 빗돌 (설치비 포함)",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "석물 및 설치 비용 (선택)"
            },
            {
                name: "갓비석 (오석)",
                price: 2500000,
                feeType: "USAGE",
                grade: null,
                note: "머리 부분에 지붕 모양의 장식이 있는 고급 검은돌 재질의 비석 (설치비 포함)",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "석물 및 설치 비용 (선택)"
            },
            {
                name: "상석 (화강석)",
                price: 1000000,
                feeType: "USAGE",
                grade: null,
                note: "제사상을 차리기 위해 무덤 앞에 평평하게 설치하는 돌 (설치비 포함)",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "석물 및 설치 비용 (선택)"
            },
            {
                name: "향로석 (화강석)",
                price: 100000,
                feeType: "USAGE",
                grade: null,
                note: "향로를 올려놓기 위해 상석 앞에 두는 작은 돌받침대 (설치비 포함)",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "석물 및 설치 비용 (선택)"
            },
            {
                name: "화병 (화강석)",
                price: 100000,
                feeType: "USAGE",
                grade: null,
                note: "조화를 꽂기 위해 상석 좌우에 두는 돌 꽃병 (설치비 포함)",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "석물 및 설치 비용 (선택)"
            },
            {
                name: "각자비 (소)",
                price: 2500,
                feeType: "USAGE",
                grade: null,
                note: "비석 등에 글자를 새기는 작업 비용 (소형 글씨)",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "석물 및 설치 비용 (선택)"
            },
            {
                name: "각자비 (중)",
                price: 20000,
                feeType: "USAGE",
                grade: null,
                note: "비석 등에 글자를 새기는 작업 비용 (중형 글씨)",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "석물 및 설치 비용 (선택)"
            },
            {
                name: "각자비 (대)",
                price: 25000,
                feeType: "USAGE",
                grade: null,
                note: "비석 등에 글자를 새기는 작업 비용 (대형 글씨)",
                isRepresentative: false,
                duration: null,
                durationType: null,
                residency: "ALL",
                groupType: "석물 및 설치 비용 (선택)"
            }
        ]
    }
];

if (!park.priceInfo) {
    park.priceInfo = {};
}
park.priceInfo.standardizedPrices = newStandardizedPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated park-0027 array without duplicate subType.');
