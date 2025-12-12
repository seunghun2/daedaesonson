const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');

console.log('=== archive 1~10번 기준으로 새 시설 생성 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// archive 1~10번 폴더
const archiveFolders = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => !f.startsWith('.'))
    .filter(f => {
        const num = parseInt(f.match(/^\d+/));
        return num >= 1 && num <= 10;
    })
    .sort((a, b) => {
        const numA = parseInt(a.match(/^\d+/));
        const numB = parseInt(b.match(/^\d+/));
        return numA - numB;
    });

console.log('Archive 1~10번:');
archiveFolders.forEach(f => console.log(`  ${f}`));

// 새 시설 데이터 생성
const newFacilities = archiveFolders.map((folder, idx) => {
    const num = idx + 1;
    const name = folder.replace(/^\d+\./, ''); // "1.(재)낙원추모공원" -> "(재)낙원추모공원"

    return {
        id: `archive-${num}`,
        name: name,
        originalName: folder,
        category: 'FAMILY_GRAVE', // 공원묘지
        address: '주소 업데이트 필요',
        phone: '',
        isPublic: true,
        status: 'OPEN',
        priceRange: { min: 100, max: 500 }, // 기본값
        priceInfo: { priceTable: {} },
        coordinates: { lat: 0, lng: 0 },
        imageUrl: '',
        imageGallery: [],
        tags: ['공원묘지'],
        description: `${name}은(는) 공원묘지입니다.`,
        area: 0,
        capacity: 0,
        hasParking: true,
        hasRestaurant: false,
        hasStore: false,
        hasAccessibility: true,
        reviews: [],
        updatedAt: new Date().toISOString().split('T')[0]
    };
});

console.log(`\n생성된 시설: ${newFacilities.length}개\n`);
newFacilities.forEach((f, idx) => {
    console.log(`  ${idx + 1}. ${f.name} (ID: ${f.id})`);
});

// 기존 시설 앞에 추가
const updated = [...newFacilities, ...facilities];

console.log(`\n총 시설 수: ${facilities.length} → ${updated.length}개`);

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2));

console.log('\n✅ 저장 완료!');
console.log('브라우저 새로고침 후 No.1~10 확인하세요.');
