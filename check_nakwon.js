const xlsx = require('xlsx');

// 엑셀에서 낙원추모공원 데이터만 뽑아서 보여주는 스크립트
try {
    const filename = 'park_price_master.xlsx';
    console.log(`Reading ${filename}...`);
    const wb = xlsx.readFile(filename);

    // 시트 1: 가격 정보
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(ws);

    console.log('\n--- (재)낙원추모공원 Price Items ---');

    const targetName = '(재)낙원추모공원';
    const items = rows.filter(row => row.FacilityName === targetName);

    if (items.length === 0) {
        console.log('데이터를 찾을 수 없습니다.');
    } else {
        items.forEach((item, idx) => {
            console.log(`[${idx + 1}] ${item.ExtractedName} : ${item.ExtractedPrice} (Raw: ${item.RawLine})`);
        });
    }

} catch (e) {
    console.error('Error:', e);
}
