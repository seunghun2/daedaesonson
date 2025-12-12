const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const TEST_PDF = path.join(__dirname, '../archive/1.(재)낙원추모공원/1.(재)낙원추모공원_price_info.pdf');

(async () => {
    try {
        if (!fs.existsSync(TEST_PDF)) {
            console.log("Test PDF not found at:", TEST_PDF);
            return;
        }

        console.log("Attempting to parse PDF...");
        const dataBuffer = fs.readFileSync(TEST_PDF);

        // Debugging the import
        console.log("Type of pdf:", typeof pdf);
        let parser = pdf;
        if (typeof pdf !== 'function') {
            console.log("Keys of pdf:", Object.keys(pdf));
            if (pdf.default && typeof pdf.default === 'function') {
                console.log("Using pdf.default");
                parser = pdf.default;
            } else if (pdf.PDFParse && typeof pdf.PDFParse === 'function') {
                console.log("Using pdf.PDFParse");
                parser = pdf.PDFParse;
            }
        }

        console.log("Using parser of type:", typeof parser);
        const data = await parser(dataBuffer);
        console.log("Success!");
        console.log("Text length:", data.text.length);
        console.log("Preview:", data.text.substring(0, 100));

    } catch (e) {
        console.error("Error parsing PDF:", e);
    }
})();
