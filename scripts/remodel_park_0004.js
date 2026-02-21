const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const dataPath = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    const parkId = "park-0004";
    const parkIndex = data.findIndex(p => p.id === parkId);

    if (parkIndex === -1) {
        console.error("Not found!");
        return;
    }

    const facility = data[parkIndex];
    const prices = facility.priceInfo.priceTable; // V1 data

    const newStandardizedPrices = [];

    const baseLand = { name: "기본 시설 사용료 (토지)", price: 4950000, feeType: "USAGE", grade: "1평/30년 기준", isRepresentative: true, capacity: "1평 단위가" };
    const baseMaintenance = { name: "연 관리비 (토지)", price: 46000, feeType: "MAINTENANCE", grade: "1평/1년 기준", capacity: "1평 단위가" };
    const packageInfoRow = { name: "[올인원 패키지란?]", feeType: "OTHER", grade: "토지 사용료 + 관리비 5년 선납 + 특수작업비 + 석물비/설치비가 모두 포함된 원스톱 분양가로, 별도의 추가 비용이 발생하지 않습니다.", isRepresentative: false };

    // 1. 매장묘 (일반, 부부, 고급)
    if (prices["매장묘"] && prices["매장묘"].rows.length > 0) {
        // 일반, 부부, 고급 그룹핑
        const ilbanRows = prices["매장묘"].rows.filter(r => r.name.includes("일반")).map(r => ({
            name: "총 분양대금 (올인원 패키지)",
            feeType: "USAGE",
            grade: r.grade.trim() + " 기준",
            price: r.price,
            capacity: "토지 + 5년관리비 + 석물비/작업비 포함",
            groupType: "일반",
            isRepresentative: false
        }));

        const bubuRows = prices["매장묘"].rows.filter(r => r.name.includes("부부")).map(r => ({
            name: "총 분양대금 (올인원 패키지)",
            feeType: "USAGE",
            grade: r.grade.trim() + " 기준",
            price: r.price,
            capacity: "토지 + 5년관리비 + 석물비/작업비 포함",
            groupType: "부부",
            isRepresentative: false
        }));

        const gogeubRows = prices["매장묘"].rows.filter(r => r.name.includes("고급")).map(r => ({
            name: "총 분양대금 (올인원 패키지)",
            feeType: "USAGE",
            grade: r.grade.trim() + " 기준",
            price: r.price,
            capacity: "토지 + 5년관리비 + 석물비/작업비 포함",
            groupType: "고급",
            isRepresentative: false
        }));

        const combinedRows = [];
        if (ilbanRows.length > 0) {
            combinedRows.push(Object.assign({}, baseLand, { groupType: "일반" }), Object.assign({}, baseMaintenance, { groupType: "일반" }), ...ilbanRows);
        }
        if (bubuRows.length > 0) {
            combinedRows.push(Object.assign({}, baseLand, { groupType: "부부" }), Object.assign({}, baseMaintenance, { groupType: "부부" }), ...bubuRows);
        }
        if (gogeubRows.length > 0) {
            combinedRows.push(Object.assign({}, baseLand, { groupType: "고급" }), Object.assign({}, baseMaintenance, { groupType: "고급" }), ...gogeubRows);
        }

        if (combinedRows.length > 0) {
            newStandardizedPrices.push({
                serviceType: "BURIAL",
                subType: "매장묘",
                unit: "원",
                rows: [...combinedRows, packageInfoRow]
            });
        }
    }

    // 2. 평장묘
    if (prices["평장묘"] && prices["평장묘"].rows.length > 0) {
        const rows = prices["평장묘"].rows.map(r => ({
            name: "총 분양대금 (올인원 패키지)",
            feeType: "USAGE",
            grade: r.grade.trim() + " 기준",
            price: r.price,
            capacity: "토지 + 5년관리비 + 석물비/작업비 포함",
            isRepresentative: false
        }));
        newStandardizedPrices.push({
            serviceType: "BURIAL",
            subType: "평장묘 (리모델링 패키지)",
            unit: "원",
            rows: [baseLand, baseMaintenance, ...rows, packageInfoRow]
        });
    }

    // 3. 봉안묘
    if (prices["봉안묘"] && prices["봉안묘"].rows.length > 0) {
        const rows = prices["봉안묘"].rows.map((r, index) => ({
            name: "총 분양대금 (올인원 패키지)",
            feeType: "USAGE",
            grade: r.grade.trim() + " 기준",
            price: r.price,
            capacity: "토지 + 5년관리비 + 석물비/작업비 포함",
            isRepresentative: false
        }));
        newStandardizedPrices.push({
            serviceType: "BURIAL",
            subType: "봉안묘 (리모델링 패키지)",
            unit: "원",
            rows: [baseLand, baseMaintenance, ...rows, packageInfoRow]
        });
    }

    facility.priceInfo.standardizedPrices = newStandardizedPrices;
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');

    // Update DB
    const { error } = await supabase
        .from('Facility')
        .update({ pricing: facility.priceInfo })
        .eq('id', parkId);

    if (error) {
        console.error("DB update error:", error);
    } else {
        console.log("✅ DB update complete for park-0004");
    }
}
main();
