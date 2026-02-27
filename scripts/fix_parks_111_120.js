const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const updated = [];

    // ─── park-0111 안중공설묘지 ───
    {
        const p = data.find(d => d.id === 'park-0111');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형',
                rows: [
                    { name: '공설묘지 사용료', price: 451000, isRepresentative: true, note: '1기당 기준면적 10㎡, 사용기간 15년' },
                    { name: '공설묘지 관리비', price: 199000, feeType: 'MAINTENANCE', note: '1기당 기준면적 10㎡, 사용기간 15년' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장형',
                rows: [
                    { name: '공설묘지 사용료', price: 676000, isRepresentative: true, note: '1기당 기준면적 10㎡, 사용기간 15년' },
                    { name: '공설묘지 관리비', price: 299000, feeType: 'MAINTENANCE', note: '1기당 기준면적 10㎡, 사용기간 15년' }
                ]
            }
        ];
        updated.push('park-0111');
    }

    // ─── park-0112 이천시설성공설공원묘지 ───
    // 이미지: 묘지사용료 200,000 (1기당 기준면적 6.6㎡) / 묘지관리비 250,000 / 연장사용료 200,000 (현행금액 징수) / 연장관리비 250,000
    // → EXTENSION 제거, 연장 합체, note 통일
    {
        const p = data.find(d => d.id === 'park-0112');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 200000, isRepresentative: true, note: '1기당 기준면적 6.6㎡' },
                    { name: '묘지 관리비', price: 250000, feeType: 'MAINTENANCE', note: '1기당 기준면적 6.6㎡' },
                    { name: '연장 사용료', price: 200000, note: '연장 시 동일 요금 적용' },
                    { name: '연장 관리비', price: 250000, feeType: 'MAINTENANCE', note: '연장 시 동일 요금 적용' }
                ]
            }
        ];
        updated.push('park-0112');
    }

    // ─── park-0113 이천시장호원공설공원묘지(만장) ───
    // 이미지: 동일 구조(묘지사용료/관리비/연장사용료/연장관리비)
    // → 구조 정리: 단장형 하나로, EXTENSION 제거
    {
        const p = data.find(d => d.id === 'park-0113');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 200000, isRepresentative: true, note: '1기당 기준면적 6.6㎡' },
                    { name: '묘지 관리비', price: 250000, feeType: 'MAINTENANCE', note: '1기당 기준면적 6.6㎡' },
                    { name: '연장 사용료', price: 200000, note: '연장 시 동일 요금 적용' },
                    { name: '연장 관리비', price: 250000, feeType: 'MAINTENANCE', note: '연장 시 동일 요금 적용' }
                ]
            }
        ];
        updated.push('park-0113');
    }

    // ─── park-0114 선재리공설묘지 ───
    // 이미지: 이용자격:옹진군민, 사용기간:15년
    // RESIDENT → LOCAL
    {
        const p = data.find(d => d.id === 'park-0114');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '공설묘지 사용료 (단장)', price: 60000, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 사용료 (합장)', price: 90000, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 관리비 (단장)', price: 30000, feeType: 'MAINTENANCE' },
                    { name: '공설묘지 관리비 (합장)', price: 45000, feeType: 'MAINTENANCE' }
                ]
            }
        ];
        updated.push('park-0114');
    }

    // ─── park-0115 이작리공설묘지 ───
    // 이미지: 이용자격:옹진군민, 사용기간:15년
    // note 추가, residency LOCAL
    {
        const p = data.find(d => d.id === 'park-0115');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형',
                rows: [
                    { name: '공설묘지 사용료', price: 60000, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 관리비', price: 30000, feeType: 'MAINTENANCE' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장형',
                rows: [
                    { name: '공설묘지 사용료', price: 90000, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 관리비', price: 45000, feeType: 'MAINTENANCE' }
                ]
            }
        ];
        updated.push('park-0115');
    }

    // ─── park-0116 (재)예다원 묘원 ───
    // 이미지: 일반시민 180,000 / 관리비 120,000 / 특례자(타지역주민 등록 1년미만) 270,000 / 관리비 120,000
    // → residency로 구분: LOCAL(일반시민) vs NON_LOCAL(특례자)
    {
        const p = data.find(d => d.id === 'park-0116');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 180000, isRepresentative: true, residency: 'LOCAL', note: '묘지 1기당 6.61㎡, 사용기간 15년' },
                    { name: '묘지 관리비', price: 120000, feeType: 'MAINTENANCE', residency: 'LOCAL', note: '연간 관리비' },
                    { name: '묘지 사용료 (특례자)', price: 270000, residency: 'NON_LOCAL', note: '여수시 주민등록 1년 미만 거주자, 1기당 6.61㎡' },
                    { name: '묘지 관리비 (특례자)', price: 120000, feeType: 'MAINTENANCE', residency: 'NON_LOCAL', note: '연간 관리비' }
                ]
            }
        ];
        updated.push('park-0116');
    }

    // ─── park-0117 신도리공설묘지 ───
    // RESIDENT → LOCAL, note 정리
    {
        const p = data.find(d => d.id === 'park-0117');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '공설묘지 사용료 (단장)', price: 60000, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 사용료 (합장)', price: 90000, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 관리비 (단장)', price: 30000, feeType: 'MAINTENANCE' },
                    { name: '공설묘지 관리비 (합장)', price: 45000, feeType: 'MAINTENANCE' }
                ]
            }
        ];
        updated.push('park-0117');
    }

    // ─── park-0118 장봉리공설묘지 ───
    // RESIDENT → LOCAL, note 정리
    {
        const p = data.find(d => d.id === 'park-0118');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '공설묘지 사용료 (단장)', price: 60000, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 사용료 (합장)', price: 90000, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 관리비 (단장)', price: 30000, feeType: 'MAINTENANCE' },
                    { name: '공설묘지 관리비 (합장)', price: 45000, feeType: 'MAINTENANCE' }
                ]
            }
        ];
        updated.push('park-0118');
    }

    // ─── park-0119 청양군추모공원(묘지) ───
    // 이미지: 30년 이용 1회연장 가능
    // EXTENSION → USAGE, note 정리
    {
        const p = data.find(d => d.id === 'park-0119');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형',
                rows: [
                    { name: '공설묘지 사용료', price: 700000, isRepresentative: true, note: '30년 이용, 1회 연장 가능' },
                    { name: '공설묘지 관리비', price: 800000, feeType: 'MAINTENANCE', note: '30년 이용, 1회 연장 가능' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장형',
                rows: [
                    { name: '공설묘지 사용료', price: 1050000, isRepresentative: true, note: '30년 이용, 1회 연장 가능' },
                    { name: '공설묘지 관리비', price: 1200000, feeType: 'MAINTENANCE', note: '30년 이용, 1회 연장 가능' }
                ]
            }
        ];
        updated.push('park-0119');
    }

    // ─── park-0120 와동꽃빛공원(공설묘지) ───
    // 이미지: 공설공원묘지/매장 656,000 (6.6㎡ 이하, 신규매장불가)
    //         무연분묘/매장 108,000 (0.25㎡ 이하, 신규매장불가)
    //         연장신청시 관내 656,000 / 관외 1,312,000 (6.6㎡ 이하)
    // → NON_RESIDENT → NON_LOCAL, 항목명 정리
    {
        const p = data.find(d => d.id === 'park-0120');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '매장묘 사용료', price: 656000, isRepresentative: true, note: '6.6㎡ 이하, 신규매장 불가' },
                    { name: '무연분묘 매장', price: 108000, note: '0.25㎡ 이하, 신규매장 불가' },
                    { name: '연장 사용료 (관내)', price: 656000, residency: 'LOCAL', note: '6.6㎡ 이하' },
                    { name: '연장 사용료 (관외)', price: 1312000, residency: 'NON_LOCAL', note: '6.6㎡ 이하' }
                ]
            }
        ];
        updated.push('park-0120');
    }

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    // Supabase 동기화
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        console.log(error ? `❌ ${id}: ${error.message}` : `✅ ${id} (${f.name})`);
    }
    console.log('\n✨ 111~120 수정 완료!');
}
fix();
