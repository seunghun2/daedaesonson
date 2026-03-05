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

    // 946: 정토세계 - 이미지에서 "정토세계" (절 관련), 빈 가격표
    // DB에 BURIAL 매장묘로 되어있으나 이미지상 빈 테이블 → 깨진 grade 정리, 시설문의
    // 이름으로 보면 묘지이므로 BURIAL 유지
    u('park-0946', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원', rows: [
                { name: '매장묘', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 947: 안양사푸른공원 - 데이터 없음, 사찰공원 → BONGSAN 봉안당
    u('park-0947', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 948: 개원추모공원 봉안탑 - 데이터 없음 → BONGSAN 봉안탑
    u('park-0948', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안탑', unit: '원', rows: [
                { name: '봉안탑', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 949: (재)우성공원 추모관 - BURIAL+NATURAL 깨진 grade 정리
    u('park-0949', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원', rows: [
                    { name: '매장묘', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
                ]
            },
            {
                serviceType: 'NATURAL', subType: '수목장', unit: '원', rows: [
                    { name: '수목장', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
                ]
            },
        ];
    });

    // 950: NOT FOUND - 스킵

    // 951: 장기공설봉안묘 - 이미지 "장기공설봉안묘" → 봉안묘 = 야외 묘지형 봉안 → BURIAL
    u('park-0951', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                { name: '봉안묘', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 952: (재)천주교유지재단 천호성지 - NATURAL 수목장 깨진 grade 정리
    u('park-0952', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'NATURAL', subType: '수목장', unit: '원', rows: [
                { name: '수목장', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 953: 홍천군공설묘원 봉안묘·담 - 봉안묘 → BONGSAN (공설 실내 봉안), ★ 없음 수정
    // 이름에 "봉안묘·담" = 봉안묘(야외) + 봉안담(벽면)
    u('park-0953', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안묘·담', unit: '원', rows: [
                { name: '봉안묘·담', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 954: (사)대한불교연화조계종 정림사 - 데이터 없음 → BONGSAN 봉안당
    u('park-0954', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 955: 천봉사 봉안당 - 데이터 없음 → BONGSAN 봉안당
    u('park-0955', p => {
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
    console.log('\n🎉 park-0946 ~ park-0955 완료!');
}
fix();
