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

    // === park-0251 거창공설공원묘지 ===
    // 이미지: 사용료 300,000 / 관리비 200,000 (이용자격:해당읍 주민 사용기간:15년)
    // RESIDENT→LOCAL, grade에 사용기간 15년 추가
    update('park-0251', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설공원묘지 사용료', price: 300000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 해당읍 주민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설공원묘지 관리비', price: 200000, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '이용자격: 해당읍 주민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0252 어둔동공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시에 거주한 시민, 사용기간:15년)
    // RESIDENT→LOCAL, grade "1년" 누락 수정
    update('park-0252', p => {
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

    // === park-0253 유양동공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시에 거주한 시민, 사용기간:15년)
    // RESIDENT→LOCAL, grade "1년" 누락 수정
    update('park-0253', p => {
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

    // === park-0254 고려공원법인묘지 ===
    // 이미지: 묘지사용료 700,000 (평) / 관리비 10,000 (평)
    // grade 보완 (평당 기준)
    update('park-0254', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지사용료', price: 700000, feeType: 'USAGE', grade: '평당 기준', isRepresentative: true },
                    { name: '관리비', price: 10000, feeType: 'MAINTENANCE', grade: '연관리비 (평당)' },
                ]
            }
        ];
    });

    // === park-0255 장기공설공원묘원 ===
    // 이미지: 묘지 사용료 400,000 (1기당 기준면적 6.6m²/15년) / 묘지 관리비 150,000 (1기당 기준면적 6.6m²/15년)
    // 관리비 150,000 누락! 추가, grade 보완
    update('park-0255', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 400000, feeType: 'USAGE', grade: '1기당 기준면적(6.6m²), 사용기간: 15년', isRepresentative: true },
                    { name: '묘지 관리비', price: 150000, feeType: 'MAINTENANCE', grade: '1기당 기준면적(6.6m²), 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0256 고제공설공원묘지 ===
    // 이미지: 묘지 사용료 100,000 / 묘지 관리비 100,000 (이용자격:해당면 주민 사용기간:15년)
    // RESIDENT→LOCAL, grade에 사용기간 15년 추가
    update('park-0256', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 100000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 해당면 주민, 사용기간: 15년', isRepresentative: true },
                    { name: '묘지 관리비', price: 100000, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '이용자격: 해당면 주민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0257 삼하리공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시에 거주한 시민, 사용기간:15년)
    // RESIDENT→LOCAL, grade "1년" 누락 수정
    update('park-0257', p => {
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

    // === park-0258 삼상리공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시에 거주한 시민, 사용기간:15년)
    // RESIDENT→LOCAL, grade "1년" 누락 수정
    update('park-0258', p => {
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

    // === park-0259 관인면 제1공설묘지 ===
    // 이미지: 사용료 40,000 / 관리비 50,000 (사망 당시 포천시 주민등록 6개월이상 거주, 사용기간:15년 3회연장가능)
    // EXTENSION→USAGE, RESIDENT→LOCAL
    update('park-0259', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 40000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 사망 당시 주민등록상 포천시에 주소를 두고 6개월 이상 거주한 시민, 사용기간: 15년 3회연장가능', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 50000, feeType: 'MAINTENANCE', grade: '이용자격: 사망 당시 포천시에 주소를 두고 6개월 이상 거주한 자, 사용기간: 15년 3회연장가능' },
                ]
            }
        ];
    });

    // === park-0260 교산1리공설묘지 ===
    // 이미지: 사용료 15,000 / 관리비 15,000 (이용자격: 강화군민, 15년)
    // RESIDENT→LOCAL, 관리비 isRepresentative 제거
    update('park-0260', p => {
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
    const ids = ['park-0251', 'park-0252', 'park-0253', 'park-0254', 'park-0255', 'park-0256', 'park-0257', 'park-0258', 'park-0259', 'park-0260'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 251~260 수정 완료!');
}
fix();
