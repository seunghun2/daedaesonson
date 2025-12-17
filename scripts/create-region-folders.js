const fs = require('fs');
const path = require('path');

const f = JSON.parse(fs.readFileSync('data/facilities.json'));
const public_f = f.filter(x => x.isPublic === true);

// 주소에서 시/군/구 추출
const regions = new Set();
public_f.forEach(p => {
    if (p.address) {
        const match = p.address.match(/([\uAC00-\uD7A3]+[시군구])/);
        if (match) regions.add(match[1]);
    }
});

const allRegions = [...regions].sort();

// 이미 완료된 지자체
const done = ['강릉시', '거제시', '광주광역시', '논산시', '보은군', '춘천시'];

// 남은 지자체
const remaining = allRegions.filter(r => !done.includes(r));

console.log('=== 전체 지자체:', allRegions.length + '개 ===');
console.log('=== 완료:', done.length + '개 ===');
console.log('=== 남은 지자체:', remaining.length + '개 ===\n');

// 폴더 생성
const baseDir = 'data/ordinance_hwp';
remaining.forEach((region, i) => {
    const dir = path.join(baseDir, region);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    console.log((i + 1) + '. ' + region);
});

// 리스트 파일 저장
fs.writeFileSync(path.join(baseDir, 'remaining_list.txt'), remaining.join('\n'));
console.log('\n폴더 생성 완료!');
console.log('리스트 저장: data/ordinance_hwp/remaining_list.txt');
