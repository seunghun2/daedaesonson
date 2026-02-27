const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const park = data.find(p => p.id === 'park-0056');
if (!park) { console.error('park-0056 not found'); process.exit(1); }

// Image analysis:
// 시설사용료:
//   매장지 묘지조성에 대한 원가요소별 산정금액임 3,180,000
//   천명지 묘지조성에 대한 원가요소별 산정금액임 5,340,000
//   봉안묘 묘지조성에 대한 원가요소별 산정금액임 4,170,000
//   정명지 묘지조성에 대한 원가요소별 산정금액임 2,620,000
//   일반묘지 1년 평당 단가 25,000
//   조경지 조경관리 대상 묘역 추가 조경관리비 청구 25,000
//   사용료 환불 규정(설묘 전/약정일기준) 15일 이내 해지 요청시 전액 환불
//   사용료 환불 규정(설묘 전/약정일기준) 1년이내50%, 2년이내40%, 3년이내30%, 4년이내20%, 5년이내10%, 5년초과0%
//   사용료 환불 규정(설묘 후) 환급하지 않음
//   관리비 환불 규정 계약일로부터 사용기간 일할계산후 환급

park.priceInfo.standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        feeType: 'USAGE',
        rows: [
            { name: '매장지', price: 3180000, groupType: '', note: '묘지조성에 대한 원가요소별 산정금액' },
            { name: '천명지', price: 5340000, groupType: '', note: '묘지조성에 대한 원가요소별 산정금액' },
            { name: '정명지', price: 2620000, groupType: '', note: '묘지조성에 대한 원가요소별 산정금액' },
            { name: '연간 관리비 (1평)', price: 25000, groupType: '', note: '1년 평당 단가' },
            { name: '조경관리비', price: 25000, groupType: '', note: '조경관리 대상 묘역 추가 청구' },
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '봉안묘',
        feeType: 'USAGE',
        rows: [
            { name: '봉안묘', price: 4170000, groupType: '', note: '묘지조성에 대한 원가요소별 산정금액' },
        ]
    }
];

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0056 (재)용인공원(묘지) updated');
