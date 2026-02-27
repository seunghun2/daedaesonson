const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const updated = [];

    // ─── park-0121 춘천안식공원(묘지) ───
    // 이미지: 묘지 단장1단 3,619,280 / 단장2단 3,919,280 / 합장1단 4,878,420 / 합장2단 5,318,420
    // 현재: feeType USAGE로 돼있음 → 제거 (기본값), note 추가
    {
        const p = data.find(d => d.id === 'park-0121');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형',
                rows: [
                    { name: '묘지 사용료 (1단)', price: 3619280, isRepresentative: true, note: '단장 1단' },
                    { name: '묘지 사용료 (2단)', price: 3919280, note: '단장 2단' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장형',
                rows: [
                    { name: '묘지 사용료 (1단)', price: 4878420, isRepresentative: true, note: '합장 1단' },
                    { name: '묘지 사용료 (2단)', price: 5318420, note: '합장 2단' }
                ]
            }
        ];
        updated.push('park-0121');
    }

    // ─── park-0122 청솔공원 ───
    // 이미지: 매장묘지(단장) 2,506,000 관내(6월이상 거주) / 매장묘지(합장) 3,141,000 / 가족봉안매장묘(24구) 4,216,000 / 가족봉안당(12기) 4,491,000
    // RESIDENT → LOCAL, grade → note, 추가안치 note 정리
    {
        const p = data.find(d => d.id === 'park-0122');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '매장묘지 (단장)', price: 2506000, isRepresentative: true, residency: 'LOCAL', note: '관내 6개월 이상 거주자' },
                    { name: '매장묘지 (합장)', price: 3141000, residency: 'LOCAL', note: '관내 6개월 이상 거주자' },
                    { name: '가족봉안매장묘 (24구)', price: 4216000, residency: 'LOCAL', note: '관내 6개월 이상 거주자, 추가안치 시 신청인의 가족' }
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당',
                rows: [
                    { name: '가족봉안당 (12기)', price: 4491000, isRepresentative: true, residency: 'LOCAL', note: '관내 6개월 이상 거주자, 추가안치 시 신청인의 가족' }
                ]
            }
        ];
        updated.push('park-0122');
    }

    // ─── park-0123 화도공설묘지(만장) ───
    // 이미지: 묘지사용료(단장) 15,400 분묘1기당 6.6㎡ / 묘지관리비(단장) 16,300 / 묘지사용료(합장) 23,100 9.9㎡ / 묘지관리비(합장) 24,000
    // 현재: 구조 혼란(매장묘 관리비 + 단장형 사용료들), "힙장" 오타 → 통일
    {
        const p = data.find(d => d.id === 'park-0123');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형',
                rows: [
                    { name: '묘지 사용료', price: 15400, isRepresentative: true, note: '분묘 1기당 기준면적 6.6㎡' },
                    { name: '묘지 관리비', price: 16300, feeType: 'MAINTENANCE', note: '분묘 1기당 기준면적 6.6㎡' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장형',
                rows: [
                    { name: '묘지 사용료', price: 23100, isRepresentative: true, note: '분묘 1기당 기준면적 9.9㎡' },
                    { name: '묘지 관리비', price: 24000, feeType: 'MAINTENANCE', note: '분묘 1기당 기준면적 9.9㎡' }
                ]
            }
        ];
        updated.push('park-0123');
    }

    // ─── park-0124 수동공설묘지(만장) ───
    // 이미지: 동일 구조 (단장 15,400/16,300, 합장 23,100/24,400)
    // 현재: 중복 이름(단장 2개씩), 구조 혼란 → 통일
    {
        const p = data.find(d => d.id === 'park-0124');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형',
                rows: [
                    { name: '묘지 사용료', price: 15400, isRepresentative: true, note: '분묘 1기당 기준면적 6.6㎡' },
                    { name: '묘지 관리비', price: 16300, feeType: 'MAINTENANCE', note: '분묘 1기당 기준면적 6.6㎡' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장형',
                rows: [
                    { name: '묘지 사용료', price: 23100, isRepresentative: true, note: '분묘 1기당 기준면적 9.9㎡' },
                    { name: '묘지 관리비', price: 24400, feeType: 'MAINTENANCE', note: '분묘 1기당 기준면적 9.9㎡' }
                ]
            }
        ];
        updated.push('park-0124');
    }

    // ─── park-0125 완주군 공설공원묘지 ───
    // 이미지: 공설묘지 사용료 684,000 (6.6㎡/30년) / 관리비 1,100,000 (6.6㎡/30년 1회연장가능) / 자연장지 500,000 (50*50/40년/연장불가) / 봉안당 100,000 (10년/2회 연장가능)
    // EXTENSION → USAGE, grade → note 정리
    {
        const p = data.find(d => d.id === 'park-0125');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '공설묘지 사용료', price: 684000, isRepresentative: true, note: '6.6㎡, 사용기간 30년' },
                    { name: '공설묘지 관리비', price: 1100000, feeType: 'MAINTENANCE', note: '6.6㎡, 30년, 1회 연장 가능' }
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당',
                rows: [
                    { name: '봉안당 사용료', price: 100000, isRepresentative: true, note: '사용기간 10년, 2회 연장 가능' }
                ]
            },
            {
                serviceType: 'NATURAL', subType: '수목장',
                rows: [
                    { name: '자연장지 사용료', price: 500000, isRepresentative: true, note: '50×50cm, 사용기간 40년, 연장 불가' }
                ]
            }
        ];
        updated.push('park-0125');
    }

    // ─── park-0126 충주시공설묘지 ───
    // 이미지: 단장 사용료 250,000 (10㎡/15년) / 관리비 300,000 / 합장 사용료 500,000 (15㎡/15년) / 관리비 300,000
    // 현재: 기본 구조 OK, note 추가
    {
        const p = data.find(d => d.id === 'park-0126');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형',
                rows: [
                    { name: '묘지 사용료', price: 250000, isRepresentative: true, note: '기준면적 10㎡, 사용기간 15년' },
                    { name: '묘지 관리비', price: 300000, feeType: 'MAINTENANCE', note: '기준면적 10㎡, 사용기간 15년' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장형',
                rows: [
                    { name: '묘지 사용료', price: 500000, isRepresentative: true, note: '기준면적 15㎡, 사용기간 15년' },
                    { name: '묘지 관리비', price: 300000, feeType: 'MAINTENANCE', note: '기준면적 15㎡, 사용기간 15년' }
                ]
            }
        ];
        updated.push('park-0126');
    }

    // ─── park-0127 청북공설묘지 ───
    // 이미지: 단장 사용료 451,000 (1기당 10㎡/15년) / 관리비 199,000 / 합장 사용료 676,000 / 관리비 299,000
    // 현재: 구조 혼란(매장묘 관리비 + 단장형 사용료), grade → note
    {
        const p = data.find(d => d.id === 'park-0127');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형',
                rows: [
                    { name: '공설묘지 사용료', price: 451000, isRepresentative: true, note: '1기당 기준면적 10㎡, 사용기간 15년' },
                    { name: '공설묘지 관리비', price: 199000, feeType: 'MAINTENANCE' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장형',
                rows: [
                    { name: '공설묘지 사용료', price: 676000, isRepresentative: true, note: '1기당 기준면적 10㎡, 사용기간 15년' },
                    { name: '공설묘지 관리비', price: 299000, feeType: 'MAINTENANCE' }
                ]
            }
        ];
        updated.push('park-0127');
    }

    // ─── park-0128 자월리공설묘지 ───
    // 이미지: 이용자격:옹진군민, 사용기간:15년 / 단장 60,000/30,000 / 합장 90,000/45,000
    // 현재: residency 없음 → LOCAL 추가, note 추가
    {
        const p = data.find(d => d.id === 'park-0128');
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
        updated.push('park-0128');
    }

    // ─── park-0129 내리공설묘지 ───
    // 이미지: 이용자격:옹진군민, 사용기간:15년 / 단장 60,000/30,000 / 합장 90,000/45,000
    // RESIDENT → LOCAL, grade → note
    {
        const p = data.find(d => d.id === 'park-0129');
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
        updated.push('park-0129');
    }

    // ─── park-0130 처리공원묘지 ───
    // 이미지: 이용자격:여주시민, 15년 / 단장 150,000/150,000 / 합장 225,000/225,000
    // RESIDENT → LOCAL, grade → note
    {
        const p = data.find(d => d.id === 'park-0130');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '공설공원묘지 사용료 (단장)', price: 150000, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 여주시민, 사용기간: 15년' },
                    { name: '공설공원묘지 사용료 (합장)', price: 225000, residency: 'LOCAL', note: '이용자격: 여주시민, 사용기간: 15년' },
                    { name: '공설공원묘지 관리비 (단장)', price: 150000, feeType: 'MAINTENANCE' },
                    { name: '공설공원묘지 관리비 (합장)', price: 225000, feeType: 'MAINTENANCE' }
                ]
            }
        ];
        updated.push('park-0130');
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
    console.log('\n✨ 121~130 수정 완료!');
}
fix();
