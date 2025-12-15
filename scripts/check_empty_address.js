const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const emptyAddress = data.filter(f => !f.address || f.address.trim() === '');

console.log('총 시설 수:', data.length);
console.log('주소 없는 시설 수:', emptyAddress.length);
console.log('\n주소 없는 시설 ID 예시 (처음 10개):');
emptyAddress.slice(0, 10).forEach(f => console.log('  -', f.id, f.name));
