const fs = require('fs');
const path = require('path');
const https = require('https');

// .env.local 파일에서 환경변수 읽기
const envPath = path.join(__dirname, '../.env.local');
const envVars = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            envVars[match[1].trim()] = match[2].trim();
        }
    });
}

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

// Geocoding 함수 (https 모듈 사용)
function geocode(address) {
    return new Promise((resolve, reject) => {
        const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`;

        const options = {
            headers: {
                'X-NCP-APIGW-API-KEY-ID': envVars.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID,
                'X-NCP-APIGW-API-KEY': envVars.NAVER_MAP_CLIENT_SECRET
            }
        };

        https.get(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.addresses && json.addresses.length > 0) {
                        const { x, y } = json.addresses[0];
                        resolve({ lat: parseFloat(y), lng: parseFloat(x) });
                    } else {
                        resolve(null);
                    }
                } catch (err) {
                    resolve(null);
                }
            });
        }).on('error', () => {
            resolve(null);
        });
    });
}

// 딜레이 함수
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 메인 함수
async function main() {
    console.log('📍 Starting accurate geocoding...\n');
    console.log(`API KEY ID: ${envVars.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID?.substring(0, 5)}...`);
    console.log(`API KEY: ${envVars.NAVER_MAP_CLIENT_SECRET?.substring(0, 5)}...\n`);

    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ facilities.json not found!');
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    console.log(`✅ Loaded ${facilities.length} facilities\n`);

    let success = 0;
    let failed = 0;
    let skipped = 0;

    // 처음 100개만 테스트
    const limit = Math.min(100, facilities.length);

    for (let i = 0; i < limit; i++) {
        const facility = facilities[i];

        // 이미 정확한 location이 있으면 스킵 (지역 중심이 아닌 실제 좌표)
        if (facility.location &&
            facility.location.lat !== 0 &&
            facility.location.lng !== 0 &&
            !isRegionCenter(facility.location)) {
            console.log(`⏭️  [${i + 1}/${limit}] Skipped: ${facility.name} (already has precise location)`);
            skipped++;
            continue;
        }

        if (!facility.address) {
            console.log(`⚠️  [${i + 1}/${limit}] Skipped: ${facility.name} (no address)`);
            skipped++;
            continue;
        }

        console.log(`🔍 [${i + 1}/${limit}] Geocoding: ${facility.name}`);
        console.log(`   Address: ${facility.address}`);

        const location = await geocode(facility.address);

        if (location) {
            facilities[i].location = location;
            console.log(`✅ Success! Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}\n`);
            success++;
        } else {
            console.log(`❌ Failed\n`);
            failed++;
        }

        // API 제한 방지: 초당 5개 = 200ms 대기
        await delay(200);
    }

    // 저장
    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

    console.log('\n📊 Summary (First 100):');
    console.log(`   ✅ Success: ${success}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`\n✅ Done! Run again to process next batch.`);
}

// 지역 중심 좌표인지 확인
function isRegionCenter(location) {
    const REGION_CENTERS = [
        { lat: 37.5665, lng: 126.9780 }, // 서울
        { lat: 35.1796, lng: 129.0756 }, // 부산
        { lat: 35.8714, lng: 128.6014 }, // 대구
        // ... (다른 지역들도 포함 가능)
    ];

    return REGION_CENTERS.some(center =>
        Math.abs(location.lat - center.lat) < 0.1 &&
        Math.abs(location.lng - center.lng) < 0.1
    );
}

main().catch(console.error);
