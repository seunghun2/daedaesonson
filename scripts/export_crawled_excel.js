const XLSX = require('xlsx');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/smart_crawled_data.json', 'utf-8'));

const rows = data.map(d => ({
    '번호': d.no,
    '시설명': d.name,
    'URL': d.url,
    '묘지가격수': d.prices?.묘지?.length || 0,
    '봉안당가격수': d.prices?.봉안당?.length || 0,
    '자연장가격수': d.prices?.자연장?.length || 0,
    '전체가격수': d.totalPrices || 0,
    '이미지수': d.images || 0,
    '대표가격': d.allPrices?.[0]?.priceText || '-',
    '크롤링일시': d.crawledAt
}));

const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '크롤링결과');
XLSX.writeFile(wb, 'crawled_prices.xlsx');
console.log('저장완료: crawled_prices.xlsx');
console.log('총 ' + rows.length + '개 시설');
