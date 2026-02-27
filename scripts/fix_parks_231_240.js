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

    // === park-0231 남상공설공원묘지 ===
    // 이미지: 사용료 300,000 / 관리비 200,000 (해당면 주민, 15년)
    // RESIDENT→LOCAL, grade 정리
    update('park-0231', p => {
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

    // === park-0232 두곡리공설묘지 ===
    update('park-0232', p => {
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

    // === park-0233 도하리공설묘지 ===
    update('park-0233', p => {
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

    // === park-0234 하패리공설묘지 ===
    update('park-0234', p => {
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

    // === park-0235 선암리공설묘지 ===
    update('park-0235', p => {
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

    // === park-0236 용암리공설묘지 ===
    update('park-0236', p => {
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

    // === park-0237 복지리 공설묘지 ===
    update('park-0237', p => {
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

    // === park-0238 방성리공설묘지 ===
    update('park-0238', p => {
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

    // === park-0239 답곡리 공설묘지 ===
    // 이미지: 사용료 187,000 / 관리비 113,000 (연천군민, 15년, 3회연장 가능)
    // EXTENSION→USAGE, RESIDENT→LOCAL
    update('park-0239', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 187000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 연천군민, 사용기간: 15년, 3회연장 가능', isRepresentative: true },
                    { name: '묘지 관리비', price: 113000, feeType: 'MAINTENANCE', grade: '이용자격: 연천군민, 사용기간: 15년, 3회연장 가능' },
                ]
            }
        ];
    });

    // === park-0240 군남면공설묘지 ===
    // 이미지: 사용료 15,400 / 관리비 16,300 (연천군민, 15년, 3회연장가능)
    // EXTENSION→USAGE, RESIDENT→LOCAL
    update('park-0240', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 15400, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 연천군민, 사용기간: 15년, 3회연장가능', isRepresentative: true },
                    { name: '묘지 관리비', price: 16300, feeType: 'MAINTENANCE', grade: '이용자격: 연천군민, 사용기간: 15년, 3회연장가능' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = ['park-0231', 'park-0232', 'park-0233', 'park-0234', 'park-0235', 'park-0236', 'park-0237', 'park-0238', 'park-0239', 'park-0240'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 231~240 수정 완료!');
}
fix();
