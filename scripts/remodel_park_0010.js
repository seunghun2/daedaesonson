const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function remodelPark0010() {
    console.log('\n🚀 [park-0010] 재단법인 솥발산공원묘원 리모델링 시작...');

    const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
    const facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    // park-0010 솥발산공원묘원 찾기
    const facilityIdx = facilitiesData.findIndex(f => f.id === 'park-0010');
    if (facilityIdx === -1) {
        console.error('❌ park-0010 not found');
        return;
    }

    const facility = facilitiesData[facilityIdx];

    const newStandardizedPrices = [];

    // ─── 1. 매장묘 ───
    newStandardizedPrices.push({
        serviceType: "BURIAL",
        subType: "매장묘",
        unit: "원",
        rows: [
            // 사용료 & 관리비 & 필수작업비
            { name: "묘지임대사용료 (1평당)", price: 1400000, feeType: "USAGE", grade: "", note: "3.3㎡ 기준", isRepresentative: true, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "관리비 (1년납, 1평당)", price: 20000, feeType: "MAINTENANCE", grade: "년간공동관리비", note: "3.3㎡ 기준", isRepresentative: false, groupType: null, duration: 1, durationType: "YEAR", residency: "ALL" },
            { name: "[필수] 기본 매장작업비", price: 1500000, feeType: "USAGE", grade: "인건비, 봉분설치 등", note: "작업 난이도에 따라 추가 가능", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "[필수] 1.5평형 매장 기본석물비", price: 4250000, feeType: "USAGE", grade: "둘레석, 비석, 상석 외", note: "부가세 별도", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "[필수] 2평형 매장 기본석물비", price: 4500000, feeType: "USAGE", grade: "둘레석, 비석, 상석 외", note: "부가세 별도", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "[필수] 3평형 매장 기본석물비", price: 5500000, feeType: "USAGE", grade: "둘레석, 비석, 상석 외", note: "부가세 별도", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
        ]
    });

    // ─── 2. 평장묘 (평장) ───
    newStandardizedPrices.push({
        serviceType: "BURIAL",
        subType: "평장묘",
        unit: "원",
        rows: [
            { name: "평장 개인형 세트", price: 2900000, feeType: "USAGE", grade: "부속석물일체, 작업비 포함", note: "부가세 포함", isRepresentative: true, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "평장 합장형 세트", price: 3850000, feeType: "USAGE", grade: "부속석물일체, 작업비 포함", note: "부가세 포함", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "[필수] 장례 작업비 (평장/봉안 기본)", price: 500000, feeType: "USAGE", grade: "매장 외 작업비용", note: "작업 난이도에 따라 추가 가능", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
        ]
    });

    // ─── 3. 가족봉안묘 (봉안묘) ───
    newStandardizedPrices.push({
        serviceType: "BURIAL",
        subType: "봉안묘",
        unit: "원",
        rows: [
            { name: "4호 가족봉안묘 (6기형)", price: 12150000, feeType: "USAGE", grade: "석물설치비용 일체", note: "비석, 상석, 향로, 꽃병 세트 (부가세 별도)", isRepresentative: true, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "3호 가족봉안묘 (16기형)", price: 20200000, feeType: "USAGE", grade: "석물설치비용 일체", note: "비석, 상석, 향로, 꽃병 세트 (부가세 별도)", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "2호 가족봉안묘 (20기형)", price: 24300000, feeType: "USAGE", grade: "석물설치비용 일체", note: "비석, 상석, 향로, 꽃병 세트 (부가세 별도)", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "1호 가족봉안묘 (24기형)", price: 35600000, feeType: "USAGE", grade: "석물설치비용 일체", note: "비석, 상석, 향로, 꽃병 세트 (부가세 별도)", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "[필수] 장례 장비대 및 부대비용", price: 1500000, feeType: "USAGE", grade: "매장 외 부대비용", note: "장례형태, 평수에 따라 상이 (부가세 별도)", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
        ]
    });

    // ─── 4. 선택항목 (석물 및 추가작업) ───
    newStandardizedPrices.push({
        serviceType: "BURIAL",
        subType: "선택항목 (석물 및 추가작업)",
        unit: "원",
        rows: [
            // 사각둘레석
            { name: "사각둘레석 2단 (전남 고흥석 A급)", price: 3100000, feeType: "USAGE", grade: "1.5~2.5평형 설치규격", note: "부가세 별도", isRepresentative: false, groupType: "사각 둘레석", duration: null, durationType: null, residency: "ALL" },
            { name: "사각둘레석 3단 (전남 고흥석 A급)", price: 3500000, feeType: "USAGE", grade: "3평 이상 설치규격", note: "부가세 별도", isRepresentative: false, groupType: "사각 둘레석", duration: null, durationType: null, residency: "ALL" },
            { name: "사각둘레석 4단 3면 무궁화 최고급형", price: 11000000, feeType: "USAGE", grade: "전남 고흥석 A급 조각", note: "부가세 별도", isRepresentative: false, groupType: "사각 둘레석", duration: null, durationType: null, residency: "ALL" },
            // 상석
            { name: "고흥석 A급 상석 (2.5자)", price: 300000, feeType: "USAGE", grade: "", note: "부가세 별도", isRepresentative: false, groupType: "상석 (제사상)", duration: null, durationType: null, residency: "ALL" },
            { name: "고흥석 A급 상석 (3.0자)", price: 800000, feeType: "USAGE", grade: "", note: "부가세 별도", isRepresentative: false, groupType: "상석 (제사상)", duration: null, durationType: null, residency: "ALL" },
            { name: "영주석(애석) 상석 (3.0자)", price: 950000, feeType: "USAGE", grade: "", note: "부가세 별도", isRepresentative: false, groupType: "상석 (제사상)", duration: null, durationType: null, residency: "ALL" },
            { name: "오석(중국산) 상석 (3.0자)", price: 1650000, feeType: "USAGE", grade: "", note: "부가세 별도", isRepresentative: false, groupType: "상석 (제사상)", duration: null, durationType: null, residency: "ALL" },
            { name: "혼유, 복석, 받침 세트 (3.0자)", price: 300000, feeType: "USAGE", grade: "부속석물", note: "부가세 별도", isRepresentative: false, groupType: "상석 (제사상)", duration: null, durationType: null, residency: "ALL" },
            // 비석
            { name: "중국산 오비석 (2.5자)", price: 500000, feeType: "USAGE", grade: "각지비 별도", note: "부가세 별도", isRepresentative: false, groupType: "오비석 (비석)", duration: null, durationType: null, residency: "ALL" },
            { name: "중국산 오비석 (3.0자)", price: 900000, feeType: "USAGE", grade: "각지비 별도", note: "부가세 별도", isRepresentative: false, groupType: "오비석 (비석)", duration: null, durationType: null, residency: "ALL" },
            { name: "중국산 오비석 (3.5자)", price: 1300000, feeType: "USAGE", grade: "각지비 별도", note: "부가세 별도", isRepresentative: false, groupType: "오비석 (비석)", duration: null, durationType: null, residency: "ALL" },
            { name: "중국산 오비석 (4.0자)", price: 1900000, feeType: "USAGE", grade: "각지비 별도", note: "부가세 별도", isRepresentative: false, groupType: "오비석 (비석)", duration: null, durationType: null, residency: "ALL" },
            { name: "비석 석각인비 (2.5~3.5자형)", price: 300000, feeType: "USAGE", grade: "고인 1분 기준 기본 각인", note: "4자 이상 별도 견적", isRepresentative: false, groupType: "오비석 (비석)", duration: null, durationType: null, residency: "ALL" },
            // 기타 관리 및 부대작업비용 추가항목
            { name: "묘지사초작업", price: 600000, feeType: "USAGE", grade: "", note: "평수/작업난이도에 따라 상이", isRepresentative: false, groupType: "기타 부대비용 및 추가작업", duration: null, durationType: null, residency: "ALL" },
            { name: "개장정리비 (폐기물처리비)", price: 700000, feeType: "USAGE", grade: "", note: "묘지형태에 따라 40~70만", isRepresentative: false, groupType: "기타 부대비용 및 추가작업", duration: null, durationType: null, residency: "ALL" },
            { name: "추가 봉안료 및 비석각인비", price: 500000, feeType: "USAGE", grade: "", note: "부가세 별도", isRepresentative: false, groupType: "기타 부대비용 및 추가작업", duration: null, durationType: null, residency: "ALL" },
        ]
    });

    // Save properly
    facility.priceInfo.standardizedPrices = newStandardizedPrices;
    facilitiesData[facilityIdx] = facility;

    fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2));
    console.log('✅ Local facilities.json updated for park-0010');

    // Update Supabase
    const { error } = await supabase
        .from('Facility')
        .update({ pricing: facility.priceInfo })
        .eq('id', 'park-0010');

    if (error) {
        console.error('❌ Error updating Supabase:', error);
        return;
    }

    console.log('✨ park-0010 리모델링 완료! ✨\n');
}

// execute
remodelPark0010().catch(console.error);
