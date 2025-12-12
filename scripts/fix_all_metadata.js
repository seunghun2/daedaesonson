const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

console.log('=== 1~10번 좌표 및 운영형태 최종 수정 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// 1~10번 체크
for (let i = 0; i < 10; i++) {
    const facility = facilities[i];

    console.log(`${i + 1}. ${facility.name}`);

    // 운영형태 수정
    const oldType = facility.operatorType;
    if (facility.name.includes('(재)') || facility.name.includes('재단법인')) {
        facility.operatorType = 'FOUNDATION';
    } else if (facility.name.includes('공설') || facility.name.includes('군립') || facility.name.includes('시립')) {
        facility.operatorType = 'PUBLIC';
    } else {
        facility.operatorType = 'PRIVATE';
    }

    if (oldType !== facility.operatorType) {
        console.log(`  운영형태: ${oldType} → ${facility.operatorType}`);
    }

    // 좌표 체크 (0,0이면 임시 설정)
    if (facility.coordinates.lat === 0 && facility.coordinates.lng === 0) {
        // 주소에서 대략 좌표 추정
        if (facility.address.includes('울산')) {
            facility.coordinates = { lat: 35.5384, lng: 129.3114 };
        } else if (facility.address.includes('경남') || facility.address.includes('김해')) {
            facility.coordinates = { lat: 35.2281, lng: 128.6811 };
        } else if (facility.address.includes('진주')) {
            facility.coordinates = { lat: 35.1797, lng: 128.1076 };
        } else if (facility.address.includes('양산')) {
            facility.coordinates = { lat: 35.3350, lng: 129.0375 };
        } else if (facility.address.includes('예산')) {
            facility.coordinates = { lat: 36.6820, lng: 126.8466 };
        } else if (facility.address.includes('충남')) {
            facility.coordinates = { lat: 36.5184, lng: 126.8000 };
        }

        if (facility.coordinates.lat !== 0) {
            console.log(`  좌표: 설정됨 (${facility.coordinates.lat}, ${facility.coordinates.lng})`);
        }
    }

    // 가격 체크
    if (facility.priceRange.min === 100) {
        console.log(`  ⚠️  가격: 100만원 (기본값, 확인 필요)`);
    }
}

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('\n✅ 전체 수정 완료!');
console.log('브라우저 새로고침 후 지도에서 마커 확인하세요!');
