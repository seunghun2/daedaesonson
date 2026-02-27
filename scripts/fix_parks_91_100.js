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
    // park-0091 광릉 더 크레스트 묘지
    // 문제: 자연장 feeType: EXTENSION → 안내및규정으로 감
    // 수정: feeType 제거 + 가격 note에 단위정보 추가
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0091');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '사용금', price: 1700000, isRepresentative: true, note: '평당' },
                    { name: '1년 관리비', price: 19500, feeType: 'MAINTENANCE', note: '평당' }
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당',
                rows: [
                    { name: '봉안당 사용료', price: 8477000, isRepresentative: true, note: '1기 기준' },
                    { name: '봉안당 관리비', price: 84200, feeType: 'MAINTENANCE', note: '1기 기준' }
                ]
            },
            {
                serviceType: 'NATURAL', subType: '자연장',
                rows: [
                    { name: '자연장 사용금', price: 2305000, isRepresentative: true, note: '1위 기준' },
                    { name: '자연장 관리비', price: 34700, feeType: 'MAINTENANCE', note: '1위 기준' }
                ]
            }
        ];
        updated.push('park-0091');
        console.log('✅ park-0091 fixed (자연장 feeType:EXTENSION 제거)');
    }

    // ============================================================
    // park-0092 (재)안동추모공원(묘지)
    // 문제: 완전히 잘못된 데이터 (40,000 하나) → 실제는 통합요금 4유형
    // 이미지: 서구형3단 9,680,000 / 특3단 10,580,000 / 특대3단 11,980,000 / 특대합장묘 13,580,000
    //         (관리비5년,사용금,조성비,석물 포함 / 각자비별도)
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0092');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '서구형 3단', price: 9680000, isRepresentative: true, note: '관리비5년+사용금+조성비+석물 포함 (각자비 별도)' },
                    { name: '서구형 특 3단', price: 10580000, note: '관리비5년+사용금+조성비+석물 포함 (각자비 별도)' },
                    { name: '서구형 특대 3단', price: 11980000, note: '관리비5년+사용금+조성비+석물 포함 (각자비 별도)' },
                    { name: '서구형 특대 합장묘', price: 13580000, note: '관리비5년+사용금+조성비+석물 포함 (각자비 별도)' }
                ]
            }
        ];
        updated.push('park-0092');
        console.log('✅ park-0092 fixed (통합요금 4유형으로 재구성)');
    }

    // ============================================================
    // park-0093 청량리성당 다볼산묘원
    // 문제: 관리비가 매장묘에 있지만 이미지는 평장묘 관리비
    //       석물세트(1,200,000) 누락
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0093');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '매장묘지 사용금', price: 10000, note: '3.3㎡' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '평장묘',
                rows: [
                    { name: '평장묘 묘지사용금', price: 3500000, isRepresentative: true, note: '3.3㎡' },
                    { name: '평장묘 관리비', price: 20000, feeType: 'MAINTENANCE', note: '3.3㎡' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[선택]석물',
                rows: [
                    { name: '평장묘 석물세트', price: 1200000, note: '3.3㎡' }
                ]
            }
        ];
        updated.push('park-0093');
        console.log('✅ park-0093 fixed (관리비→평장묘, 석물세트 추가)');
    }

    // ============================================================
    // park-0094 예래원(묘지)
    // 문제: 석물 serviceType: OTHER → BURIAL, feeType: STONE → 제거
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0094');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '사용료', price: 373370, isRepresentative: true, note: 'm²당' },
                    { name: '관리비', price: 7670, feeType: 'MAINTENANCE', note: 'm²당, 1년' },
                    { name: '안치비', price: 1500000, note: '회당' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[선택]석물',
                rows: [
                    { name: '석물 (고급합장묘B)', price: 24900000, note: '1기' },
                    { name: '석물 (고급합장묘D)', price: 26100000, note: '1기' }
                ]
            }
        ];
        updated.push('park-0094');
        console.log('✅ park-0094 fixed (석물 svc=BURIAL, feeType 제거)');
    }

    // ============================================================
    // park-0095 현대공원1묘원
    // 문제: 상석/비석 데이터 누락
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0095');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지사용료', price: 1300000, isRepresentative: true, note: '평당' },
                    { name: '관리비', price: 15000, feeType: 'MAINTENANCE', note: '평당' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[선택]석물',
                rows: [
                    { name: '상석 (소)', price: 800000, note: '가로70cm 세로40cm' },
                    { name: '상석 (중)', price: 950000, note: '가로75cm 세로48cm' },
                    { name: '비석 (요석)', price: 700000, note: '가로26cm 세로75cm 두께13cm' }
                ]
            }
        ];
        updated.push('park-0095');
        console.log('✅ park-0095 fixed (석물 3종 추가)');
    }

    // ============================================================
    // park-0096 전주효자공원
    // 문제: groupType 사용 → "미분류" 탭 발생 위험
    //       r4 "매장 전 사용장소의 반환" groupType 없음
    // 수정: groupType 제거, 이름에 구분 포함, 반환정책 note로
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0096');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '사용료 (최초 30년)', price: 240000, isRepresentative: true },
                    { name: '관리비 (최초 30년)', price: 160000, feeType: 'MAINTENANCE' },
                    { name: '연장 사용료 (5년, 1회 한정)', price: 40000 },
                    { name: '연장 관리비 (5년, 1회 한정)', price: 27000, feeType: 'MAINTENANCE' }
                ]
            }
        ];
        updated.push('park-0096');
        console.log('✅ park-0096 fixed (groupType 제거, 반환정책 제거)');
    }

    // ============================================================
    // park-0097 현대공원2묘원
    // 문제: 상석/비석 데이터 누락 (95번과 동일 구조)
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0097');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지사용료', price: 1300000, isRepresentative: true, note: '평당' },
                    { name: '관리비', price: 15000, feeType: 'MAINTENANCE', note: '평당' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[선택]석물',
                rows: [
                    { name: '상석 (소)', price: 800000, note: '가로70cm 세로40cm' },
                    { name: '상석 (중)', price: 950000, note: '가로75cm 세로48cm' },
                    { name: '비석 (요석)', price: 700000, note: '가로26cm 세로75cm 두께13cm' }
                ]
            }
        ];
        updated.push('park-0097');
        console.log('✅ park-0097 fixed (석물 3종 추가)');
    }

    // ============================================================
    // park-0098 (재)청구공원
    // 문제: 봉안묘 ★ 없음, 봉안당 grade 정리
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0098');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지사용금', price: 1000000, isRepresentative: true, note: '평당' },
                    { name: '묘지관리비', price: 12000, feeType: 'MAINTENANCE', note: '평당' }
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당',
                rows: [
                    { name: '봉안당 사용료', price: 1500000, isRepresentative: true, note: '1기/15년' }
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안묘',
                rows: [
                    { name: '봉안묘 2기형', price: 6000000, isRepresentative: true, note: '유골 2기 안치, 6.6㎡' },
                    { name: '봉안묘 2기형 (특)', price: 7000000, note: '유골 2기 안치, 6.6㎡' }
                ]
            }
        ];
        updated.push('park-0098');
        console.log('✅ park-0098 fixed (봉안묘 ★추가, grade→note 정리)');
    }

    // ============================================================
    // park-0099 천주교효천공원묘지
    // 문제: groupType:'미분류' 명시적으로 설정됨!, 비석대 누락
    // 수정: groupType 제거, 이름 정정, 비석대 [필수]석물 아코디언
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0099');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지대', price: 820000, isRepresentative: true, note: '5.4㎡' },
                    { name: '조성비', price: 540000, note: '묘지사용면적 기준' },
                    { name: '매장비', price: 600000, note: '신규안장' },
                    { name: '관리비', price: 50000, feeType: 'MAINTENANCE', note: '1년 관리비 및 벌초대금' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[필수]석물',
                rows: [
                    { name: '비석대', price: 600000, note: '화강석 가로72cm 세로45cm 높이8cm' }
                ]
            }
        ];
        updated.push('park-0099');
        console.log('✅ park-0099 fixed (미분류 제거, 비석대 추가)');
    }

    // ============================================================
    // park-0100 천자봉공원묘원
    // 문제: 석물 데이터 누락, grade 깨진 문자
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0100');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지사용료', price: 1400000, isRepresentative: true, note: '1평당' },
                    { name: '관리비', price: 18000, feeType: 'MAINTENANCE', note: '1평/년' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[선택]석물',
                rows: [
                    { name: '외비상석', price: 520000, note: '부부형 6평' },
                    { name: '외비석', price: 930000, note: '부부형 6평' },
                    { name: '석화분', price: 400000, note: '3평형' }
                ]
            }
        ];
        updated.push('park-0100');
        console.log('✅ park-0100 fixed (석물 3종 추가, grade 정리)');
    }

    // JSON 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    console.log('\n🚀 Supabase 동기화 시작...');
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) {
            console.error(`❌ ${id}: ${error.message}`);
        } else {
            console.log(`  ✅ ${id} (${f.name}) → Supabase 완료`);
        }
    }
    console.log('\n📊 91-100 전체 완료!');
}

fix();
