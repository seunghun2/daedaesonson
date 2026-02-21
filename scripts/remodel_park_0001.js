const fs = require('fs');

const d = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const fIndex = d.facilities ? d.facilities.findIndex(x => x.id === 'park-0001') : d.findIndex(x => x.id === 'park-0001');
const targetArray = d.facilities ? d.facilities : d;

if (fIndex !== -1) {
    let f = targetArray[fIndex];
    if (f.priceInfo && f.priceInfo.standardizedPrices) {
        // 매장묘 카테고리 이름 및 내용 재구성
        f.priceInfo.standardizedPrices.forEach(g => {
            if (g.serviceType === 'BURIAL') {
                if (g.subType === '매장묘' || g.subType === '매장묘 (부부 포함)') {
                    g.subType = '매장묘 (부부 포함)';
                    g.rows = [
                        { name: "기본 시설 사용료", price: 3000000, feeType: "USAGE", grade: "1평형 기준", unit: "평/년", residency: "ALL" },
                        { name: "연 관리비", price: 25000, feeType: "MAINTENANCE", grade: "1평형 / 1년 기준", unit: "년", residency: "ALL" },
                        { name: "단장묘 분양 패키지", price: 20275000, feeType: "USAGE", grade: "1구 안치 (최초 사용료 포함)", unit: "세트", isRepresentative: true, residency: "ALL" },
                        { name: "합장묘 분양 패키지(기본)", price: 31150000, feeType: "USAGE", grade: "부부 2구 안치", unit: "세트", residency: "ALL" },
                        { name: "합장묘 분양 패키지(고급)", price: 64650000, feeType: "USAGE", grade: "부부 2구 안치 (6평~)", unit: "세트", residency: "ALL" },
                        { name: "사용료 반환 규정", price: 0, feeType: "OTHER", grade: "미사용 후 묘지 반환 시 납부 사용료 전액 환불", unit: "환불", residency: "ALL" },
                        { name: "관리비 반환 규정", price: 0, feeType: "OTHER", grade: "남은 기간 월 단위 계산 환불", unit: "환불", residency: "ALL" }
                    ];
                } else if (g.subType === '가족형' || g.subType === '매장묘 (가족형)') {
                    g.subType = '매장묘 (가족형)';
                } else if (g.subType === '평장묘') {
                    g.subType = '평장묘';
                }
            }
        });

        fs.writeFileSync('data/facilities.json', JSON.stringify(d, null, 2));
        console.log("park-0001 데이터 리뷰 및 수정 완료 (data/facilities.json)");
    }
}
