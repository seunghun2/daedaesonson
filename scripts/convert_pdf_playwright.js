const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PDF_DIR = path.join(__dirname, '..', 'archive5');
const OUTPUT_DIR = path.join(__dirname, '..', 'archive5_images');

async function convertAllPdfs() {
    try {
        // Create output directory
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        // Get all PDF files
        const files = fs.readdirSync(PDF_DIR).filter(file => file.endsWith('.pdf'));
        console.log(`Found ${files.length} PDF files to convert\n`);

        const browser = await chromium.launch({ headless: true });

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const pdfPath = path.join(PDF_DIR, file);
            const baseName = path.basename(file, '.pdf');
            const outputPath = path.join(OUTPUT_DIR, `${baseName}.png`);

            try {
                console.log(`[${i + 1}/${files.length}] Converting: ${file}`);

                const page = await browser.newPage();
                await page.goto(`file://${pdfPath}`, { waitUntil: 'networkidle' });
                await page.waitForTimeout(500);

                // Take screenshot of first page
                await page.screenshot({
                    path: outputPath,
                    fullPage: false,
                    type: 'png',
                    clip: { x: 0, y: 0, width: 1200, height: 1600 }
                });

                await page.close();
                successCount++;
                console.log(`  ✅ Saved: ${baseName}.png`);

            } catch (error) {
                errorCount++;
                console.error(`  ❌ Error: ${error.message}`);
            }

            // Progress update every 100 files
            if ((i + 1) % 100 === 0) {
                console.log(`\n📊 Progress: ${i + 1}/${files.length} (Success: ${successCount}, Errors: ${errorCount})\n`);
            }
        }

        await browser.close();

        console.log('\n=================================');
        console.log('✅ Conversion complete!');
        console.log(`Total: ${files.length}`);
        console.log(`Success: ${successCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`Output: ${OUTPUT_DIR}`);
        console.log('=================================');

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

convertAllPdfs();
