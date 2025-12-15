const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const { pdfToPng } = require('pdf-to-png-converter'); // devDep에 있음

const PDF_PATH = path.join(__dirname, '../archive5/172.(재)원주공원묘원_price_info.pdf');

async function testOCR() {
    console.log(`🔍 Testing OCR on: ${PDF_PATH}`);

    if (!fs.existsSync(PDF_PATH)) {
        console.error("❌ File not found.");
        return;
    }

    try {
        // 1. Convert PDF to PNG Buffer
        // pdf-to-png-converter returns a list of png objects
        const pngPages = await pdfToPng(PDF_PATH, {
            viewportScale: 2.0, // 화질을 높여야 인식률 상승
            outputFileMask: 'buffer',
            disableFontFace: true,
            useSystemFonts: true,
            verbosityLevel: 0
        });

        if (pngPages.length === 0) {
            console.error("❌ Failed to convert PDF to Image.");
            return;
        }

        console.log("✅ PDF converted to Image. Running OCR...");

        // 2. Run Tesseract OCR on the first page
        const result = await Tesseract.recognize(
            pngPages[0].content, // Buffer
            'kor+eng', // 한글 + 영어
            // { logger: m => console.log(m) } // 진행상황 로그 (너무 많으면 끔)
        );

        console.log("✅ OCR Completed!");
        console.log("--- START OCR TEXT ---");
        console.log(result.data.text);
        console.log("--- END OCR TEXT ---");

    } catch (err) {
        console.error("💥 OCR Failed:", err);
    }
}

testOCR();
