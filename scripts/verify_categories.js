const fs = require('fs');
const path = require('path');

const jsonPath = path.join(process.cwd(), 'data', 'pricing_db.json');

try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Total: ${data.length}`);

    // Helper to find samples
    const findSample = (key, label) => {
        const found = data.filter(i => i[key] && i[key].trim() !== '').slice(0, 3);
        console.log(`\n--- [${label}] Sample (${key}) ---`);
        if (found.length === 0) console.log("   (No data found)");
        found.forEach(f => console.log(`   "${f[key]}"  (Facility: ${f.parkName})`));
    };

    findSample('category2', '안치 유형 (개인/부부)');
    findSample('category3', '자격 (관내/관외)');
    findSample('category0_1', 'AI 분석 내용');

} catch (e) {
    console.error(e);
}
