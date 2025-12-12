
const fs = require('fs');

async function fetchAllData() {
    console.log('🌍 Fetching ALL facilities data...');

    const url = 'https://www.15774129.go.kr/portal/fnlfac/fac_list.ajax';

    // pageInqCnt를 3000으로 늘려서 전체 데이터(2596개) 한 번에 요청
    const payload = new URLSearchParams({
        'pageInqCnt': '3000',
        'curPageNo': '1',
        'sidocd': '',
        'gungucd': '',
        'companyname': '',
        'facilitygroupcd': '',
        'publiccode': ''
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do'
            },
            body: payload
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const json = await response.json();
        console.log(`📦 Received ${json.list ? json.list.length : 0} items (Total Count: ${json.cnt})`);

        // 데이터 저장
        if (json.list) {
            fs.writeFileSync('full_data.json', JSON.stringify(json.list, null, 2));
            console.log('✅ All data saved to full_data.json');

            // 프리즈마 시드를 위한 변환된 데이터 생성
            const prismaSeed = json.list.map(item => ({
                name: item.companyname,
                category: mapCategory(item.type),
                address: item.fulladdress,
                lat: parseFloat(item.latitude),
                lng: parseFloat(item.longitude),
                minPrice: 0,
                maxPrice: 0,
                description: item.telephone,
                isPublic: item.publiccode === 'TCM0100001',
                rating: 0,
                reviewCount: 0
            })).filter(item => !isNaN(item.lat));

            fs.writeFileSync('seeds.json', JSON.stringify(prismaSeed, null, 2));
            console.log('🌱 Prisma seeds saved to seeds.json');
        }

    } catch (e) {
        console.error('Fetching failed:', e);
    }
}

function mapCategory(type) {
    if (type === 'FuneralHallDet') return 'FUNERAL_HOME';
    if (type === 'CrematoriumDet') return 'CREMATORIUM'; // Enum에 추가 필요할 수도 있음, 일단 기타로 처리하거나 확인 필요
    if (type === 'NaturalBurialDet') return 'NATURAL_BURIAL';
    if (type === 'CharnelDet') return 'CHARNEL_HOUSE';
    if (type === 'CemeteryDet') return 'FAMILY_GRAVE'; // 묘지는 가족묘(공원묘지)로 매핑
    return 'ETC';
}

fetchAllData();
