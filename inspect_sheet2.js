const xlsx = require('xlsx');

try {
    const filename = 'park_price_master.xlsx';
    const wb = xlsx.readFile(filename);

    // 두 번째 시트 (Full Text) 확인
    const sheetName = wb.SheetNames[1]; // Index 1
    console.log(`Reading Sheet: ${sheetName}`);

    const ws = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(ws).slice(0, 3); // 첫 3개 행만

    console.log(JSON.stringify(data, null, 2));

} catch (e) {
    console.error(e);
}
