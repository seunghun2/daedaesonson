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
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0091');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용금', price: 1700000, isRepresentative: true, note: '1평 기준 (515,152원/㎡)' },
                    { name: '연간 관리비', price: 19500, feeType: 'MAINTENANCE', note: '1평 기준 (5,910원/㎡)' }
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당',
                rows: [
                    { name: '봉안당 사용료', price: 8477000, isRepresentative: true, note: '1기 기준' },
                    { name: '봉안당 관리비', price: 84200, feeType: 'MAINTENANCE', note: '1기 기준, 연간' }
                ]
            },
            {
                serviceType: 'NATURAL', subType: '자연장',
                rows: [
                    { name: '자연장 사용금', price: 2305000, isRepresentative: true, note: '1위 기준' },
                    { name: '자연장 관리비', price: 34700, feeType: 'MAINTENANCE', note: '1위 기준, 연간' }
                ]
            }
        ];
        updated.push('park-0091');
        console.log('✅ park-0091 보강');
    }

    // ============================================================
    // park-0092 (재)안동추모공원(묘지)
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0092');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '서구형 3단', price: 9680000, isRepresentative: true, note: '관리비 5년 + 사용금 + 조성비 + 석물 포함 (각자비 별도)' },
                    { name: '서구형 특 3단', price: 10580000, note: '관리비 5년 + 사용금 + 조성비 + 석물 포함 (각자비 별도)' },
                    { name: '서구형 특대 3단', price: 11980000, note: '관리비 5년 + 사용금 + 조성비 + 석물 포함 (각자비 별도)' },
                    { name: '서구형 특대 합장묘', price: 13580000, note: '관리비 5년 + 사용금 + 조성비 + 석물 포함 (각자비 별도)' },
                    { name: '묘지조화', price: 6000, note: '1개당' }
                ]
            }
        ];
        updated.push('park-0092');
        console.log('✅ park-0092 보강');
    }

    // ============================================================
    // park-0093 청량리성당 다볼산묘원
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0093');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '평장묘',
                rows: [
                    { name: '평장묘 묘지사용금', price: 3500000, isRepresentative: true, note: '3.3㎡ 기준' },
                    { name: '평장묘 관리비', price: 20000, feeType: 'MAINTENANCE', note: '3.3㎡ 기준, 연간' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[선택]석물',
                rows: [
                    { name: '평장묘 석물세트', price: 1200000, note: '3.3㎡ 기준, 석물 일체 포함' }
                ]
            }
        ];
        updated.push('park-0093');
        console.log('✅ park-0093 보강');
    }

    // ============================================================
    // park-0094 예래원(묘지)
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0094');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '매장묘 사용료', price: 373370, isRepresentative: true, note: '㎡당' },
                    { name: '매장묘 관리비', price: 7670, feeType: 'MAINTENANCE', note: '㎡당, 1년' },
                    { name: '안치비 (매장)', price: 1500000, note: '1회당' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[선택]석물',
                rows: [
                    { name: '석물 (고급합장묘 B타입)', price: 24900000, note: '1기 기준' },
                    { name: '석물 (고급합장묘 D타입)', price: 26100000, note: '1기 기준' }
                ]
            }
        ];
        updated.push('park-0094');
        console.log('✅ park-0094 보강');
    }

    // ============================================================
    // park-0095 현대공원1묘원
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0095');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 1300000, isRepresentative: true, note: '1평당' },
                    { name: '연간 관리비', price: 15000, feeType: 'MAINTENANCE', note: '1평당' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[선택]석물',
                rows: [
                    { name: '상석 (소형)', price: 800000, note: '가로 70cm × 세로 40cm' },
                    { name: '상석 (중형)', price: 950000, note: '가로 75cm × 세로 48cm' },
                    { name: '비석 (요석)', price: 700000, note: '가로 26cm × 세로 75cm × 두께 13cm' }
                ]
            }
        ];
        updated.push('park-0095');
        console.log('✅ park-0095 보강');
    }

    // ============================================================
    // park-0096 전주효자공원
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0096');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '사용료 (최초 30년)', price: 240000, isRepresentative: true, note: '기 사용허가를 받은 자 기준' },
                    { name: '관리비 (최초 30년)', price: 160000, feeType: 'MAINTENANCE', note: '기 사용허가를 받은 자 기준' },
                    { name: '연장 사용료 (5년)', price: 40000, note: '1회에 한함' },
                    { name: '연장 관리비 (5년)', price: 27000, feeType: 'MAINTENANCE', note: '1회에 한함' },
                    { name: '매장 전 사용장소 반환', price: 0, note: '납부한 금액의 반액 환불' }
                ]
            }
        ];
        updated.push('park-0096');
        console.log('✅ park-0096 보강');
    }

    // ============================================================
    // park-0097 현대공원2묘원
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0097');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 1300000, isRepresentative: true, note: '1평당' },
                    { name: '연간 관리비', price: 15000, feeType: 'MAINTENANCE', note: '1평당' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[선택]석물',
                rows: [
                    { name: '상석 (소형)', price: 800000, note: '가로 70cm × 세로 40cm' },
                    { name: '상석 (중형)', price: 950000, note: '가로 75cm × 세로 48cm' },
                    { name: '비석 (요석)', price: 700000, note: '가로 26cm × 세로 75cm × 두께 13cm' }
                ]
            }
        ];
        updated.push('park-0097');
        console.log('✅ park-0097 보강');
    }

    // ============================================================
    // park-0098 (재)청구공원
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0098');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용금', price: 1000000, isRepresentative: true, note: '1평당' },
                    { name: '묘지 관리비', price: 12000, feeType: 'MAINTENANCE', note: '1평당, 연간' }
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당',
                rows: [
                    { name: '봉안당 사용료', price: 1500000, isRepresentative: true, note: '1기 기준, 15년 사용' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '봉안묘',
                rows: [
                    { name: '봉안묘 2기형', price: 6000000, isRepresentative: true, note: '유골 2기 안치, 6.6㎡' },
                    { name: '봉안묘 2기형 (특)', price: 7000000, note: '유골 2기 안치, 6.6㎡' }
                ]
            }
        ];
        updated.push('park-0098');
        console.log('✅ park-0098 보강');
    }

    // ============================================================
    // park-0099 천주교효천공원묘지
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0099');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지대', price: 820000, isRepresentative: true, note: '5.4㎡ 기준' },
                    { name: '조성비', price: 540000, note: '묘지 사용면적 기준 조성비' },
                    { name: '매장비', price: 600000, note: '신규 안장 시' },
                    { name: '관리비 및 벌초대금', price: 50000, feeType: 'MAINTENANCE', note: '1년 기준, 관리비 + 벌초대금 포함' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[필수]석물',
                rows: [
                    { name: '비석대 (화강석)', price: 600000, note: '가로 72cm × 세로 45cm × 높이 8cm' }
                ]
            }
        ];
        updated.push('park-0099');
        console.log('✅ park-0099 보강');
    }

    // ============================================================
    // park-0100 천자봉공원묘원
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0100');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 1400000, isRepresentative: true, note: '1평당' },
                    { name: '연간 관리비', price: 18000, feeType: 'MAINTENANCE', note: '1평당, 연간' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[선택]석물',
                rows: [
                    { name: '외비상석', price: 520000, note: '부부형 6평 기준' },
                    { name: '외비석', price: 930000, note: '부부형 6평 기준' },
                    { name: '석화분', price: 400000, note: '3평형 기준' }
                ]
            }
        ];
        updated.push('park-0100');
        console.log('✅ park-0100 보강');
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
    console.log('\n📊 91-100 설명 보강 완료!');
}

fix();
