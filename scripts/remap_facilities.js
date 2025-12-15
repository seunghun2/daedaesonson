const fs = require('fs');
const path = require('path');

// 1. 아카이브 폴더에서 번호와 시설명 추출
const archiveDir = 'archive';
const folders = fs.readdirSync(archiveDir).filter(f =>
    fs.statSync(path.join(archiveDir, f)).isDirectory()
);

// 번호.시설명 형식 파싱
const archiveMap = new Map();
folders.forEach(folder => {
    const match = folder.match(/^(\d+)\.(.+)$/);
    if (match) {
        const num = parseInt(match[1]);
        const name = match[2].trim();
        archiveMap.set(num, { folder, name });
    }
});

console.log('아카이브 폴더 수:', archiveMap.size);
console.log('번호 범위:', Math.min(...archiveMap.keys()), '~', Math.max(...archiveMap.keys()));

// 2. 기존 facilities.json 읽기
const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
console.log('기존 시설 수:', facilities.length);

// 3. 이름으로 매핑 테이블 생성
const nameToFacility = new Map();
facilities.forEach(f => {
    if (f.name) {
        nameToFacility.set(f.name, f);
    }
});

// 4. 아카이브 번호 기준으로 새 facilities 배열 생성
const newFacilities = [];
const matched = [];
const notMatched = [];

const sortedNums = [...archiveMap.keys()].sort((a, b) => a - b);

sortedNums.forEach(num => {
    const data = archiveMap.get(num);

    // 정확한 이름 매칭
    let found = nameToFacility.get(data.name);

    // 없으면 유사 검색
    if (!found) {
        for (const [name, facility] of nameToFacility.entries()) {
            if (name.includes(data.name) || data.name.includes(name)) {
                found = facility;
                break;
            }
        }
    }

    const newId = 'park-' + String(num).padStart(4, '0');

    if (found) {
        matched.push(num);
        newFacilities.push({
            ...found,
            id: newId,
            originalName: data.folder + '_price_info.png'
        });
    } else {
        // 아카이브에만 있고 facilities.json에 없는 경우 - 새로 생성
        notMatched.push({ num, name: data.name });
        newFacilities.push({
            id: newId,
            name: data.name,
            originalName: data.folder + '_price_info.png',
            address: '',
            coordinates: { lat: 0, lng: 0 },
            category: 'F',
            phone: '',
            website: '',
            images: []
        });
    }
});

console.log('\n=== 결과 ===');
console.log('매칭됨:', matched.length);
console.log('새로 생성:', notMatched.length);
console.log('총 시설:', newFacilities.length);

// ID 순서대로 정렬
newFacilities.sort((a, b) => {
    const numA = parseInt(a.id.replace('park-', ''));
    const numB = parseInt(b.id.replace('park-', ''));
    return numA - numB;
});

// 5. 저장
fs.writeFileSync('data/facilities_remapped.json', JSON.stringify(newFacilities, null, 2));
console.log('\n저장 완료: data/facilities_remapped.json');

// 검증
console.log('\n=== 검증 (첫 10개) ===');
newFacilities.slice(0, 10).forEach(f => {
    console.log(f.id, '→', f.name, '| orig:', f.originalName?.substring(0, 30));
});
