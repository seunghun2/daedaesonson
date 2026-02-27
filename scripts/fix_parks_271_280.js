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

    // === park-0271 익산하늘공원묘지 ===
    // 사용료및관리비 450,000 (5m², 15년), 연장료 300,000 (5m², 10년)
    // isRepresentative를 사용료에, 연장료는 EXTENSION
    update('park-0271', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료 및 관리비', price: 450000, feeType: 'USAGE', grade: '5m², 사용기간: 15년', isRepresentative: true },
                    { name: '연장료', price: 300000, feeType: 'EXTENSION', grade: '5m², 연장기간: 10년' },
                ]
            }
        ];
    });

    // === park-0272 통일촌 공설묘지 ===
    // RESIDENT→LOCAL, grade에 사용기간 추가
    update('park-0272', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 95000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 파주시민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 150000, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '이용자격: 파주시민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0273 탄현면 공설묘지 ===
    // RESIDENT→LOCAL, 관리비 isRepresentative 제거, grade 보완
    update('park-0273', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 95000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 파주시민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 150000, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '이용자격: 파주시민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0274 부안수동공설묘지 ===
    // 관리비 30,000 누락!
    update('park-0274', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 90000, feeType: 'USAGE', grade: '1기당 기준면적(10m²), 사용기간: 15년', isRepresentative: true },
                    { name: '묘지 관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1기당 기준면적(10m²), 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0275 부안용산공설묘지 ===
    // 관리비 30,000 누락!
    update('park-0275', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 90000, feeType: 'USAGE', grade: '1기당 기준면적(10m²), 사용기간: 15년', isRepresentative: true },
                    { name: '묘지 관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1기당 기준면적(10m²), 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0276 북상공설공원묘지 ===
    // RESIDENT→LOCAL, grade에 사용기간 추가
    update('park-0276', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설공원묘지 사용료', price: 300000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 북상면 주민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설공원묘지 관리비', price: 200000, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '이용자격: 북상면 주민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0277 북양공설공원묘지 ===
    // 관리비 120,000 누락!, grade 깨짐 수정
    update('park-0277', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지사용료', price: 80000, feeType: 'USAGE', grade: '1기(10m² 이하)', isRepresentative: true },
                    { name: '묘지관리비', price: 120000, feeType: 'MAINTENANCE', grade: '1기(10m² 이하)' },
                ]
            }
        ];
    });

    // === park-0278 안성시공설공원묘지(사곡동) ===
    // 관리비 50,000 누락!
    update('park-0278', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지사용료', price: 50000, feeType: 'USAGE', grade: '1기당 기준면적(6.6m²), 사용기간: 15년', isRepresentative: true },
                    { name: '묘지관리비', price: 50000, feeType: 'MAINTENANCE', grade: '1기당 기준면적(6.6m²), 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0279 사천시공설묘지 ===
    // isRepresentative를 사용료(30,000)에 설정, 수수료는 그대로
    update('park-0279', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 30000, feeType: 'USAGE', grade: '공공사업 이장 분묘 등에 한하여 사용 가능', isRepresentative: true },
                    { name: '공설묘지 수수료', price: 23000, feeType: 'USAGE', grade: '공공사업 이장 분묘 등에 한하여 사용 가능' },
                ]
            }
        ];
    });

    // === park-0280 상리공설묘지 ===
    // RESIDENT→LOCAL, grade에 사용기간 추가
    update('park-0280', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 15000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 강화군민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 15000, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '이용자격: 강화군민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = ['park-0271', 'park-0272', 'park-0273', 'park-0274', 'park-0275', 'park-0276', 'park-0277', 'park-0278', 'park-0279', 'park-0280'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 271~280 수정 완료!');
}
fix();
