/**
 * standardizedPrices 정리 스크립트
 * 1. 같은 그룹 내 완전 동일 행(name+price 동일) 중복 제거
 * 2. 만장 항목 → serviceType을 'MANJANG'으로 분류 (별도 처리)
 */
const fs = require('fs');
const filePath = 'data/facilities.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const facilities = data.facilities || data;

let totalDupRemoved = 0;
let totalManjangMoved = 0;
let changedFacilities = new Set();

facilities.forEach(f => {
    const s = f.priceInfo && f.priceInfo.standardizedPrices;
    if (!s) return;

    s.forEach(g => {
        // 1. 완전 동일 행 제거 (name + price + feeType 모두 같은 경우)
        const before = g.rows.length;
        const seen = new Set();
        g.rows = g.rows.filter(r => {
            const key = `${r.name}|${r.price}|${r.feeType || ''}|${r.unit || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        const removed = before - g.rows.length;
        if (removed > 0) {
            totalDupRemoved += removed;
            changedFacilities.add(f.id);
        }
    });

    // 2. 만장 항목 처리 - 별도 그룹으로 분리하지 않고, 행 이름에 "만장" prefix 유지
    // (만장은 매장묘 카테고리에 그대로 두되, 이름으로 구분)
});

// 저장
const arr = Array.isArray(data) ? facilities : data;
fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf8');

console.log(`=== 정리 결과 ===`);
console.log(`중복 행 제거: ${totalDupRemoved}건`);
console.log(`변경된 시설: ${changedFacilities.size}개`);
console.log(`만장 항목: ${totalManjangMoved}건 이동`);

// 검증: 남은 중복 확인
let remainingDups = 0;
facilities.forEach(f => {
    const s = f.priceInfo && f.priceInfo.standardizedPrices;
    if (!s) return;
    s.forEach(g => {
        const seen = new Set();
        g.rows.forEach(r => {
            const key = `${r.name}|${r.price}|${r.feeType || ''}|${r.unit || ''}`;
            if (seen.has(key)) remainingDups++;
            seen.add(key);
        });
    });
});
console.log(`남은 완전동일 중복: ${remainingDups}건`);
