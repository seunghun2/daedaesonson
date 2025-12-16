/**
 * 좌표 없는 시설만 처리 - ID는 절대 건드리지 않음!
 * 주소 → 좌표 변환 (OSM Nominatim API 사용)
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// OSM으로 좌표 조회
async function geocodeOSM(address) {
    let query = address.split('(')[0].trim();

    const attempts = [
        query,
        query.replace(/산?\s*\d+[-]?\d*.*$/, '').trim(),
        query.split(' ').slice(0, 4).join(' '),
        query.split(' ').slice(0, 3).join(' ')
    ];

    for (const q of attempts) {
        if (!q || q.length < 5) continue;

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=kr&limit=1`;

            const response = await fetch(url, {
                headers: { 'User-Agent': 'DaeDaeSonSon/1.0' }
            });

            const data = await response.json();

            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
        } catch (e) {
            // 다음 시도
        }

        await delay(1100); // OSM 정책: 1초에 1요청
    }

    return null;
}

async function main() {
    console.log('🚀 좌표 없는 시설만 처리합니다 (ID는 절대 건드리지 않음!)\n');

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    // 좌표 없는 시설 ID 목록
    const missingIds = [];
    facilities.forEach((f, idx) => {
        if (!f.coordinates || !f.coordinates.lat || !f.coordinates.lng) {
            if (f.address) {
                missingIds.push({ id: f.id, index: idx, name: f.name, address: f.address });
            }
        }
    });

    console.log(`📂 총 ${facilities.length}개 중 좌표 없는 시설: ${missingIds.length}개\n`);

    if (missingIds.length === 0) {
        console.log('✅ 모든 시설에 좌표가 있습니다!');
        return;
    }

    let success = 0;
    let failed = 0;

    for (let i = 0; i < missingIds.length; i++) {
        const item = missingIds[i];

        if (i % 10 === 0) {
            const pct = ((i / missingIds.length) * 100).toFixed(1);
            console.log(`\n📊 [${i}/${missingIds.length}] ${pct}% | ✅${success} ❌${failed}`);
        }

        const coords = await geocodeOSM(item.address);

        if (coords) {
            // ID는 그대로 두고 좌표만 추가!
            facilities[item.index].coordinates = coords;
            success++;
            console.log(`✅ ${item.id} | ${item.name.substring(0, 20)}`);
        } else {
            failed++;
            console.log(`❌ ${item.id} | ${item.name.substring(0, 20)}`);
        }

        // 25개마다 저장
        if ((i + 1) % 25 === 0) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
            console.log(`💾 저장 (${i + 1}개 처리됨)`);
        }
    }

    // 최종 저장
    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

    console.log('\n\n🎉 완료!');
    console.log(`✅ 성공: ${success}개`);
    console.log(`❌ 실패: ${failed}개`);
}

main().catch(console.error);
