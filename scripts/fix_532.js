const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0532');
const sp = p.priceInfo.standardizedPrices;

// [0] 개인: "1단 및 7단" → 1단, 7단 분리 + 위치 맞춤
sp[0].rows = [
    { name: '1단', price: 3500000, feeType: 'USAGE', groupType: '일반', isRepresentative: true },
    { name: '2단', price: 4500000, feeType: 'USAGE', groupType: '일반' },
    { name: '3단', price: 5000000, feeType: 'USAGE', groupType: '일반' },
    { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '일반' },
    { name: '5단', price: 6500000, feeType: 'USAGE', groupType: '일반' },
    { name: '6단', price: 5500000, feeType: 'USAGE', groupType: '일반' },
    { name: '7단', price: 3500000, feeType: 'USAGE', groupType: '일반' },
    { name: '8단', price: 2500000, feeType: 'USAGE', groupType: '일반' },
    { name: '9단', price: 1500000, feeType: 'USAGE', groupType: '일반' },
    { name: '10단', price: 1000000, feeType: 'USAGE', groupType: '일반' },
    { name: '개인단 관리비', price: 2000000, feeType: 'MAINTENANCE', groupType: '부가옵션' },
    { name: '관리비 (5년마다/총88년)', price: 250000, feeType: 'MAINTENANCE', groupType: '부가옵션' },
];

// [1] 부부: "1단 및 7단" → 1단, 7단 분리 + 위치 맞춤
sp[1].rows = [
    { name: '1단', price: 7000000, feeType: 'USAGE', groupType: '일반' },
    { name: '2단', price: 9000000, feeType: 'USAGE', groupType: '일반' },
    { name: '3단', price: 10000000, feeType: 'USAGE', groupType: '일반' },
    { name: '4단', price: 12000000, feeType: 'USAGE', groupType: '일반' },
    { name: '5단', price: 13000000, feeType: 'USAGE', groupType: '일반' },
    { name: '6단', price: 11000000, feeType: 'USAGE', groupType: '일반' },
    { name: '7단', price: 7000000, feeType: 'USAGE', groupType: '일반' },
    { name: '8단', price: 5000000, feeType: 'USAGE', groupType: '일반' },
    { name: '9단', price: 3000000, feeType: 'USAGE', groupType: '일반' },
    { name: '10단', price: 2000000, feeType: 'USAGE', groupType: '일반' },
    // 5면부부단
    { name: '1단', price: 9000000, feeType: 'USAGE', groupType: '5면부부단', grade: '5면' },
    { name: '2단', price: 10000000, feeType: 'USAGE', groupType: '5면부부단', grade: '5면' },
    { name: '3단', price: 12000000, feeType: 'USAGE', groupType: '5면부부단', grade: '5면' },
    { name: '4단', price: 15000000, feeType: 'USAGE', groupType: '5면부부단', grade: '5면' },
    { name: '5단', price: 16000000, feeType: 'USAGE', groupType: '5면부부단', grade: '5면' },
    { name: '7단', price: 9000000, feeType: 'USAGE', groupType: '5면부부단', grade: '5면' },
    { name: '8단', price: 7000000, feeType: 'USAGE', groupType: '5면부부단', grade: '5면' },
    { name: '9단', price: 5000000, feeType: 'USAGE', groupType: '5면부부단', grade: '5면' },
    { name: '10단', price: 4000000, feeType: 'USAGE', groupType: '5면부부단', grade: '5면' },
    // 부도합
    { name: '부도합8위', price: 32000000, feeType: 'USAGE', groupType: '부도합' },
    { name: '부도합12위', price: 48000000, feeType: 'USAGE', groupType: '부도합' },
    { name: '부도합16위', price: 64000000, feeType: 'USAGE', groupType: '부도합' },
    { name: '부도합24위', price: 96000000, feeType: 'USAGE', groupType: '부도합' },
    // 관리비
    { name: '부부단 및 5면부부단 관리비', price: 4000000, feeType: 'MAINTENANCE', groupType: '부가옵션' },
    { name: '관리비 (5년마다/총88년)', price: 500000, feeType: 'MAINTENANCE', groupType: '부가옵션' },
];

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ 532 "1단 및 7단" → 1단, 7단 분리 완료');
