var fs = require('fs');
var d = JSON.parse(fs.readFileSync(require('path').join(__dirname, '../data/facilities.json'), 'utf8'));
['park-0626', 'park-0627', 'park-0628', 'park-0629'].forEach(function (id) {
    var p = d.find(function (x) { return x.id === id });
    if (!p) { console.log(id, 'NOT FOUND'); return; }
    console.log('===', id, '|', p.name, '===');
    console.log('web:', p.websiteUrl || '없음');
    console.log('cat:', p.institutionType || '?');
    var sp = (p.priceInfo && p.priceInfo.standardizedPrices) || [];
    console.log('prices:', sp.length, 'groups');
    sp.forEach(function (g) {
        console.log(' [' + g.serviceType + '] ' + (g.subType || '') + ' ' + (g.groupType || ''));
        (g.rows || []).forEach(function (r) {
            console.log('  ', r.name, '=', r.price);
        });
    });
    console.log('');
});
