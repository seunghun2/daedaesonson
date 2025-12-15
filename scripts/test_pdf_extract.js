const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const PDF_PATH = path.join(__dirname, '../archive5/171.웅양공설공원묘지_price_info.pdf');

if (fs.existsSync(PDF_PATH)) {
    let dataBuffer = fs.readFileSync(PDF_PATH);
    pdf(dataBuffer).then(function (data) {
        console.log("✅ PDF Text Extracted Successfully!");
        console.log("--- START TEXT ---");
        console.log(data.text);
        console.log("--- END TEXT ---");
    }).catch(err => {
        console.error("❌ Failed to parse PDF:", err);
    });
} else {
    console.error("❌ File not found:", PDF_PATH);
}
