const XLSX = require('xlsx');
const path = require('path');

function checkExcel(filename) {
    const filePath = path.join(__dirname, 'facility_data', filename);
    console.log(`Checking file: ${filePath}`);
    try {
        const wb = XLSX.readFile(filePath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws); // header:1 제거해서 객체 배열로
        if (data.length >= 505) {
            console.log('Row 500:', data[500]);
            console.log('Row 501:', data[501]);
            console.log('Row 502:', data[502]);
        }

        // Count empty capacity
        let emptyCount = 0;
        data.forEach(row => {
            if (!row['총매장능력']) emptyCount++;
        });
        console.log(`Total rows: ${data.length}, Empty capacity: ${emptyCount}`);
    } catch (e) {
        console.error('Error reading file:', e.message);
    }
    console.log('---');
}

checkExcel('facilities_info.xlsx');
checkExcel('facilities_info_2025-12-12.xlsx');
