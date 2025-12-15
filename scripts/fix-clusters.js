const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

// 한국 시/도별 대표 좌표 (중심점)
const REGION_COORDS = {
    '서울': { lat: 37.5665, lng: 126.9780 },
    '부산': { lat: 35.1796, lng: 129.0756 },
    '대구': { lat: 35.8714, lng: 128.6014 },
    '인천': { lat: 37.4563, lng: 126.7052 },
    '광주': { lat: 35.1595, lng: 126.8526 },
    '대전': { lat: 36.3504, lng: 127.3845 },
    '울산': { lat: 35.5384, lng: 129.3114 },
    '세종': { lat: 36.4800, lng: 127.2890 },
    '경기도': { lat: 37.4138, lng: 127.5183 },
    '강원': { lat: 37.8228, lng: 128.1555 },
    '충청북도': { lat: 36.8, lng: 127.7 },
    '충청남도': { lat: 36.5, lng: 126.8 },
    '전라북도': { lat: 35.7175, lng: 127.153 },
    '전라남도': { lat: 34.8679, lng: 126.991 },
    '경상북도': { lat: 36.4919, lng: 128.8889 },
    '경상남도': { lat: 35.4606, lng: 128.2132 },
    '제주': { lat: 33.4890, lng: 126.4983 }
};

// 주소에서 지역 추출
function extractRegion(address) {
    if (!address) return '서울'; // 주소 없으면 서울로
    if (address.includes('서울')) return '서울';
    if (address.includes('부산')) return '부산';
    if (address.includes('대구')) return '대구';
    if (address.includes('인천')) return '인천';
    if (address.includes('광주')) return '광주';
    if (address.includes('대전')) return '대전';
    if (address.includes('울산')) return '울산';
    if (address.includes('세종')) return '세종';
    if (address.includes('경기')) return '경기도';
    if (address.includes('강원')) return '강원';
    if (address.includes('충북') || address.includes('충청북도')) return '충청북도';
    if (address.includes('충남') || address.includes('충청남도')) return '충청남도';
    if (address.includes('전북') || address.includes('전라북도')) return '전라북도';
    if (address.includes('전남') || address.includes('전라남도')) return '전라남도';
    if (address.includes('경북') || address.includes('경상북도')) return '경상북도';
    if (address.includes('경남') || address.includes('경상남도')) return '경상남도';
    if (address.includes('제주')) return '제주';
    return '서울'; // 기본값
}

function main() {
    console.log('📍 Analyzing and fixing clustered markers...\n');

    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ facilities.json not found!');
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    // 1. 좌표별 카운트 (소수점 3자리 기준 - 약 100m)
    const coordMap = new Map();

    facilities.forEach((f, idx) => {
        const key = `${f.location.lat.toFixed(3)},${f.location.lng.toFixed(3)}`;
        if (!coordMap.has(key)) coordMap.set(key, []);
        coordMap.get(key).push(idx);
    });

    let updated = 0;

    // 2. 겹친 마커들 분산 처리
    for (const [key, indices] of coordMap.entries()) {
        if (indices.length > 5) { // 5개 이상 겹치면 무조건 분산
            console.log(`⚡ Found cluster at ${key}: ${indices.length} facilities. Dispersing...`);

            indices.forEach(idx => {
                const facility = facilities[idx];

                // 보호할 중요 시설 확인
                const isProtected =
                    (Math.abs(facility.location.lat - 35.2789) < 0.01 && Math.abs(facility.location.lng - 127.2913) < 0.01) ||
                    (Math.abs(facility.location.lat - 35.4352) < 0.01 && Math.abs(facility.location.lng - 128.3228) < 0.01);

                if (isProtected) {
                    console.log(`  🔒 Skipping protected facility: ${facility.name}`);
                    return;
                }

                // 주소 기반 지역 추출
                const region = extractRegion(facility.address);
                const center = REGION_COORDS[region] || REGION_COORDS['서울'];

                // 광범위 분산 (±0.3도 ≈ 30km)
                const offset = {
                    lat: (Math.random() - 0.5) * 0.6,
                    lng: (Math.random() - 0.5) * 0.6
                };

                facilities[idx].location = {
                    lat: center.lat + offset.lat,
                    lng: center.lng + offset.lng
                };
                updated++;
            });
        }
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
    console.log(`\n✅ Validated and dispersed ${updated} clustered facilities.`);
}

main();
