import { readFileSync } from 'fs';
import { resolve } from 'path';

const data = JSON.parse(readFileSync(resolve('./data/facilities.json'), 'utf-8'));

console.log('========================================');
console.log('  대대손손 데이터 품질 분석 리포트');
console.log('========================================\n');

// 1. 카테고리별 수
console.log('📊 1. 카테고리별 시설 수');
console.log('─'.repeat(40));
const catCount = {};
data.forEach(f => { catCount[f.category] = (catCount[f.category] || 0) + 1; });
Object.entries(catCount).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    const label = { CHARNEL_HOUSE: '봉안당', FAMILY_GRAVE: '공원묘지', NATURAL_BURIAL: '수목장', CREMATORIUM: '화장장' }[k] || k;
    console.log(`  ${label} (${k}): ${v}개`);
});
console.log(`  전체: ${data.length}개\n`);

// 2. 이름 중복 분석
console.log('🔍 2. 이름 중복 시설 분석');
console.log('─'.repeat(40));
const nameMap = {};
data.forEach(f => {
    const key = f.name.replace(/\s+/g, '').replace(/[()（）]/g, '');
    if (!nameMap[key]) nameMap[key] = [];
    nameMap[key].push(f);
});

// 카테고리 간 중복 (핵심!)
const crossCatDups = [];
Object.entries(nameMap).forEach(([name, items]) => {
    if (items.length > 1) {
        const cats = new Set(items.map(i => i.category));
        if (cats.size > 1) {
            crossCatDups.push(items);
        }
    }
});
console.log(`\n  📌 카테고리 간 중복: ${crossCatDups.length}건`);
crossCatDups.slice(0, 20).forEach(items => {
    const catLabels = { CHARNEL_HOUSE: '봉안', FAMILY_GRAVE: '묘지', NATURAL_BURIAL: '수목', CREMATORIUM: '화장' };
    console.log(`    "${items[0].name}" → ${items.map(i => (catLabels[i.category] || i.category) + '(' + i.id.slice(0, 8) + ')').join(' / ')}`);
});
if (crossCatDups.length > 20) console.log(`    ... 외 ${crossCatDups.length - 20}건 더`);

// 같은 카테고리 내 중복
const sameCatDups = [];
Object.entries(nameMap).forEach(([name, items]) => {
    if (items.length > 1) {
        const catGroups = {};
        items.forEach(i => {
            if (!catGroups[i.category]) catGroups[i.category] = [];
            catGroups[i.category].push(i);
        });
        Object.entries(catGroups).forEach(([cat, group]) => {
            if (group.length > 1) sameCatDups.push(group);
        });
    }
});
console.log(`  📌 같은 카테고리 내 중복: ${sameCatDups.length}건`);
sameCatDups.slice(0, 10).forEach(items => {
    console.log(`    "${items[0].name}" (${items[0].category}) → ID: ${items.map(i => i.id.slice(0, 8)).join(', ')}`);
});

// 3. 이미지 분석
console.log(`\n🖼️  3. 이미지 품질 분석`);
console.log('─'.repeat(40));
let noImage = 0, hasImage = 0, imageUrls = new Set();
data.forEach(f => {
    const gallery = f.imageGallery || [];
    const thumb = f.thumbnail;
    if (gallery.length === 0 && !thumb) {
        noImage++;
    } else {
        hasImage++;
        gallery.forEach(url => imageUrls.add(url));
        if (thumb) imageUrls.add(thumb);
    }
});
console.log(`  이미지 있는 시설: ${hasImage}개`);
console.log(`  이미지 없는 시설: ${noImage}개`);
console.log(`  전체 이미지 URL 수: ${imageUrls.size}개`);

// 이미지 URL 패턴 분석
const urlPatterns = {};
imageUrls.forEach(url => {
    try {
        const u = new URL(url);
        const host = u.hostname;
        urlPatterns[host] = (urlPatterns[host] || 0) + 1;
    } catch {
        urlPatterns['(invalid)'] = (urlPatterns['(invalid)'] || 0) + 1;
    }
});
console.log('  이미지 호스트별:');
Object.entries(urlPatterns).sort((a, b) => b[1] - a[1]).forEach(([host, cnt]) => {
    console.log(`    ${host}: ${cnt}개`);
});

// 4. 가격 테이블 구조 분석
console.log(`\n💰 4. 가격 테이블 구조 분석`);
console.log('─'.repeat(40));

const priceStructures = { CHARNEL_HOUSE: {}, FAMILY_GRAVE: {}, NATURAL_BURIAL: {} };

data.forEach(f => {
    if (!f.priceInfo || !f.priceInfo.priceTable) return;
    const pt = f.priceInfo.priceTable;

    if (!priceStructures[f.category]) return;

    // 탭(카테고리) 구조 분석
    const tabs = Object.keys(pt);
    const tabKey = tabs.sort().join(',');
    if (!priceStructures[f.category][tabKey]) {
        priceStructures[f.category][tabKey] = { count: 0, example: f.name };
    }
    priceStructures[f.category][tabKey].count++;
});

Object.entries(priceStructures).forEach(([cat, structures]) => {
    const catLabel = { CHARNEL_HOUSE: '봉안당', FAMILY_GRAVE: '공원묘지', NATURAL_BURIAL: '수목장' }[cat];
    console.log(`\n  📌 ${catLabel} (${cat}) 가격 테이블 구조:`);

    // 가격 데이터 없는 시설 수
    const total = data.filter(f => f.category === cat).length;
    const withPrice = data.filter(f => f.category === cat && f.priceInfo && f.priceInfo.priceTable && Object.keys(f.priceInfo.priceTable).length > 0).length;
    console.log(`    가격 데이터 있음: ${withPrice}/${total}개`);

    const sorted = Object.entries(structures).sort((a, b) => b[1].count - a[1].count);
    sorted.slice(0, 5).forEach(([tabs, info]) => {
        const tabNames = tabs.split(',').map(t => t.slice(0, 10)).join(', ');
        console.log(`    [${info.count}건] 탭구조: {${tabNames}} (예: ${info.example})`);
    });
    if (sorted.length > 5) console.log(`    ... 외 ${sorted.length - 5}가지 구조 more`);
});

// 5. priceTable 내부 그룹타입 분석
console.log(`\n💰 5. 가격 그룹 타입(groupType) 분석`);
console.log('─'.repeat(40));

const groupTypes = {};
data.forEach(f => {
    if (!f.priceInfo || !f.priceInfo.priceTable) return;
    const pt = f.priceInfo.priceTable;
    Object.entries(pt).forEach(([tab, groups]) => {
        if (Array.isArray(groups)) {
            groups.forEach(g => {
                if (g.groupType) {
                    groupTypes[g.groupType] = (groupTypes[g.groupType] || 0) + 1;
                }
            });
        }
    });
});

Object.entries(groupTypes).sort((a, b) => b[1] - a[1]).forEach(([type, cnt]) => {
    console.log(`  ${type}: ${cnt}건`);
});

console.log('\n========================================');
console.log('  분석 완료');
console.log('========================================');
