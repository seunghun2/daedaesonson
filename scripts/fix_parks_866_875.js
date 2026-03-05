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

    // 866: 군산시추모관 - 공설
    // 이미지: 개인단(관내) 100,000 / 15년 3회 연장가능
    // → grade 비어있음 → '관내, 15년 3회 연장 가능'
    u('park-0866', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단', price: 100000, feeType: 'USAGE', grade: '관내, 15년 3회 연장 가능', isRepresentative: true },
            ]
        }];
    });

    // 867: 표선면봉안당 - 공설
    // 이미지: 개인단 도내 20,000 / 도외 50,000
    // → grade에 '도내 2만원 도외5만원' 통으로 → LOCAL/NON_LOCAL 분리!
    u('park-0867', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단', price: 20000, feeType: 'USAGE', residency: 'LOCAL', isRepresentative: true },
                { name: '개인단', price: 50000, feeType: 'USAGE', residency: 'NON_LOCAL' },
            ]
        }];
    });

    // 868: 태안군 영묘전 - 공설
    // 이미지: 개인단(관내) 328,000 / 30년사용, 1회 연장 가능
    // → EXTENSION→USAGE, grade '관내, 30년, 1회 연장 가능'
    u('park-0868', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단', price: 328000, feeType: 'USAGE', grade: '관내, 30년, 1회 연장 가능', isRepresentative: true },
            ]
        }];
    });

    // 869: 금호동성당 천보묘원(봉안) - 사설
    // 이미지: 개인단 441,000 / 글씨비:23.1만원, 관리비:21만원(20년)
    // → 총액(441,000)은 사용료+글씨비+관리비 합산. 분리!
    // 사용료 = 441,000 - 231,000 - 210,000 = 0? → 아니다, 이미지를 다시 보면
    // "글씨비:23.1만원, 관리비:21만원(20년)" → 이게 사용료내역 설명이고 요금은 441,000
    // → 총액 441,000 = 전체 비용. grade에 '글씨비 23.1만원+관리비 21만원(20년) 포함' 표기
    u('park-0869', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단', price: 441000, feeType: 'USAGE', grade: '글씨비 23.1만원+관리비 21만원(20년) 포함', isRepresentative: true },
            ]
        }];
    });

    // 870: 익산시 추모의집 제2관 - 공설
    // 이미지: 개인단 200,000 / 최초 15년 사용 후 10년씩 3번 연장가능
    // → EXTENSION→USAGE, grade '최초 15년, 10년씩 3회 연장 가능'
    u('park-0870', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단', price: 200000, feeType: 'USAGE', grade: '최초 15년, 10년씩 3회 연장 가능', isRepresentative: true },
            ]
        }];
    });

    // 871: 원흥사 납골탑 - 사설
    // 이미지: 납골당 비용 4,000,000
    // 현재 OK. isRepresentative 확인
    u('park-0871', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '납골당 비용', price: 4000000, feeType: 'USAGE', isRepresentative: true },
            ]
        }];
    });

    // 872: 도봉구추모의집 - 공설
    // 이미지: 15년사용 800,000 / 15년사용료+관리비
    // → MAINTENANCE→USAGE (합산 요금이므로 메인 사용료), grade '15년, 사용료+관리비 포함'
    u('park-0872', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 800000, feeType: 'USAGE', grade: '15년, 사용료+관리비 포함', isRepresentative: true },
            ]
        }];
    });

    // 873: 광진구추모의집 - 공설
    // 이미지: 15년사용 800,000 / 15년사용료+관리비
    // → MAINTENANCE→USAGE, grade '15년, 사용료+관리비 포함'
    u('park-0873', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 800000, feeType: 'USAGE', grade: '15년, 사용료+관리비 포함', isRepresentative: true },
            ]
        }];
    });

    // 874: 성동구추모의집 - 공설
    // 이미지: 15년 사용 800,000 / 15년사용료+관리비
    // → MAINTENANCE→USAGE, grade '15년, 사용료+관리비 포함'
    u('park-0874', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 800000, feeType: 'USAGE', grade: '15년, 사용료+관리비 포함', isRepresentative: true },
            ]
        }];
    });

    // 875: 중구추모의집 - 공설
    // 이미지: 15년사용 800,000 / 15년사용료+관리비
    // 현재: feeType USAGE OK, grade '일반' → '15년, 사용료+관리비 포함'으로 보강
    u('park-0875', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 800000, feeType: 'USAGE', grade: '15년, 사용료+관리비 포함', isRepresentative: true },
            ]
        }];
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    const ids = Array.from({ length: 10 }, (_, i) => 'park-' + String(866 + i).padStart(4, '0'));
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 park-0866 ~ park-0875 완료!');
}
fix();
