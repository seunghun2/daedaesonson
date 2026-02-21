const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function remodelPark0003() {
    const d = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
    const facilities = d.facilities || d;
    const fIndex = facilities.findIndex(x => x.id === 'park-0003');

    if (fIndex !== -1) {
        let f = facilities[fIndex];
        if (f.priceInfo) {
            let newStandardizedPrices = [];

            // 공통 베이스 비용
            const baseLand = { name: "기본 시설 사용료 (토지)", price: 1600000, feeType: "USAGE", grade: "1평 기준", isRepresentative: true, capacity: "공통" };
            const baseMaintenance = { name: "연 관리비 (토지)", price: 19000, feeType: "MAINTENANCE", grade: "1평 / 1년 기준", capacity: "공통" };

            // 평장묘 (개인 부부)
            newStandardizedPrices.push({
                serviceType: "BURIAL",
                subType: "평장묘 (개인/부부형)",
                unit: "원",
                rows: [
                    baseLand,
                    baseMaintenance,
                    { name: "개인 1위 평장 세트", price: 2500000, feeType: "USAGE", grade: "개인용 평장 시설물 패키지", isRepresentative: false, capacity: "1인" },
                    { name: "부부 2위 평장 세트", price: 7000000, feeType: "USAGE", grade: "부부형 평장 시설물 패키지", capacity: "부부(2인)" }
                ]
            });

            // 평장묘 (가족형)
            newStandardizedPrices.push({
                serviceType: "BURIAL",
                subType: "평장묘 (가족형)",
                unit: "원",
                rows: [
                    baseLand,
                    baseMaintenance,
                    { name: "가족 4위 평장 세트", price: 9600000, feeType: "USAGE", grade: "4인 가족형 시설물 패키지", isRepresentative: false, capacity: "가족(4위)" },
                    { name: "가족 6위 평장 세트", price: 12200000, feeType: "USAGE", grade: "6인 가족형 시설물 패키지", isRepresentative: false, capacity: "가족(6위)" }
                ]
            });

            // 봉안묘
            newStandardizedPrices.push({
                serviceType: "BURIAL",
                subType: "봉안묘",
                unit: "원",
                rows: [
                    baseLand,
                    baseMaintenance,
                    { name: "부부 2위 봉안묘 패키지", price: 4200000, feeType: "USAGE", grade: "석물 및 봉안 시설 패키지", isRepresentative: false, capacity: "부부(2인)" },
                    { name: "12위 사각돌뚜껑 가족세트", price: 9900000, feeType: "USAGE", grade: "가족 전용 석물 패키지", isRepresentative: false, capacity: "가족(12위)" }
                ]
            });

            // 매장묘
            newStandardizedPrices.push({
                serviceType: "BURIAL",
                subType: "매장묘",
                unit: "원",
                rows: [
                    baseLand,
                    baseMaintenance,
                    { name: "원형 매장묘 (기본 세트)", price: 5600000, feeType: "USAGE", grade: "전통 봉분 등 기본 제공", isRepresentative: false, capacity: "1인/부부" },
                    { name: "원형 매장묘 (조각 세트)", price: 7200000, feeType: "USAGE", grade: "둘레석 등 조각 장식 포함", isRepresentative: false, capacity: "1인/부부" },
                    { name: "가족 6위 조각 매장 세트", price: 10900000, feeType: "USAGE", grade: "석물 장식 포함 가족 세트", isRepresentative: false, capacity: "가족(6위)" }
                ]
            });

            // 정렬
            newStandardizedPrices.sort((a, b) => {
                const getOrder = (g) => {
                    if (g.serviceType === 'BONGSAN') return 0;
                    if (g.serviceType === 'BURIAL') {
                        if (g.subType.includes('매장묘')) return 1;
                        if (g.subType.includes('개인/부부형')) return 2;
                        if (g.subType.includes('가족형')) return 3;
                        return 4;
                    }
                    return 99;
                };
                return getOrder(a) - getOrder(b);
            });

            f.priceInfo.standardizedPrices = newStandardizedPrices;

            fs.writeFileSync('data/facilities.json', JSON.stringify(d, null, 2));
            console.log("park-0003 데이터 리뷰 및 수정 완료 (data/facilities.json) - 탭 단순화 수정");

            // DB 업데이트
            const { error } = await supabase
                .from('Facility')
                .update({ pricing: f.priceInfo })
                .eq('id', 'park-0003');

            if (error) {
                console.error('Error updating DB:', error);
            } else {
                console.log('✅ DB update complete for park-0003');
            }
        }
    }
}

remodelPark0003();
