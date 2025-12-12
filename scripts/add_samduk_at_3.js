const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

console.log('=== 3번에 삼덕공원묘원 추가 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// 삼덕공원묘원 데이터
const samduk = {
    id: 'archive-3',
    name: '(재)삼덕공원묘원',
    originalName: '3.(재)삼덕공원묘원',
    category: 'FAMILY_GRAVE',
    address: '울산광역시 울주군',
    phone: '',
    isPublic: true,
    status: 'OPEN',
    priceRange: { min: 100, max: 300 },
    priceInfo: { priceTable: {} },
    coordinates: { lat: 0, lng: 0 },
    imageUrl: '',
    imageGallery: [],
    tags: ['공원묘지'],
    description: '(재)삼덕공원묘원은(는) 울산광역시 울주군의 대표적인 공원묘지입니다.',
    area: 0,
    capacity: 0,
    hasParking: true,
    hasRestaurant: false,
    hasStore: false,
    hasAccessibility: true,
    reviews: [],
    updatedAt: new Date().toISOString().split('T')[0]
};

// 3번 자리에 추가 (index 2)
facilities.splice(2, 0, samduk);

console.log('✅ 추가 완료!');
console.log('\n처음 5개:');
facilities.slice(0, 5).forEach((f, idx) => {
    console.log(`  ${idx + 1}. ${f.name}`);
});

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('\n✅ 저장 완료!');
console.log('브라우저 새로고침 후 No.3 확인하세요.');
