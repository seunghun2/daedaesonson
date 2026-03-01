/**
 * park-0736 ~ park-0737 가격 데이터 세팅 (아카이브)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const updates = [];

    // ===== 736 광양시립영세공원 봉안당 (아카이브) =====
    // 관내: 사용료 120,000 + 관리비 60,000 / 15년, 3회 연장가능
    // 관외: 사용료 430,000 + 관리비 60,000 / 15년, 3회 연장가능
    const p736 = data.find(x => x.id === 'park-0736');
    if (p736) {
        p736.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료', price: 120000, feeType: 'USAGE', grade: '15년, 3회 연장가능', isRepresentative: true, residency: 'LOCAL' },
                    { name: '관리비', price: 60000, feeType: 'MAINTENANCE', grade: '15년', residency: 'LOCAL' },
                    { name: '사용료', price: 430000, feeType: 'USAGE', grade: '15년, 3회 연장가능', residency: 'NON_LOCAL' },
                    { name: '관리비', price: 60000, feeType: 'MAINTENANCE', grade: '15년', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0736', p: p736 });
        console.log('✅', p736.id, p736.name);
    }

    // ===== 737 동대문구추모의집 (아카이브) =====
    // 사용료: 개인단 200,000 (최초15년기준) / 부부단 400,000 (최초15년기준)
    // 관리비: 개인단 450,000 (최초15년기준) / 부부단 900,000 (최초15년기준)
    const p737 = data.find(x => x.id === 'park-0737');
    if (p737) {
        p737.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 200000, feeType: 'USAGE', grade: '최초 15년', isRepresentative: true },
                    { name: '관리비 (개인단)', price: 450000, feeType: 'MAINTENANCE', grade: '최초 15년' },
                    { name: '사용료 (부부단)', price: 400000, feeType: 'USAGE', grade: '최초 15년' },
                    { name: '관리비 (부부단)', price: 900000, feeType: 'MAINTENANCE', grade: '최초 15년' },
                ]
            },
        ];
        updates.push({ id: 'park-0737', p: p737 });
        console.log('✅', p737.id, p737.name);
    }

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    // Supabase 동기화
    for (const u of updates) {
        const ud = { pricing: JSON.stringify(u.p.priceInfo) };
        const { error } = await supabase.from('Facility').update(ud).eq('id', u.id);
        if (error) console.log('❌', u.id, error.message);
        else console.log('☁️', u.id, 'Supabase 동기화 완료');
    }
}
fix();
