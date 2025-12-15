const fs = require('fs');
const pdf = require('pdf-parse');

(async () => {
    const filePath = 'archive/15.(재)이화공원묘원/15.(재)이화공원묘원_price_info.pdf';
    if (!fs.existsSync(filePath)) {
        console.log('PDF 파일이 없습니다.');
        return;
    }

    const dataBuffer = fs.readFileSync(filePath);
    try {
        const data = await pdf(dataBuffer);
        console.log('PDF 텍스트 길이:', data.text.length);
        console.log('--- 텍스트 내용 일부 ---');
        console.log(data.text);
        console.log('-------------------------');
    } catch (e) {
        console.error('PDF 읽기 실패:', e);
    }
})();
