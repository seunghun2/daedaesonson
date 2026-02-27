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

    // === park-0171 웅양공설공원묘지 ===
    // 이미지: 사용료 300,000, 관리비 200,000, 이용자격: 해당면 주민, 사용기간: 15년
    // RESIDENT→LOCAL, grade 사용기간 추가
    update('park-0171', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설공원묘지 사용료', price: 300000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 해당면 주민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설공원묘지 관리비', price: 200000, feeType: 'MAINTENANCE', grade: '이용자격: 해당면 주민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0172 (재)원주공원묘원 ===
    // 이미지: 사용료 1,500,000 (1평) / 관리비 20,000 (5년, 1평)
    // 관리비 누락 추가
    update('park-0172', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 1500000, feeType: 'USAGE', grade: '1평', isRepresentative: true },
                    { name: '관리비', price: 20000, feeType: 'MAINTENANCE', grade: '5년, 1평' },
                ]
            }
        ];
    });

    // === park-0173 월곳리공설묘지 ===
    // 이미지: 사용료 15,000, 관리비 15,000, 이용자격: 강화군민, 15년
    // RESIDENT→LOCAL
    update('park-0173', p => {
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

    // === park-0174 월롱면 공설묘지 ===
    // 이미지: 사용료 95,000, 관리비 150,000, 이용자격: 파주시민, 15년
    // RESIDENT→LOCAL
    update('park-0174', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 95000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 파주시민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 150000, feeType: 'MAINTENANCE', grade: '이용자격: 파주시민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0175 월평공설공원묘지 ===
    // 이미지: 사용료 300,000, 관리비 200,000, 이용자격: 해당면 주민, 사용기간: 15년
    // RESIDENT→LOCAL
    update('park-0175', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설공원묘지 사용료', price: 300000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 해당면 주민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설공원묘지 관리비', price: 200000, feeType: 'MAINTENANCE', grade: '이용자격: 해당면 주민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0176 유치공설공원묘지 ===
    // 이미지: 사용료 500,000 / 관리비 500,000 (1기당 4.95㎡, 30년)
    // 관리비 누락 추가
    update('park-0176', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 500000, feeType: 'USAGE', grade: '1기당, 4.95㎡, 사용기간: 30년', isRepresentative: true },
                    { name: '묘지 관리비', price: 500000, feeType: 'MAINTENANCE', grade: '1기당, 4.95㎡, 사용기간: 30년' },
                ]
            }
        ];
    });

    // === park-0177 의령군공설묘지 ===
    // 이미지: 사용료 300,000 / 관리비 150,000 (1구당 8.25㎡, 15년)
    // grade 정리
    update('park-0177', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 300000, feeType: 'USAGE', grade: '1구당, 8.25㎡, 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 150000, feeType: 'MAINTENANCE', grade: '1구당, 8.25㎡, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0178 낙원공원 의정부묘원 ===
    // 이미지: 묘지사용료 736,860 (222.890㎡) / 묘지관리비 9,260 (2.800㎡)
    // isRepresentative 수정 (사용료에), groupType 미분류→삭제, grade 정리
    update('park-0178', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 736860, feeType: 'USAGE', grade: '222.89㎡ 기준', isRepresentative: true },
                    { name: '묘지 관리비', price: 9260, feeType: 'MAINTENANCE', grade: '연간, 2.8㎡ 기준' },
                ]
            }
        ];
    });

    // === park-0179 (재)시안 가족추모공원(매장묘) ===
    // 이미지: 무학봉안묘 55,800 (위당) / 매장묘 11,132 (1㎡)
    // BONGSAN→봉안묘 serviceType 수정
    update('park-0179', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '매장묘 사용료', price: 11132, feeType: 'USAGE', grade: '1㎡당', isRepresentative: true },
                ]
            },
            {
                serviceType: '봉안묘', subType: '봉안묘', unit: '원',
                rows: [
                    { name: '무학봉안묘 사용료', price: 55800, feeType: 'USAGE', grade: '위당', isRepresentative: true },
                ]
            }
        ];
    });

    // === park-0180 정왕공설묘지 ===
    // 이미지: 사용료 45,000, 관리비 15,000, 이용자격: 시흥시민, 사용기간: 15년 3회 연장 가능
    // EXTENSION→USAGE, RESIDENT→LOCAL, grade 괄호 닫기
    update('park-0180', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 45000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 시흥시민, 사용기간: 15년 (3회 연장 가능)', isRepresentative: true },
                    { name: '묘지 관리비', price: 15000, feeType: 'MAINTENANCE', grade: '이용자격: 시흥시민, 사용기간: 15년 (3회 연장 가능)' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = ['park-0171', 'park-0172', 'park-0173', 'park-0174', 'park-0175', 'park-0176', 'park-0177', 'park-0178', 'park-0179', 'park-0180'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 171~180 수정 완료!');
}
fix();
