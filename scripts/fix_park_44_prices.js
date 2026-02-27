const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0044');
if (parkIndex === -1) { console.error('park-0044 not found'); process.exit(1); }
const park = data[parkIndex];

// park-0044: (재)한남공원묘원
// - 사용료: m²당 581,190원, 관리비: m²당/년 5,660원
// - 합장용 묘테(석물세트): 1단 288만/2단 408만/3단(신) 601만/4단 685만
//   → 비석, 상석, 화병 포함
// - 봉안묘: 2위 300만/4위 350만/8위 500만/12위 650만/16위 850만/20위 960만/24위 1053만
//   → 봉안묘본체, 비석, 상석, 화병 포함
// 모두 야외시설 → BURIAL

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "묘지 사용료",
                price: 581190,
                feeType: "USAGE",
                grade: "1m²당",
                note: "",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "관리비",
                price: 5660,
                feeType: "MAINTENANCE",
                grade: "1m²당 / 1년",
                note: "",
                groupType: "매장묘"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "[필수] 석물 (묘테 세트)",
        rows: [
            {
                name: "1단 묘테 합장용",
                price: 2880000,
                feeType: "USAGE",
                grade: "",
                note: "비석, 상석, 화병 포함",
                groupType: "[필수] 석물 (묘테 세트)",
                isRepresentative: true
            },
            {
                name: "2단 묘테 합장용",
                price: 4080000,
                feeType: "USAGE",
                grade: "",
                note: "비석, 상석, 화병 포함",
                groupType: "[필수] 석물 (묘테 세트)"
            },
            {
                name: "3단 묘테 합장용 (신형)",
                price: 6010000,
                feeType: "USAGE",
                grade: "",
                note: "비석, 상석, 화병 포함",
                groupType: "[필수] 석물 (묘테 세트)"
            },
            {
                name: "4단 묘테 합장용",
                price: 6850000,
                feeType: "USAGE",
                grade: "",
                note: "갓비석, 상석, 화병 포함",
                groupType: "[필수] 석물 (묘테 세트)"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "봉안묘",
        rows: [
            {
                name: "봉안묘 2위형",
                price: 3000000,
                feeType: "USAGE",
                grade: "2위",
                note: "봉안묘본체, 비석, 상석, 화병 포함",
                groupType: "봉안묘",
                isRepresentative: true
            },
            {
                name: "봉안묘 4위형",
                price: 3500000,
                feeType: "USAGE",
                grade: "4위",
                note: "봉안묘본체, 비석, 상석, 화병 포함",
                groupType: "봉안묘"
            },
            {
                name: "봉안묘 8위형",
                price: 5000000,
                feeType: "USAGE",
                grade: "8위",
                note: "봉안묘본체, 비석, 상석, 화병 포함",
                groupType: "봉안묘"
            },
            {
                name: "봉안묘 12위형",
                price: 6500000,
                feeType: "USAGE",
                grade: "12위",
                note: "봉안묘본체, 비석, 상석, 화병 포함",
                groupType: "봉안묘"
            },
            {
                name: "봉안묘 16위형",
                price: 8500000,
                feeType: "USAGE",
                grade: "16위",
                note: "봉안묘본체, 비석, 상석, 화병 포함",
                groupType: "봉안묘"
            },
            {
                name: "봉안묘 20위형",
                price: 9600000,
                feeType: "USAGE",
                grade: "20위",
                note: "봉안묘본체, 비석, 상석, 화병 포함",
                groupType: "봉안묘"
            },
            {
                name: "봉안묘 24위형",
                price: 10530000,
                feeType: "USAGE",
                grade: "24위",
                note: "봉안묘본체, 비석, 상석, 화병 포함",
                groupType: "봉안묘"
            }
        ]
    }
];

if (!park.priceInfo) park.priceInfo = {};
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0044 prices updated successfully.');
