
const fs = require('fs');
const path = require('path');

// e하늘 도메인
const BASE_URL = 'https://www.15774129.go.kr';

function getRandomPrice(minBase, maxBase, isMetro) {
    const multiplier = isMetro ? 1.5 : 1.0;
    // 10만원 단위로 끊기
    const min = Math.floor((minBase * multiplier + Math.random() * 100) / 10) * 10;
    const max = Math.floor((maxBase * multiplier + Math.random() * 500) / 10) * 10;
    return { min, max };
}

function getCategory(type) {
    if (type === 'FuneralHallDet') return 'FUNERAL_HOME'; // 장례식장
    if (type === 'CrematoriumDet') return 'CREMATORIUM'; // 화장시설
    if (type === 'NaturalBurialDet') return 'NATURAL_BURIAL'; // 자연장지
    if (type === 'CharnelDet') return 'CHARNEL_HOUSE'; // 봉안시설
    if (type === 'CemeteryDet') return 'FAMILY_GRAVE'; // 묘지
    return 'ETC';
}

function main() {
    const rawPath = path.join(__dirname, '../full_data.json');
    if (!fs.existsSync(rawPath)) {
        console.error('❌ full_data.json not found!');
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    console.log(`📦 Loaded ${rawData.length} raw items.`);

    const refined = rawData
        .map(item => {
            // 1. 카테고리 매핑
            const category = getCategory(item.type);

            // 2. 수도권 여부 확인 (서울, 경기, 인천)
            const isMetro = item.fulladdress.includes('서울') ||
                item.fulladdress.includes('경기') ||
                item.fulladdress.includes('인천');

            // 3. 가격 추정 로직 (단위: 만원)
            let priceRange = { min: 0, max: 0 };

            switch (category) {
                case 'CHARNEL_HOUSE': // 봉안당
                    priceRange = getRandomPrice(200, 1500, isMetro);
                    break;
                case 'NATURAL_BURIAL': // 수목장
                    priceRange = getRandomPrice(150, 1000, isMetro);
                    break;
                case 'FAMILY_GRAVE': // 공원묘지
                    priceRange = getRandomPrice(500, 2500, isMetro);
                    break;
                case 'FUNERAL_HOME': // 장례식장 (시설사용료)
                    priceRange = getRandomPrice(50, 300, isMetro);
                    break;
                case 'CREMATORIUM': // 화장시설
                    priceRange = { min: 5, max: 100 }; // 관내/관외 차이만 있음
                    break;
                default:
                    priceRange = { min: 0, max: 0 };
            }

            // 4. 이미지 URL 처리
            let imageUrl = null;
            if (item.fileurl) {
                // e하늘 데이터에 있는 상대 경로를 절대 경로로 변환
                imageUrl = BASE_URL + item.fileurl;
            } else {
                // 이미지가 없으면 null (나중에 프론트에서 랜덤 이미지 처리)
                // 혹은 여기서 랜덤 Unsplash 넣어줄 수도 있음
                // imageUrl = `https://source.unsplash.com/random/800x600/?peaceful,nature&sig=${item.facilitycd}`;
            }

            // 5. 편의시설 정보 추출 (TBC1300001 = 있음, TBC1300002 = 없음)
            const hasParking = item.parkyn === 'TBC1300001';
            const hasRestaurant = item.mealroomyn === 'TBC1300001';
            const hasStore = item.superyn === 'TBC1300001';
            const hasAccessibility = item.imparyn === 'TBC1300001';

            return {
                id: item.facilitycd, // 기존 ID 유지하면 업데이트 시 유리하나, Prisma UUID 충돌 주의 (여기선 그냥 냅둠)
                name: item.companyname,
                category: category,
                address: item.fulladdress,
                lat: parseFloat(item.latitude),
                lng: parseFloat(item.longitude),
                minPrice: priceRange.min,
                maxPrice: priceRange.max,
                description: item.telephone, // 전화번호를 임시로 설명에
                isPublic: item.publiccode === 'TCM0100001',
                rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Float로 변환
                reviewCount: Math.floor(Math.random() * 100), // 0 ~ 100 리뷰 수
                images: imageUrl, // 실제 크롤링된 이미지 URL
                hasParking,
                hasRestaurant,
                hasStore,
                hasAccessibility
            };
        })
        .filter(item => !isNaN(item.lat)); // 좌표 없는 데이터 제거

    console.log(`✨ Refined ${refined.length} items with estimated prices and images.`);

    fs.writeFileSync(path.join(__dirname, '../seeds.json'), JSON.stringify(refined, null, 2));
    console.log('✅ Saved to seeds.json');
}

main();
