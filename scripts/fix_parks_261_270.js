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

    const yangjuGrade = '이용자격: 1년이상 양주시 거주 시민, 사용기간: 15년';

    // === park-0261 비암리공설묘지 ===
    // RESIDENT→LOCAL, grade "1년" 누락
    update('park-0261', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 26000, feeType: 'USAGE', residency: 'LOCAL', grade: yangjuGrade, isRepresentative: true },
                    { name: '공설묘지 관리비', price: 9000, feeType: 'MAINTENANCE', grade: yangjuGrade },
                ]
            }
        ];
    });

    // === park-0262 석우리공설묘지 ===
    // RESIDENT→LOCAL, grade "1년" 누락
    update('park-0262', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 26000, feeType: 'USAGE', residency: 'LOCAL', grade: yangjuGrade, isRepresentative: true },
                    { name: '공설묘지 관리비', price: 9000, feeType: 'MAINTENANCE', grade: yangjuGrade },
                ]
            }
        ];
    });

    // === park-0263 구리시공설묘지 ===
    // 관리비 80,000 누락! grade "1구당"→보완
    update('park-0263', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 120000, feeType: 'USAGE', grade: '1기당 6.6m², 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 80000, feeType: 'MAINTENANCE', grade: '1기당 6.6m², 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0264 덕도리공설묘지 ===
    // RESIDENT→LOCAL, grade "1년" 누락
    update('park-0264', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 26000, feeType: 'USAGE', residency: 'LOCAL', grade: yangjuGrade, isRepresentative: true },
                    { name: '공설묘지 관리비', price: 9000, feeType: 'MAINTENANCE', grade: yangjuGrade },
                ]
            }
        ];
    });

    // === park-0265 대곡공설묘지(만장) ===
    // 관리비 isRepresentative 제거, grade 보완
    update('park-0265', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '비조성묘지 사용료', price: 3600, feeType: 'USAGE', grade: '비조성묘지 4.95m²당', isRepresentative: true },
                    { name: '비조성묘지 관리비', price: 17800, feeType: 'MAINTENANCE', grade: '비조성묘지 4.95m²당' },
                ]
            }
        ];
    });

    // === park-0266 (재)대명공원묘원 ===
    // 가격 오류! 900,000→1,100,000, 13,000→15,000, grade 추가
    update('park-0266', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지사용료', price: 1100000, feeType: 'USAGE', grade: '3.3m²당', isRepresentative: true },
                    { name: '묘지관리비', price: 15000, feeType: 'MAINTENANCE', grade: '3.3m²당' },
                ]
            }
        ];
    });

    // === park-0267 포내공설묘지 ===
    // EXTENSION→USAGE, RESIDENT→LOCAL, grade 단축
    update('park-0267', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 487500, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 김포시 6개월이상 거주, 사용기간: 15년(3회 연장가능)', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 162500, feeType: 'MAINTENANCE', grade: '이용자격: 김포시 6개월이상 거주, 사용기간: 15년(3회 연장가능)' },
                ]
            }
        ];
    });

    // === park-0268 백운공원묘원 제1묘원 ===
    // grade 보완
    update('park-0268', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지사용료', price: 700000, feeType: 'USAGE', grade: '1평 기준', isRepresentative: true },
                    { name: '묘지관리비', price: 16000, feeType: 'MAINTENANCE', grade: '1평 기준(1년)' },
                ]
            }
        ];
    });

    // === park-0269 백운공원묘원 제2묘원 ===
    // grade 보완
    update('park-0269', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지사용료', price: 700000, feeType: 'USAGE', grade: '1평 기준', isRepresentative: true },
                    { name: '묘지관리비', price: 16000, feeType: 'MAINTENANCE', grade: '1평 기준(1년)' },
                ]
            }
        ];
    });

    // === park-0270 가톨릭 범물공원묘원 ===
    // 관리비 row 누락, 추가
    update('park-0270', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '사용료', price: 0, feeType: 'USAGE', grade: '신규분양 없음(만장)', isRepresentative: true },
                    { name: '관리비', price: 0, feeType: 'MAINTENANCE', grade: '관리비 없음' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = ['park-0261', 'park-0262', 'park-0263', 'park-0264', 'park-0265', 'park-0266', 'park-0267', 'park-0268', 'park-0269', 'park-0270'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 261~270 수정 완료!');
}
fix();
