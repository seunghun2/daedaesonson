const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const park = data.find(p => p.id === 'park-0050');
if (!park) { console.error('park-0050 not found'); process.exit(1); }

// Image analysis:
// 시설사용료: 묘지사용료(1평) 1,895,100 / 관리비(1평) 15,400
// 매장묘 단장: 1단미니묘테 2,156,000 (60cm비석,60cm화강상석,화병)
//             1단 1.1×2.1묘테 2,304,500 (60cm비석,60cm화강상석,화병)
// 매장묘 합장: 각묘테-중 4,474,800 (90cm갓비석,75cm화강상석,화병)
//             각묘테-대 4,990,700 (90cm갓비석,75cm화강상석,화병)
//             각묘테-특 7,200,600 (90cm갓비석,90cm화강상석,화병)
// 봉안묘: 2인 4,032,600 (60cm피아노비석,60cm화강상석,화병)
//         4인 6,103,900 (75cm화강비석,75cm화강상석,화병)
//         6인 7,604,300 (75cm화강비석,75cm화강상석,화병)
// 서비스항목: 비석 53cm×38cm×12cm 200,000 / 석관 분묘 비탈을 제외한 모든곳에 7개 설치 200,000

park.priceInfo.standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        feeType: 'USAGE',
        rows: [
            { name: '묘지사용료 (1평)', price: 1895100, groupType: '기본비용', note: '1평 기준' },
            { name: '묘지관리비 (1평/년)', price: 15400, groupType: '기본비용', note: '1년간 관리비' },
            { name: '1단 미니묘테', price: 2156000, groupType: '단장묘', note: '60cm비석, 60cm화강상석, 화병 포함' },
            { name: '1단 (1.1×2.1 묘테)', price: 2304500, groupType: '단장묘', note: '60cm비석, 60cm화강상석, 화병 포함' },
            { name: '합장묘 각묘테 (중)', price: 4474800, groupType: '합장묘', note: '90cm갓비석, 75cm화강상석, 화병 포함' },
            { name: '합장묘 각묘테 (대)', price: 4990700, groupType: '합장묘', note: '90cm갓비석, 75cm화강상석, 화병 포함' },
            { name: '합장묘 각묘테 (특)', price: 7200600, groupType: '합장묘', note: '90cm갓비석, 90cm화강상석, 화병 포함' },
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '봉안묘',
        feeType: 'USAGE',
        rows: [
            { name: '봉안묘 2인', price: 4032600, groupType: '', note: '60cm피아노비석, 60cm화강상석, 화병 포함' },
            { name: '봉안묘 4인', price: 6103900, groupType: '', note: '75cm화강비석, 75cm화강상석, 화병 포함' },
            { name: '봉안묘 6인', price: 7604300, groupType: '', note: '75cm화강비석, 75cm화강상석, 화병 포함' },
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '석물',
        feeType: 'STONE',
        rows: [
            { name: '비석', price: 200000, groupType: '', note: '53cm×38cm×12cm' },
            { name: '석관', price: 200000, groupType: '', note: '분묘 비탈을 제외한 모든곳에 7개 설치' },
        ]
    }
];

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0050 광주공원묘원 updated');
