/**
 * 네이버 Geocoding API로 좌표 채우기 (정확도 높음)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

// 네이버 클라우드 플랫폼 API 키
const NCP_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
const NCP_CLIENT_SECRET = process.env.NAVER_MAP_CLIENT_SECRET;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 네이버 Geocoding API
async function geocodeNaver(address) {
    if (!NCP_CLIENT_ID || !NCP_CLIENT_SECRET) {
        console.error('❌ 네이버 API 키가 없습니다!');
        return null;
    }

    // 주소 정제 (괄호 안 내용 제거)
    let query = address.split('(')[0].trim();

    try {
        const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
            headers: {
                'X-NCP-APIGW-API-KEY-ID': NCP_CLIENT_ID,
                'X-NCP-APIGW-API-KEY': NCP_CLIENT_SECRET
            }
        });

        const data = await response.json();

        if (data.addresses && data.addresses.length > 0) {
            return {
                lat: parseFloat(data.addresses[0].y),
                lng: parseFloat(data.addresses[0].x)
            };
        }

        // 첫 시도 실패 시, 더 짧은 주소로 재시도
        const shorterQuery = query.split(' ').slice(0, 4).join(' ');
        if (shorterQuery !== query) {
            const url2 = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(shorterQuery)}`;
            const response2 = await fetch(url2, {
                headers: {
                    'X-NCP-APIGW-API-KEY-ID': NCP_CLIENT_ID,
                    'X-NCP-APIGW-API-KEY': NCP_CLIENT_SECRET
                }
            });
            const data2 = await response2.json();

            if (data2.addresses && data2.addresses.length > 0) {
                return {
                    lat: parseFloat(data2.addresses[0].y),
                    lng: parseFloat(data2.addresses[0].x)
                };
            }
        }

        return null;
    } catch (e) {
        console.error('API 에러:', e.message);
        return null;
    }
}

async function main() {
    console.log('🚀 네이버 Geocoding API로 좌표 채우기 시작!\n');

    if (!NCP_CLIENT_ID || !NCP_CLIENT_SECRET) {
        console.error('❌ 환경변수에 NAVER_MAP_CLIENT_SECRET이 없습니다!');
        console.log('   .env 파일에 NAVER_MAP_CLIENT_SECRET=xxx 추가 필요');
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    // 모든 시설 중 주소가 있는 것들 (기존 좌표 덮어쓰기)
    const targets = facilities.filter(f => f.address && f.address.trim() !== '');

    console.log(`📂 총 ${facilities.length}개 중 주소 있는 시설: ${targets.length}개\n`);

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < targets.length; i++) {
        const f = targets[i];
        const idx = facilities.findIndex(x => x.id === f.id);

        if (i % 50 === 0) {
            const pct = ((i / targets.length) * 100).toFixed(1);
            console.log(`\n📊 [${i}/${targets.length}] ${pct}% | ✅${success} ❌${failed}`);
        }

        const coords = await geocodeNaver(f.address);

        if (coords) {
            facilities[idx].coordinates = coords;
            success++;
            if (i < 20 || i % 100 === 0) {
                console.log(`✅ ${f.id} | ${f.name.substring(0, 25)}`);
            }
        } else {
            failed++;
            console.log(`❌ ${f.id} | ${f.name.substring(0, 25)}`);
        }

        // 네이버 API 속도 제한 (초당 10회 정도)
        await delay(100);

        // 100개마다 저장
        if ((i + 1) % 100 === 0) {
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
