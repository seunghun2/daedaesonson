const fs = require('fs');
const facs = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));

// 1~650 미등록
const m1 = facs.filter(f => {
    const n = parseInt(f.id.replace('park-', ''));
    return n >= 1 && n <= 650 && !f.websiteUrl;
}).sort((a, b) => a.id.localeCompare(b.id));

// 651~ 미등록
const m2 = facs.filter(f => {
    const n = parseInt(f.id.replace('park-', ''));
    return n >= 651 && !f.websiteUrl;
}).sort((a, b) => a.id.localeCompare(b.id));

let md = '# 공식 홈페이지 미등록 시설\n\n';
md += `> 총 ${m1.length + m2.length}개 시설에 websiteUrl이 없습니다.\n`;
md += '> 공홈을 찾으시면 URL을 알려주세요! "없음"이면 없음 표시\n\n';

md += '## 1~650 구간 (' + m1.length + '개)\n\n';
md += '| # | ID | 시설명 | 공설/사설 | 주소 | 공식 홈페이지 URL |\n';
md += '|---|---|---|---|---|---|\n';
m1.forEach((f, i) => {
    const pub = f.isPublic ? '공설' : '사설';
    const addr = (f.address || '').replace(/\|/g, '/');
    md += `| ${i + 1} | ${f.id} | ${f.name} | ${pub} | ${addr} | |\n`;
});

md += '\n## 651~ 구간 (' + m2.length + '개)\n\n';
md += '| # | ID | 시설명 | 공설/사설 | 주소 | 공식 홈페이지 URL |\n';
md += '|---|---|---|---|---|---|\n';
m2.forEach((f, i) => {
    const pub = f.isPublic ? '공설' : '사설';
    const addr = (f.address || '').replace(/\|/g, '/');
    md += `| ${m1.length + i + 1} | ${f.id} | ${f.name} | ${pub} | ${addr} | |\n`;
});

fs.writeFileSync('공홈_미등록_시설_1_650.md', md);
console.log('1~650:', m1.length, '개');
console.log('651~:', m2.length, '개');
console.log('합계:', m1.length + m2.length, '개');
