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

    // === park-0301 무궁화공원묘원 ===
    // grade 보완: 3.3㎡
    update('park-0301', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '토지대', price: 680000, feeType: 'USAGE', grade: '3.3㎡당', isRepresentative: true },
                    { name: '관리비(년)', price: 15000, feeType: 'MAINTENANCE', grade: '3.3㎡당, 연관리비' },
                ]
            }
        ];
    });

    // === park-0302 망월묘지공원 ===
    // grade 깨짐 수정: "사용료+수수료 포함, 사용" → 완전한 텍스트
    update('park-0302', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘원 사용료', price: 3081000, feeType: 'USAGE', grade: '사용료+수수료 포함, 30년 사용 (16.7.1.부터 변경)', isRepresentative: true },
                    { name: '묘원 관리비', price: 300000, feeType: 'MAINTENANCE', grade: '1구당, 30년 (16.7.1.부터 변경)' },
                ]
            }
        ];
    });

    // === park-0303 하늘공원(부곡동공설공원묘지) ===
    // 관리비 403,000 누락 추가, grade 깨짐 수정
    update('park-0303', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지사용료', price: 253000, feeType: 'USAGE', grade: '1기당 6.6㎡ 이하', isRepresentative: true },
                    { name: '묘지관리비', price: 403000, feeType: 'MAINTENANCE', grade: '1기당 6.6㎡ 이하' },
                ]
            }
        ];
    });

    // === park-0304 모란공원(묘지) ===
    // grade 보완, groupType 제거
    update('park-0304', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 430500, feeType: 'USAGE', grade: 'm당 연간사용료', isRepresentative: true },
                    { name: '묘지 관리비', price: 3636, feeType: 'MAINTENANCE', grade: 'm당 연간관리비' },
                ]
            }
        ];
    });

    // === park-0305 소흘읍제3공설묘지 ===
    // EXTENSION→USAGE, RESIDENT→LOCAL, grade 간소화
    update('park-0305', p => {
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

    // === park-0306 소흘읍제2공설묘지 ===
    // EXTENSION→USAGE, RESIDENT→LOCAL
    update('park-0306', p => {
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

    // === park-0307 천부교추모공원 ===
    // grade 보완: 3.3m²
    update('park-0307', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '토지사용료', price: 0, feeType: 'USAGE', grade: '3.3m²', isRepresentative: true },
                    { name: '묘지 관리비', price: 0, feeType: 'MAINTENANCE', grade: '3.3m²' },
                ]
            }
        ];
    });

    // === park-0308 내촌면 제2공설묘지 ===
    // EXTENSION→USAGE, RESIDENT→LOCAL, isRepresentative 중복 제거
    update('park-0308', p => {
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

    // === park-0309 일동면 공설묘지 ===
    // EXTENSION→USAGE, RESIDENT→LOCAL
    update('park-0309', p => {
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

    // === park-0310 내유동공설묘지(만장) ===
    // EXTENSION→USAGE, RESIDENT→LOCAL, 순서 정렬 (일반→합장)
    update('park-0310', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공동묘지 사용료(일반)', price: 10000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 고양시민(6개월 이상 거주), 사용기간: 30년, 1회연장 가능', isRepresentative: true },
                    { name: '공동묘지 사용료(합장)', price: 5000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 고양시민(6개월 이상 거주), 사용기간: 30년, 1회연장 가능' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = ['park-0301', 'park-0302', 'park-0303', 'park-0304', 'park-0305', 'park-0306', 'park-0307', 'park-0308', 'park-0309', 'park-0310'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 301~310 수정 완료!');
}
fix();
