const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function remodelPark0011() {
    console.log('\n🚀 [park-0011] 재단법인 로엠(묘지) 리모델링 시작...');

    const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
    const facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    // park-0011 로엠 찾기
    const facilityIdx = facilitiesData.findIndex(f => f.id === 'park-0011');
    if (facilityIdx === -1) {
        console.error('❌ park-0011 not found');
        return;
    }

    const facility = facilitiesData[facilityIdx];
    const newStandardizedPrices = [];

    // 석물 항목
    const stoneModels = [
        { name: "평안 1단 일반석물형", price: 4300000, grade: "기본 세트", note: "묘지사용료/관리비 별도 (평안 모델)" },
        { name: "평안 2단 일반석물형", price: 5600000, grade: "기본 세트", note: "묘지사용료/관리비 별도 (평안 모델)", isRepresentative: true },
        { name: "평안 3단 고급석물형", price: 6400000, grade: "기본 세트", note: "묘지사용료/관리비 별도 (평안 모델)" },
        { name: "공작 1단 일반석물형", price: 6500000, grade: "기본 세트", note: "묘지사용료/관리비 별도 (공작 모델)" },
        { name: "공작 2단 일반석물형", price: 7300000, grade: "기본 세트", note: "묘지사용료/관리비 별도 (공작 모델)" },
        { name: "공작 3단 일반석물형", price: 8300000, grade: "기본 세트", note: "묘지사용료/관리비 별도 (공작 모델)" },
        { name: "공작 2단 고급석물형", price: 9000000, grade: "기본 세트", note: "묘지사용료/관리비 별도 (공작 모델)" },
        { name: "공작 3단 고급석물형", price: 10400000, grade: "기본 세트", note: "묘지사용료/관리비 별도 (공작 모델)" }
    ];

    const createStoneRows = () => stoneModels.map(item => ({
        name: item.name,
        price: item.price,
        feeType: "USAGE",
        grade: item.grade,
        note: item.note,
        isRepresentative: item.isRepresentative || false,
        groupType: item.name.includes("평안") ? "평안 모델" : "공작 모델",
        duration: null,
        durationType: null,
        residency: "ALL"
    }));

    const optionalRows = [
        { name: "각지금입비 (외비)", price: 66000, feeType: "USAGE", grade: "작업 1건 기준", note: "비석 및 석재에 외부 추가 금입 작업이 들어갈 때 발생", isRepresentative: false, groupType: "선택항목", duration: null, durationType: null, residency: "ALL" },
        { name: "비석 각자비 (大)", price: 14000, feeType: "USAGE", grade: "큰 글씨 1글자 단위", note: "", isRepresentative: false, groupType: "선택항목", duration: null, durationType: null, residency: "ALL" },
        { name: "비석 각자비 (中)", price: 7000, feeType: "USAGE", grade: "중간 글씨 1글자 단위", note: "", isRepresentative: false, groupType: "선택항목", duration: null, durationType: null, residency: "ALL" },
        { name: "비석 각자비 (小)", price: 3000, feeType: "USAGE", grade: "작은 글씨 1글자 단위", note: "", isRepresentative: false, groupType: "선택항목", duration: null, durationType: null, residency: "ALL" },
        { name: "비석 각자 (마크,무늬)", price: 66000, feeType: "USAGE", grade: "종교 등 문양 1개당", note: "", isRepresentative: false, groupType: "선택항목", duration: null, durationType: null, residency: "ALL" },
        { name: "개장 석물 폐기비", price: 490000, feeType: "USAGE", grade: "폐기 1건 기준", note: "이후 기존 묘 구조물을 철거하고 폐기물로 처리할 때의 비용", isRepresentative: false, groupType: "선택항목", duration: null, durationType: null, residency: "ALL" },
        { name: "석물 해체 및 재조립", price: 880000, feeType: "USAGE", grade: "작업 1건 기준", note: "기존 훼손되거나 이동해야 하는 석물을 해체 후 다시 세우는 인건비", isRepresentative: false, groupType: "선택항목", duration: null, durationType: null, residency: "ALL" },
        { name: "석물 준중보수", price: 220000, feeType: "USAGE", grade: "작업 1건 기준", note: "중간 정도의 석물 파손 및 보수 수리 비용", isRepresentative: false, groupType: "선택항목", duration: null, durationType: null, residency: "ALL" },
        { name: "석물 경보수", price: 88000, feeType: "USAGE", grade: "작업 1건 기준", note: "가벼운 스크래치나 석물 어긋남 수리 비용", isRepresentative: false, groupType: "선택항목", duration: null, durationType: null, residency: "ALL" }
    ];

    // 공통 항목 (묘지, 관리비)
    // 1. 매장묘 탭
    newStandardizedPrices.push({
        serviceType: "BURIAL", // 매장묘 탭에 넣음
        subType: "매장묘",
        unit: "원",
        rows: [
            {
                name: "묘지 사용료",
                price: 332900,
                feeType: "USAGE",
                grade: "1㎡ 면적 기준",
                note: "실제 분양받는 묘지 면적에 따라 곱하여 산정됩니다 (예: 1평 = 약 3.3㎡)",
                isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL"
            },
            {
                name: "연간 관리비",
                price: 7000,
                feeType: "MAINTENANCE",
                grade: "1㎡당 1년 기준",
                note: "분양 면적에 비례하여 산정되며, 묘역 전체 조경 및 유지보수에 사용됩니다",
                isRepresentative: false, groupType: null, duration: 1, durationType: "YEAR", residency: "ALL"
            },
            {
                name: "[필수] 매장 안장 작업비",
                price: 1500000,
                feeType: "USAGE",
                grade: "안장 1회 기준액",
                note: "고인분을 관째로 흙 속에 매장할 때 발생하는 파묘 및 하관 인건비",
                isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL"
            },
            { name: "개장 작업비 (단장묘)", price: 1880000, feeType: "USAGE", grade: "묘지 이전 1회 기준", note: "기존 묘를 파묘하여 다른 곳이나 화장장으로 모실 때의 비용", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "개장 작업비 (합장묘)", price: 2300000, feeType: "USAGE", grade: "묘지 이전 1회 기준", note: "기존 부부/합장묘를 파묘하여 다른 곳이나 화장장으로 모실 때의 비용", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" }
        ]
    });

    // 2. 봉안묘 탭
    newStandardizedPrices.push({
        serviceType: "BURIAL", // 4개 탭 한방에 보여주기위해 BURIAL로 통합
        subType: "봉안묘",
        unit: "원",
        rows: [
            {
                name: "묘지 사용료",
                price: 332900,
                feeType: "USAGE",
                grade: "1㎡ 면적 기준",
                note: "실제 분양받는 묘지 면적에 따라 곱하여 산정됩니다 (예: 1평 = 약 3.3㎡)",
                isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL"
            },
            {
                name: "연간 관리비",
                price: 7000,
                feeType: "MAINTENANCE",
                grade: "1㎡당 1년 기준",
                note: "분양 면적에 비례하여 산정되며, 묘역 전체 조경 및 유지보수에 사용됩니다",
                isRepresentative: false, groupType: null, duration: 1, durationType: "YEAR", residency: "ALL"
            },
            {
                name: "[필수] 봉안 안장 작업비",
                price: 250000,
                feeType: "USAGE",
                grade: "안장 1회 기준액",
                note: "화장된 유골함을 다 지어진 석실(돌집) 안에 넣고 안치하는 인건비",
                isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL"
            }
        ]
    });

    // 3. 석물(필수 택1)
    newStandardizedPrices.push({
        serviceType: "BURIAL",
        subType: "석물 (필수 택1)",
        unit: "원",
        rows: createStoneRows()
    });

    // 4. 선택항목
    newStandardizedPrices.push({
        serviceType: "BURIAL",
        subType: "선택 항목",
        unit: "원",
        rows: optionalRows
    });

    facility.priceInfo.standardizedPrices = newStandardizedPrices;

    // Remove legacy properties
    if (facility.priceInfo.priceTable) {
        delete facility.priceInfo.priceTable;
    }

    facilitiesData[facilityIdx] = facility;
    fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2));
    console.log('✅ Local facilities.json updated for park-0011');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: facility.priceInfo })
        .eq('id', 'park-0011');

    if (error) {
        console.error('❌ Error updating Supabase:', error);
        return;
    }

    console.log('✨ park-0011 리모델링 완료! ✨\n');
}

remodelPark0011().catch(console.error);
