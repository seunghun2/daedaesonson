const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    function update(id, fn) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('NOT FOUND:', id); return; }
        if (!p.priceInfo) p.priceInfo = {};
        fn(p);
        console.log('✅', id, p.name);
    }

    // 포천시 공설묘지 공통 데이터 (312~319)
    const pocheonRow = (usagePrice = 40000, maintPrice = 50000) => [
        {
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '공설묘지 사용료', price: usagePrice, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 포천시민(6개월 이상 거주), 사용기간: 15년, 3회연장 가능', isRepresentative: true },
                { name: '공설묘지 관리비', price: maintPrice, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '이용자격: 포천시민(6개월 이상 거주), 사용기간: 15년, 3회연장 가능' },
            ]
        }
    ];

    // === park-0311 천주교 대구대교구청 성직자묘지 ===
    // grade 보완: "분양하는 시설묘지 아님"
    update('park-0311', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 0, feeType: 'USAGE', grade: '분양하는 시설묘지 아님', isRepresentative: true },
                ]
            }
        ];
    });

    // === park-0312~0319 포천시 공설묘지 (EXTENSION→USAGE, RESIDENT→LOCAL, isRepresentative 중복 제거) ===
    for (const id of ['park-0312', 'park-0313', 'park-0314', 'park-0315', 'park-0316', 'park-0317', 'park-0318', 'park-0319']) {
        update(id, p => { p.priceInfo.standardizedPrices = pocheonRow(); });
    }

    // === park-0320 내리공설묘지(화도면) ===
    // RESIDENT→LOCAL
    update('park-0320', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 15000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 강화군민', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 15000, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '이용자격: 강화군민' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = ['park-0311', 'park-0312', 'park-0313', 'park-0314', 'park-0315', 'park-0316', 'park-0317', 'park-0318', 'park-0319', 'park-0320'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 311~320 수정 완료!');
}
fix();
