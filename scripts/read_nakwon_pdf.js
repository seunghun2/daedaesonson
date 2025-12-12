const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = 'archive/1.(재)낙원추모공원/1.(재)낙원추모공원_price_info.pdf';

(async () => {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);

    console.log('=== 낙원추모공원 PDF 전체 텍스트 ===\n');
    console.log(data.text);
    console.log('\n=== 끝 ===');
})();
