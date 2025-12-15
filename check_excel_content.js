const xlsx = require('xlsx');

try {
    const workbook = xlsx.readFile('park_price_master.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // 첫 5줄만 JSON으로 변환하여 출력
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 5);

    console.log('Sheet Name:', sheetName);
    console.log('Headers:', data[0]);
    console.log('Sample Data:', data.slice(1));

} catch (error) {
    console.error('Error reading excel file:', error.message);
}
