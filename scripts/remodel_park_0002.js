const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function remodelPark0002() {
    const d = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
    const facilities = d.facilities || d;
    const fIndex = facilities.findIndex(x => x.id === 'park-0002');

    if (fIndex !== -1) {
        let f = facilities[fIndex];
        if (f.priceInfo && f.priceInfo.standardizedPrices) {

            // 기존 BURIAL/매장묘 데이터를 읽어서 새롭게 재구성
            let newStandardizedPrices = [];

            f.priceInfo.standardizedPrices.forEach(g => {
                if (g.serviceType === 'BURIAL' && g.subType === '매장묘') {
                    // 매장묘 (단장/합장) 분리
                    const singleRows = [
                        { name: "기본 시설 사용료", price: 2160000, feeType: "USAGE", grade: "1평 기준", isRepresentative: true, capacity: "1인" },
                        { name: "연 관리비", price: 16000, feeType: "MAINTENANCE", grade: "1평 / 1년 기준", capacity: "1인" },
                        { name: "단장묘 분양 패키지(소형)", price: 12000000, feeType: "USAGE", grade: "1구 안치 (2.5평형)", capacity: "1인" },
                        { name: "단장묘 분양 패키지(중형)", price: 15339000, feeType: "USAGE", grade: "1구 안치 (4평형)", capacity: "1인" },
                    ];

                    const coupleRows = [
                        { name: "기본 시설 사용료", price: 2160000, feeType: "USAGE", grade: "1평 기준", isRepresentative: true, capacity: "부부" },
                        { name: "연 관리비", price: 16000, feeType: "MAINTENANCE", grade: "1평 / 1년 기준", capacity: "부부" },
                        { name: "합장묘 분양 패키지(소형)", price: 18000000, feeType: "USAGE", grade: "부부 2구 안치 (2.5평형)", capacity: "부부" },
                        { name: "합장묘 분양 패키지(중형)", price: 23823000, feeType: "USAGE", grade: "부부 2구 안치 (4평형)", capacity: "부부" }
                    ];

                    newStandardizedPrices.push({
                        serviceType: 'BURIAL',
                        subType: '매장묘 (단장형)',
                        unit: '원',
                        rows: singleRows
                    });

                    newStandardizedPrices.push({
                        serviceType: 'BURIAL',
                        subType: '매장묘 (합장형)',
                        unit: '원',
                        rows: coupleRows
                    });
                } else if (g.serviceType === 'BURIAL' && g.subType === '평장묘') {
                    g.subType = '평장묘 (부부형)';
                    g.rows = [
                        { name: "평장묘 분양 패키지", price: 5273180, feeType: "USAGE", grade: "부부 2구 안치 (2.5평형)", isRepresentative: true, capacity: "부부" }
                    ];
                    newStandardizedPrices.push(g);
                } else if (g.serviceType === 'BONGSAN' && g.subType === '봉안묘') {
                    g.rows = [
                        { name: "봉안묘 분양 (2기)", price: 15200000, feeType: "USAGE", grade: "부부 2기 안치", capacity: "부부" },
                        { name: "봉안묘 분양 (4기)", price: 19200000, feeType: "USAGE", grade: "가족 4기 안치", capacity: "가족" },
                        { name: "봉안묘 분양 (6기)", price: 24000000, feeType: "USAGE", grade: "가족 6기 안치", capacity: "가족" },
                        { name: "봉안묘 분양 (9기)", price: 28000000, feeType: "USAGE", grade: "가족 9기 안치", capacity: "가족" },
                        { name: "봉안묘 분양 (16기)", price: 35000000, feeType: "USAGE", grade: "문중 16기 안치", capacity: "문중" }
                    ];
                    newStandardizedPrices.push(g);
                } else {
                    newStandardizedPrices.push(g); // 나머지 그대로 복사
                }
            });

            // 정렬
            newStandardizedPrices.sort((a, b) => {
                const getOrder = (g) => {
                    if (g.serviceType === 'BONGSAN') return 0;
                    if (g.serviceType === 'BURIAL') {
                        if (g.subType.includes('단장형')) return 1;
                        if (g.subType.includes('합장형')) return 2;
                        if (g.subType.includes('평장묘')) return 3;
                        return 4;
                    }
                    return 99;
                };
                return getOrder(a) - getOrder(b);
            });

            f.priceInfo.standardizedPrices = newStandardizedPrices;

            fs.writeFileSync('data/facilities.json', JSON.stringify(d, null, 2));
            console.log("park-0002 데이터 리뷰 및 수정 완료 (data/facilities.json)");

            // DB 업데이트
            const { error } = await supabase
                .from('Facility')
                .update({ pricing: f.priceInfo })
                .eq('id', 'park-0002');

            if (error) {
                console.error('Error updating DB:', error);
            } else {
                console.log('✅ DB update complete for park-0002');
            }
        }
    }
}

remodelPark0002();
