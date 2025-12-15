const fs = require('fs');
const list = require('../data/facilities.json');

// Find ID 1
const f = list.find(i => i.id === 'park-0001' || i.id === '1');
if (!f) {
    console.log("Cannot find ID 1 in local JSON");
    process.exit(0);
}

console.log(`\n--- Simulating Cleanup for [${f.name}] ---`);

const rows = [];
if (f.pricing) {
    Object.values(f.pricing).forEach(group => {
        if (group.rows) rows.push(...group.rows);
    });
}

// Rules
// 1. Keep: "사용료", "관리비", "매장묘", "봉안", "수목", "평장", "담장"
// 2. Drop: "작업비", "개장", "유골함", "석물", "조각", "향로", "석곽"

const KEEP_KEYWORDS = ['사용료', '관리비', '매장묘', '봉안', '수목', '평장', '잔디', '부부', '가족', '개인'];
const DROP_KEYWORDS = ['작업비', '개장', '수선', '유골함', '석물', '석곽', '석봉분', '향로', '구판'];

const toKeep = [];
const toDrop = [];

rows.forEach(r => {
    const text = (r.name + " " + (r.description || "")).toLowerCase();

    // Check Drop first
    const hitDrop = DROP_KEYWORDS.find(k => text.includes(k));
    if (hitDrop) {
        toDrop.push({ ...r, reason: hitDrop });
        return;
    }

    // Check Keep (Implicitly keep if not dropped? Or strict keep?)
    // User said "Clean up titles/descriptions for each ID".
    // Usually we want to keep the core products.
    // If it's not in drop list, maybe strictly check if it looks like a product?
    // Let's rely on Drop list primarily for "Delete useless", and maybe highlight ambiguity.

    toKeep.push(r);
});

console.log(`\n✅ TO KEEP (${toKeep.length} items):`);
toKeep.forEach(k => console.log(`  - ${k.name} (${k.description || ''})`));

console.log(`\n❌ TO DROP (${toDrop.length} items):`);
toDrop.forEach(d => console.log(`  - ${d.name} [Reason: ${d.reason}]`));
