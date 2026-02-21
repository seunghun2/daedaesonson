const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
    console.log("Starting park-0005 remodel...");
    const dataPath = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const parkId = "park-0005";
    const facility = data.find(p => p.id === parkId);
    if (!facility) return;

    const prices = facility.priceInfo.priceTable;
    if (!prices) return;

    const newStandardizedPrices = [];

    // 1. 매장묘
    if (prices["매장묘"] && prices["매장묘"].rows.length > 0) {
        // Just standard usage and maintenance fees as normal
        const rows = prices["매장묘"].rows.map(r => ({
            name: r.name,
            feeType: r.name.includes('관리비') ? 'MAINTENANCE' : 'USAGE',
            price: r.price,
            grade: r.grade,
            isRepresentative: r.isRepresentative
        }));

        newStandardizedPrices.push({
            serviceType: "BURIAL",
            subType: "매장묘",
            unit: "원",
            rows: rows
        });
        console.log("Processed 매장묘");
    }

    // 2. 봉안당
    if (prices["봉안당"] && prices["봉안당"].rows.length > 0) {
        const rawRows = prices["봉안당"].rows;

        const m1price = 50000;
        const m2price = 80000;

        // NO groupType! This forces them into the "관리비 안내" gray box at the bottom globally for all tabs!
        const m1 = { name: "연 관리비 (개인단)", price: m1price, feeType: "MAINTENANCE", grade: "1년 기준" };
        const m2 = { name: "연 관리비 (부부단/VIP단)", price: m2price, feeType: "MAINTENANCE", grade: "1년 기준" };

        const usageRows = rawRows.filter(r => !r.name.includes("관리비") && r.price > 0);
        const groups = [...new Set(usageRows.map(r => r.groupType).filter(Boolean))];

        let allCombinedRows = [];
        let hasNormal = false;
        let hasVIP = false;

        groups.forEach(g => {
            let isVIP = g.includes("VIP");
            if (isVIP) hasVIP = true;
            if (!isVIP) hasNormal = true;

            const gRows = usageRows.filter(r => r.groupType === g).map(r => ({
                name: r.name,
                price: r.price,
                feeType: "USAGE",
                grade: r.grade,
                groupType: g,
                isRepresentative: r.isRepresentative
            }));

            allCombinedRows.push(...gRows);
        });

        // Add overall guide for otherRows smoothly now that UI is fixed
        if (hasNormal) {
             allCombinedRows.push({
                name: "[일반실 안내]",
                feeType: "OTHER",
                grade: "가장 표준적이고 아늑하게 구성된 합리적인 가격의 기본 봉안 공간입니다.",
                isRepresentative: false
            });
        }
        if (hasVIP) {
            allCombinedRows.push({
                name: "[VIP실 안내]",
                feeType: "OTHER",
                grade: "고급스러운 자재와 넓은 공간이 함께 제공되는 프리미엄 안치 공간입니다.",
                isRepresentative: false
            });
        }

        // Push maintenance unconditionally outside all groups. They will render beautifully in the "관리비 안내" box.
        if (hasNormal) allCombinedRows.push(m1);
        if (hasVIP || m1price !== m2price) allCombinedRows.push(m2);

        if (allCombinedRows.length > 0) {
            newStandardizedPrices.push({
                serviceType: "BONGSAN",
                subType: "봉안당",
                unit: "원",
                rows: allCombinedRows
            });
            console.log("Processed 봉안당 groups");
        }
    }

    facility.priceInfo.standardizedPrices = newStandardizedPrices;

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: facility.priceInfo })
        .eq('id', parkId);

    if (error) {
        console.error("DB update error:", error);
    } else {
        console.log("✅ DB update complete for park-0005");
    }
}
main();
