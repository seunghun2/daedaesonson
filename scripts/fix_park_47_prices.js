const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0047');
if (parkIndex === -1) { console.error('park-0047 not found'); process.exit(1); }
const park = data[parkIndex];

// park-0047: 양양군공설묘원 (공설)
// 단장묘: 사용료 359,440 / 관리비 24만 / 매장비 24만 / 석물비 88만
// 단장묘(수급자/유공자): 사용료 259,440
// 합장묘: 사용료 527,170 / 관리비 36만 / 매장비 24만 / 석물비 24만(?)
// 합장묘(수급자/유공자): 사용료 527,170 / 관리비 36만

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            // 단장묘
            {
                name: "사용료 (단장묘)",
                price: 359440,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "단장묘",
                isRepresentative: true
            },
            {
                name: "[필수] 매장비",
                price: 240000,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "단장묘"
            },
            {
                name: "사용료 (수급자/유공자/유가족)",
                price: 259440,
                feeType: "USAGE",
                grade: "",
                note: "수급자, 독립유공자, 국가유공자, 유가족",
                groupType: "단장묘"
            },
            {
                name: "관리비",
                price: 240000,
                feeType: "MAINTENANCE",
                grade: "",
                note: "",
                groupType: "단장묘"
            },
            // 합장묘
            {
                name: "사용료 (합장묘)",
                price: 527170,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "합장묘",
                isRepresentative: true
            },
            {
                name: "[필수] 매장비",
                price: 240000,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "합장묘"
            },
            {
                name: "사용료 (수급자/유공자/유가족)",
                price: 527170,
                feeType: "USAGE",
                grade: "",
                note: "수급자, 독립유공자, 국가유공자, 유가족",
                groupType: "합장묘"
            },
            {
                name: "관리비",
                price: 360000,
                feeType: "MAINTENANCE",
                grade: "",
                note: "",
                groupType: "합장묘"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "[필수] 석물비",
        rows: [
            {
                name: "석물비 (단장묘)",
                price: 880000,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "단장묘",
                isRepresentative: true
            },
            {
                name: "석물비 (합장묘)",
                price: 240000,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "합장묘",
                isRepresentative: true
            }
        ]
    }
];

if (!park.priceInfo) park.priceInfo = {};
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0047 prices updated successfully.');
