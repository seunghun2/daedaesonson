const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
// const { parse } = require('csv-parse/sync'); // Removed dependency

const prisma = new PrismaClient();
const INPUT_JSON = 'esky_full_renumbered.json';
const CSV_FILES = [
    'data/pricing_enshrinement.csv',
    'data/pricing_cemetery.csv',
    'data/pricing_natural.csv',
    'data/pricing_cremation.csv'
];

// Mapping CSV Name to PriceCategory Name
const FILE_TO_CATEGORY_NAME = {
    'pricing_enshrinement.csv': '봉안시설',
    'pricing_cemetery.csv': '묘지',
    'pricing_natural.csv': '자연장지',
    'pricing_cremation.csv': '화장시설'
};

/* CSV Structure:
ParkID,ParkName,Category,ItemName,Price,RawText
park-0001,"(재)낙원추모공원",기본비용,"묘지사용료 (1평형 기준)",3000000,""
*/

// Helper: Parse CSV Line
function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inQuote = !inQuote;
        } else if (c === ',' && !inQuote) {
            result.push(current);
            current = '';
        } else {
            current += c;
        }
    }
    result.push(current);
    // Remove quotes
    return result.map(col => col.replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
}

async function main() {
    console.log('Start Database Import...');

    // 1. Load Facility Map (rno -> facilitycd)
    console.log('Loading Facility Map...');
    const jsonContent = fs.readFileSync(INPUT_JSON, 'utf-8');
    const facilitiesList = JSON.parse(jsonContent).list || JSON.parse(jsonContent);
    const parkToFacCd = {}; // park-XXXX -> facilitycd (DB ID)
    const parkToMeta = {};  // park-XXXX -> { Name, Address, Lat, Lng }

    facilitiesList.forEach(f => {
        const rnoStr = String(f.rno).padStart(4, '0');
        const parkId = `park-${rnoStr}`;
        parkToFacCd[parkId] = f.facilitycd; // Match DB ID

        // Metadata for creating if missing
        parkToMeta[parkId] = {
            id: f.facilitycd,
            name: f.companyname,
            address: f.fulladdress || '',
            lat: parseFloat(f.latitude) || 0.0,
            lng: parseFloat(f.longitude) || 0.0,
            category: f.type || 'UNKNOWN'
        };
    });

    // 2. Iterate CSV Files
    for (const file of CSV_FILES) {
        if (!fs.existsSync(file)) continue;
        const fileName = path.basename(file);
        const categoryName = FILE_TO_CATEGORY_NAME[fileName];
        console.log(`Processing ${fileName} as category '${categoryName}'...`);

        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        // Group by ParkID
        const grouped = {};

        lines.forEach((line, idx) => {
            if (idx === 0 || !line.trim()) return; // Skip header
            const cols = parseCsvLine(line);
            if (cols.length < 6) return;

            // ParkID,ParkName,Category,ItemName,Price,RawText
            const row = {
                ParkID: cols[0],
                ParkName: cols[1],
                Category: cols[2],
                ItemName: cols[3],
                Price: cols[4],
                RawText: cols[5]
            };

            grouped[row.ParkID] = grouped[row.ParkID] || [];
            grouped[row.ParkID].push(row);
        });

        for (const [parkId, items] of Object.entries(grouped)) {
            const facilityId = parkToFacCd[parkId];
            if (!facilityId) {
                // console.warn(`Skipping ${parkId}: No mapped facilitycd`);
                continue;
            }

            // A. Ensure Facility Exists
            try {
                // Check exist?
                const meta = parkToMeta[parkId];
                await prisma.facility.upsert({
                    where: { id: facilityId },
                    update: {}, // Don't overwrite existing user data if any
                    create: {
                        id: meta.id,
                        name: meta.name,
                        address: meta.address,
                        lat: meta.lat,
                        lng: meta.lng,
                        category: meta.category,
                        description: `Imported from E-Sky (ID: ${meta.id})`,
                        minPrice: 0n,
                        maxPrice: 0n
                    }
                });
            } catch (e) {
                console.error(`Failed to upsert facility ${parkId} (${facilityId}): ${e.message}`);
                continue;
            }

            // B. Ensure PriceCategory Exists
            // "봉안시설" for this Facility
            let priceCategory;
            try {
                // Use findFirst? Or upsert with unique constraint?
                // PriceCategory does not have a UNIQUE(facilityId, name). 
                // So we check first.
                priceCategory = await prisma.priceCategory.findFirst({
                    where: {
                        facilityId: facilityId,
                        name: categoryName
                    }
                });

                if (!priceCategory) {
                    priceCategory = await prisma.priceCategory.create({
                        data: {
                            facilityId,
                            name: categoryName,
                            normalizedName: categoryName
                        }
                    });
                } else {
                    // Start fresh for this category?
                    // Delete existing items in this category to avoid duplication on re-run
                    await prisma.priceItem.deleteMany({
                        where: { categoryId: priceCategory.id }
                    });
                }
            } catch (e) {
                console.error(`Failed to init category for ${parkId}: ${e.message}`);
                continue;
            }

            // C. Insert Items
            const priceItemsData = items.map(item => {
                // Map fields
                // item.Category e.g. "안치단" -> groupType
                // item.ItemName -> itemName
                // item.Price -> price (BigInt)
                // item.RawText -> description

                // Parse Price as BigInt
                let priceVal = 0n;
                try {
                    priceVal = BigInt(item.Price || 0);
                } catch (e) { console.error(`Bad Price: ${item.Price}`); }

                return {
                    categoryId: priceCategory.id,
                    facilityId: facilityId,
                    itemName: item.ItemName,
                    price: priceVal,
                    // raw: item.RawText, // Keep Raw empty or map?
                    description: item.RawText, // Map to description
                    groupType: item.Category, // "안치단"
                    unit: '1기', // Default, maybe parse from name if desired
                    normalizedItemType: item.Category // Use same for now
                };
            });

            if (priceItemsData.length > 0) {
                // Use concurrent Create instead of CreateMany for SQLite compatibility/logging
                const CHUNK_SIZE = 50; // SQLite params limit?
                for (let i = 0; i < priceItemsData.length; i += CHUNK_SIZE) {
                    const chunk = priceItemsData.slice(i, i + CHUNK_SIZE);
                    await Promise.all(chunk.map(data => prisma.priceItem.create({ data })));
                }
            }
        }
        console.log(`Finished ${fileName}`);
    }

    console.log('Database Import Complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
