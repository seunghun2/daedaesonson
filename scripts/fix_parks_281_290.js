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

    // === park-0281 초원지공설묘지 ===
    // EXTENSION→USAGE, RESIDENT→LOCAL, grade 단축
    update('park-0281', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 487500, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 김포시민(6개월 이상 거주), 사용기간: 15년, 3회연장 가능', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 162500, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '이용자격: 김포시민(6개월 이상 거주), 사용기간: 15년, 3회연장 가능' },
                ]
            }
        ];
    });

    // === park-0282 상신공원묘지 ===
    // 관리비 120,000 누락!, grade 깨짐 수정
    update('park-0282', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지사용료', price: 80000, feeType: 'USAGE', grade: '1기(10m² 이하)', isRepresentative: true },
                    { name: '묘지관리비', price: 120000, feeType: 'MAINTENANCE', grade: '1기(10m² 이하)' },
                ]
            }
        ];
    });

    // === park-0283 청주시목련공원묘지 ===
    // grade "최초"→"최초 30년" 보완
    update('park-0283', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '분묘(단장)', price: 2042000, feeType: 'USAGE', grade: '최초 30년', isRepresentative: true },
                    { name: '분묘(합장)', price: 2648000, feeType: 'USAGE', grade: '최초 30년' },
                ]
            }
        ];
    });

    // === park-0284 선단동공설묘지 ===
    // EXTENSION→USAGE, RESIDENT→LOCAL, grade 단축
    update('park-0284', p => {
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

    // === park-0285 천주교성환공원묘지 ===
    // grade 보완 "공용포함 3평"
    update('park-0285', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '사용료', price: 958000, feeType: 'USAGE', grade: '공용포함 3평', isRepresentative: true },
                    { name: '관리비', price: 459000, feeType: 'MAINTENANCE', grade: '공용포함 3평' },
                ]
            }
        ];
    });

    // === park-0286 성석동공설묘지(만장) ===
    // EXTENSION→USAGE, RESIDENT→LOCAL, grade 단축
    update('park-0286', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료(일반)', price: 35000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 고양시민(6개월 이상 거주), 사용기간: 30년, 1회연장 가능', isRepresentative: true },
                    { name: '공설묘지 사용료(합장)', price: 47500, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 고양시민(6개월 이상 거주), 사용기간: 30년, 1회연장 가능' },
                ]
            }
        ];
    });

    // === park-0287 성주군공설묘지 ===
    // grade 보완
    update('park-0287', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 50000, feeType: 'USAGE', grade: '평당 3.3m², 1등지 5만원 이하', isRepresentative: true },
                    { name: '묘지 관리비', price: 3000, feeType: 'MAINTENANCE', grade: '기당/1년, 2,000원~3,000원' },
                ]
            }
        ];
    });

    // === park-0288 미법리공설묘지 ===
    // RESIDENT→LOCAL, grade 보완
    update('park-0288', p => {
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

    // === park-0289 문형공설묘지(만장) ===
    // 서비스타입 통합, 순서 수정(사용료→관리비)
    update('park-0289', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지사용료', price: 60000, feeType: 'USAGE', grade: '1기당 기준면적(6.6m²)', isRepresentative: true },
                    { name: '묘지관리비', price: 63000, feeType: 'MAINTENANCE', grade: '1기당 기준면적(6.6m²)' },
                ]
            }
        ];
    });

    // === park-0290 대전공원묘원 ===
    // grade 보완
    update('park-0290', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지사용료(6평)', price: 6300000, feeType: 'USAGE', grade: '평당 1,050,000원', isRepresentative: true },
                    { name: '관리비(6평)', price: 2250000, feeType: 'MAINTENANCE', grade: '15년 × 평당 25,000원' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = ['park-0281', 'park-0282', 'park-0283', 'park-0284', 'park-0285', 'park-0286', 'park-0287', 'park-0288', 'park-0289', 'park-0290'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 281~290 수정 완료!');
}
fix();
