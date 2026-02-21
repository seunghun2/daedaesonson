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

async function remodelPark0008() {
    console.log('\n🚀 Modifying [park-0008] using specialized mapping...');

    const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
    const facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    const facilityIdx = facilitiesData.findIndex(f => f.id === 'park-0008');
    if (facilityIdx === -1) {
        console.error('❌ Facility park-0008 not found in local data');
        return;
    }

    const facility = facilitiesData[facilityIdx];
    const v1Table = facility.priceInfo?.priceTable;
    if (!v1Table) {
        console.error('❌ V1 priceTable not found');
        return;
    }

    const newStandardizedPrices = [
        {
            serviceType: "BURIAL",
            subType: "매장묘",
            unit: "원",
            rows: []
        },
        {
            serviceType: "BURIAL",
            subType: "봉안묘",
            unit: "원",
            rows: []
        },
        {
            serviceType: "BURIAL",
            subType: "선택항목 (석물 및 묘테)",
            unit: "원",
            rows: []
        }
    ];

    function getSmartCapacity(name, num) {
        if (num === 1) return "개인";
        if (num === 2) return "부부";
        if (num >= 3 && num <= 6) return "가족";
        if (num > 6) return "대가족";
        return undefined;
    }

    function processRow(row, category) {
        let finalName = row.name.replace(/\s+/g, ' ').trim();
        let serviceType = "BURIAL";
        let subType = "매장묘";
        let feeType = row.name.includes('관리비') ? 'MAINTENANCE' : 'USAGE';
        let capacity = undefined;
        let isRepresentative = !!row.isRepresentative;
        let groupType = null;

        // 1. 야외 봉안묘
        if (finalName.includes('대지') && finalName.includes('납골')) {
            subType = "봉안묘";
            const match = finalName.match(/(\d+)위/);
            if (match) {
                const num = parseInt(match[1]);
                finalName = `봉안묘(${num}분)`; // Exact precision from user
                capacity = getSmartCapacity(finalName, num);
            }
        }
        // 2. 석물 및 묘테 (선택항목 그룹화)
        else if (finalName.includes('묘테') || finalName.includes('석물') || finalName.includes('비석') || finalName.includes('상석') || finalName.includes('갓비석')) {
            subType = "선택항목 (석물 및 묘테)";
            feeType = "USAGE";

            // 스마트 그룹핑
            const seokMatch = finalName.match(/석물\([^\)]+\)/);
            if (seokMatch) {
                groupType = seokMatch[0]; // e.g., "석물(301형)"
            } else if (finalName.startsWith('묘테')) {
                groupType = "묘테";
            } else if (finalName.startsWith('비석') || finalName.startsWith('갓비석')) {
                groupType = "비석";
            } else if (finalName.startsWith('상석')) {
                groupType = "상석";
            } else {
                groupType = "기타 석물";
            }
        }
        // 3. 매장묘 (Default handles 묘지사용료, 묘지관리비)

        const enriched = {
            name: finalName,
            price: row.price,
            feeType,
            grade: row.grade && row.grade !== "-" ? row.grade : "",
            note: "",
            isRepresentative,
            groupType,
            duration: null,
            durationType: null,
            residency: "ALL",
            capacity
        };

        const targetGroup = newStandardizedPrices.find(g => g.serviceType === serviceType && g.subType === subType);
        if (targetGroup) targetGroup.rows.push(enriched);
    }

    // Process all values from v1 ignoring useless "기타" empty buckets 
    for (const [subTypeName, subData] of Object.entries(v1Table)) {
        if (subTypeName === '기타') continue; // Always empty
        if (!subData.rows || subData.rows.length === 0) continue;

        subData.rows.forEach(row => processRow(row, subTypeName));
    }

    // Sort families dynamically by capacity
    const bongsangs = newStandardizedPrices.find(g => g.subType === '봉안묘');
    if (bongsangs) {
        bongsangs.rows.sort((a, b) => {
            const matchA = a.name.match(/(\d+)분/);
            const matchB = b.name.match(/(\d+)분/);
            const numA = matchA ? parseInt(matchA[1]) : 0;
            const numB = matchB ? parseInt(matchB[1]) : 0;
            return numA - numB;
        });
    }

    // Assign and save
    facility.priceInfo.standardizedPrices = newStandardizedPrices.filter(g => g.rows.length > 0);
    facilitiesData[facilityIdx] = facility;

    fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2));
    console.log(`✅ Local facilities.json updated for park-0008`);

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: facility.priceInfo })
        .eq('id', 'park-0008');

    if (error) {
        console.error(`❌ Error updating Supabase:`, error);
        return;
    }

    console.log(`✨ DB Special Rewrite complete ✨\n`);
}

remodelPark0008().catch(console.error);
