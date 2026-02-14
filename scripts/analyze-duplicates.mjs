import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('./data/facilities.json', 'utf-8'));
const catLabel = { CHARNEL_HOUSE: '봉안당', FAMILY_GRAVE: '공원묘지', NATURAL_BURIAL: '수목장', CREMATORIUM: '화장장' };

// 이름 기준 그룹핑 (공백/괄호 제거)
const nameMap = {};
data.forEach(f => {
    const key = f.name.replace(/\s+/g, '').replace(/[()（）]/g, '');
    if (!nameMap[key]) nameMap[key] = [];
    nameMap[key].push(f);
});

// 중복 그룹만 추출
const dupGroups = Object.entries(nameMap)
    .filter(([_, items]) => items.length > 1)
    .map(([key, items]) => items);

console.log('========================================');
console.log('  중복 시설 상세 분석');
console.log('========================================\n');
console.log(`중복 그룹 수: ${dupGroups.length}개\n`);

// 주소까지 같은 진짜 중복 vs 이름만 같은 다른 시설
let trueDups = [];
let nameOnlyDups = [];

dupGroups.forEach(items => {
    // 주소 비교 (앞 10글자)
    const addrs = items.map(f => (f.address || '').replace(/\s+/g, '').slice(0, 15));
    const uniqueAddrs = new Set(addrs);

    if (uniqueAddrs.size === 1 || addrs.some(a => a === '')) {
        trueDups.push(items);
    } else {
        // 주소가 다른 경우 → 이름만 같은 다른 시설일 수 있음
        nameOnlyDups.push(items);
    }
});

console.log(`📌 진짜 중복 (이름+주소 같음): ${trueDups.length}개 그룹`);
console.log('─'.repeat(60));
trueDups.slice(0, 30).forEach((items, idx) => {
    const cats = items.map(f => catLabel[f.category] || f.category);
    const uniqueCats = [...new Set(cats)];
    const hasPrices = items.map(f => {
        if (!f.priceInfo?.priceTable) return 0;
        return Object.values(f.priceInfo.priceTable).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    });
    const hasImages = items.map(f => (f.imageGallery?.length || 0));

    console.log(`\n  ${idx + 1}. "${items[0].name}"`);
    console.log(`     주소: ${items[0].address?.slice(0, 30) || '없음'}`);
    items.forEach((f, fi) => {
        console.log(`     [${fi + 1}] ID: ${f.id} | ${catLabel[f.category]} | 가격항목: ${hasPrices[fi]}개 | 이미지: ${hasImages[fi]}개`);
    });
    if (uniqueCats.length > 1) {
        console.log(`     ⚡ 다른 카테고리: ${uniqueCats.join(' + ')}`);
    }
});

console.log(`\n\n📌 이름만 같고 주소 다름 (다른 시설): ${nameOnlyDups.length}개 그룹`);
console.log('─'.repeat(60));
nameOnlyDups.slice(0, 10).forEach((items, idx) => {
    console.log(`\n  ${idx + 1}. "${items[0].name}"`);
    items.forEach((f, fi) => {
        console.log(`     [${fi + 1}] ${f.id} | ${catLabel[f.category]} | ${(f.address || '없음').slice(0, 30)}`);
    });
});

// 병합 시 고려사항
console.log('\n\n========================================');
console.log('  병합 전략 요약');
console.log('========================================');
console.log(`\n진짜 중복 ${trueDups.length}개 그룹 중:`);
let crossCat = trueDups.filter(items => new Set(items.map(f => f.category)).size > 1);
let sameCat = trueDups.filter(items => new Set(items.map(f => f.category)).size === 1);
console.log(`  - 카테고리 다른 중복: ${crossCat.length}개 → categories 배열로 합침`);
console.log(`  - 같은 카테고리 중복: ${sameCat.length}개 → 데이터 합쳐서 하나로`);
console.log(`  - 이름만 같은 다른 시설: ${nameOnlyDups.length}개 → 건드리지 않음`);

// 전체 시설 중 실제로 복수 서비스 제공하는 곳 분석
console.log('\n\n========================================');
console.log('  복수 서비스 분석 (가격 탭 기준)');
console.log('========================================');

const serviceMapping = {
    '봉안당': 'CHARNEL_HOUSE',
    '봉안묘': 'CHARNEL_HOUSE',
    '봉안담': 'CHARNEL_HOUSE',
    '수목형': 'NATURAL_BURIAL',
    '수목장': 'NATURAL_BURIAL',
    '잔디형': 'NATURAL_BURIAL',
    '화초형': 'NATURAL_BURIAL',
    '암석형': 'NATURAL_BURIAL',
    '매장묘': 'FAMILY_GRAVE',
    '평장묘': 'FAMILY_GRAVE',
    '합장형': 'FAMILY_GRAVE',
    '쌍분형': 'FAMILY_GRAVE',
    '단장형': 'FAMILY_GRAVE',
    '복합묘': 'FAMILY_GRAVE',
};

let multiService = 0;
const serviceCombos = {};

data.forEach(f => {
    if (!f.priceInfo?.priceTable) return;
    const pt = f.priceInfo.priceTable;

    // 실제 가격 데이터가 있는 탭만
    const activeTabs = Object.entries(pt)
        .filter(([_, groups]) => Array.isArray(groups) && groups.some(g => g.items?.length > 0))
        .map(([tab]) => tab);

    // 해당 탭들이 어떤 카테고리에 속하는지
    const serviceCategories = new Set();
    activeTabs.forEach(tab => {
        if (serviceMapping[tab]) serviceCategories.add(serviceMapping[tab]);
    });

    if (serviceCategories.size > 1) {
        multiService++;
        const combo = [...serviceCategories].map(c => catLabel[c]).sort().join(' + ');
        serviceCombos[combo] = (serviceCombos[combo] || 0) + 1;
    }
});

console.log(`\n복수 서비스 제공 시설: ${multiService}개 / 전체 ${data.length}개`);
console.log('\n서비스 조합별:');
Object.entries(serviceCombos).sort((a, b) => b[1] - a[1]).forEach(([combo, cnt]) => {
    console.log(`  ${combo}: ${cnt}개`);
});
