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

    // 876: 상락원 지장영묘전 - 사설
    // 이미지: 개인단 2,030,000 / 사용료:200만원 부터, 관리비:1년에 3만원 / 자세한 사항은 031-941-3416 문의
    // 현재: serviceType=BURIAL(잘못), feeType=MAINTENANCE(잘못), grade 이상
    // → BONGSAN(봉안당), USAGE, grade '사용료 200만원부터, 관리비 연 3만원 별도'
    u('park-0876', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단', price: 2030000, feeType: 'USAGE', grade: '사용료 200만원부터, 관리비 연 3만원 별도', isRepresentative: true },
            ]
        }];
    });

    // 877: 대구광역시 낙산제2추모의집 - 공설
    // 이미지: 사용료 및 관리비 200,000 / 10년 / 국가유공자(배우자), 수급자 외 사용제한
    // 현재: 데이터 없음! → 추가
    u('park-0877', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료 및 관리비', price: 200000, feeType: 'USAGE', grade: '10년, 국가유공자(배우자)·수급자 외 사용제한', isRepresentative: true },
            ]
        }];
    });

    // 878: 장성군추모공원 - 공설
    // 이미지: 안치료(15년간) 300,000 / 별도의 관리비 없음
    // 현재: grade '일반' → '15년, 별도 관리비 없음'
    u('park-0878', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '안치료', price: 300000, feeType: 'USAGE', grade: '15년, 별도 관리비 없음', isRepresentative: true },
            ]
        }];
    });

    // 879: 익산시 추모의집 제1관 - 공설
    // 이미지: 봉안당 / 만장 / 요금 0원 → 무료(만장 서비스)
    // 현재: price=0, grade='01'(오류) → grade='만장, 무료'
    u('park-0879', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '만장, 무료', isRepresentative: true },
            ]
        }];
    });

    // 880: 흥창사 - 사설
    // 이미지: 사용료 300만원부터~ / 1
    // 현재: 데이터 없음! → 추가
    u('park-0880', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 3000000, feeType: 'USAGE', grade: '300만원부터~', isRepresentative: true },
            ]
        }];
    });

    // 881: 구파발성당 성요셉관 - 사설
    // 이미지: 개인단(1단~6단) 3,000,000 / 사용료:300만원부터~ / 사용기간:20년, 1회연장가능 / 자세한 사항 02-389-1501 문의
    // 현재: grade '300만원부터 / 기간' → '20년, 1회 연장 가능, 300만원부터~'
    u('park-0881', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단(1단~6단)', price: 3000000, feeType: 'USAGE', grade: '20년, 1회 연장 가능, 300만원부터~', isRepresentative: true },
            ]
        }];
    });

    // 882: 대구광역시 낙산추모의집 - 공설
    // 이미지: 사용료 및 관리비 200,000 / 10년 / 국가유공자(배우자), 수급자 외 사용제한
    // 현재: 일반 200,000 / 유공자 100,000 → grade에 '10년' 추가
    u('park-0882', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료 및 관리비', price: 200000, feeType: 'USAGE', grade: '10년, 국가유공자(배우자)·수급자 외 사용제한', isRepresentative: true },
            ]
        }];
    });

    // 883: 화천공원묘원 봉안당 - 공설
    // 이미지: 개인 250,000 / 사용료(자세한사항 시설문의:033-249-2676)
    // 현재: OK. grade 보강
    u('park-0883', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인', price: 250000, feeType: 'USAGE', grade: '자세한 사항 시설문의', isRepresentative: true },
            ]
        }];
    });

    // 884: 만불사 - 사설
    // 이미지: 개인단 300만원~600만원 / 자세한내용은 시설문의
    // 현재: price=2,000,000(잘못!), grade='일반' → price=6,000,000(이미지 요금단위에 표시된 값), grade='300만~600만원, 시설문의'
    u('park-0884', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단', price: 6000000, feeType: 'USAGE', grade: '300만~600만원, 시설문의', isRepresentative: true },
            ]
        }];
    });

    // 885: 재단법인조안공원양주지사 - 사설
    // 이미지: 일반실 9단~1단, 고급실 9단~1단, 특실 8단~1단, VIP실 8단~1단, 모든실의 부부단=개인단X2
    // 현재: 모든 데이터 있음. 구조 정리:
    //   - grade에 등급명(일반실/고급실/특실/VIP실) 반영
    //   - isRepresentative: 일반실 9단(가장 저렴) = true
    //   - 부부단(개인단X2) 항목은 grade='모든실 부부단=개인단×2'
    u('park-0885', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                // 일반실
                { name: '일반실 9단', price: 2500000, feeType: 'USAGE', grade: '일반실', isRepresentative: true },
                { name: '일반실 8단', price: 3500000, feeType: 'USAGE', grade: '일반실' },
                { name: '일반실 7단', price: 6500000, feeType: 'USAGE', grade: '일반실' },
                { name: '일반실 6단', price: 8000000, feeType: 'USAGE', grade: '일반실' },
                { name: '일반실 5단', price: 8500000, feeType: 'USAGE', grade: '일반실' },
                { name: '일반실 4단', price: 8000000, feeType: 'USAGE', grade: '일반실' },
                { name: '일반실 3단', price: 7000000, feeType: 'USAGE', grade: '일반실' },
                { name: '일반실 2단', price: 5000000, feeType: 'USAGE', grade: '일반실' },
                { name: '일반실 1단', price: 4000000, feeType: 'USAGE', grade: '일반실' },
                // 고급실
                { name: '고급실 9단', price: 2500000, feeType: 'USAGE', grade: '고급실' },
                { name: '고급실 8단', price: 3500000, feeType: 'USAGE', grade: '고급실' },
                { name: '고급실 7단', price: 8000000, feeType: 'USAGE', grade: '고급실' },
                { name: '고급실 6단', price: 12000000, feeType: 'USAGE', grade: '고급실' },
                { name: '고급실 5단', price: 12000000, feeType: 'USAGE', grade: '고급실' },
                { name: '고급실 4단', price: 12000000, feeType: 'USAGE', grade: '고급실' },
                { name: '고급실 3단', price: 10000000, feeType: 'USAGE', grade: '고급실' },
                { name: '고급실 2단', price: 8000000, feeType: 'USAGE', grade: '고급실' },
                { name: '고급실 1단', price: 4000000, feeType: 'USAGE', grade: '고급실' },
                // 특실
                { name: '특실 8단', price: 4500000, feeType: 'USAGE', grade: '특실' },
                { name: '특실 7단', price: 10000000, feeType: 'USAGE', grade: '특실' },
                { name: '특실 6단', price: 13000000, feeType: 'USAGE', grade: '특실' },
                { name: '특실 5단', price: 13000000, feeType: 'USAGE', grade: '특실' },
                { name: '특실 4단', price: 13000000, feeType: 'USAGE', grade: '특실' },
                { name: '특실 3단', price: 12000000, feeType: 'USAGE', grade: '특실' },
                { name: '특실 2단', price: 10000000, feeType: 'USAGE', grade: '특실' },
                { name: '특실 1단', price: 5000000, feeType: 'USAGE', grade: '특실' },
                // VIP실
                { name: 'VIP실 8단', price: 5000000, feeType: 'USAGE', grade: 'VIP실' },
                { name: 'VIP실 7단', price: 11000000, feeType: 'USAGE', grade: 'VIP실' },
                { name: 'VIP실 6단', price: 15000000, feeType: 'USAGE', grade: 'VIP실' },
                { name: 'VIP실 5단', price: 15000000, feeType: 'USAGE', grade: 'VIP실' },
                { name: 'VIP실 4단', price: 15000000, feeType: 'USAGE', grade: 'VIP실' },
                { name: 'VIP실 3단', price: 13000000, feeType: 'USAGE', grade: 'VIP실' },
                { name: 'VIP실 2단', price: 11000000, feeType: 'USAGE', grade: 'VIP실' },
                { name: 'VIP실 1단', price: 5500000, feeType: 'USAGE', grade: 'VIP실' },
                // 부부단
                { name: '모든실 부부단', price: 0, feeType: 'USAGE', grade: '개인단×2' },
            ]
        }];
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    const ids = Array.from({ length: 10 }, (_, i) => 'park-' + String(876 + i).padStart(4, '0'));
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 park-0876 ~ park-0885 완료!');
}
fix();
