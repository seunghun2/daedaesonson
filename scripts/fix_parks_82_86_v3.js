const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    // ============================================================
    // park-0082 세종시공설묘지
    // 수정: 석물을 groupType이 아닌 별도 subType '[필수]석물' 아코디언으로
    //       매장묘 안에서 groupType 혼용 X → "미분류" 탭 제거
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0082');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '일반묘지 사용료', price: 90000, isRepresentative: true },
                    { name: '일반묘지 관리료', price: 110000, feeType: 'MAINTENANCE' },
                    { name: '국가유공자묘지 사용료', price: 0, note: '무료', residency: 'VETERAN' },
                    { name: '국가유공자묘지 관리료', price: 0, note: '무료', residency: 'VETERAN', feeType: 'MAINTENANCE' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[필수]석물',
                rows: [
                    { name: '비석대', price: 805000, note: '일반/국가유공자 동일' }
                ]
            }
        ];
        console.log('✅ park-0082 fixed (석물 → 별도 아코디언 [필수]석물)');
    }

    // ============================================================
    // park-0086 (재)천주교세종로묘원
    // 수정: 석물을 groupType이 아닌 별도 subType '[필수]석물' 아코디언으로
    // ============================================================
    {
        const p = data.find(d => d.id === 'park-0086');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 3000000, note: '9.92㎡', isRepresentative: true },
                    { name: '묘지 관리비', price: 5000, note: '3.3㎡당', feeType: 'MAINTENANCE' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '평장묘',
                rows: [
                    { name: '평장묘지 분양금액 (합장)', price: 9000000, note: '3.3㎡', isRepresentative: true },
                    { name: '평장묘지 관리비', price: 66667, note: '3.3㎡당', feeType: 'MAINTENANCE' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[필수]석물',
                rows: [
                    { name: '1단 모대', price: 800000, note: '2150×1530mm' },
                    { name: '2단 모대', price: 1500000, note: '2400×1740mm' }
                ]
            }
        ];
        console.log('✅ park-0086 fixed (석물 → 별도 아코디언 [필수]석물)');
    }

    // JSON 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    // Supabase 동기화
    const supabaseUrl = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
    const supabaseKey = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
    const supabase = createClient(supabaseUrl, supabaseKey);

    for (const id of ['park-0082', 'park-0086']) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) {
            console.error(`❌ ${id}: ${error.message}`);
        } else {
            console.log(`🚀 ${id} (${f.name}) → Supabase 동기화 완료`);
        }
    }
}

fix();
