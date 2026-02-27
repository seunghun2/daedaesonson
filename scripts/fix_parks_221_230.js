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

    // === park-0221 재단법인금산공원묘원 ===
    // 이미지: 사용료 900,000 (30년/3.3㎡(평당)) / 관리비 13,000 (년/3.3㎡(평당))
    // grade 깨짐 수정
    update('park-0221', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지사용료', price: 900000, feeType: 'USAGE', grade: '30년, 3.3㎡(평당)', isRepresentative: true },
                    { name: '관리비', price: 13000, feeType: 'MAINTENANCE', grade: '연, 3.3㎡(평당)' },
                ]
            }
        ];
    });

    // === park-0222 구암리공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시 거주 시민, 15년)
    // RESIDENT→LOCAL, grade 정리
    update('park-0222', p => {
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

    // === park-0223 신암리공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시 거주 시민, 15년)
    update('park-0223', p => {
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

    // === park-0224 신산리공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시 거주 시민, 15년)
    update('park-0224', p => {
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

    // === park-0225 황방리공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시 거주 시민, 15년)
    update('park-0225', p => {
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

    // === park-0226 한산리공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시 거주 시민, 15년)
    update('park-0226', p => {
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

    // === park-0227 김포공원법인묘지(대곶) ===
    // 이미지: 매장묘,봉안묘 사용료 700,000 (평당) / 관리비 7,000 (1년, 평당)
    // grade 추가, group 제거
    update('park-0227', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 700000, feeType: 'USAGE', grade: '매장묘·봉안묘, 사용료(평당)', isRepresentative: true },
                    { name: '관리비', price: 7000, feeType: 'MAINTENANCE', grade: '매장묘·봉안묘, 1년 관리비(평당)' },
                ]
            }
        ];
    });

    // === park-0228 김포공원법인묘지(풍무) ===
    // 이미지: 매장묘,봉안묘 사용료 700,000 (평당) / 관리비 7,000 (1년, 평당)
    // 매장묘+봉안묘 동일가격, 매장묘만 남기고 grade에 표시, group 제거
    update('park-0228', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 700000, feeType: 'USAGE', grade: '매장묘·봉안묘, 사용료(평당)', isRepresentative: true },
                    { name: '관리비', price: 7000, feeType: 'MAINTENANCE', grade: '매장묘·봉안묘, 1년 관리비(평당)' },
                ]
            }
        ];
    });

    // === park-0229 입암리공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시 거주 시민, 15년)
    update('park-0229', p => {
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

    // === park-0230 상수리공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시 거주 시민, 15년)
    update('park-0230', p => {
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
    const ids = ['park-0221', 'park-0222', 'park-0223', 'park-0224', 'park-0225', 'park-0226', 'park-0227', 'park-0228', 'park-0229', 'park-0230'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 221~230 수정 완료!');
}
fix();
