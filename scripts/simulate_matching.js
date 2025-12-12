
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// === CONFIGURATION ===
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3'; // Safe to use here
const IMAGE_DIR = path.join(process.cwd(), 'FLATTENED_IMAGES');

// === INIT ===
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

async function simulateUpload() {
    console.log('🔍 Starting Strict Matching Simulation...');

    if (!fs.existsSync(IMAGE_DIR)) {
        console.error('❌ FLATTENED_IMAGES directory not found!');
        return;
    }

    // 1. Fetch all facilities from DB
    console.log('📡 Fetching full facility list from DB...');
    const { data: allFacilities, error } = await supabase
        .from('Facility')
        .select('id, name');

    if (error) {
        console.error('❌ Failed to fetch facilities:', error.message);
        return;
    }

    // Name -> ID Map (Normal & Normalized)
    const exactNameMap = new Map();
    allFacilities.forEach(f => {
        if (f.name) exactNameMap.set(f.name.trim(), f.id);
    });
    console.log(`✅ Loaded ${allFacilities.length} facilities from DB.`);

    // 2. Scan Files
    const files = fs.readdirSync(IMAGE_DIR).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
    console.log(`📂 Found ${files.length} image files.`);

    const matchResults = {
        exactMatch: [],
        noMatch: [],
        ambiguous: []
    };

    const fileGroups = {};
    files.forEach(file => {
        // Parse: "123.Name_img1.jpg"
        // Key is "123.Name" part? No, usually the name part matters.
        // Let's rely on the structure [ID_PREFIX].[NAME]_img[INDEX].[EXT]
        // But ID_PREFIX is just an index from previous scripts, not safe to rely on unless mapped.
        // Let's extract the NAME part.

        // Pattern: [digits].[NAME]_img[digits].[ext]
        const match = file.match(/^\d+\.(.+)_img\d+\./);
        if (match && match[1]) {
            const rawName = match[1].trim();
            if (!fileGroups[rawName]) fileGroups[rawName] = [];
            fileGroups[rawName].push(file);
        } else {
            console.warn(`⚠️  Unrecognized file format: ${file}`);
        }
    });

    console.log(`\n🔎 Testing match for ${Object.keys(fileGroups).length} unique facility names found in files...`);

    // 3. Test Matching
    for (const fileNameKey of Object.keys(fileGroups)) {
        const fileCount = fileGroups[fileNameKey].length;

        // STRICT CHECK: Does DB have this EXACT name?
        const dbId = exactNameMap.get(fileNameKey);

        if (dbId) {
            matchResults.exactMatch.push({
                name: fileNameKey,
                fileCount: fileCount,
                dbId: dbId
            });
        } else {
            // Try to find if there's a close call (for debugging "ambiguous" names)
            // But we will NOT match them for upload. just reporting.
            matchResults.noMatch.push({
                name: fileNameKey,
                fileCount: fileCount
            });
        }
    }

    // 4. Report
    console.log('\n📊 === MATCHING REPORT ===');
    console.log(`✅ Exact Matches: ${matchResults.exactMatch.length} groups`);
    console.log(`❌ No Matches:    ${matchResults.noMatch.length} groups`);

    console.log('\n✅ [SAMPLE] Matched Examples (Top 10):');
    matchResults.exactMatch.slice(0, 10).forEach(m => {
        console.log(`   - "${m.name}" : ${m.fileCount} images (ID: ${m.dbId})`);
    });

    // Check specifically for user's concern
    const hojung = matchResults.exactMatch.find(m => m.name === '(재)호정공원');
    const hojungGrave = matchResults.exactMatch.find(m => m.name === '(재)호정공원(묘지)');

    console.log('\n🧐 [CRITICAL CHECK] User Request Verification:');
    if (hojung) console.log(`   ✅ Matched "(재)호정공원": ${hojung.fileCount} images`);
    else console.log(`   ❌ "(재)호정공원" NOT found/matched`);

    if (hojungGrave) console.log(`   ✅ Matched "(재)호정공원(묘지)": ${hojungGrave.fileCount} images`);
    else console.log(`   ❌ "(재)호정공원(묘지)" NOT found/matched`);


    if (matchResults.noMatch.length > 0) {
        console.log('\n⚠️ [SAMPLE] Unmatched Names (Top 10) - These will be SKIPPED:');
        matchResults.noMatch.slice(0, 10).forEach(m => {
            console.log(`   - "${m.name}" : ${m.fileCount} images`);
        });
    }

    // Save full report
    fs.writeFileSync('matching_report.json', JSON.stringify(matchResults, null, 2));
    console.log('\n📄 Full report saved to matching_report.json');
}

simulateUpload();
