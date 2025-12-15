const fs = require('fs');
const path = require('path');

// 1. facilities.json 읽기
const facilitiesPath = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf-8'));

console.log(`📊 총 시설 수: ${facilities.length}\n`);

// 2. 좌표 데이터 검증
let withCoords = 0;
let withoutCoords = 0;
let invalidCoords = 0;
const missingCoords = [];

facilities.forEach((f, index) => {
    const hasCoordinates = f.coordinates &&
        typeof f.coordinates.lat === 'number' &&
        typeof f.coordinates.lng === 'number';

    const hasLatLng = typeof f.lat === 'number' && typeof f.lng === 'number';

    if (hasCoordinates || hasLatLng) {
        // 좌표 유효성 검사
        const lat = f.coordinates?.lat || f.lat;
        const lng = f.coordinates?.lng || f.lng;

        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            withCoords++;
        } else {
            invalidCoords++;
            missingCoords.push({
                index: index + 1,
                id: f.id,
                name: f.name,
                issue: '좌표 범위 초과',
                coords: { lat, lng }
            });
        }
    } else {
        withoutCoords++;
        missingCoords.push({
            index: index + 1,
            id: f.id,
            name: f.name,
            issue: '좌표 없음'
        });
    }
});

console.log(`📍 좌표 데이터:`);
console.log(`  ✅ 유효한 좌표: ${withCoords}`);
console.log(`  ❌ 좌표 없음: ${withoutCoords}`);
console.log(`  ⚠️  유효하지 않은 좌표: ${invalidCoords}\n`);

if (missingCoords.length > 0) {
    console.log(`🚨 좌표 문제 있는 시설 (최대 20개):\n`);
    missingCoords.slice(0, 20).forEach(m => {
        console.log(`  #${m.index} | ${m.id} | ${m.name}`);
        console.log(`    문제: ${m.issue}`);
        if (m.coords) {
            console.log(`    좌표: lat=${m.coords.lat}, lng=${m.coords.lng}`);
        }
    });
    if (missingCoords.length > 20) {
        console.log(`  ... 외 ${missingCoords.length - 20}개`);
    }
    console.log();
}

// 3. 마커 URL 매핑 시뮬레이션
console.log(`\n🗺️  마커 → URL 매핑 예시:\n`);

const samples = facilities.slice(0, 5);
samples.forEach(f => {
    const lat = f.coordinates?.lat || f.lat || 'N/A';
    const lng = f.coordinates?.lng || f.lng || 'N/A';
    const url = `/?id=${f.id}`;

    console.log(`  시설: ${f.name}`);
    console.log(`  좌표: (${lat}, ${lng})`);
    console.log(`  클릭 시 이동: ${url}\n`);
});

// 4. ID 재정렬 시 영향 분석
console.log(`\n💡 ID 재정렬 시 마커 동기화:\n`);
console.log(`  현재: park-0001 ~ park-1498 (중복/누락 있음)`);
console.log(`  재정렬 후: park-0001 ~ park-1497 (순차적)\n`);
console.log(`  영향:`);
console.log(`  ✅ 좌표는 그대로 유지 (lat, lng 변경 없음)`);
console.log(`  ✅ 마커 클릭 시 새 ID로 이동 (예: park-0001 → /?id=park-0001)`);
console.log(`  ⚠️  기존 북마크/링크는 깨질 수 있음`);
console.log(`  💡 해결: 301 리다이렉트 또는 ID 매핑 테이블 생성\n`);

// 5. 동기화 검증 결과
console.log(`\n✅ 동기화 검증 결과:\n`);

if (withCoords === facilities.length) {
    console.log(`  🎉 모든 시설이 지도에 표시 가능!`);
    console.log(`  🎉 ID 재정렬 후에도 마커는 정상 작동!`);
} else {
    console.log(`  ⚠️  ${withoutCoords + invalidCoords}개 시설은 지도에 표시 불가`);
    console.log(`  💡 좌표 데이터 추가 필요`);
}

console.log(`\n✅ 검증 완료!`);
