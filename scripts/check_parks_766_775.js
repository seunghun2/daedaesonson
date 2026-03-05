const fs = require('fs');
const path = require('path');

const fp = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

const ids = [];
for (let i = 766; i <= 775; i++) {
    ids.push(`park-${String(i).padStart(4, '0')}`);
}

ids.forEach(id => {
    const p = data.find(x => x.id === id);
    if (!p) { console.log(`\n❌ ${id} NOT FOUND`); return; }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 ${id} | ${p.name} | ${p.category} | ${p.operatorType || ''}`);
    console.log(`   주소: ${p.address || 'N/A'}`);
    console.log(`   websiteUrl: ${p.websiteUrl || 'N/A'}`);
    console.log(`   isActive: ${p.isActive} | isFull: ${p.isFull || false}`);

    const sp = p.priceInfo?.standardizedPrices || [];
    if (sp.length === 0) {
        console.log('   ⚠️ standardizedPrices 없음');
        // priceTable 확인
        const pt = p.priceInfo?.priceTable || p.pricing;
        if (pt && typeof pt === 'object') {
            console.log('   📋 priceTable 키:', Object.keys(pt).join(', '));
        }
        return;
    }

    sp.forEach(group => {
        const rows = group.rows || [];
        rows.forEach(r => {
            const stars = r.isRepresentative ? '★' : '';
            const fee = r.feeType || 'USAGE';
            const res = r.residency || '';
            const grade = r.grade || '';
            const note = r.note || '';
            const gType = r.groupType ? `[${r.groupType}]` : '';
            console.log(`   [${group.serviceType}] ${group.subType} ${gType} → ${r.name} = ${r.price?.toLocaleString() || '문의'}원 | grade: ${grade} | fee: ${fee} | res: ${res} ${stars}`);
            if (note) console.log(`      └ note: ${note}`);
        });
    });
});

console.log(`\n${'='.repeat(60)}`);
console.log('✅ 체크 완료');
