const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PDF_DIR = path.join(__dirname, '..', 'archive5');
const OUTPUT_DIR = path.join(__dirname, '..', 'archive5_images');

async function convertPdfToImage(pdfPath, outputPath) {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Load PDF
    await page.goto(`file://${pdfPath}`);

    // Wait for PDF to load
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({
        path: outputPath,
        fullPage: true,
        type: 'png'
    });

    await browser.close();
}

async function convertAllPdfs() {
    try {
        // Create output directory
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        // Get all PDF files
        const files = fs.readdirSync(PDF_DIR).filter(file => file.endsWith('.pdf'));
        console.log(`Found ${files.length} PDF files to convert`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const pdfPath = path.join(PDF_DIR, file);
            const baseName = path.basename(file, '.pdf');
            const outputPath = path.join(OUTPUT_DIR, `${baseName}.png`);

            try {
                console.log(`[${i + 1}/${files.length}] Converting: ${file}`);
                await convertPdfToImage(pdfPath, outputPath);
                successCount++;
                console.log(`  ✅ Success`);
            } catch (error) {
                errorCount++;
                console.error(`  ❌ Error:`, error.message);
            }

            // Progress update every 50 files
            if ((i + 1) % 50 === 0) {
                console.log(`\n📊 Progress: ${i + 1}/${files.length} (${successCount} success, ${errorCount} errors)\n`);
            }
        }

        console.log('\n=================================');
        console.log('✅ Conversion complete!');
        console.log(`Total: ${files.length}`);
        console.log(`Success: ${successCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log('=================================');

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

convertAllPdfs();
