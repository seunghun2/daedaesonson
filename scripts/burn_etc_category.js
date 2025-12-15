const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("🔥 Burning 'Etc' Category for ID 1...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
const fIndex = facilities.findIndex(f => f.id === 'park-0001');

if (fIndex === -1) {
    console.error("❌ Facility park-0001 not found!");
    process.exit(1);
}

const target = facilities[fIndex];
const pricing = target.pricing || {};

// 1. Remove '기타' category entirely if user wants it clean
// But let's check if there are any gems hidden in there.
// If user says "다 빼줘", we trust them and nuke it, 
// OR we apply very strict filter.

if (pricing['기타']) {
    const originalCount = pricing['기타'].rows.length;

    // Filter: Keep ONLY what explicitly looks like "Space" or "Usage Fee"
    // Actually, user said "다 빼줘" to junk. 
    // Let's keep items that contain "사용료" just in case, but remove everything else.

    const keptRows = pricing['기타'].rows.filter(r => {
        const text = (r.name + r.description).toLowerCase();
        // Whitelist keywords
        const safeKeywords = ['사용료', '분양', '1위', '부부', '가족'];

        // Blacklist (Double Check)
        const junk = ['화장', '안치', '빈소', '접객', '영결', '제례', '벌초', '비석', '상석', '위패', '꽃병', '모시는글', '운구', '코팅', '증명서', '차량', '앰뷸런스'];

        if (junk.some(j => text.includes(j))) return false;

        // Must have a whitelist keyword to survive in '기타'
        return safeKeywords.some(k => text.includes(k));
    });

    console.log(`기타: ${originalCount} -> ${keptRows.length}`);

    if (keptRows.length === 0) {
        delete pricing['기타'];
        console.log("💀 '기타' category deleted completely.");
    } else {
        pricing['기타'].rows = keptRows;
    }
}

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Cleaned.");
