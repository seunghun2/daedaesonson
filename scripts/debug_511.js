const fs = require('fs');
const pdf = require('pdf-parse');

const PDF_PATH = 'archive/511.해인사 고불암무량수전/511.해인사 고불암무량수전_price_info.pdf';

async function main() {
    const dataBuffer = fs.readFileSync(PDF_PATH);
    const pdfData = await pdf(dataBuffer);
    console.log('--- PDF TEXT START ---');
    console.log(pdfData.text);
    console.log('--- PDF TEXT END ---');
}
main();
