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

    // 976: (재)하늘공원 봉안당 → BONGSAN 봉안당 + 시설문의
    u('park-0976', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 977: 지장사 봉안당 → BONGSAN 봉안당 + 시설문의
    u('park-0977', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 978: 서강대학교 봉안묘 → §8: 야외 봉안묘 = BURIAL
    u('park-0978', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                { name: '봉안묘', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 979: 대원정사 봉안담 → 이름이 '봉안담'. 이미지 빈 테이블.
    // 기존에 BURIAL 매장묘 + BONGSAN 봉안당 + NATURAL 수목장 모두 0원인 근거 없는 데이터.
    // 이름 기반 주시설 = 봉안담. BONGSAN 봉안담 + 시설문의로 정리.
    u('park-0979', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안담', unit: '원', rows: [
                { name: '봉안담', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 980: 오봉사 봉안묘 → §8: 야외 봉안묘 = BURIAL
    u('park-0980', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                { name: '봉안묘', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 981: 영원한도움의성모성전 납골당 → subType '봉안당'→'납골당', grade '시설문의'
    // §14: 납골당은 BONGSAN 유지 가능 (실내 시설)
    u('park-0981', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '납골당', unit: '원', rows: [
                { name: '납골당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 982: 운휴암 봉안당 → grade '시설사용료 항목'→'시설문의', isRepresentative:true
    u('park-0982', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 983: 갈월사 봉안탑 → BONGSAN 봉안탑 + 시설문의
    u('park-0983', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안탑', unit: '원', rows: [
                { name: '봉안탑', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 984: NOT FOUND in facilities.json → 건너뜀

    // 985: 영은설악동산 → 시설 타입 불명확, 이미지 빈 테이블
    // 이름에 특정 시설 키워드 없음. 일반 추모시설로 가정. BONGSAN으로 처리.
    u('park-0985', p => {
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
    console.log('\n🎉 park-0976 ~ park-0985 완료!');
}
fix();
