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

    // === park-0241 우고리공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시에 거주한 시민, 15년)
    // RESIDENT→LOCAL, grade "1년" 누락 수정
    update('park-0241', p => {
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

    // === park-0242 종로성당 나자렛묘원 ===
    // 이미지: 매장용 묘지 1,500,000 (3.3m2) / 관리비(연) 10,000 (3.3m2/1년)
    // group: 미분류 제거, grade 보완
    update('park-0242', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '매장용 묘지', price: 1500000, feeType: 'USAGE', grade: '3.3m2 기준', isRepresentative: true },
                    { name: '관리비', price: 10000, feeType: 'MAINTENANCE', grade: '연관리비 (3.3m2 기준)' },
                ]
            }
        ];
    });

    // === park-0243 회정동공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시에 거주한 시민, 15년)
    // RESIDENT→LOCAL, grade "1년" 누락 수정
    update('park-0243', p => {
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

    // === park-0244 (재)안양공원묘원 ===
    // 이미지: 평당 798,700 (1평) / 년간 11,000 (평당)
    // grade 보완
    update('park-0244', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 798700, feeType: 'USAGE', grade: '1평 기준', isRepresentative: true },
                    { name: '관리비', price: 11000, feeType: 'MAINTENANCE', grade: '연관리비 (평당)' },
                ]
            }
        ];
    });

    // === park-0245 봉양동공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시에 거주한 시민, 15년)
    // RESIDENT→LOCAL, grade "1년" 누락 수정
    update('park-0245', p => {
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

    // === park-0246 가북공설공원묘지 ===
    // 이미지: 사용료 300,000 / 관리 200,000 (해당면 주민, 15년)
    // 관리비 feeType이 USAGE → MAINTENANCE, RESIDENT→LOCAL, grade 보완
    update('park-0246', p => {
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

    // === park-0247 가조공설공원묘지 ===
    // 이미지: 사용료 300,000 / 관리비 200,000 (15년간)
    // 관리비 isRepresentative 제거
    update('park-0247', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '사용료(15년)', price: 300000, feeType: 'USAGE', isRepresentative: true },
                    { name: '관리비(15년)', price: 200000, feeType: 'MAINTENANCE' },
                ]
            }
        ];
    });

    // === park-0248 광사동공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시에 거주한 시민, 15년)
    // RESIDENT→LOCAL, grade "1년" 누락 수정
    update('park-0248', p => {
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

    // === park-0249 마전동공설묘지 ===
    // 이미지: 사용료 26,000 / 관리비 9,000 (1년이상 양주시에 거주한 시민, 15년)
    // RESIDENT→LOCAL, grade "1년" 누락 수정
    update('park-0249', p => {
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

    // === park-0250 갑향군립묘원(묘지) ===
    // 이미지: 사용료 1,900,000 / 관리비 600,000 (묘지 1기(10m2), 30년)
    // group: 미분류 제거, subType 단장형→매장묘, grade 보완
    update('park-0250', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '군립묘원 사용료', price: 1900000, feeType: 'USAGE', grade: '묘지 1기(10m2), 사용기간: 30년', isRepresentative: true },
                    { name: '군립묘원 관리비', price: 600000, feeType: 'MAINTENANCE', grade: '묘지 1기(10m2), 사용기간: 30년' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = ['park-0241', 'park-0242', 'park-0243', 'park-0244', 'park-0245', 'park-0246', 'park-0247', 'park-0248', 'park-0249', 'park-0250'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 241~250 수정 완료!');
}
fix();
