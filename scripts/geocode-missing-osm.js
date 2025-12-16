/**
 * 좌표 없는 시설만 OpenStreetMap(Nominatim) API로 주소→좌표 변환
 * 무료, API 키 필요 없음
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

// 지연 함수
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// OSM Nominatim API로 좌표 조회 (여러 시도)
async function geocodeOSM(address) {
    // 주소 전처리: 괄호 제거
    let query = address.split('(')[0].trim();

    const attempts = [
        query, // 전체 주소
        query.replace(/산?\s*\d+[-]?\d*.*$/, '').trim(), // 번지수 제거
        query.split(' ').slice(0, 4).join(' '), // 첫 4어절만
        query.split(' ').slice(0, 3).join(' ')  // 첫 3어절만 (시/군/구)
    ];

    for (const q of attempts) {
        if (!q || q.length < 5) continue;

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=kr&limit=1`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'DaeDaeSonSon/1.0 (admin contact)'
                }
            });

            const data = await response.json();

            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
        } catch (e) {
            // 무시하고 다음 시도
        }

        // OSM 정책 준수: 1초 대기
        await delay(1000);
    }

    return null;
}

async function main() {
    console.log('🚀 좌표 없는 시설 자동 보정 시작 (OSM)...\n');

    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ facilities.json not found!');
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    // 좌표 없는 시설만 필터
    const missingCoords = [];
    facilities.forEach((f, idx) => {
        if (!f.coordinates || !f.coordinates.lat || !f.coordinates.lng) {
            if (f.address) {
                missingCoords.push({ facility: f, index: idx });
            }
        }
    });

    console.log(`📂 총 ${facilities.length}개 시설 중 좌표 없는 시설: ${missingCoords.length}개\n`);

    if (missingCoords.length === 0) {
        console.log('✅ 모든 시설에 좌표가 있습니다!');
        return;
    }

    let success = 0;
    let failed = 0;

    for (let i = 0; i < missingCoords.length; i++) {
        const { facility, index } = missingCoords[i];

        // 진행률 표시
        if (i % 10 === 0) {
            const percent = ((i / missingCoords.length) * 100).toFixed(1);
            console.log(`\n📊 진행률: ${i}/${missingCoords.length} (${percent}%) | 성공: ${success}, 실패: ${failed}`);
        }

        const coords = await geocodeOSM(facility.address);

        if (coords) {
            facilities[index].coordinates = coords;
            facilities[index].location = coords;
            success++;
            console.log(`✅ [${i + 1}] ${facility.name.substring(0, 25)}... -> ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        } else {
            failed++;
            console.log(`❌ [${i + 1}] ${facility.name.substring(0, 25)}... (좌표 못 찾음)`);
        }

        // 20개마다 중간 저장
        if ((i + 1) % 20 === 0) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
            console.log(`💾 중간 저장 완료 (${i + 1}개 처리)`);
        }
    }

    // 최종 저장
    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

    console.log('\n\n🎉 ===== 완료! =====');
    console.log(`✅ 성공: ${success}개`);
    console.log(`❌ 실패: ${failed}개`);
    console.log(`📁 처리 대상: ${missingCoords.length}개`);
    console.log('\n✨ 메인 페이지를 새로고침하면 새 마커들을 확인할 수 있습니다!');
}

main().catch(err => {
    console.error('오류 발생:', err);
    process.exit(1);
});
