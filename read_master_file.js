const XLSX = require('xlsx');
const path = require('path');

// Suppress codepage error if possible or just try-catch
try {
    const filename = 'park_price_master.xlsx';
    const filePath = path.join(__dirname, filename);
    console.log(`Checking file: ${filePath}`);

    const wb = XLSX.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    // Header 확인 (첫 줄)
    const headers = XLSX.utils.sheet_to_json(ws, { header: 1 })[0];
    console.log('Headers:', headers);

    // 데이터 일부 확인
    const data = XLSX.utils.sheet_to_json(ws);
    console.log(`Total rows: ${data.length}`);
    if (data.length > 0) {
        console.log('First row sample:', data[0]);
    }
} catch (e) {
    console.error('Error reading file:', e);
}
