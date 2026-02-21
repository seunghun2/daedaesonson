const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function remodelPark0009() {
    console.log('\n🚀 [park-0009] 재단법인선산공원묘원 리모델링 시작...');

    const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
    const facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    const facilityIdx = facilitiesData.findIndex(f => f.id === 'park-0009');
    if (facilityIdx === -1) {
        console.error('❌ park-0009 not found');
        return;
    }

    const facility = facilitiesData[facilityIdx];

    // ============================================================
    // 핵심 원칙: 이름(name)만 봐도 뭔지 바로 알 수 있게!
    // grade는 보조설명, note는 주의사항
    // ============================================================

    const newStandardizedPrices = [];

    // ─── 1. 매장묘 ───
    newStandardizedPrices.push({
        serviceType: "BURIAL",
        subType: "매장묘",
        unit: "원",
        rows: [
            // 사용료: 이름에 등급 직접 표시
            { name: "묘지사용료 (기본형)", price: 1500000, feeType: "USAGE", grade: "영구사용계약", note: "", isRepresentative: true, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "묘지사용료 (상위 묘역 10%)", price: 2500000, feeType: "USAGE", grade: "영구사용계약", note: "", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "묘지사용료 (상위 묘역 7%)", price: 3000000, feeType: "USAGE", grade: "영구사용계약", note: "", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "묘지사용료 (상위 묘역 3%)", price: 5000000, feeType: "USAGE", grade: "영구사용계약", note: "", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            // 관리비: 년납/영구납 구분 (feeType MAINTENANCE는 그룹핑 시 하단 분리됨)
            { name: "관리비 (1년납, 1평당)", price: 13000, feeType: "MAINTENANCE", grade: "", note: "", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "관리비 (영구납, 1평당)", price: 780000, feeType: "MAINTENANCE", grade: "60년납 기준", note: "", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            // 설치비: 평수 직접 표시 (USAGE로 올려서 메인 항목과 나란히 표출)
            { name: "[필수] 분묘설치비 (3평)", price: 1300000, feeType: "USAGE", grade: "", note: "합장시 500,000원 추가", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "[필수] 분묘설치비 (4평)", price: 1500000, feeType: "USAGE", grade: "", note: "합장시 500,000원 추가", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "[필수] 분묘설치비 (5평)", price: 1700000, feeType: "USAGE", grade: "", note: "합장시 500,000원 추가", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
        ]
    });

    // ─── 2. 봉안묘 (야외 납골묘) → BURIAL ───
    newStandardizedPrices.push({
        serviceType: "BURIAL",
        subType: "봉안묘",
        unit: "원",
        rows: [
            { name: "장례비 - 매장식 (1위)", price: 430000, feeType: "USAGE", grade: "", note: "", isRepresentative: true, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "장례비 - 안치식 (1위)", price: 300000, feeType: "USAGE", grade: "", note: "", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "납골묘 석물 (1위용)", price: 1090000, feeType: "USAGE", grade: "", note: "", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "납골묘 석물 (2위용)", price: 2040000, feeType: "USAGE", grade: "", note: "", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "설치공사비 (1위용)", price: 950000, feeType: "USAGE", grade: "", note: "", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "설치공사비 (2위용)", price: 1340000, feeType: "USAGE", grade: "", note: "", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
        ]
    });

    // ─── 3. 자연장 → NATURAL_BURIAL ───
    newStandardizedPrices.push({
        serviceType: "NATURAL_BURIAL",
        subType: "자연장",
        unit: "원",
        rows: [
            { name: "화초장 (1위)", price: 1200000, feeType: "USAGE", grade: "", note: "잔디를 10주 포함", isRepresentative: true, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "잔디장 (1위)", price: 1000000, feeType: "USAGE", grade: "", note: "", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
            { name: "산골장 (1위)", price: 600000, feeType: "USAGE", grade: "", note: "", isRepresentative: false, groupType: null, duration: null, durationType: null, residency: "ALL" },
        ]
    });

    // ─── 4. 봉안당 (실내 납골당) → BONGSAN ───
    newStandardizedPrices.push({
        serviceType: "BONGSAN",
        subType: "봉안당",
        unit: "원",
        rows: [
            { name: "납골당 사용료 (유연고, 30년)", price: 1000000, feeType: "USAGE", grade: "일반 가족단 정식 안치계약", note: "", isRepresentative: true, groupType: null, duration: 30, durationType: "YEAR", residency: "ALL" },
            { name: "납골당 사용료 (무연고, 10년)", price: 300000, feeType: "USAGE", grade: "무명묘 유골 10년 임시보관 전용", note: "", isRepresentative: false, groupType: null, duration: 10, durationType: "YEAR", residency: "ALL" },
        ]
    });

    // ─── 5. 선택항목 (석물) → BURIAL ───
    newStandardizedPrices.push({
        serviceType: "BURIAL",
        subType: "선택항목 (석물)",
        unit: "원",
        rows: [
            // 세트 & 둘레석
            { name: "기본형 세트", price: 1000000, feeType: "USAGE", grade: "비석+상석+향로석+화병", note: "", isRepresentative: true, groupType: "세트 & 둘레석", duration: null, durationType: null, residency: "ALL" },
            { name: "A형 둘레석 (단분형)", price: 2300000, feeType: "USAGE", grade: "영주석, 수연마", note: "", isRepresentative: false, groupType: "세트 & 둘레석", duration: null, durationType: null, residency: "ALL" },
            { name: "A형 둘레석 (합장형)", price: 2500000, feeType: "USAGE", grade: "영주석, 수연마", note: "", isRepresentative: false, groupType: "세트 & 둘레석", duration: null, durationType: null, residency: "ALL" },
            { name: "B형 둘레석", price: 1500000, feeType: "USAGE", grade: "영주석, 수연마", note: "", isRepresentative: false, groupType: "세트 & 둘레석", duration: null, durationType: null, residency: "ALL" },
            { name: "C형 둘레석", price: 1300000, feeType: "USAGE", grade: "영주석, 수연마", note: "", isRepresentative: false, groupType: "세트 & 둘레석", duration: null, durationType: null, residency: "ALL" },
            // 개별 석물
            { name: "상석 (90cm)", price: 1000000, feeType: "USAGE", grade: "영주석, 수연마, 고급향로석", note: "", isRepresentative: false, groupType: "개별 석물", duration: null, durationType: null, residency: "ALL" },
            { name: "비석 (90cm)", price: 600000, feeType: "USAGE", grade: "오석, 수연마", note: "", isRepresentative: false, groupType: "개별 석물", duration: null, durationType: null, residency: "ALL" },
            { name: "석등 (1쌍)", price: 1000000, feeType: "USAGE", grade: "치등롱, 영주석, 수연마", note: "", isRepresentative: false, groupType: "개별 석물", duration: null, durationType: null, residency: "ALL" },
            { name: "경계석 (1M)", price: 75000, feeType: "USAGE", grade: "영주석, 무광", note: "", isRepresentative: false, groupType: "개별 석물", duration: null, durationType: null, residency: "ALL" },
            { name: "화병 (고급형)", price: 100000, feeType: "USAGE", grade: "수연마", note: "", isRepresentative: false, groupType: "개별 석물", duration: null, durationType: null, residency: "ALL" },
            { name: "해미석 (1Kg)", price: 35000, feeType: "USAGE", grade: "", note: "", isRepresentative: false, groupType: "개별 석물", duration: null, durationType: null, residency: "ALL" },
            // 와비 & 각자비
            { name: "와비 中 (45cm)", price: 500000, feeType: "USAGE", grade: "오석, 대석포함", note: "", isRepresentative: false, groupType: "기타", duration: null, durationType: null, residency: "ALL" },
            { name: "와비 大 (60cm)", price: 700000, feeType: "USAGE", grade: "오석, 대석포함", note: "", isRepresentative: false, groupType: "기타", duration: null, durationType: null, residency: "ALL" },
            { name: "각자비", price: 80000, feeType: "USAGE", grade: "", note: "추가시 별도", isRepresentative: false, groupType: "기타", duration: null, durationType: null, residency: "ALL" },
        ]
    });

    // Save
    facility.priceInfo.standardizedPrices = newStandardizedPrices;
    facilitiesData[facilityIdx] = facility;

    fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2));
    console.log('✅ Local facilities.json updated for park-0009');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: facility.priceInfo })
        .eq('id', 'park-0009');

    if (error) {
        console.error('❌ Error updating Supabase:', error);
        return;
    }

    console.log('✨ park-0009 리모델링 완료! ✨\n');
}

remodelPark0009().catch(console.error);
