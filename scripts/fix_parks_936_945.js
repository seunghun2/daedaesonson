const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const updated = [];

    function u(id, fn) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('⚠️ NOT FOUND:', id); return; }
        if (!p.priceInfo) p.priceInfo = {};
        fn(p);
        updated.push(id);
        console.log('✅', id, p.name);
    }

    // 936: 전주효자공원 (공설봉안원) - 데이터 없음
    // 이미지: 빈 가격표, 이름에 "봉안원" → BONGSAN
    u('park-0936', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 937: 함양하늘공원(봉안시설)
    // ✅ 가격 데이터 있음 - 수정:
    //   §3: INSTALLATION(안장비)→USAGE (매장 작업비는 USAGE로)
    //   grade: '1구' → null (불필요)
    //   관리비: feeType MAINTENANCE OK, grade에 '연간' 추가
    u('park-0937', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '평장묘', unit: '원',
                rows: [
                    { name: '토지사용비', price: 1570000, feeType: 'USAGE', isRepresentative: true },
                    { name: '조성비', price: 1600000, feeType: 'USAGE' },
                    { name: '안장비', price: 500000, feeType: 'USAGE' },
                    { name: '관리비', price: 43000, feeType: 'MAINTENANCE', grade: '연간' },
                ],
            },
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '토지사용비', price: 4500000, feeType: 'USAGE', isRepresentative: true },
                    { name: '조성비', price: 3000000, feeType: 'USAGE' },
                    { name: '안장비', price: 1100000, feeType: 'USAGE' },
                    { name: '관리비', price: 130000, feeType: 'MAINTENANCE', grade: '연간' },
                ],
            },
            {
                serviceType: 'NATURAL', subType: '수목장', unit: '원',
                rows: [
                    { name: '토지사용비', price: 3200000, feeType: 'USAGE', isRepresentative: true },
                    { name: '조성비', price: 1600000, feeType: 'USAGE' },
                    { name: '안장비', price: 500000, feeType: 'USAGE' },
                    { name: '관리비', price: 100000, feeType: 'MAINTENANCE', grade: '연간' },
                ],
            },
        ];
    });

    // 938: 지장선원 - 불필요한 row 2개 정리
    u('park-0938', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 939: 새하늘공원
    u('park-0939', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 940: 늘푸른안식관
    u('park-0940', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 941: (재)천주교원주교구 배론성지
    u('park-0941', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 942: 동해사 - 불필요 row 2개 정리
    u('park-0942', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 943: 대한불교조계종 화암사
    u('park-0943', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 944: 석종사
    u('park-0944', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 945: (재)한남공원묘원(봉안) - grade 장황 정리
    u('park-0945', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    for (const id of updated) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 park-0936 ~ park-0945 완료!');
}
fix();
