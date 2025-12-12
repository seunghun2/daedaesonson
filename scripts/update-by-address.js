const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

const ADDRESS_UPDATES = [
    { keyword: '곡성읍 신기리', location: { lat: 35.2789128, lng: 127.2913501 } },
    { keyword: '부림면 함의로 2180-269', location: { lat: 35.43527, lng: 128.32286 } },
    { keyword: '용인시 처인구 이동면 백자로 41', location: { lat: 37.1856, lng: 127.1856 } }, // 서울공원묘원
    { keyword: '인천광역시 중구 운북동 132-80', location: { lat: 37.5028, lng: 126.5492 } }, // 영종공설묘지
    { keyword: '경기도 광주시 오포읍 문형산길 81-37', location: { lat: 37.3512, lng: 127.1823 } }, // 스카이캐슬봉안당
    { keyword: '경기도 양평군 양동면 양동로 566', location: { lat: 37.4241, lng: 127.7512 } }, // 양평가족납골묘
    { keyword: '경기도 파주시 광탄면 명봉산로 262', location: { lat: 37.7582, lng: 126.8521 } }, // 용미리묘지
    { keyword: '경기도 고양시 덕양구 대자동 산 178-1', location: { lat: 37.6982, lng: 126.8712 } }, // 서울시립승화원
    { keyword: '세종특별자치시 은하수공원길 1', location: { lat: 36.6343, lng: 127.2435 } }, // 은하수공원
    { keyword: '부산광역시 금정구 금강로 754', location: { lat: 35.2782, lng: 129.0912 } } // 영락공원
];

function main() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ facilities.json not found!');
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    let count = 0;

    // 1. 주소 기반 일괄 업데이트
    facilities.forEach((facility, index) => {
        if (!facility.address) return;

        for (const update of ADDRESS_UPDATES) {
            if (facility.address.includes(update.keyword)) {

                // 마커 겹침 방지를 위해 미세한 랜덤 오프셋 추가 (반경 5~10m)
                const offset = {
                    lat: (Math.random() - 0.5) * 0.0001,
                    lng: (Math.random() - 0.5) * 0.0001
                };

                facilities[index].location = {
                    lat: update.location.lat + offset.lat,
                    lng: update.location.lng + offset.lng
                };

                console.log(`✅ Updated by Address: ${facility.name} -> ${facilities[index].location.lat}, ${facilities[index].location.lng}`);
                count++;
            }
        }
    });

    // 2. 이름 기반 보완 (주소가 다를 수도 있으므로)
    const NAME_UPDATES = [
        { name: '청계공원', lat: 35.2789128, lng: 127.2913501 },
        { name: '동산공원묘원', lat: 35.43527, lng: 128.32286 }
    ];

    facilities.forEach((facility, index) => {
        // 이미 업데이트된 항목은 패스 (대충 좌표 비교)
        if (Math.abs(facility.location.lat - 35.2789) < 0.01 || Math.abs(facility.location.lat - 35.4352) < 0.01) return;

        for (const update of NAME_UPDATES) {
            if (facility.name.includes(update.name) && !facility.name.includes('춘천')) { // 춘천 동산공원 제외

                const offset = {
                    lat: (Math.random() - 0.5) * 0.0001,
                    lng: (Math.random() - 0.5) * 0.0001
                };

                facilities[index].location = {
                    lat: update.lat + offset.lat,
                    lng: update.lng + offset.lng
                };
                console.log(`✅ Updated by Name: ${facility.name} -> ${facilities[index].location.lat}`);
                count++;
            }
        }
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
    console.log(`\n✅ Total updated: ${count}`);
}

main();
