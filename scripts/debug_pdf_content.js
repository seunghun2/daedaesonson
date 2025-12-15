const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

(async () => {
    // 1.(재)낙원추모공원 PDF Path
    const filePath = '/Users/el/Desktop/daedaesonson/archive/1.(재)낙원추모공원/1.(재)낙원추모공원_price_info.pdf';

    if (!fs.existsSync(filePath)) {
        console.log('PDF 파일이 없습니다:', filePath);
        return;
    }

    console.log('Testing PDF:', filePath);
    const dataBuffer = fs.readFileSync(filePath);
    try {
        const data = await pdf(dataBuffer);
        console.log('PDF 텍스트 길이:', data.text.length);
        console.log('--- 텍스트 내용 (일부) ---');
        console.log(data.text.substring(0, 5000)); // 처음 5000자 출력
        console.log('-------------------------');
    } catch (e) {
        console.error('PDF 읽기 실패:', e);
    }
})();
