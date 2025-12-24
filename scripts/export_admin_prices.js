const XLSX = require('xlsx');
const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf-8'));

const allRows = [];

facilities.forEach(f => {
    if (!f.priceInfo?.priceTable) return;

    // 시설의 1뎁스 (시설 카테고리)
    const facilityCategory = f.category || '미분류';

    Object.entries(f.priceInfo.priceTable).forEach(([priceCategory, catData]) => {
        const rows = catData.rows || [];

        // 2뎁스: priceTable의 키값 (봉안당, 봉안담, 봉안묘, 평장묘 등)
        rows.forEach(row => {
            allRows.push({
                '시설ID': f.id,
                '시설명': f.name,
                '시설분류': facilityCategory,
                '2뎁스(유형)': priceCategory,  // 봉안당, 봉안담, 봉안묘, 평장묘 등
                '상품명': row.name || '',
                '세부정보': row.grade || '',
                '가격': row.price || 0,
                '항목수': rows.length
            });
        });
    });
});

// 시트1: 전체 데이터
const ws1 = XLSX.utils.json_to_sheet(allRows);

// 시트2: 2뎁스(유형)별 요약
const depthStats = {};
allRows.forEach(r => {
    const key = r['2뎁스(유형)'];
    if (!depthStats[key]) {
        depthStats[key] = { count: 0, facilities: new Set() };
    }
    depthStats[key].count++;
    depthStats[key].facilities.add(r['시설ID']);
});

const summaryRows = Object.entries(depthStats).map(([cat, data]) => ({
    '2뎁스(유형)': cat,
    '상품수': data.count,
    '시설수': data.facilities.size
})).sort((a, b) => b['상품수'] - a['상품수']);

const ws2 = XLSX.utils.json_to_sheet(summaryRows);

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws1, '전체가격');
XLSX.utils.book_append_sheet(wb, ws2, '유형별요약');
XLSX.writeFile(wb, 'admin_prices_by_type.xlsx');

console.log('✅ 저장완료: admin_prices_by_type.xlsx');
console.log(`📊 총 ${allRows.length}개 가격 항목\n`);

console.log('📁 2뎁스(유형)별 현황:');
summaryRows.forEach(r => {
    console.log(`   ${r['2뎁스(유형)']}: ${r['상품수']}개 (${r['시설수']}개 시설)`);
});
