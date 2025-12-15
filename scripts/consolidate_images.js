const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const TARGET_DIR = path.join(process.cwd(), 'FLATTENED_IMAGES');
const SOURCE_DIRS = ['archive', 'archive2', 'archive3'];

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR);
}

async function main() {
    let totalFiles = 0;
    let processedFolders = 0;

    console.log('🚀 Starting Image Consolidation with Optimization (Limit 1MB)...');

    for (const dirName of SOURCE_DIRS) {
        const rootDir = path.join(process.cwd(), dirName);
        if (!fs.existsSync(rootDir)) {
            console.log(`Skipping missing directory: ${dirName}`);
            continue;
        }

        const entries = fs.readdirSync(rootDir, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            if (entry.name.includes('장례식장')) continue; // Skip Funeral Homes

            const photosDir = path.join(rootDir, entry.name, 'photos');
            if (fs.existsSync(photosDir)) {
                try {
                    const files = fs.readdirSync(photosDir)
                        .filter(f => /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(f));

                    if (files.length > 0) {
                        for (let idx = 0; idx < files.length; idx++) {
                            const file = files[idx];
                            const ext = path.extname(file).toLowerCase();
                            // Format: "FolderName_imgIndex.ext"
                            // Example: "642.Name_img1.jpg"
                            const newFileName = `${entry.name}_img${idx + 1}${ext}`;
                            const sourcePath = path.join(photosDir, file);
                            const targetPath = path.join(TARGET_DIR, newFileName);

                            try {
                                const stat = fs.statSync(sourcePath);
                                if (stat.size > 100 * 1024) { // > 100KB
                                    // Optimization needed (Aggressive)
                                    // Resize to 1000px width, Quality 60
                                    await sharp(sourcePath)
                                        .resize({ width: 1000, withoutEnlargement: true })
                                        .jpeg({ quality: 60 })
                                        .toFile(targetPath);
                                } else {
                                    fs.copyFileSync(sourcePath, targetPath);
                                }
                                totalFiles++;
                            } catch (err) {
                                console.error(`  Error processing file ${file}:`, err.message);
                            }
                        }
                        processedFolders++;
                    }
                } catch (e) {
                    console.error(`Error processing folder ${entry.name}:`, e.message);
                }
            }
        }
    }

    console.log('-----------------------------------');
    console.log('✅ Consolidation Complete!');
    console.log(`Processed Folders: ${processedFolders}`);
    console.log(`Total Images Copied: ${totalFiles}`);
    console.log(`Location: ${TARGET_DIR}`);
}

main();
