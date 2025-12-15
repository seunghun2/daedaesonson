const fs = require('fs');
const path = require('path');
const { pdfToPng } = require('pdf-to-png-converter');

const PDF_DIR = path.join(__dirname, '..', 'archive5');
const OUTPUT_DIR = path.join(__dirname, '..', 'archive5_images');

async function convertPdfToImages() {
    try {
        // Create output directory if it doesn't exist
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

            try {
                console.log(`[${i + 1}/${files.length}] Converting: ${file}`);

                // Convert PDF to PNG
                const pngPages = await pdfToPng(pdfPath, {
                    disableFontFace: false,
                    useSystemFonts: false,
                    viewportScale: 2.0,
                    outputFolder: OUTPUT_DIR,
                    outputFileMask: baseName,
                    pdfFilePassword: '',
                    pagesToProcess: [1], // Only convert first page
                });

                if (pngPages && pngPages.length > 0) {
                    // Rename the output file to have proper extension
                    const outputPath = path.join(OUTPUT_DIR, `${baseName}_1.png`);
                    const finalPath = path.join(OUTPUT_DIR, `${baseName}.png`);

                    if (fs.existsSync(outputPath)) {
                        fs.renameSync(outputPath, finalPath);
                    }

                    successCount++;
                    console.log(`  ✅ Success: ${baseName}.png`);
                } else {
                    errorCount++;
                    console.log(`  ❌ Failed: No pages generated`);
                }
            } catch (error) {
                errorCount++;
                console.error(`  ❌ Error converting ${file}:`, error.message);
            }

            // Progress update every 50 files
            if ((i + 1) % 50 === 0) {
                console.log(`\n📊 Progress: ${i + 1}/${files.length} files processed (${successCount} success, ${errorCount} errors)\n`);
            }
        }

        console.log('\n=================================');
        console.log('✅ Conversion complete!');
        console.log(`Total files: ${files.length}`);
        console.log(`Success: ${successCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`Output directory: ${OUTPUT_DIR}`);
        console.log('=================================');

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

convertPdfToImages();
