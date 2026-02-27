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

    // === park-0211 왕길공설묘지(만장) ===
    // 이미지: 사용료 3,600 / 관리비 17,800 (비조성묘지 4.95㎡당)
    // grade에 4.95㎡당 추가, 관리비 ★ 제거
    update('park-0211', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '비조성묘지 사용료', price: 3600, feeType: 'USAGE', grade: '비조성묘지 4.95㎡당', isRepresentative: true },
                    { name: '비조성묘지 관리비', price: 17800, feeType: 'MAINTENANCE', grade: '비조성묘지 4.95㎡당' },
                ]
            }
        ];
    });

    // === park-0212 양오리공설묘지 ===
    // 이미지: 사용료 15,000 / 관리비 15,000 (이용자격:강화군민, 15년)
    // RESIDENT→LOCAL, grade 정리
    update('park-0212', p => {
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

    // === park-0213 상주시공설묘지(만장) ===
    // 이미지: 사용료 10,000 (1기당 3.3㎡, 1등지:5만원이하, 2등지:3만원이하, 3등지:1만원이하)
    //         관리비 2,000 (1기당 3.3㎡, 2,000원~3,000원)
    // 단장형→매장묘 통합, grade 정리
    update('park-0213', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 10000, feeType: 'USAGE', grade: '1기당 3.3㎡, 1등지: 5만원 이하, 2등지: 3만원 이하, 3등지: 1만원 이하', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 2000, feeType: 'MAINTENANCE', grade: '1기당 3.3㎡, 2,000원~3,000원' },
                ]
            }
        ];
    });

    // === park-0214 왕길조성묘지 ===
    // 이미지: 사용료 15,400 / 관리비 48,900 (조성묘지 4.95㎡당)
    // grade에 "조성묘지 4.95㎡당" 추가
    update('park-0214', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '조성묘지 사용료', price: 15400, feeType: 'USAGE', grade: '조성묘지 4.95㎡당', isRepresentative: true },
                    { name: '조성묘지 관리비', price: 48900, feeType: 'MAINTENANCE', grade: '조성묘지 4.95㎡당' },
                ]
            }
        ];
    });

    // === park-0215 송전공설묘지 ===
    // 이미지: 합장 사용료 200,000 / 관리비 150,000 (6.6㎡, 합장만가능, 15년, 관내주민)
    // RESIDENT→LOCAL, name/grade 정리
    update('park-0215', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료 (합장)', price: 200000, feeType: 'USAGE', residency: 'LOCAL', grade: '합장만 가능, 6.6㎡, 사용기간: 15년, 관내주민', isRepresentative: true },
                    { name: '묘지 관리비 (합장)', price: 150000, feeType: 'MAINTENANCE', grade: '합장만 가능, 6.6㎡, 사용기간: 15년, 관내주민' },
                ]
            }
        ];
    });

    // === park-0216 천주교부산교구 하늘공원 ===
    // 이미지: 사용료 0 / 관리비 40,000 (천주교인에 한함)
    // name 정리, grade에 "천주교인에 한함" 추가
    update('park-0216', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '사용료', price: 0, feeType: 'USAGE', grade: '천주교인에 한함', isRepresentative: true },
                    { name: '관리비', price: 40000, feeType: 'MAINTENANCE', grade: '천주교인에 한함, 연관리비' },
                ]
            }
        ];
    });

    // === park-0217 군산시공설묘지 ===
    // 이미지: 사용료 445,000 / 관리비 55,000 (1기당, 15년)
    // 관리비 누락 추가, grade 추가
    update('park-0217', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 445000, feeType: 'USAGE', grade: '1기당, 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 55000, feeType: 'MAINTENANCE', grade: '1기당, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0218 광석리공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시에 거주한 시민, 사용기간:15년)
    // RESIDENT→LOCAL, grade 정리
    update('park-0218', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 26000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 1년이상 양주시 거주 시민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 9000, feeType: 'MAINTENANCE', grade: '이용자격: 1년이상 양주시 거주 시민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0219 금광공설묘지 ===
    // 이미지: 사용료 50,000 / 관리비 50,000 (1기당 기본면적 6.6㎡, 15년)
    // 관리비 누락 추가, grade 추가
    update('park-0219', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지사용료', price: 50000, feeType: 'USAGE', grade: '1기당 기본면적 6.6㎡, 사용기간: 15년', isRepresentative: true },
                    { name: '묘지관리비', price: 50000, feeType: 'MAINTENANCE', grade: '1기당 기본면적 6.6㎡, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0220 가납리공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시에 거주한 시민, 사용기간:15년)
    // RESIDENT→LOCAL, grade 정리
    update('park-0220', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 26000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 1년이상 양주시 거주 시민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 9000, feeType: 'MAINTENANCE', grade: '이용자격: 1년이상 양주시 거주 시민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = ['park-0211', 'park-0212', 'park-0213', 'park-0214', 'park-0215', 'park-0216', 'park-0217', 'park-0218', 'park-0219', 'park-0220'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 211~220 수정 완료!');
}
fix();
