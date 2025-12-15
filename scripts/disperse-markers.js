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

// 지역 중심점인지 확인 (오차 범위 내)
function isNearRegionCenter(location) {
    if (!location) return false;

    return Object.values(REGION_COORDS).some(center =>
        Math.abs(location.lat - center.lat) < 0.15 && // 기존에 0.1 범위 내로 생성했으므로
        Math.abs(location.lng - center.lng) < 0.15
    );
}

// 주소에서 지역 추출
function extractRegion(address) {
    if (!address) return null;
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
    return null;
}

function main() {
    console.log('📍 Dispersing markers wider...\n');

    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ facilities.json not found!');
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    let updated = 0;

    for (let i = 0; i < facilities.length; i++) {
        const facility = facilities[i];

        // 중요: 방금 수동 업데이트한 시설들은 건드리지 않음
        if (facility.name.includes('청계공원') || facility.name.includes('동산공원묘원')) {
            console.log(`🔒 Skipped (protected): ${facility.name}`);
            continue;
        }

        // 지역 중심점 근처에 있는 마커들만 다시 분산
        if (isNearRegionCenter(facility.location)) {
            const region = extractRegion(facility.address);

            if (region && REGION_COORDS[region]) {
                // 더 넓게 분산 (±0.4도 ≈ 40km 반경)
                const offset = {
                    lat: (Math.random() - 0.5) * 0.4,
                    lng: (Math.random() - 0.5) * 0.4
                };

                facilities[i].location = {
                    lat: REGION_COORDS[region].lat + offset.lat,
                    lng: REGION_COORDS[region].lng + offset.lng
                };
                updated++;
            }
        }
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
    console.log(`\n✅ Dispersed ${updated} facilities.`);
}

main();
