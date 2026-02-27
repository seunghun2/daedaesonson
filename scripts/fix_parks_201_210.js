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

    // === park-0201 죽변화성리공설묘지 ===
    // 이미지: 사용료 25,000 / 관리비 2,000 (이용자격:울진군민)
    // RESIDENT→LOCAL
    update('park-0201', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 25000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 울진군민', isRepresentative: true },
                    { name: '묘지 관리비', price: 2000, feeType: 'MAINTENANCE', grade: '이용자격: 울진군민' },
                ]
            }
        ];
    });

    // === park-0202 신월공설묘지(만장) ===
    // 이미지: 사용료 60,000 / 관리비 63,000 (1기당 기준면적 6.6㎡)
    // 단장형→매장묘 합치기, grade에 6.6㎡ 추가, 관리비 ★ 제거
    update('park-0202', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 60000, feeType: 'USAGE', grade: '1기당 기준면적 6.6㎡', isRepresentative: true },
                    { name: '묘지 관리비', price: 63000, feeType: 'MAINTENANCE', grade: '1기당 기준면적 6.6㎡' },
                ]
            }
        ];
    });

    // === park-0203 주문공설묘지 ===
    // 이미지: 사용료 15,000 / 관리비 15,000 (이용자격:강화군민, 15년)
    // RESIDENT→LOCAL, grade 정리
    update('park-0203', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 15000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 강화군민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 15000, feeType: 'MAINTENANCE', grade: '이용자격: 강화군민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0204 해남신안공설묘지 ===
    // 이미지: 사용료 90,000 / 관리비 100,000 (15년 사용, 2회연장가능)
    // EXTENSION→USAGE
    update('park-0204', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 90000, feeType: 'USAGE', grade: '15년 사용, 2회 연장가능', isRepresentative: true },
                    { name: '묘지 관리비', price: 100000, feeType: 'MAINTENANCE', grade: '15년 사용, 2회 연장가능' },
                ]
            }
        ];
    });

    // === park-0205 오룡군립묘원(묘지) ===
    // 이미지: 사용료 1,900,000 / 관리비 600,000 (묘지 1기(10㎡), 30년)
    // grade에 30년 추가
    update('park-0205', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '군립묘원 사용료', price: 1900000, feeType: 'USAGE', grade: '묘지 1기 (10㎡), 사용기간: 30년', isRepresentative: true },
                    { name: '군립묘원 관리비', price: 600000, feeType: 'MAINTENANCE', grade: '묘지 1기 (10㎡), 사용기간: 30년' },
                ]
            }
        ];
    });

    // === park-0206 오상리공설묘지 ===
    // 이미지: 사용료 15,000 / 관리비 15,000 (이용자격:강화군민, 15년)
    // RESIDENT→LOCAL, grade 정리
    update('park-0206', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 15000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 강화군민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 15000, feeType: 'MAINTENANCE', grade: '이용자격: 강화군민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0207 구미시옥계공설묘지(만장) ===
    // 이미지: 사용료 24,000 / 관리비 2,000 (1㎡ 기준/30년)
    // grade 정리, 관리비 ★ 제거
    update('park-0207', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 24000, feeType: 'USAGE', grade: '1㎡ 기준, 사용기간: 30년', isRepresentative: true },
                    { name: '묘지 관리비', price: 2000, feeType: 'MAINTENANCE', grade: '1㎡ 기준, 사용기간: 30년' },
                ]
            }
        ];
    });

    // === park-0208 신서면공설묘지 ===
    // 이미지: 사용료 15,400 / 관리비 16,300 (이용자격:연천군민, 사용기간:15년, 3회연장가능)
    // EXTENSION→USAGE, RESIDENT→LOCAL
    update('park-0208', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 15400, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 연천군민, 사용기간: 15년 (3회 연장가능)', isRepresentative: true },
                    { name: '묘지 관리비', price: 16300, feeType: 'MAINTENANCE', grade: '이용자격: 연천군민, 사용기간: 15년 (3회 연장가능)' },
                ]
            }
        ];
    });

    // === park-0209 옥천군공설묘지 ===
    // 이미지: 사용료 180,000 / 관리비 120,000 (1기당 5㎡, 15년 사용가능)
    // 단장형→매장묘 합치기 (이미지에는 합장형 없음, 단장형만 있음), 합장형 제거
    update('park-0209', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 180000, feeType: 'USAGE', grade: '1기당 5㎡, 15년 사용가능', isRepresentative: true },
                    { name: '묘지 관리비', price: 120000, feeType: 'MAINTENANCE', grade: '1기당 5㎡, 15년 사용가능' },
                ]
            }
        ];
    });

    // === park-0210 온수리공설묘지 ===
    // 이미지: 사용료 15,000 / 관리비 15,000 (이용자격:강화군민, 15년)
    // RESIDENT→LOCAL, grade 정리
    update('park-0210', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 15000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 강화군민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 15000, feeType: 'MAINTENANCE', grade: '이용자격: 강화군민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = ['park-0201', 'park-0202', 'park-0203', 'park-0204', 'park-0205', 'park-0206', 'park-0207', 'park-0208', 'park-0209', 'park-0210'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 201~210 수정 완료!');
}
fix();
