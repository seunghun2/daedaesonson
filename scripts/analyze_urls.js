const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facility_urls.json'), 'utf-8'));

// 의심스러운 도메인 패턴 (중개사이트, 임시 도메인 등)
const badDomains = [
    'myungdangga.co.kr',   // 명당가 (중개)
    'linktoplace.com',     // 중개
    'goifuneral.co.kr',    // 고이장례 (중개)
    'funeralblog.co.kr',   // 장례블로그 (중개)
    'cafe24.com',          // 임시 도메인
    'dmonster',            // 임시 도메인
    'portal.co.kr',        // 포털
    '15774129.go.kr',      // e-하늘 (정부 포털)
    'ciff.kr',             // 장례 관련 포털
    'saeob.com',           // 중개
    'rightfuneral.co.kr',  // 중개
    'placeview.co.kr',     // 중개
];

const analysis = {
    good: [],
    suspicious: [],
    noUrl: []
};

data.forEach(d => {
    if (!d.url) {
        analysis.noUrl.push(d);
    } else {
        const url = d.url.toLowerCase();
        const isBad = badDomains.some(bad => url.includes(bad));
        if (isBad) {
            analysis.suspicious.push(d);
        } else {
            analysis.good.push(d);
        }
    }
});

console.log('📊 URL 품질 분석');
console.log('================');
console.log('✅ 양호한 URL: ' + analysis.good.length + '개');
console.log('⚠️  의심스러운 URL (중개사이트 등): ' + analysis.suspicious.length + '개');
console.log('❌ URL 없음: ' + analysis.noUrl.length + '개');

console.log('\n⚠️ 의심스러운 URL 도메인 현황:');
const domainCount = {};
analysis.suspicious.forEach(d => {
    try {
        const domain = new URL(d.url).hostname;
        domainCount[domain] = (domainCount[domain] || 0) + 1;
    } catch (e) { }
});

Object.entries(domainCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count]) => {
        console.log('  ' + domain + ': ' + count + '개');
    });

// 모든 도메인별 통계
console.log('\n📈 전체 도메인 통계 (상위 30개):');
const allDomains = {};
data.forEach(d => {
    if (d.url) {
        try {
            const domain = new URL(d.url).hostname;
            allDomains[domain] = (allDomains[domain] || 0) + 1;
        } catch (e) { }
    }
});

Object.entries(allDomains)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .forEach(([domain, count]) => {
        const isBad = badDomains.some(bad => domain.includes(bad));
        const emoji = isBad ? '⚠️' : '✅';
        console.log(`  ${emoji} ${domain}: ${count}개`);
    });
