var fs = require('fs');
var d = JSON.parse(fs.readFileSync(require('path').join(__dirname, '../data/facilities.json'), 'utf8'));
var parks = d.filter(function (x) { return x.id && x.id.startsWith('park-06') });
parks.sort(function (a, b) { return a.id.localeCompare(b.id) });
var done = ['park-0619', 'park-0620', 'park-0621', 'park-0622', 'park-0623', 'park-0624', 'park-0625', 'park-0626', 'park-0627', 'park-0628', 'park-0629'];
var remaining = parks.filter(function (x) { return !done.includes(x.id) && parseInt(x.id.split('-')[1]) >= 630 });
console.log('완료 (619~629):', done.length, '개');
console.log('');
console.log('=== 남은 park-06xx ===');
remaining.forEach(function (p) {
    var sp = (p.priceInfo && p.priceInfo.standardizedPrices) || [];
    console.log(p.id, '|', p.name, '| 가격:', sp.length > 0 ? '있음' : '없음', '| web:', p.websiteUrl || '없음');
});
console.log('');
console.log('총 남은 수:', remaining.length);
