const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Item 323: 천주사 영탑공원 (park-0703)
const target = facilities.find(f => f.id === 'park-0703');

if (!target) {
    console.error('❌ park-0703 (천주사 영탑공원) not found!');
    process.exit(1);
}

console.log(`📝 Updating ${target.name} (${target.id})...`);

target.pricing = {
    '봉안당': {
        rows: [
            {
                name: "유해납골",
                grade: "1기",
                price: 2500000,
                description: "유해납골 1기",
                isRepresentative: true
            },
            {
                name: "유골함",
                grade: "1기",
                price: 270000,
                description: "유골함 1기",
                isRepresentative: false
            }
        ]
    },
    '옵션': {
        rows: [
            {
                name: "관리비",
                price: 50000,
                description: "1년",
                isRepresentative: false
            }
        ]
    }
};

// lastUpdated 업데이트
target.lastUpdated = new Date().toISOString();

fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log(`✅ Item 323 (천주사 영탑공원) updated successfully!`);
