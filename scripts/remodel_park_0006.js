const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
    console.log("Starting park-0006 remodel...");
    const dataPath = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const parkId = "park-0006";
    const facility = data.find(p => p.id === parkId);
    if (!facility) return;

    const newStandardizedPrices = [];

    // --- 1. 봉안당 (BONGSAN) ---
    // From 534 image. Grouping by room types (implicitly, based on price ranges)
    const bongsanRows = [
        // 그룹 A (Premium?) 개인단
        { name: "1단", price: 2000000, feeType: "USAGE", groupType: "개인단 (로얄실)", isRepresentative: false },
        { name: "2단", price: 3000000, feeType: "USAGE", groupType: "개인단 (로얄실)", isRepresentative: false },
        { name: "3단", price: 3500000, feeType: "USAGE", groupType: "개인단 (로얄실)", isRepresentative: true },
        { name: "4단", price: 5000000, feeType: "USAGE", groupType: "개인단 (로얄실)", isRepresentative: false },
        { name: "5단", price: 5000000, feeType: "USAGE", groupType: "개인단 (로얄실)", isRepresentative: false },
        { name: "6단", price: 5000000, feeType: "USAGE", groupType: "개인단 (로얄실)", isRepresentative: false },
        { name: "7단", price: 3500000, feeType: "USAGE", groupType: "개인단 (로얄실)", isRepresentative: false },
        { name: "8단", price: 2500000, feeType: "USAGE", groupType: "개인단 (로얄실)", isRepresentative: false },

        // 그룹 A 부부단
        { name: "1단", price: 4000000, feeType: "USAGE", groupType: "부부단 (로얄실)", isRepresentative: false },
        { name: "2단", price: 6000000, feeType: "USAGE", groupType: "부부단 (로얄실)", isRepresentative: false },
        { name: "3단", price: 7000000, feeType: "USAGE", groupType: "부부단 (로얄실)", isRepresentative: true },
        { name: "4단", price: 10000000, feeType: "USAGE", groupType: "부부단 (로얄실)", isRepresentative: false },
        { name: "5단", price: 10000000, feeType: "USAGE", groupType: "부부단 (로얄실)", isRepresentative: false },
        { name: "6단", price: 10000000, feeType: "USAGE", groupType: "부부단 (로얄실)", isRepresentative: false },
        { name: "7단", price: 7000000, feeType: "USAGE", groupType: "부부단 (로얄실)", isRepresentative: false },
        { name: "8단", price: 5000000, feeType: "USAGE", groupType: "부부단 (로얄실)", isRepresentative: false },

        // 그룹 B (Standard?) 개인단
        { name: "1단", price: 1200000, feeType: "USAGE", groupType: "개인단 (일반실)", isRepresentative: false },
        { name: "2단", price: 1800000, feeType: "USAGE", groupType: "개인단 (일반실)", isRepresentative: false },
        { name: "3단", price: 2100000, feeType: "USAGE", groupType: "개인단 (일반실)", isRepresentative: false },
        { name: "4단", price: 3000000, feeType: "USAGE", groupType: "개인단 (일반실)", isRepresentative: false },
        { name: "5단", price: 3000000, feeType: "USAGE", groupType: "개인단 (일반실)", isRepresentative: false },
        { name: "6단", price: 3000000, feeType: "USAGE", groupType: "개인단 (일반실)", isRepresentative: false },
        { name: "7단", price: 2100000, feeType: "USAGE", groupType: "개인단 (일반실)", isRepresentative: false },

        // 그룹 B 부부단
        { name: "1단", price: 3200000, feeType: "USAGE", groupType: "부부단 (일반실)", isRepresentative: false },
        { name: "2단", price: 4800000, feeType: "USAGE", groupType: "부부단 (일반실)", isRepresentative: false },
        { name: "3단", price: 5600000, feeType: "USAGE", groupType: "부부단 (일반실)", isRepresentative: false },
        { name: "4단", price: 8000000, feeType: "USAGE", groupType: "부부단 (일반실)", isRepresentative: false },
        { name: "5단", price: 8000000, feeType: "USAGE", groupType: "부부단 (일반실)", isRepresentative: false },
        { name: "6단", price: 8000000, feeType: "USAGE", groupType: "부부단 (일반실)", isRepresentative: false },
        { name: "7단", price: 5600000, feeType: "USAGE", groupType: "부부단 (일반실)", isRepresentative: false },

        // 기독교 전용관 (그룹 C?) 개인단
        { name: "1단", price: 1600000, feeType: "USAGE", groupType: "개인단 (특별실/기독교관)", isRepresentative: false },
        { name: "2단", price: 2400000, feeType: "USAGE", groupType: "개인단 (특별실/기독교관)", isRepresentative: false },
        { name: "3단", price: 2800000, feeType: "USAGE", groupType: "개인단 (특별실/기독교관)", isRepresentative: false },
        { name: "4단", price: 4000000, feeType: "USAGE", groupType: "개인단 (특별실/기독교관)", isRepresentative: false },
        { name: "5단", price: 4000000, feeType: "USAGE", groupType: "개인단 (특별실/기독교관)", isRepresentative: false },
        { name: "6단", price: 4000000, feeType: "USAGE", groupType: "개인단 (특별실/기독교관)", isRepresentative: false },
        { name: "7단", price: 2800000, feeType: "USAGE", groupType: "개인단 (특별실/기독교관)", isRepresentative: false },

        // 관리비 추출. "관리비 안내" 영역으로 가도록 groupType 없이 MAINTENANCE로.
        { name: "연 관리비 (개인단)", price: 32000, feeType: "MAINTENANCE", grade: "1년 기준" },
        { name: "연 관리비 (부부단)", price: 64000, feeType: "MAINTENANCE", grade: "1년 기준" }
    ];

    newStandardizedPrices.push({
        serviceType: "BONGSAN",
        subType: "봉안당",
        unit: "원",
        rows: bongsanRows
    });

    // --- 2. 매장묘지 (BURIAL) ---
    // From 6 image
    const burialRows = [
        { name: "묘지 임대사용료", price: 1070000, feeType: "USAGE", grade: "1평 기준" },
        { name: "묘지 공동관리비", price: 17000, feeType: "MAINTENANCE", grade: "1평/1년 기준" },

        // 기타 석물 및 부대비용. 별도의 subType("기타 석물 및 추가비용")으로 빼주면 아코디언처럼 보임.
        // 우리는 "BURIAL"에 subType = "기타 석물 및 작업비용"으로 추가 배열 하나 더 만들 것.
    ];
    newStandardizedPrices.push({
        serviceType: "BURIAL",
        subType: "매장묘",
        unit: "원",
        rows: burialRows
    });

    const burialExtras = [
        { name: "봉분작업비", price: 500000, feeType: "USAGE", grade: "흙 운반 및 봉분 작업비용" },
        { name: "평토작업비", price: 150000, feeType: "USAGE", grade: "바닥 다지기 작업/1평 기준" },
        { name: "재봉작업 (1.5평)", price: 500000, feeType: "USAGE", grade: "사각묘태석 봉분" },
        { name: "재봉작업 (3.0평)", price: 550000, feeType: "USAGE", grade: "타원묘태석 봉분" },
        { name: "개장정리비 (소)", price: 420000, feeType: "USAGE", grade: "1.5~2.5평 원상복구" },
        { name: "개장정리비 (중)", price: 520000, feeType: "USAGE", grade: "3.0~4.5평 원상복구" },
        { name: "개장정리비 (대)", price: 620000, feeType: "USAGE", grade: "5.0~6.0평 원상복구" },
        { name: "조각묘태석 3단", price: 5544000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "사각묘태석 3단", price: 4059000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "사각묘태석 2단", price: 1859000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "사각묘태석 1단", price: 1496000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "타원묘태석", price: 1496000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "월석", price: 154000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "화강상석 (3자)", price: 1309000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "화강상석 (2.5자)", price: 759000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "북석 대", price: 374000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "북석 소", price: 297000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "혼유석", price: 286000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "갓비석", price: 1199000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "갓석", price: 847000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "오석비석 (3.5자)", price: 1122000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "오석비석 (3자)", price: 946000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "오석비석 (2.5자)", price: 759000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "연꽃좌대", price: 638000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "무지좌대", price: 264000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "와비", price: 1100000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "연꽃와비좌대", price: 924000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "조각꽃병", price: 682000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "광택꽃병", price: 341000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "조각상향로", price: 517000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "단향로", price: 198000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "석문", price: 1353000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "석주", price: 198000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "경계석", price: 198000, feeType: "USAGE", groupType: "석물 비용" },
        { name: "각자 비용 (합비)", price: 407000, feeType: "USAGE", groupType: "추가 비용" },
        { name: "각자 비용 (외비)", price: 330000, feeType: "USAGE", groupType: "추가 비용" },
        { name: "각자 비용 (별세일 추가)", price: 121000, feeType: "USAGE", groupType: "추가 비용" },
        { name: "각자 비용 (이름 추가)", price: 55000, feeType: "USAGE", groupType: "추가 비용" },
        { name: "각자 비용 (봉안묘 뚜껑)", price: 110000, feeType: "USAGE", groupType: "추가 비용" }
    ];
    newStandardizedPrices.push({
        serviceType: "BURIAL",
        subType: "기타 석물 및 추가비용",
        unit: "원",
        rows: burialExtras
    });

    // --- 3. 자연장지 (NATURAL_BURIAL) ---
    // From 1187 image
    const naturalRows = [
        { name: "수목장지 (1위)", price: 2000000, feeType: "USAGE", groupType: "개인, 부부형", isRepresentative: true },
        { name: "개인, 부부형", price: 3000000, feeType: "USAGE", groupType: "개인, 부부형", isRepresentative: false },
        { name: "개인,부부형 (양산시민/수급자)", price: 2700000, feeType: "USAGE", groupType: "개인, 부부형", grade: "양산시민 기초생활수급자(10%할인)" },

        { name: "수목 잔디 가족장지", price: 4000000, feeType: "USAGE", groupType: "가족형", isRepresentative: false },
        { name: "수목 가족장지", price: 5000000, feeType: "USAGE", groupType: "가족형", isRepresentative: false },
        { name: "수목 가족장지 (중)", price: 9000000, feeType: "USAGE", groupType: "가족형", isRepresentative: false },
        { name: "가족형", price: 15000000, feeType: "USAGE", groupType: "가족형", isRepresentative: false },
        { name: "가족형 (소)", price: 5000000, feeType: "USAGE", groupType: "가족형", isRepresentative: false },

        { name: "대가족형", price: 17000000, feeType: "USAGE", groupType: "대가족형", grade: "17,000,000 ~ 24,000,000", isRepresentative: false },

        { name: "연 관리비 (기본)", price: 21400, feeType: "MAINTENANCE", groupType: "개인, 부부형" },
        { name: "연 관리비 (소)", price: 42600, feeType: "MAINTENANCE", groupType: "개인, 부부형" },
        { name: "연 관리비 (중소)", price: 64000, feeType: "MAINTENANCE", groupType: "가족형" },
        { name: "연 관리비 (중)", price: 85400, feeType: "MAINTENANCE", groupType: "가족형" },
        { name: "연 관리비 (중대)", price: 106800, feeType: "MAINTENANCE", groupType: "가족형" },
        { name: "연 관리비 (대)", price: 213400, feeType: "MAINTENANCE", groupType: "가족형" },
        { name: "연 관리비 (특대)", price: 300000, feeType: "MAINTENANCE", groupType: "대가족형" }
    ];
    newStandardizedPrices.push({
        serviceType: "NATURAL_BURIAL",
        subType: "수목장",
        unit: "원",
        rows: naturalRows
    });

    facility.priceInfo.standardizedPrices = newStandardizedPrices;

    // Apply to facility root level if needed (for safety)
    facility.standardizedPrices = newStandardizedPrices;

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: facility.priceInfo })
        .eq('id', parkId);

    if (error) {
        console.error("DB update error:", error);
    } else {
        console.log("✅ DB update complete for park-0006");
    }
}
main();
