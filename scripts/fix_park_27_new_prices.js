const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0027');
if (parkIndex === -1) {
    console.error('park-0027 not found');
    process.exit(1);
}

const park = data[parkIndex];

// park-0027: 우성공원묘원 
// Burial

const newPrices = [
    // --- 매장묘 (BURIAL) ---
    {
        serviceType: "BURIAL",
        subType: "토지 사용료 및 관리비",
        groupType: "기본 사용료 (필수)",
        rows: [
            {
                itemName: "토지사용료",
                description: "3.3㎡(평) 당 토지 사용료",
                price: 693000,
                feeType: "USAGE",
                grade: "3.3㎡(1평)단위",
                note: ""
            },
            {
                itemName: "관리비",
                description: "1년/3.3㎡(평) 관리비 (년2회/제초제 살포 및 벌초 포함)",
                price: 20000,
                feeType: "MAINTENANCE",
                grade: "3.3㎡(1평)단위",
                note: "년2회 제초제 살포 및 벌초 작업 포함"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "기본 매장 작업비",
        groupType: "기본 시설/작업 (필수)",
        rows: [
            {
                itemName: "매장비(시신, 개장유골)",
                description: "광중작업, 매장작업, 봉분작업, 잔디식재 등 기본 매장 작업 비용",
                price: 2000000,
                feeType: "USAGE",
                grade: null,
                note: ""
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "매장묘 패키지 (석물 + 작업비)",
        groupType: "묘 조성 패키지 (선택)",
        rows: [
            {
                itemName: "단장묘",
                description: "단장묘 테두리, 비석, 상석, 화병, 향로석, 설치비 등 포함",
                price: 25000000,
                feeType: "USAGE",
                grade: "단장묘",
                note: ""
            },
            {
                itemName: "합장묘",
                description: "합장묘 테두리, 비석, 상석, 화병, 향로석, 설치비 등 포함",
                price: 30000000,
                feeType: "USAGE",
                grade: "합장묘",
                note: ""
            },
            {
                itemName: "쌍분묘",
                description: "단장묘 테두리 2벌, 비석, 상석, 화병, 향로석, 설치비 등 포함",
                price: 40000000,
                feeType: "USAGE",
                grade: "쌍분묘",
                note: ""
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "추가 석물 및 설치 옵션",
        groupType: "추가 석물 및 조경 (선택)",
        rows: [
            {
                itemName: "상석(화강석) 2.7자",
                description: "부속(결방석, 북석), 설치비 포함",
                price: 1000000,
                feeType: "STONE",
                grade: "2.7자",
                note: ""
            },
            {
                itemName: "월석(입)비(오석) 3자",
                description: "받침석, 글자(100자 이내), 설치비 포함",
                price: 1000000,
                feeType: "STONE",
                grade: "3자",
                note: ""
            },
            {
                itemName: "피와비(오석) 2자",
                description: "받침석, 글자(100자 이내), 설치비 포함",
                price: 1000000,
                feeType: "STONE",
                grade: "2자",
                note: ""
            },
            {
                itemName: "갓비석(오석) 3.7자",
                description: "갓, 받침석, 각자비(100자 이내), 설치비 포함",
                price: 2500000,
                feeType: "STONE",
                grade: "3.7자",
                note: ""
            },
            {
                itemName: "2단 단장묘테",
                description: "화강석 설치비 포함",
                price: 3000000,
                feeType: "STONE",
                grade: "2단",
                note: ""
            },
            {
                itemName: "2단 합장묘테",
                description: "화강석, 설치비 포함",
                price: 3500000,
                feeType: "STONE",
                grade: "2단",
                note: ""
            },
            {
                itemName: "화병(화강석)",
                description: "설치비 포함",
                price: 100000,
                feeType: "STONE",
                grade: null,
                note: ""
            },
            {
                itemName: "향로석(화강석)",
                description: "설치비 포함",
                price: 100000,
                feeType: "STONE",
                grade: null,
                note: ""
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "추가 작업 및 서비스",
        groupType: "추가 작업 및 기타 (선택)",
        rows: [
            {
                itemName: "각자비(대)",
                description: "비석글씨 대자/자당",
                price: 25000,
                feeType: "USAGE",
                grade: "대",
                note: ""
            },
            {
                itemName: "각자비(중)",
                description: "비석글씨 중자/자당",
                price: 20000,
                feeType: "USAGE",
                grade: "중",
                note: ""
            },
            {
                itemName: "각자비(소)",
                description: "비석글씨 소자/자당",
                price: 2500,
                feeType: "USAGE",
                grade: "소",
                note: ""
            },
            {
                itemName: "봉분잔디 교체/단장묘",
                description: "재래봉분, 특수묘테 비용추가",
                price: 50000,
                feeType: "USAGE",
                grade: "단장묘",
                note: ""
            },
            {
                itemName: "봉분잔디 교체/합장묘",
                description: "재래봉분, 특수묘테 비용추가",
                price: 100000,
                feeType: "USAGE",
                grade: "합장묘",
                note: ""
            }
        ]
    }
];

if (!park.priceInfo) {
    park.priceInfo = {};
}
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0027 prices updated successfully.');
