const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function remodelPark0007() {
    console.log('Starting park-0007 remodel...');

    // 1. Load local data
    const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
    const facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    // 2. Find park-0007
    const park0007Idx = facilitiesData.findIndex(f => f.id === 'park-0007');
    if (park0007Idx === -1) {
        console.error('park-0007 not found in local data');
        process.exit(1);
    }

    const facility = facilitiesData[park0007Idx];

    // 3. Keep original v1 priceTable
    const v1Table = facility.priceInfo.priceTable;
    if (!v1Table) {
        console.error('V1 priceTable not found for park-0007');
        process.exit(1);
    }

    const newStandardizedPrices = [];

    // Helper to map properties
    const processRows = (categoryName, rows) => {
        return rows.map(row => {
            let feeType = "USAGE";
            if (row.name.includes("관리비")) feeType = "MAINTENANCE";
            else if (row.name.includes("기타") || row.name.includes("조경비")) feeType = "USAGE"; // or OTHER if we want it separate

            let residency = "ALL";
            if (row.groupType && row.groupType.includes("관외")) residency = "NON_LOCAL";
            else if (row.groupType && (row.groupType.includes("3년이상") || row.groupType.includes("3년미만"))) residency = "LOCAL";

            // Format groupType nicely for tab names
            let formattedGroupType = row.groupType;
            if (formattedGroupType === "3년이상 주민등록") formattedGroupType = "관내 (3년 이상)";
            else if (formattedGroupType === "6월~3년미만 주민등록") formattedGroupType = "관내 (6개월~3년 미만)";
            else if (formattedGroupType === "관외 (예산군 이외)") formattedGroupType = "관외";

            let duration = 30;
            let durationType = "YEAR";

            let newName = row.name;
            newName = newName.replace('1회차1구', '최초 안치 시(1분) -');
            newName = newName.replace('1회차2구', '합장 안치 시(2분) -');
            newName = newName.replace('2회차 1구', '계약 연장 시(30년 후) -');
            newName = newName.replace('가족봉안묘 ', ''); // Remove redundant prefix

            // Clean up double spaces if any
            newName = newName.replace(/\s+/g, ' ').trim();

            let newGrade = row.grade;
            if (newGrade === '30년') {
                newGrade = '안치기간 30년 기준';
            }

            return {
                name: newName,
                price: row.price,
                feeType,
                grade: newGrade || "",
                note: "",
                isRepresentative: !!row.isRepresentative,
                groupType: formattedGroupType || '공통 (연장 등)',
                duration,
                durationType,
                residency,
                capacity: categoryName === "가족봉안묘" ? "가족" : undefined
            };
        });
    };

    // --- BURIAL (단장형) ---
    if (v1Table["단장형"] && v1Table["단장형"].rows) {
        newStandardizedPrices.push({
            serviceType: "BURIAL",
            subType: "단장형",
            unit: "원",
            rows: processRows("단장형", v1Table["단장형"].rows)
        });
    }

    // --- BURIAL (합장형) ---
    if (v1Table["합장형"] && v1Table["합장형"].rows) {
        newStandardizedPrices.push({
            serviceType: "BURIAL",
            subType: "합장형",
            unit: "원",
            rows: processRows("합장형", v1Table["합장형"].rows)
        });
    }

    // --- BONGSAN (봉안묘) ---
    // Note: 봉안묘 generally acts as an outdoor tomb/mausoleum. Can be classified as BONGSAN.
    if (v1Table["봉안묘"] && v1Table["봉안묘"].rows) {
        newStandardizedPrices.push({
            serviceType: "BONGSAN",
            subType: "가족봉안묘",
            unit: "원",
            rows: processRows("가족봉안묘", v1Table["봉안묘"].rows)
        });
    }

    // 4. Update the local object
    facility.priceInfo.standardizedPrices = newStandardizedPrices;
    facilitiesData[park0007Idx] = facility;

    // 5. Save back to facilities.json
    fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2));
    console.log('✅ Local facilities.json updated for park-0007');

    // 6. Update Supabase
    const { error } = await supabase
        .from('Facility')
        .update({ pricing: facility.priceInfo })
        .eq('id', 'park-0007');

    if (error) {
        console.error('❌ Error updating Supabase:', error);
        process.exit(1);
    }

    console.log('✅ DB update complete for park-0007');
}

remodelPark0007().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
