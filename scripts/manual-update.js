const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

const UPDATES = [
    {
        name: '(재)아름다운 청계공원 화장시설',
        location: { lat: 35.2789128, lng: 127.2913501 }
    },
    {
        name: '(재)동산공원묘원 묘지',
        location: { lat: 35.43527, lng: 128.32286 }
    },
    // 사용자 요청했던 곳들 확인
    {
        name: '(재)동산공원묘원', // 이름이 살짝 다를 수 있으니
        location: { lat: 35.43527, lng: 128.32286 }
    }
];

function main() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ facilities.json not found!');
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    let count = 0;

    UPDATES.forEach(update => {
        const index = facilities.findIndex(f => f.name.includes(update.name) || update.name.includes(f.name));
        if (index !== -1) {
            facilities[index].location = update.location;
            console.log(`✅ Updated: ${facilities[index].name} -> ${update.location.lat}, ${update.location.lng}`);
            count++;
        }
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
    console.log(`\n✅ Manually updated ${count} facilities.`);
}

main();
