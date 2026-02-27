const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const park = data.find(p => p.id === 'park-0058');
if (!park) { console.error('park-0058 not found'); process.exit(1); }

// Image analysis:
// 시설사용료:
//   사용료 332,748원/㎡ (1,100,000원/1평)
//   관리비 4,538원/㎡ (15,000원/1평)
//   장례비(1평) 500,000
// 서비스항목:
//   매장묘(보급형) 둘레석,표석,상석,향로,꽃병(SET) 5,000,000
//   매장묘(고급형) 둘레석,표석,상석,향로,꽃병(SET) 7,500,000
//   보급형 보급형(SET) 3,500,000
//   고급형 고급형(SET) 5,000,000
//   예술보급형 예술보급형(SET) 7,500,000
//   구름보급형 구름보급형(SET) 6,500,000

park.priceInfo.standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        feeType: 'USAGE',
        rows: [
            { name: '사용료 (0.3평)', price: 332748, groupType: '기본비용', note: '0.3평 기준 (1,100,000원/1평)' },
            { name: '관리비 (0.3평)', price: 4538, groupType: '기본비용', note: '0.3평 기준 (15,000원/1평)' },
            { name: '장례비 (1평)', price: 500000, groupType: '기본비용', note: '매장 작업비' },
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '석물',
        feeType: 'STONE',
        rows: [
            { name: '매장묘 석물 SET (보급형)', price: 5000000, groupType: '매장묘 SET', note: '둘레석, 표석, 상석, 향로, 꽃병 포함' },
            { name: '매장묘 석물 SET (고급형)', price: 7500000, groupType: '매장묘 SET', note: '둘레석, 표석, 상석, 향로, 꽃병 포함' },
            { name: '보급형 SET', price: 3500000, groupType: '봉안묘/기타 SET', note: '' },
            { name: '고급형 SET', price: 5000000, groupType: '봉안묘/기타 SET', note: '' },
            { name: '예술보급형 SET', price: 7500000, groupType: '봉안묘/기타 SET', note: '' },
            { name: '구름보급형 SET', price: 6500000, groupType: '봉안묘/기타 SET', note: '' },
        ]
    }
];

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0058 (재)경주공원묘원 updated');
