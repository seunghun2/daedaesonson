const d = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));

// 515 - 같은 그룹+단 중복 체크
console.log('=== 515 에덴추모공원 중복 단 체크 ===');
const p515 = d.find(x => x.id === 'park-0515');
p515.priceInfo.standardizedPrices.forEach(g => {
    const groups = {};
    g.rows.forEach(r => {
        const key = (r.groupType || '미분류') + ' | ' + r.name + (r.grade ? ' (' + r.grade + ')' : '');
        if (!groups[key]) groups[key] = [];
        groups[key].push(r.price);
    });
    Object.entries(groups).forEach(([k, prices]) => {
        if (prices.length > 1) console.log('  중복:', k, '→', prices.join(', '));
    });
});

// 516 - 같은 그룹+단 중복 체크  
console.log('\n=== 516 팔공산도림사추모공원 중복 단 체크 ===');
const p516 = d.find(x => x.id === 'park-0516');
p516.priceInfo.standardizedPrices.forEach(g => {
    const groups = {};
    g.rows.forEach(r => {
        const key = (r.groupType || '미분류') + ' | ' + r.name + (r.grade ? ' (' + r.grade + ')' : '');
        if (!groups[key]) groups[key] = [];
        groups[key].push(r.price);
    });
    Object.entries(groups).forEach(([k, prices]) => {
        if (prices.length > 1) console.log('  중복:', k, '→', prices.join(', '));
    });
});

// 519 - 미분류 그룹 확인
console.log('\n=== 519 양평추모공원 더포레 그룹 확인 ===');
const p519 = d.find(x => x.id === 'park-0519');
p519.priceInfo.standardizedPrices.forEach(g => {
    console.log('[' + g.serviceType + '] ' + g.subType);
    g.rows.forEach(r => {
        let line = '  ' + r.name + ' = ' + r.price;
        if (r.grade) line += ' | grade: ' + r.grade;
        if (r.feeType) line += ' | fee: ' + r.feeType;
        if (r.groupType) line += ' | group: ' + r.groupType;
        else line += ' | group: (없음)';
        console.log(line);
    });
});
