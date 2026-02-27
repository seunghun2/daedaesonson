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

    // === park-0181 장수동공설묘지(매장불가) ===
    // 이미지: 비조성묘지 사용료 3,600 / 관리비 17,800 (비조성묘지 4.95㎡당)
    // 관리비 ★ 제거, grade 통일
    update('park-0181', p => {
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

    // === park-0182 황산병온공설묘지 ===
    // 이미지: 사용료 90,000 / 관리비 100,000 (15년 사용 2회연장가능)
    // EXTENSION→USAGE
    update('park-0182', p => {
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

    // === park-0183 수산동공설묘지(매장불가) ===
    // 이미지: 비조성묘지 사용료 3,600 / 관리비 17,800 (비조성묘지 4.95㎡당)
    // 관리비 ★ 제거, grade 통일
    update('park-0183', p => {
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

    // === park-0184 인천가족공원 묘지 ===
    // 이미지: 계단식 일반조성묘 30,000 / 가족봉안묘 50,000 (3만원/1년, 5만원/1년, 10년 단위로 징수)
    // BONGSAN→봉안묘, 미분류 삭제, grade 괄호 닫기
    update('park-0184', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '계단식 일반조성묘', price: 30000, feeType: 'USAGE', grade: '3만원/1년 (10년 단위로 징수)', isRepresentative: true },
                ]
            },
            {
                serviceType: '봉안묘', subType: '봉안묘', unit: '원',
                rows: [
                    { name: '가족봉안묘', price: 50000, feeType: 'USAGE', grade: '5만원/1년 (10년 단위로 징수)', isRepresentative: true },
                ]
            }
        ];
    });

    // === park-0185 전곡읍공설묘지 ===
    // 이미지: 사용료 15,400 / 관리비 16,300 (이용자격:연천군민, 사용기간:15년 3회연장가능)
    // EXTENSION→USAGE, RESIDENT→LOCAL
    update('park-0185', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 15400, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 연천군민, 사용기간: 15년 (3회 연장가능)', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 16300, feeType: 'MAINTENANCE', grade: '이용자격: 연천군민, 사용기간: 15년 (3회 연장가능)' },
                ]
            }
        ];
    });

    // === park-0186 장계공설묘지 ===
    // 이미지: 사용료 100,000 / 관리비 100,000 (1기당 10㎡, 15년)
    // 관리비 누락 추가
    update('park-0186', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 100000, feeType: 'USAGE', grade: '1기당 10㎡, 사용기간: 15년', isRepresentative: true },
                    { name: '묘지 관리비', price: 100000, feeType: 'MAINTENANCE', grade: '1기당 10㎡, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0187 장흥리공설묘지 ===
    // 이미지: 사용료 15,000 / 관리비 15,000 (이용자격: 강화군민, 15년)
    // RESIDENT→LOCAL, grade에 사용기간 추가
    update('park-0187', p => {
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

    // === park-0188 인산리공설묘지 ===
    // 이미지: 사용료 15,000 / 관리비 15,000 (이용자격: 강화군민, 15년)
    // RESIDENT→LOCAL, grade에 사용기간 추가
    update('park-0188', p => {
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

    // === park-0189 신림덕화공설묘지 ===
    // 이미지: 사용료 90,000 / 관리비 30,000 (1기당 기준면적 10㎡, 15년)
    // 단장형→매장묘 합치기
    update('park-0189', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 90000, feeType: 'USAGE', grade: '1기당 기준면적 10㎡, 사용기간: 15년', isRepresentative: true },
                    { name: '묘지 관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1기당 기준면적 10㎡, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0190 외포리공설묘지 ===
    // 이미지: 사용료 15,000 / 관리비 15,000 (이용자격: 강화군민, 15년)
    // RESIDENT→LOCAL, grade에 사용기간 추가
    update('park-0190', p => {
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
    const ids = ['park-0181', 'park-0182', 'park-0183', 'park-0184', 'park-0185', 'park-0186', 'park-0187', 'park-0188', 'park-0189', 'park-0190'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 181~190 수정 완료!');
}
fix();
