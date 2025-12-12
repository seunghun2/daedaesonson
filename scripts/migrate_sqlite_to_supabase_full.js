const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const db = new Database('prisma/dev.db');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3'; // Service Role Key required for bypassing RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function convertBigInt(obj) {
    const newObj = { ...obj };
    for (const key in newObj) {
        // BigInt handling
        if (typeof newObj[key] === 'bigint') {
            newObj[key] = Number(newObj[key]); // Safe for KRW prices
        }

        // Date handling (SQLite stores ms timestamp, Postgres needs ISO)
        if ((key === 'createdAt' || key === 'updatedAt') && typeof newObj[key] === 'number') {
            // Check if it looks like timestamp (older dates might be smaller numbers, but recently created ones are large)
            if (newObj[key] > 1000000000000) {
                newObj[key] = new Date(newObj[key]).toISOString();
            } else if (newObj[key] > 1000000000) {
                // seconds? (SQLite default is usually ms via Date.now())
                newObj[key] = new Date(newObj[key] * 1000).toISOString();
            }
        }
        // String date handling (if SQLite stored string "1765...")
        if ((key === 'createdAt' || key === 'updatedAt') && typeof newObj[key] === 'string' && /^\d+$/.test(newObj[key])) {
            newObj[key] = new Date(parseInt(newObj[key])).toISOString();
        }
        // Handle boolean 1/0 from SQLite -> true/false for Postgres
        if (typeof newObj[key] === 'number' && (key.startsWith('is') || key.startsWith('has') || key.includes('discount'))) {
            // SQLite stores boolean as 0/1. Postgres needs boolean.
            // Wait, better-sqlite3 returns 1/0? Yes.
            // But Prisma schema says Boolean.
            // Does `better-sqlite3` map it? No, returns 0 or 1.
            // We need to convert checks.
        }
    }
    return newObj;
}

// Helper to fix boolean fields often found in SQlite
function fixBooleans(record, boolFields) {
    boolFields.forEach(field => {
        if (record[field] === 1) record[field] = true;
        if (record[field] === 0) record[field] = false;
    });
    return record;
}

async function migrate() {
    console.log('🚀 Starting Migration: SQLite -> Supabase');

    // 1. Facilities
    console.log('Reading Facilities...');
    const facilities = db.prepare('SELECT * FROM Facility').all();
    console.log(`Found ${facilities.length} Facilities.`);

    const boolFieldsFacility = ['isPublic', 'hasParking', 'hasRestaurant', 'hasStore', 'hasAccessibility'];

    for (let i = 0; i < facilities.length; i += 50) {
        const chunk = facilities.slice(i, i + 50).map(r => {
            const c = convertBigInt(r);
            return fixBooleans(c, boolFieldsFacility);
        });

        const { error } = await supabase.from('Facility').insert(chunk);
        if (error) {
            console.log(`❌ Error Fac Batch ${i}:`, error.message);
        } else {
            process.stdout.write('.');
        }
    }
    console.log('\n✅ Facilities Done.');

    // 2. PriceCategory
    console.log('Reading PriceCategories...');
    const categories = db.prepare('SELECT * FROM PriceCategory').all();
    console.log(`Found ${categories.length} Categories.`);

    for (let i = 0; i < categories.length; i += 100) {
        const chunk = categories.slice(i, i + 100).map(convertBigInt);
        const { error } = await supabase.from('PriceCategory').insert(chunk);
        if (error) console.log(`❌ Error Cat Batch ${i}:`, error.message);
        else process.stdout.write('.');
    }
    console.log('\n✅ PriceCategories Done.');

    // 3. PriceItem
    console.log('Reading PriceItems...');
    const items = db.prepare('SELECT * FROM PriceItem').all();
    console.log(`Found ${items.length} Items.`);

    const boolFieldsItem = ['hasInstallation', 'hasManagementFee', 'discountAvailable'];

    for (let i = 0; i < items.length; i += 100) {
        const chunk = items.slice(i, i + 100).map(r => {
            const c = convertBigInt(r);
            return fixBooleans(c, boolFieldsItem);
        });

        const { error } = await supabase.from('PriceItem').insert(chunk);
        if (error) console.log(`❌ Error Item Batch ${i}:`, error.message);
        else process.stdout.write('.');
    }
    console.log('\n✅ PriceItems Done.');

    // 4. MappingDictionary
    try {
        const maps = db.prepare('SELECT * FROM MappingDictionary').all();
        if (maps.length > 0) {
            console.log(`Migrating ${maps.length} Maps...`);
            const { error } = await supabase.from('MappingDictionary').insert(maps);
            if (error) console.log('Map Error:', error.message);
            else console.log('✅ Maps Done.');
        }
    } catch (e) {
        console.log('Skipping MappingDictionary (maybe empty)');
    }
}

migrate();
