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

    // === park-0291 화현면공설묘지 ===
    // RESIDENT→LOCAL 누락, grade 추가
    update('park-0291', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 40000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 포천시민(6개월 이상 거주), 사용기간: 15년, 3회연장 가능', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 50000, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '이용자격: 포천시민(6개월 이상 거주), 사용기간: 15년, 3회연장 가능' },
                ]
            }
        ];
    });

    // === park-0292 화천공원묘원 ===
    // grade 깨짐 수정, 분묘관리비+사용료 → USAGE, 잔디비용 → MAINTENANCE
    update('park-0292', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지등의 사용료', price: 110000, feeType: 'USAGE', grade: '분묘 관리비, 사용료 (m당/15년간)', isRepresentative: true },
                    { name: '잔디비용(기당)', price: 30000, feeType: 'MAINTENANCE', grade: '기당' },
                ]
            }
        ];
    });

    // === park-0293 화교화원 ===
    // 가격 수정 800K→1M, grade 보완, groupType 제거
    update('park-0293', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지사용료', price: 1000000, feeType: 'USAGE', grade: '303,030/m², 1,000,000/3.3m², 15년, 1회에 한하여 연장', isRepresentative: true },
                    { name: '묘지관리비', price: 16000, feeType: 'MAINTENANCE', grade: '4,848/m², 16,000/3.3m², 15년, 1회에 한하여 연장' },
                ]
            }
        ];
    });

    // === park-0294 영암군덕진공설묘지 ===
    // subType 통합, grade 보완
    update('park-0294', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 90000, feeType: 'USAGE', grade: '1기당 10평방미터', isRepresentative: true },
                    { name: '묘지 관리비', price: 25000, feeType: 'MAINTENANCE', grade: '1기당 10평방미터, 유효기간 5년이면 영구적으로 납부시는 15만원' },
                ]
            }
        ];
    });

    // === park-0295 덕포리공설묘지 ===
    // RESIDENT→LOCAL
    update('park-0295', p => {
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

    // === park-0296 도림동공설묘지(매장불가) ===
    // isRepresentative 중복 제거(관리비), grade 보완
    update('park-0296', p => {
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

    // === park-0297 동산리공설묘지 ===
    // RESIDENT→LOCAL
    update('park-0297', p => {
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

    // === park-0298 (재)평화공원 ===
    // grade 보완
    update('park-0298', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '3.3m 사용료', price: 750000, feeType: 'USAGE', isRepresentative: true },
                    { name: '3.3m 관리비', price: 20000, feeType: 'MAINTENANCE', grade: '1년' },
                ]
            }
        ];
    });

    // === park-0299 하일리공설묘지 ===
    // RESIDENT→LOCAL
    update('park-0299', p => {
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

    // === park-0300 장흥공설공원묘지 ===
    // EXTENSION→USAGE, grade 보완
    update('park-0300', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 1000000, feeType: 'USAGE', grade: '1기당 4.95m², 30년', isRepresentative: true },
                ]
            },
            {
                serviceType: 'NATURAL', subType: '수목장', unit: '원',
                rows: [
                    { name: '자연장지 사용료', price: 400000, feeType: 'USAGE', grade: '1위당 60×80cm, 30년', isRepresentative: true },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = ['park-0291', 'park-0292', 'park-0293', 'park-0294', 'park-0295', 'park-0296', 'park-0297', 'park-0298', 'park-0299', 'park-0300'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 291~300 수정 완료!');
}
fix();
