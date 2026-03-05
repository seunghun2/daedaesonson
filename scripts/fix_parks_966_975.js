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

    // 966: (재)개나리추모공원 봉안담
    u('park-0966', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안담', unit: '원', rows: [
                { name: '봉안담', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 967: 천주교 인천교구 하늘의문(봉안담)
    u('park-0967', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안담', unit: '원', rows: [
                { name: '봉안담', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 968: 아산메모리얼파크 휴온 봉안묘 → 야외 봉안묘 = BURIAL §8
    u('park-0968', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                { name: '봉안묘', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 969: 천안노블랜드하늘공원 봉안담
    u('park-0969', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안담', unit: '원', rows: [
                { name: '봉안담', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 970: 정안수목장 봉안당 - 수목장 데이터 정리 + 봉안당 시설문의 추가
    // grade에 '1위','2위' 등 → 빈값으로, groupType 정리, isRepresentative=공동수목장(최소 100만원) ★
    // 이름에 봉안당 있으므로 봉안당 시설문의도 추가
    u('park-0970', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'NATURAL', subType: '수목장', unit: '원', rows: [
                    { name: '공동수목장', price: 1000000, feeType: 'USAGE', grade: '', isRepresentative: true, groupType: '공동' },
                    { name: '개인수목장', price: 3000000, feeType: 'USAGE', grade: '', groupType: '개인' },
                    { name: '개인수목장 (중급)', price: 4000000, feeType: 'USAGE', grade: '', groupType: '개인' },
                    { name: '개인수목장 (고급)', price: 5000000, feeType: 'USAGE', grade: '', groupType: '개인' },
                    { name: '부부수목장', price: 8000000, feeType: 'USAGE', grade: '', groupType: '부부' },
                    { name: '부부수목장 (중급)', price: 9000000, feeType: 'USAGE', grade: '', groupType: '부부' },
                    { name: '부부수목장 (고급)', price: 10000000, feeType: 'USAGE', grade: '', groupType: '부부' },
                    { name: '가족수목장', price: 10000000, feeType: 'USAGE', grade: '', groupType: '가족' },
                    { name: '가족수목장', price: 15000000, feeType: 'USAGE', grade: '', groupType: '가족' },
                    { name: '고급수목장', price: 20000000, feeType: 'USAGE', grade: '', groupType: '고급' },
                    { name: '가족수목장', price: 25000000, feeType: 'USAGE', grade: '', groupType: '가족' },
                    { name: '최고급수목장', price: 30000000, feeType: 'USAGE', grade: '', groupType: '최고급' },
                    { name: '최고급수목장', price: 35000000, feeType: 'USAGE', grade: '', groupType: '최고급' },
                    { name: '최고급수목장', price: 40000000, feeType: 'USAGE', grade: '', groupType: '최고급' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                    { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: false },
                ]
            }
        ];
    });

    // 971: 석암산수도사 봉안당 - grade 정리
    u('park-0971', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 972: 혜명사 봉안당 - grade 정리
    u('park-0972', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 973: 삼길사 봉안당 - grade 추가
    u('park-0973', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 974: 성불사 봉안당 - grade 정리
    u('park-0974', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 975: 덕안사 봉안당 - grade 정리
    u('park-0975', p => {
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
    console.log('\n🎉 park-0966 ~ park-0975 완료!');
}
fix();
