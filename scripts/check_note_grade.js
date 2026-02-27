const d = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));
let noteOnly = 0, gradeOnly = 0, both = 0, neither = 0;
const noteOnlyParks = new Set();
d.forEach(p => {
    const sp = p.priceInfo?.standardizedPrices;
    if (!sp) return;
    sp.forEach(g => {
        g.rows.forEach(r => {
            const hasGrade = r.grade && r.grade.trim();
            const hasNote = r.note && r.note.trim();
            if (hasNote && !hasGrade) { noteOnly++; noteOnlyParks.add(p.id); }
            else if (hasGrade && !hasNote) gradeOnly++;
            else if (hasGrade && hasNote) both++;
            else neither++;
        });
    });
});
console.log('grade만:', gradeOnly);
console.log('note만 (grade없음):', noteOnly, '→', noteOnlyParks.size, '개 시설');
console.log('둘다있음:', both);
console.log('둘다없음:', neither);
const sorted = [...noteOnlyParks].sort();
console.log('영향받는 시설:', sorted.slice(0, 10).join(', '), '...', sorted.slice(-5).join(', '));
