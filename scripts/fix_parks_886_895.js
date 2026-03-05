const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    function u(id, fn) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('NOT FOUND:', id); return; }
        if (!p.priceInfo) p.priceInfo = {};
        fn(p);
        console.log('✅', id, p.name);
    }

    // 886: 문빈정사 봉안당 - 사설
    // 이미지: 가격표 비어있음 (시설사용료, 서비스항목, 장사용품 모두 빈칸)
    // 현재: price=0, grade='시설사용료 항목' → grade='시설문의'
    u('park-0886', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 887: (재)아미티우스 봉안당 - 사설
    // 이미지: 가격표 비어있음
    // 현재: 데이터 없음 → 추가
    u('park-0887', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 888: (재)남도추모공원 - 사설
    // 이미지: 가격표 비어있음
    // 현재: 데이터 없음 → 추가
    u('park-0888', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 889: 해원정사 - 사설
    // 이미지: 가격표 비어있음
    // 현재: 데이터 없음 → 추가
    u('park-0889', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 890: 성불사 봉안탑 - 사설
    // 이미지: 가격표 비어있음
    // 현재: 데이터 없음 → 추가
    u('park-0890', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안탑', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 891: 양지공원 제3추모의집 - 공설
    // 이미지: 가격표 비어있음
    // 현재: 데이터 없음 → 추가
    u('park-0891', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 892: 백운공원묘원 제1묘원 - 사설 (FAMILY_GRAVE)
    // 이미지: 묘지사용료 1평기준 700,000 / 묘지관리비 1평기준(1년) 16,000
    // 현재: OK, grade '기준' → '1평 기준' / '1평 기준, 연간'
    u('park-0892', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원', rows: [
                { name: '묘지사용료', price: 700000, feeType: 'USAGE', grade: '1평 기준', isRepresentative: true },
                { name: '묘지관리비', price: 16000, feeType: 'MAINTENANCE', grade: '1평 기준, 연간' },
            ]
        }];
    });

    // 893: (재)동산공원묘원 봉안당 - 사설
    // 이미지: 가격표 비어있음
    // 현재: 데이터 없음 → 추가
    u('park-0893', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 894: 솔치백합동산 봉안묘 - 사설
    // 이미지: 가격표 비어있음
    // 현재: 데이터 없음 → 추가
    u('park-0894', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안묘', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 895: 동화경모공원(봉안) - 사설
    // 이미지: 가격표 비어있음
    // 현재: price=0, grade 비어있음 → grade='시설문의'
    u('park-0895', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    const ids = Array.from({ length: 10 }, (_, i) => 'park-' + String(886 + i).padStart(4, '0'));
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 park-0886 ~ park-0895 완료!');
}
fix();
