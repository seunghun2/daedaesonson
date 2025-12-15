const xlsx = require('xlsx');

try {
    const filename = 'park_price_master.xlsx';
    console.log(`Reading ${filename}...`);
    const wb = xlsx.readFile(filename);

    console.log('Sheet Names:', wb.SheetNames);

    wb.SheetNames.forEach((name, index) => {
        const ws = wb.Sheets[name];
        const range = xlsx.utils.decode_range(ws['!ref']);
        console.log(`Sheet ${index + 1} [${name}]: ${range.e.r + 1} rows, ${range.e.c + 1} columns`);

        // 첫 줄(헤더) 확인
        const headers = xlsx.utils.sheet_to_json(ws, { header: 1 })[0];
        console.log(`  Headers: ${JSON.stringify(headers)}`);
    });

} catch (e) {
    console.error('Error:', e);
}
