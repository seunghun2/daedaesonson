const fs = require('fs');
const https = require('https');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const ENV_FILE = path.join(__dirname, '../.env.local');

// 환경변수 로드
let CLIENT_ID = '';
let CLIENT_SECRET = '';

try {
    const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
    const idMatch = envContent.match(/NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=(.*)/);
    const secretMatch = envContent.match(/NAVER_MAP_CLIENT_SECRET=(.*)/);

    if (idMatch) CLIENT_ID = idMatch[1].trim();
    if (secretMatch) CLIENT_SECRET = secretMatch[1].trim();
} catch (e) {
    console.error('❌ .env.local 파일을 읽을 수 없습니다.');
    process.exit(1);
}

// Geocoding 함수 (올바른 URL 사용!)
function geocode(address) {
    return new Promise((resolve, reject) => {
        const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`;

        const options = {
            headers: {
                'x-ncp-apigw-api-key-id': CLIENT_ID,
                'x-ncp-apigw-api-key': CLIENT_SECRET,
                'Accept': 'application/json'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.status === 'OK' && json.addresses && json.addresses.length > 0) {
                        const addr = json.addresses[0];
                        resolve({
                            lat: parseFloat(addr.y),
                            lng: parseFloat(addr.x)
                        });
                    } else {
                        resolve(null); // 결과 없음
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', (e) => {
            resolve(null);
        });
    });
}

// 지연 함수
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('🚀 전체 시설 좌표 업데이트 시작...\n');
    console.log('⏱️  예상 소요 시간: 약 7~10분 (1,500개 기준)\n');

    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ facilities.json not found!');
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    console.log(`📂 총 ${facilities.length}개 시설 로드\n`);

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < facilities.length; i++) {
        const facility = facilities[i];

        // 진행률 표시 (10개마다)
        if (i % 10 === 0) {
            const percent = ((i / facilities.length) * 100).toFixed(1);
            console.log(`\n📊 진행률: ${i}/${facilities.length} (${percent}%) | 성공: ${success}, 실패: ${failed}`);
        }

        if (!facility.address) {
            failed++;
            continue;
        }

        // 네이버 API로 좌표 조회
        const coords = await geocode(facility.address);

        if (coords) {
            facilities[i].coordinates = coords;
            facilities[i].location = coords;
            success++;
            console.log(`✅ [${i + 1}] ${facility.name.substring(0, 20)}... -> ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        } else {
            // 실패하면 기존 좌표 유지 (OSM/Granular 결과 보존)
            failed++;
            console.log(`⚠️ [${i + 1}] ${facility.name.substring(0, 20)}... (API 실패, 기존 좌표 유지)`);
        }

        // API 레이트 제한 방지 (초당 5개 = 200ms 간격)
        await delay(200);

        // 100개마다 중간 저장
        if ((i + 1) % 100 === 0) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
            console.log(`💾 중간 저장 완료 (${i + 1}개)`);
        }
    }

    // 최종 저장
    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

    console.log('\n\n🎉 ===== 완료! =====');
    console.log(`✅ 성공: ${success}개`);
    console.log(`❌ 실패: ${failed}개 (기존 좌표 유지됨)`);
    console.log(`📁 총: ${facilities.length}개`);
    console.log('\n✨ 이제 메인 페이지를 새로고침하면 정확한 마커 위치를 확인할 수 있습니다!');
}

main().catch(err => {
    console.error('오류 발생:', err);
    process.exit(1);
});
