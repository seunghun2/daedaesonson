const fs = require('fs');
const path = require('path');

// 수정된 파일 분석
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facility_urls_fixed.json'), 'utf-8'));

const BAD_DOMAINS = [
    'goifuneral.co.kr', 'myungdangga.co.kr', 'ch-funeralportal.co.kr',
    'gangwon-portal.co.kr', 'placeview.co.kr', 'funeralblog.co.kr',
    '15774129.go.kr', 'linktoplace.com', 'cafe24.com', 'dmonster',
    'ciff.kr', 'saeob.com', 'rightfuneral.co.kr', 'bugosms.com',
    'gyeongsang-portal.co.kr', 'honam-portal.co.kr',
    'saramin.co.kr', 'jobkorea.co.kr', 'duck.ai', 'substack.com',
    'apps.apple.com', 'daangn.com'
];

function isBad(url) {
    if (!url) return 'none';
    const lower = url.toLowerCase();
    if (BAD_DOMAINS.some(bad => lower.includes(bad))) return 'bad';
    return 'good';
}

const stats = { good: 0, bad: 0, none: 0 };
const domainCount = {};

data.forEach(d => {
    const status = isBad(d.url);
    stats[status]++;

    if (d.url) {
        try {
            const domain = new URL(d.url).hostname;
            domainCount[domain] = (domainCount[domain] || 0) + 1;
        } catch (e) { }
    }
});

console.log('📊 수정된 URL 품질 분석');
console.log('========================');
console.log(`✅ 양호한 URL: ${stats.good}개 (${Math.round(stats.good / data.length * 100)}%)`);
console.log(`⚠️  의심스러운 URL: ${stats.bad}개 (${Math.round(stats.bad / data.length * 100)}%)`);
console.log(`❌ URL 없음: ${stats.none}개`);

console.log('\n📈 상위 도메인 (고유/공식 사이트):');
const sorted = Object.entries(domainCount)
    .filter(([d]) => !BAD_DOMAINS.some(bad => d.includes(bad)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

sorted.forEach(([domain, count]) => {
    console.log(`  ✅ ${domain}: ${count}개`);
});

// urlFixed 마킹된 개수
const fixed = data.filter(d => d.urlFixed === true).length;
const fixedGood = data.filter(d => d.urlFixed === true && isBad(d.url) === 'good').length;
console.log(`\n🔄 재검색으로 개선된 시설: ${fixedGood}개 / ${fixed}개`);
