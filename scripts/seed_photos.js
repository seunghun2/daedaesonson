const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const INPUT_JSON = 'esky_full_renumbered.json';
const ARCHIVE_DIR = 'archive';
const PUBLIC_IMG_DIR = 'public/images/facilities';

async function main() {
    console.log('Start Photo Import...');

    // 1. Load Facility Map (rno -> facilitycd)
    console.log('Loading Facility Map...');
    const jsonContent = fs.readFileSync(INPUT_JSON, 'utf-8');
    const facilitiesList = JSON.parse(jsonContent).list || JSON.parse(jsonContent);
    const rnoToFacCd = {}; // rno -> facilitycd (1 -> 1234567890)

    facilitiesList.forEach(f => {
        rnoToFacCd[f.rno] = f.facilitycd;
    });

    // 1.5. Clean up existing images (User Request)
    console.log('Cleaning up existing public images...');
    if (fs.existsSync(PUBLIC_IMG_DIR)) {
        fs.rmSync(PUBLIC_IMG_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(PUBLIC_IMG_DIR, { recursive: true });

    // 2. Iterate Archive
    const archiveFolders = fs.readdirSync(ARCHIVE_DIR);
    let successCount = 0;
    let photoCount = 0;

    for (const folder of archiveFolders) {
        // Folder Name: "191.양구군공설묘지"
        const match = folder.match(/^(\d+)\./);
        if (!match) continue;

        const rno = parseInt(match[1]);
        const facilityId = rnoToFacCd[rno];

        if (!facilityId) {
            // console.warn(`Skipping ${folder}: No facilitycd for rno ${rno}`);
            continue;
        }

        const sourcePhotoDir = path.join(ARCHIVE_DIR, folder, 'photos');
        if (!fs.existsSync(sourcePhotoDir)) continue;

        const files = fs.readdirSync(sourcePhotoDir);
        if (files.length === 0) continue;

        // Destination: public/images/facilities/{facilityId}
        const destDir = path.join(PUBLIC_IMG_DIR, facilityId);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        const validImages = [];

        for (const file of files) {
            if (file.toLowerCase().endsWith('.jpg') ||
                file.toLowerCase().endsWith('.jpeg') ||
                file.toLowerCase().endsWith('.png') ||
                file.toLowerCase().endsWith('.webp')) {

                const srcPath = path.join(sourcePhotoDir, file);
                const destPath = path.join(destDir, file);

                fs.copyFileSync(srcPath, destPath);
                validImages.push(`/images/facilities/${facilityId}/${file}`);
                photoCount++;
            }
        }

        if (validImages.length > 0) {
            const imagesStr = validImages.join(',');

            try {
                const existingFacility = await prisma.facility.findUnique({
                    where: { id: facilityId }
                });

                if (!existingFacility) {
                    console.warn(`Skipping update for facility ${facilityId} (from folder "${folder}"): Not found in DB.`);
                    continue; // Skip to the next folder
                }

                await prisma.facility.update({
                    where: { id: facilityId },
                    data: {
                        images: imagesStr
                    }
                });
                successCount++;
                // console.log(`Updated ${facilityId} with ${validImages.length} photos`);
            } catch (e) {
                console.error(`Failed to update DB for ${facilityId} (from folder "${folder}"): ${e.message}`);
            }
        }
    }

    console.log(`Photo Import Complete!`);
    console.log(`Facilities Updated: ${successCount}`);
    console.log(`Photos Copied: ${photoCount}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
