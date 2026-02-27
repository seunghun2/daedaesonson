const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const supabaseUrl = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
    const supabaseKey = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const updated = [];

    // ============================================================
    // park-0101 홍천군공설묘원
    // 이미지: 분묘-합장 1,500,000 / 합장-국가유공자 0 / 분묘-단장 1,125,000 / 단장-국가유공자 0 / 봉안묘 375,000
    // 현재: grade만 있고 note 없음 → 보강
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0101');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '단장 분묘 사용료', price: 1125000, isRepresentative: true, note: '1구당' },
                    { name: '합장 분묘 사용료', price: 1500000, note: '1구당' },
                    { name: '단장 분묘 사용료 (국가유공자)', price: 0, residency: 'VETERAN', note: '국가유공자 무료' },
                    { name: '합장 분묘 사용료 (국가유공자)', price: 0, residency: 'VETERAN', note: '국가유공자 무료' }
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안묘',
                rows: [
                    { name: '봉안묘 사용료', price: 375000, isRepresentative: true, note: '1기당' }
                ]
            }
        ];
        updated.push('park-0101');
        console.log('✅ park-0101 fixed');
    }

    // ============================================================
    // park-0102 이천시대월공설공원묘지(만장)
    // 이미지: 묘지사용료 200,000 (1기당 기준면적 6.6㎡) / 묘지관리비 250,000 / 연장사용료 200,000 (현행금액) / 연장관리비 250,000
    // 현재: feeType:EXTENSION, 아코디언 2개 (매장묘 + 단장형) → 하나로 통합
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0102');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 200000, isRepresentative: true, note: '1기당 기준면적 6.6㎡' },
                    { name: '묘지 관리비', price: 250000, feeType: 'MAINTENANCE', note: '1기당 기준면적 6.6㎡' },
                    { name: '연장 사용료', price: 200000, note: '현행금액 징수' },
                    { name: '연장 관리비', price: 250000, feeType: 'MAINTENANCE', note: '현행금액 징수' }
                ]
            }
        ];
        updated.push('park-0102');
        console.log('✅ park-0102 fixed');
    }

    // ============================================================
    // park-0103 진리공설묘지
    // 이미지: 단장 사용료 60,000 / 단장 관리비 30,000 / 합장 사용료 90,000 / 합장 관리비 45,000
    //         (이용자격:옹진군민, 사용기간:15년)
    // 현재: 단장형/합장형 2아코디언 → OK, note 보강
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0103');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형',
                rows: [
                    { name: '공설묘지 사용료 (단장)', price: 60000, isRepresentative: true, residency: 'RESIDENT', note: '이용자격: 옹진군민, 사용기간 15년' },
                    { name: '공설묘지 관리비 (단장)', price: 30000, feeType: 'MAINTENANCE', note: '사용기간 15년' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장형',
                rows: [
                    { name: '공설묘지 사용료 (합장)', price: 90000, isRepresentative: true, residency: 'RESIDENT', note: '이용자격: 옹진군민, 사용기간 15년' },
                    { name: '공설묘지 관리비 (합장)', price: 45000, feeType: 'MAINTENANCE', note: '사용기간 15년' }
                ]
            }
        ];
        updated.push('park-0103');
        console.log('✅ park-0103 fixed');
    }

    // ============================================================
    // park-0104 이천시백사공설공원묘지
    // 이미지: 묘지사용금 200,000 (1기당 6.6㎡) / 묘지관리비 250,000 / 연장사용료 200,000 / 연장관리비 250,000
    // 현재: 102번과 동일 구조인데 아코디언 2개 → 통합
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0104');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용금', price: 200000, isRepresentative: true, note: '1기당 기준면적 6.6㎡' },
                    { name: '묘지 관리비', price: 250000, feeType: 'MAINTENANCE', note: '1기당 기준면적 6.6㎡' },
                    { name: '연장 사용료', price: 200000, note: '현행금액 징수' },
                    { name: '연장 관리비', price: 250000, feeType: 'MAINTENANCE', note: '현행금액 징수' }
                ]
            }
        ];
        updated.push('park-0104');
        console.log('✅ park-0104 fixed');
    }

    // ============================================================
    // park-0105 점봉동 공원묘지
    // 이미지: 단장 사용료 150,000 / 단장 관리비 150,000 / 합장 사용료 225,000 / 합장 관리비 225,000
    //         (이용자격:여주시민, 15년)
    // 현재: note 없음, grade에 이용자격 → note로 이동
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0105');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '공설공원묘지 사용료 (단장)', price: 150000, isRepresentative: true, residency: 'RESIDENT', note: '이용자격: 여주시민, 사용기간 15년' },
                    { name: '공설공원묘지 관리비 (단장)', price: 150000, feeType: 'MAINTENANCE', note: '사용기간 15년' },
                    { name: '공설공원묘지 사용료 (합장)', price: 225000, residency: 'RESIDENT', note: '이용자격: 여주시민, 사용기간 15년' },
                    { name: '공설공원묘지 관리비 (합장)', price: 225000, feeType: 'MAINTENANCE', note: '사용기간 15년' }
                ]
            }
        ];
        updated.push('park-0105');
        console.log('✅ park-0105 fixed');
    }

    // ============================================================
    // park-0106 (재)자하연분당(묘지)
    // 이미지: 매장묘,봉안묘 사용료/㎡ 1,007,479 / 371번지 신규조성 봉안묘 단지 사용료/㎡ 1,641,528
    //         매장묘,봉안묘 연간 관리비/㎡ 7,563 / 미사용 묘지 반환규정 0
    // 현재: BONGSAN 봉안당으로 잘못됨 → BURIAL로 변경, 반환규정 추가
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0106');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘·봉안묘',
                rows: [
                    { name: '매장묘·봉안묘 사용료', price: 1007479, isRepresentative: true, note: '㎡당' },
                    { name: '371번지 신규조성 봉안묘단지 사용료', price: 1641528, note: '㎡당' },
                    { name: '연간 관리비', price: 7563, feeType: 'MAINTENANCE', note: '㎡당, 연간' },
                    { name: '미사용 묘지 반환', price: 0, note: '1년 미만 토지 사용료 80% 환급, 1년 이상 5년 미만 50% 환급, 5년 이상 10년 미만 20% 환급, 10년 이상 환급 없음' }
                ]
            }
        ];
        updated.push('park-0106');
        console.log('✅ park-0106 fixed');
    }

    // ============================================================
    // park-0107 하다리공설공원묘지
    // 이미지: 단장 사용료 150,000 / 단장 관리비 150,000 / 합장 사용료 225,000 / 합장 관리비 225,000
    //         (이용자격:여주시민, 15년)
    // 현재: note 없음, grade에 이용자격 → note로
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0107');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '공설공원묘지 사용료 (단장)', price: 150000, isRepresentative: true, residency: 'RESIDENT', note: '이용자격: 여주시민, 사용기간 15년' },
                    { name: '공설공원묘지 관리비 (단장)', price: 150000, feeType: 'MAINTENANCE', note: '사용기간 15년' },
                    { name: '공설공원묘지 사용료 (합장)', price: 225000, residency: 'RESIDENT', note: '이용자격: 여주시민, 사용기간 15년' },
                    { name: '공설공원묘지 관리비 (합장)', price: 225000, feeType: 'MAINTENANCE', note: '사용기간 15년' }
                ]
            }
        ];
        updated.push('park-0107');
        console.log('✅ park-0107 fixed');
    }

    // ============================================================
    // park-0108 (재)광주대교구 여수천주교공원묘원
    // 이미지: 묘지매장 1,650,000 (묘사용권(1.8평) 매장비,묘비) / 관리비 300,000 (15년관리비)
    //         평장묘 1인용 1,000,000 (15년관리비포함) / 평장묘 2인용 1,700,000 (15년관리비포함)
    // 현재: 평장묘 feeType: MAINTENANCE (잘못됨 - 관리비포함이지 관리비가 아님)
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0108');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 매장비', price: 1650000, isRepresentative: true, note: '묘사용권 1.8평 + 매장비 + 묘비 포함' },
                    { name: '관리비', price: 300000, feeType: 'MAINTENANCE', note: '15년 선납' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '평장묘',
                rows: [
                    { name: '평장묘 1인용', price: 1000000, isRepresentative: true, note: '15년 관리비 포함' },
                    { name: '평장묘 2인용', price: 1700000, note: '15년 관리비 포함' }
                ]
            }
        ];
        updated.push('park-0108');
        console.log('✅ park-0108 fixed');
    }

    // ============================================================
    // park-0109 대구시립공원묘지
    // 이미지: 공설묘지 사용료 360,000 (1기당, 30년(1회 15년 연장가능))
    //         공설묘지 관리비 300,000 / 봉안평장묘 600,000 (1기당, 30년) / 합장묘 990,000 (1기당, 30년)
    // 현재: 단장형/합장형/평장묘 3아코디언, 관리비 중복
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0109');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형',
                rows: [
                    { name: '공설묘지 사용료 (단장)', price: 360000, isRepresentative: true, note: '1기당, 30년 (1회 15년 연장 가능)' },
                    { name: '공설묘지 관리비', price: 300000, feeType: 'MAINTENANCE', note: '1기당, 30년' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장형',
                rows: [
                    { name: '합장묘 사용료', price: 990000, isRepresentative: true, note: '1기당, 30년' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '봉안평장묘',
                rows: [
                    { name: '봉안평장묘 사용료', price: 600000, isRepresentative: true, note: '1기당, 30년' }
                ]
            }
        ];
        updated.push('park-0109');
        console.log('✅ park-0109 fixed');
    }

    // ============================================================
    // park-0110 모도리공설묘지
    // 이미지: 단장 사용료 60,000 / 단장 관리비 30,000 / 합장 사용료 90,000 / 합장 관리비 45,000
    //         (이용자격:옹진군민, 사용기간:15년) — 103번과 동일
    // 현재: note 없음, grade에 이용자격 → note로
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0110');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '공설묘지 사용료 (단장)', price: 60000, isRepresentative: true, residency: 'RESIDENT', note: '이용자격: 옹진군민, 사용기간 15년' },
                    { name: '공설묘지 관리비 (단장)', price: 30000, feeType: 'MAINTENANCE', note: '사용기간 15년' },
                    { name: '공설묘지 사용료 (합장)', price: 90000, residency: 'RESIDENT', note: '이용자격: 옹진군민, 사용기간 15년' },
                    { name: '공설묘지 관리비 (합장)', price: 45000, feeType: 'MAINTENANCE', note: '사용기간 15년' }
                ]
            }
        ];
        updated.push('park-0110');
        console.log('✅ park-0110 fixed');
    }

    // JSON 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    console.log('\n🚀 Supabase 동기화...');
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) {
            console.error(`  ❌ ${id}: ${error.message}`);
        } else {
            console.log(`  ✅ ${id} (${f.name})`);
        }
    }
    console.log('\n📊 101-110 전체 완료!');
}

fix();
