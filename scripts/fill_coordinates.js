require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Google Maps Geocoding API
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_API_KEY) {
    console.error('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY가 .env.local에 없습니다!');
    process.exit(1);
}

// 주소를 좌표로 변환
async function geocodeAddress(address) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}&language=ko`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
    }
    return null;
}

async function main() {
    console.log('🚀 좌표 없는 시설에 마커 설정 시작\n');

    const facilitiesPath = path.join(__dirname, '../data/facilities.json');
    const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    // 좌표가 없거나 (0,0)인 시설 중 주소가 있는 것 필터
    const needsCoords = facilities.filter(f => {
        const noCoords = !f.coordinates || (f.coordinates.lat === 0 && f.coordinates.lng === 0);
        const hasAddress = f.address && f.address.trim() !== '';
        return noCoords && hasAddress;
    });

    console.log(`총 시설: ${facilities.length}개`);
    console.log(`좌표 필요 + 주소 있음: ${needsCoords.length}개\n`);

    if (needsCoords.length === 0) {
        console.log('✅ 모든 시설에 좌표가 있습니다!');
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < needsCoords.length; i++) {
        const facility = needsCoords[i];
        const progress = `[${i + 1}/${needsCoords.length}]`;

        try {
            const coords = await geocodeAddress(facility.address);

            if (coords) {
                // facilities 배열에서 해당 시설 찾아 업데이트
                const idx = facilities.findIndex(f => f.id === facility.id);
                if (idx !== -1) {
                    facilities[idx].coordinates = coords;
                }
                console.log(`${progress} ✅ ${facility.id}: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
                successCount++;
            } else {
                console.log(`${progress} ❌ ${facility.id}: 좌표 변환 실패`);
                failCount++;
            }
        } catch (e) {
            console.log(`${progress} ❌ ${facility.id}: ${e.message.substring(0, 50)}`);
            failCount++;
        }

        // Google API Rate limit 방지 (50 requests/second)
        if ((i + 1) % 10 === 0) {
            console.log(`   💾 중간 저장...`);
            fs.writeFileSync(facilitiesPath, JSON.stringify(facilities, null, 2), 'utf8');
            await new Promise(r => setTimeout(r, 1000));
        } else {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    // 최종 저장
    console.log('\n💾 최종 저장 중...');
    fs.writeFileSync(facilitiesPath, JSON.stringify(facilities, null, 2), 'utf8');

    console.log('\n' + '='.repeat(60));
    console.log('📊 최종 결과');
    console.log('='.repeat(60));
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
}

main().catch(console.error);
