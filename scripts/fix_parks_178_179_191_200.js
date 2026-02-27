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

    // === park-0178 낙원공원 의정부묘원 ===
    // 이미지: 사용료 736,860(222.89㎡) / 관리비 9,260(2.8㎡)
    // 222.89㎡는 계산예시. 실제 ㎡당 약 3,307원. 1구 기준 2.8㎡ = 9,260원
    update('park-0178', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 9260, feeType: 'USAGE', grade: '1구 2.8㎡ 기준 (약 3,307원/㎡)', isRepresentative: true },
                    { name: '묘지 관리비', price: 9260, feeType: 'MAINTENANCE', grade: '1구 2.8㎡ 기준 (약 3,307원/㎡)' },
                ]
            }
        ];
    });

    // === park-0179 (재)시안 가족추모공원(매장묘) ===
    // 이미지: 봉안당 55,800(위당) + 매장묘 11,132(1㎡)
    // 봉안묘는 매장묘지 안에 포함 → serviceType: BURIAL 안에 다 넣기
    update('park-0179', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '매장묘 사용료', price: 11132, feeType: 'USAGE', grade: '1㎡당', isRepresentative: true },
                    { name: '봉안묘 사용료', price: 55800, feeType: 'USAGE', grade: '1위당' },
                ]
            }
        ];
    });

    // === park-0191 양구군공설묘지 ===
    // 이미지: 단장 366,120 / 합장 536,970 (1단)
    // 단장형→매장묘 합치기
    update('park-0191', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료 (단장)', price: 366120, feeType: 'USAGE', grade: '1단', isRepresentative: true },
                    { name: '묘지 사용료 (합장)', price: 536970, feeType: 'USAGE', grade: '1단' },
                ]
            }
        ];
    });

    // === park-0192 양택공원묘지(봉안묘) ===
    // 이미지: 사용료 487,500 / 관리비 162,500 (김포시민, 6개월 이상 거주, 15년 3회연장)
    // EXTENSION→USAGE, RESIDENT→LOCAL, BONGSAN 봉안묘 price=0 제거
    update('park-0192', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 487500, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 김포시민 (6개월 이상 거주), 사용기간: 15년 (3회 연장가능)', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 162500, feeType: 'MAINTENANCE', grade: '이용자격: 김포시민 (6개월 이상 거주), 사용기간: 15년 (3회 연장가능)' },
                ]
            }
        ];
    });

    // === park-0193 진달래공원묘원 ===
    // 이미지: 사용료 1,000,000 (3.3㎡/기본30년) / 관리비 21,000 (3.3㎡/1년)
    update('park-0193', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 1000000, feeType: 'USAGE', grade: '3.3㎡, 기본 30년', isRepresentative: true },
                    { name: '관리비', price: 21000, feeType: 'MAINTENANCE', grade: '3.3㎡, 연 관리비' },
                ]
            }
        ];
    });

    // === park-0194 안흥동공설묘지(만장) ===
    // 이미지: 묘지사용료 132,000 / 묘지관리비 96,000 (1기당 기준면적 3.9㎡, 15년)
    // 단장형→매장묘 합치기
    update('park-0194', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 132000, feeType: 'USAGE', grade: '1기당 기준면적 3.9㎡, 사용기간: 15년', isRepresentative: true },
                    { name: '묘지 관리비', price: 96000, feeType: 'MAINTENANCE', grade: '1기당 기준면적 3.9㎡, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0195 여산공설묘지 ===
    // 이미지: 사용료 및 관리비 400,000 (5㎡, 15년) / 연장료 300,000 (5㎡, 10년)
    update('park-0195', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료 및 관리비', price: 400000, feeType: 'USAGE', grade: '5㎡, 사용기간: 15년', isRepresentative: true },
                    { name: '연장료', price: 300000, feeType: 'EXTENSION', grade: '5㎡, 연장기간: 10년' },
                ]
            }
        ];
    });

    // === park-0196 화산연정공설묘지 ===
    // 이미지: 사용료 90,000 / 관리비 100,000 (15년 사용, 2회연장가능)
    // EXTENSION→USAGE
    update('park-0196', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 90000, feeType: 'USAGE', grade: '15년 사용, 2회 연장가능', isRepresentative: true },
                    { name: '묘지 관리비', price: 100000, feeType: 'MAINTENANCE', grade: '15년 사용, 2회 연장가능' },
                ]
            }
        ];
    });

    // === park-0197 연천읍공설묘지 ===
    // 이미지: 사용료 15,400 / 관리비 16,300 (이용자격:연천군민, 사용기간:15년 3회연장가능)
    // EXTENSION→USAGE, RESIDENT→LOCAL, 관리비 feeType 수정
    update('park-0197', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 15400, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 연천군민, 사용기간: 15년 (3회 연장가능)', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 16300, feeType: 'MAINTENANCE', grade: '이용자격: 연천군민, 사용기간: 15년 (3회 연장가능)' },
                ]
            }
        ];
    });

    // === park-0198 삼계공설묘지 ===
    // 이미지: 사용료 25,000(1등지)/15,000(2등지)/5,000(3등지) / 관리비 2,000 (3.3㎡단, 1기당)
    // 데이터 맞음, grade만 보강
    update('park-0198', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료 (1등지)', price: 25000, feeType: 'USAGE', grade: '3.3㎡단, 1등지: 2만5천원 / 2등지: 1만5천원 / 3등지: 5천원', isRepresentative: true },
                    { name: '묘지 사용료 (2등지)', price: 15000, feeType: 'USAGE', grade: '3.3㎡단' },
                    { name: '묘지 사용료 (3등지)', price: 5000, feeType: 'USAGE', grade: '3.3㎡단' },
                    { name: '묘지 관리비', price: 2000, feeType: 'MAINTENANCE', grade: '1구당' },
                ]
            }
        ];
    });

    // === park-0199 아산주진공설묘지 ===
    // 이미지: 사용료 90,000 / 관리비 30,000 (1기당 기준면적 10㎡, 15년)
    // 관리비 누락 추가
    update('park-0199', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 90000, feeType: 'USAGE', grade: '1기당 기준면적 10㎡, 사용기간: 15년', isRepresentative: true },
                    { name: '묘지 관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1기당 기준면적 10㎡, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0200 부산영락공원묘지 ===
    // 이미지: 사용료+관리비 300,000(부산시내)/600,000(타시도) (15년~45년)
    update('park-0200', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '사용료 및 관리비 (부산시내)', price: 300000, feeType: 'USAGE', residency: 'LOCAL', grade: '사용기간: 15년~45년', isRepresentative: true },
                    { name: '사용료 및 관리비 (타시도)', price: 600000, feeType: 'USAGE', residency: 'NON_RESIDENT', grade: '사용기간: 15년~45년' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = ['park-0178', 'park-0179', 'park-0191', 'park-0192', 'park-0193', 'park-0194', 'park-0195', 'park-0196', 'park-0197', 'park-0198', 'park-0199', 'park-0200'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 178, 179, 191~200 수정 완료!');
}
fix();
