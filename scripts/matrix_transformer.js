const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- DaedaeSonson Smart Heuristics Matrix --- //

function getServiceType(cat, rows) {
    const hasNarkgol = rows.some(r => /봉안|납골|실내/.test(r.name));
    if (/봉안|납골|실내/.test(cat) || hasNarkgol) return 'BONGSAN';
    if (/수목|잔디|화초|자연장|평장|수목장/.test(cat)) return 'NATURAL_BURIAL';
    return 'BURIAL'; // default for 매장묘, 단장형, 합장형, 가족형(if not specified)
}

function getFeeType(name) {
    if (name.includes('관리비')) return 'MAINTENANCE';
    return 'USAGE';
}

function friendlyName(name) {
    let n = name;
    // Common public sector terms cleanup
    n = n.replace(/1회차\s*1구/, '최초 안치 시(1분) -');
    n = n.replace(/1회차\s*2구/, '합장 안치 시(2분) -');
    n = n.replace(/2회차\s*1구/, '계약 연장 시(30년 후) -');
    n = n.replace('가족봉안묘 ', ''); // Remove redundant tab prefixes
    return n.replace(/\s+/g, ' ').trim();
}

function getSmartCapacity(rowName, category) {
    let capacity = undefined;

    // Extract exact numbers like "2위", "4기", "12기"
    const match = rowName.match(/(\d+)(?:위|기)/);
    if (match) {
        const num = parseInt(match[1]);
        if (num === 1) capacity = "개인";
        else if (num === 2) capacity = "부부";
        else if (num >= 3 && num <= 6) capacity = "가족";
        else if (num >= 7 && num <= 24) capacity = "대가족";
        else if (num > 24) capacity = "문중";
    }

    // Fallback to text parsing
    if (!capacity) {
        if (/가족|대가족|중가족/.test(category) || /가족/.test(rowName)) capacity = "가족";
        else if (/부부|쌍분|합장/.test(category) || /부부/.test(rowName)) capacity = "부부";
        else if (/개인|단장/.test(category) || /개인/.test(rowName)) capacity = "개인";
    }

    return capacity;
}

function enrichRow(row, category) {
    let residency = "ALL";
    let gt = row.groupType || "";

    // Residency heuristics
    if (gt.includes('관외')) residency = 'NON_LOCAL';
    else if (gt.includes('관내') || gt.includes('주민등록')) residency = 'LOCAL';

    // Tab Group Formatting
    if (gt.includes('3년이상')) gt = '관내 (3년 이상)';
    else if (gt.includes('3년미만')) gt = '관내 (6개월~3년 미만)';
    else if (gt.includes('관외')) gt = '관외';

    if (gt === '관리비') gt = null; // Fix generic migration bug that set groupType='관리비' independently

    // Capacity heuristics
    let capacity = getSmartCapacity(row.name, category);

    // Duration & Grade aesthetics
    let grade = row.grade;
    let duration = null;
    let durationType = null;

    if (grade) {
        if (grade.includes('30년')) { grade = '안치기간 30년 기준'; duration = 30; durationType = 'YEAR'; }
        else if (grade.includes('15년')) { grade = '안치기간 15년 기준'; duration = 15; durationType = 'YEAR'; }
        else if (grade.includes('년')) {
            const match = grade.match(/(\d+)년/);
            if (match) {
                duration = parseInt(match[1]);
                durationType = 'YEAR';
                grade = `안치기간 ${duration}년 기준`;
            }
        }
    }

    return {
        name: friendlyName(row.name),
        price: row.price,
        feeType: getFeeType(row.name),
        grade: grade || "",
        note: "",
        isRepresentative: !!row.isRepresentative,
        groupType: gt || null, // Cleaned up groupType
        duration,
        durationType,
        residency,
        capacity
    };
}

// --- Main Transformer Function --- //

async function transformFacility(facilityId) {
    console.log(`\n🚀 Starting Smart Matrix Transformer for [${facilityId}]...`);

    const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
    const facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    const facilityIdx = facilitiesData.findIndex(f => f.id === facilityId);
    if (facilityIdx === -1) {
        console.error(`❌ Facility ${facilityId} not found in local data`);
        process.exit(1);
    }

    const facility = facilitiesData[facilityIdx];
    const v1Table = facility.priceInfo?.priceTable;

    if (!v1Table) {
        console.error(`❌ V1 priceTable not found for ${facilityId}`);
        process.exit(1);
    }

    const newStandardizedPrices = [];

    // Keys to ignore completely (like stoneworks unless specifically requested)
    const ignoreCategories = ['기타', '제외됨'];

    for (const [subType, subData] of Object.entries(v1Table)) {
        if (ignoreCategories.includes(subType)) continue;
        if (!subData.rows || subData.rows.length === 0) continue; // Skip empty V1 categories

        let serviceType = getServiceType(subType, subData.rows);
        let finalSubType = subType;

        // Refine subType if necessary
        if (serviceType === 'BONGSAN') {
            if (subType === '합장형' || subType === '쌍분형') finalSubType = '부부봉안묘';
            else if (subType === '가족형') finalSubType = '가족봉안묘';
        }

        const mappedRows = [];
        subData.rows.forEach(row => {
            let rowServiceType = serviceType;
            let rowFinalSubType = finalSubType;

            // Smart auto-correction for misclassified Family Enshrinement items (park-0008)
            if (row.name.includes('대지') && row.name.includes('납골')) {
                rowServiceType = 'BONGSAN';
                rowFinalSubType = '가족봉안묘';
            }

            const enriched = enrichRow(row, subType);

            // Group by rowServiceType + rowFinalSubType
            let targetGroup = newStandardizedPrices.find(g => g.serviceType === rowServiceType && g.subType === rowFinalSubType);
            if (!targetGroup) {
                targetGroup = {
                    serviceType: rowServiceType,
                    subType: rowFinalSubType,
                    unit: subData.unit || "원",
                    rows: []
                };
                newStandardizedPrices.push(targetGroup);
            }
            targetGroup.rows.push(enriched);
        });
    }

    // Sort rows dynamically inside 가족봉안묘 based on the capacity extracted
    newStandardizedPrices.forEach(group => {
        if (group.subType === '가족봉안묘') {
            group.rows.sort((a, b) => {
                const matchA = a.name.match(/(\d+)(?:위|기)/);
                const matchB = b.name.match(/(\d+)(?:위|기)/);
                const numA = matchA ? parseInt(matchA[1]) : 0;
                const numB = matchB ? parseInt(matchB[1]) : 0;
                return numA - numB;
            });
        }
    });

    // 4. Update the local object
    facility.priceInfo.standardizedPrices = newStandardizedPrices;
    facilitiesData[facilityIdx] = facility;

    fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2));
    console.log(`✅ Local facilities.json updated for ${facilityId}`);

    // 5. Update Supabase
    const { error } = await supabase
        .from('Facility')
        .update({ pricing: facility.priceInfo })
        .eq('id', facilityId);

    if (error) {
        console.error(`❌ Error updating Supabase for ${facilityId}:`, error);
        process.exit(1);
    }

    console.log(`✨ DB Matrix Transformation complete for ${facilityId} ✨\n`);
}

// Support CLI execution
const targetId = process.argv[2];
if (!targetId) {
    console.log('Usage: node matrix_transformer.js <facility-id>');
    process.exit(1);
}

transformFacility(targetId).catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
