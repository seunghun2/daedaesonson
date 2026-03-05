const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const f = data.find(d => d.id === 'park-0935');
    if (!f) { console.log('NOT FOUND'); return; }

    // §13-2: 개인/부부 분리
    // §13-3: 복합단 쪼개기 (1,8단→1단+8단 등)
    // groupType: 1동, 2·3동, 4·5·6동

    // 현재 데이터 분석:
    // 4,5,6동 개인: 1,8단=250만 2,7단=300만 3,6단=350만 4,5단=400만
    // 2,3동 개인:   1단=450만 2단=500만 3단=550만 4,5단=600만 6단=550만
    // 4,5,6동 부부: 1,8단=350만 2,7단=400만 3,6단=450만 4,5단=500만
    // 2,3동 부부:   1단=650만 2단=700만 3단=750만 4,5단=800만 6단=750만
    // 1동 부부:     1단=700만 2단=750만 3단=800만 4,5단=1000만
    // (1동 개인 데이터가 원본에 없는 듯 - 아마 누락)

    f.priceInfo.standardizedPrices = [
        // ===== 봉안당(개인) =====
        {
            serviceType: 'BONGSAN', subType: '봉안당(개인)', unit: '원',
            rows: [
                // 4·5·6동 (최저가) - ★는 최저가에
                { name: '1단', price: 2500000, feeType: 'USAGE', groupType: '4·5·6동', isRepresentative: true },
                { name: '2단', price: 3000000, feeType: 'USAGE', groupType: '4·5·6동' },
                { name: '3단', price: 3500000, feeType: 'USAGE', groupType: '4·5·6동' },
                { name: '4단', price: 4000000, feeType: 'USAGE', groupType: '4·5·6동' },
                { name: '5단', price: 4000000, feeType: 'USAGE', groupType: '4·5·6동' },
                { name: '6단', price: 3500000, feeType: 'USAGE', groupType: '4·5·6동' },
                { name: '7단', price: 3000000, feeType: 'USAGE', groupType: '4·5·6동' },
                { name: '8단', price: 2500000, feeType: 'USAGE', groupType: '4·5·6동' },
                // 2·3동
                { name: '1단', price: 4500000, feeType: 'USAGE', groupType: '2·3동' },
                { name: '2단', price: 5000000, feeType: 'USAGE', groupType: '2·3동' },
                { name: '3단', price: 5500000, feeType: 'USAGE', groupType: '2·3동' },
                { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '2·3동' },
                { name: '5단', price: 6000000, feeType: 'USAGE', groupType: '2·3동' },
                { name: '6단', price: 5500000, feeType: 'USAGE', groupType: '2·3동' },
            ],
        },
        // ===== 봉안당(부부) =====
        {
            serviceType: 'BONGSAN', subType: '봉안당(부부)', unit: '원',
            rows: [
                // 4·5·6동 (최저가) - ★는 최저가에
                { name: '1단', price: 3500000, feeType: 'USAGE', groupType: '4·5·6동', isRepresentative: true },
                { name: '2단', price: 4000000, feeType: 'USAGE', groupType: '4·5·6동' },
                { name: '3단', price: 4500000, feeType: 'USAGE', groupType: '4·5·6동' },
                { name: '4단', price: 5000000, feeType: 'USAGE', groupType: '4·5·6동' },
                { name: '5단', price: 5000000, feeType: 'USAGE', groupType: '4·5·6동' },
                { name: '6단', price: 4500000, feeType: 'USAGE', groupType: '4·5·6동' },
                { name: '7단', price: 4000000, feeType: 'USAGE', groupType: '4·5·6동' },
                { name: '8단', price: 3500000, feeType: 'USAGE', groupType: '4·5·6동' },
                // 2·3동
                { name: '1단', price: 6500000, feeType: 'USAGE', groupType: '2·3동' },
                { name: '2단', price: 7000000, feeType: 'USAGE', groupType: '2·3동' },
                { name: '3단', price: 7500000, feeType: 'USAGE', groupType: '2·3동' },
                { name: '4단', price: 8000000, feeType: 'USAGE', groupType: '2·3동' },
                { name: '5단', price: 8000000, feeType: 'USAGE', groupType: '2·3동' },
                { name: '6단', price: 7500000, feeType: 'USAGE', groupType: '2·3동' },
                // 1동
                { name: '1단', price: 7000000, feeType: 'USAGE', groupType: '1동' },
                { name: '2단', price: 7500000, feeType: 'USAGE', groupType: '1동' },
                { name: '3단', price: 8000000, feeType: 'USAGE', groupType: '1동' },
                { name: '4단', price: 10000000, feeType: 'USAGE', groupType: '1동' },
                { name: '5단', price: 10000000, feeType: 'USAGE', groupType: '1동' },
            ],
        },
    ];

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('📁 facilities.json 저장 완료');

    const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', 'park-0935');
    if (error) console.log('❌', error.message);
    else console.log('🔄 park-0935 → Supabase 동기화 완료');
    console.log('🎉 park-0935 극락사추모원 하늘정원 재구성 완료!');
}
fix();
