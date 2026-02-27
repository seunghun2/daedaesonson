const d = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));
const noPhone = d.filter(p => !p.phone || !p.phone.trim());
console.log('전화번호 없는 시설:', noPhone.length, '개\n');
noPhone.forEach(p => console.log(p.id, p.name, '|', p.operatorType || '?'));
