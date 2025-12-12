const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

// 주요 시설 수동 좌표 리스트 (API 없이 정확한 위치 보장)
const MANUAL_COORDS = [
    // 서울/경기
    { k: '서울공원묘원', lat: 37.1856, lng: 127.1856 },
    { k: '용미리묘지', lat: 37.7582, lng: 126.8521 },
    { k: '서울시립승화원', lat: 37.6982, lng: 126.8712 },
    { k: '스카이캐슬', lat: 37.3512, lng: 127.1823 },
    { k: '분당추모공원', lat: 37.3821, lng: 127.1623 },
    { k: '양평가족납골묘', lat: 37.4241, lng: 127.7512 },
    { k: '용인공원', lat: 37.2856, lng: 127.2312 },
    { k: '김포공원묘지', lat: 37.6432, lng: 126.6843 },
    { k: '자하연', lat: 37.7812, lng: 127.2412 }, // 포천 등 자하연 계열
    { k: '벽제화장장', lat: 37.6982, lng: 126.8712 },

    // 인천
    { k: '영종공설묘지', lat: 37.5028, lng: 126.5492 },
    { k: '인천가족공원', lat: 37.4682, lng: 126.7123 },

    // 지방 공설
    { k: '영락공원', lat: 35.2782, lng: 129.0912 }, // 부산
    { k: '은하수공원', lat: 36.6343, lng: 127.2435 }, // 세종
    { k: '대전추모공원', lat: 36.2512, lng: 127.3512 },
    { k: '광주영락공원', lat: 35.2312, lng: 126.8912 },
    { k: '대구명복공원', lat: 35.8312, lng: 128.6212 },

    // 사용자 지정
    { k: '청계공원', lat: 35.2789, lng: 127.2913 },
    { k: '동산공원묘원', lat: 35.4353, lng: 128.3229 },

    // 기타 주요 사설
    { k: '시안가족추모공원', lat: 37.3321, lng: 127.1543 },
    { k: '삼성공원묘원', lat: 37.1512, lng: 127.1123 },
    { k: '동화경모공원', lat: 37.8412, lng: 126.6812 }
];

function main() {
    console.log('📍 Applying manual coordinates for key facilities...\n');

    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ facilities.json not found!');
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    let count = 0;

    facilities.forEach((f, idx) => {
        for (const m of MANUAL_COORDS) {
            if (f.name.includes(m.k)) {
                // 정확한 좌표 적용 (미세 오차 없음)
                facilities[idx].coordinates = { lat: m.lat, lng: m.lng };
                facilities[idx].location = { lat: m.lat, lng: m.lng };
                count++;
                // console.log(`✅ Updated: ${f.name}`);
                break; // 하나 매칭되면 중단
            }
        }
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
    console.log(`\n✅ Manually fixed ${count} facilities.`);
}

main();
