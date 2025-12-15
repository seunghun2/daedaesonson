const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'archive/34.삼척시추모공원 묘지 제1단지/34.삼척시추모공원 묘지 제1단지_price_info.pdf';

const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function (data) {
    console.log("PDF TEXT CONTENT:\n");
    console.log(data.text);
}).catch(err => {
    console.error("PDF Read Error:", err);
});
