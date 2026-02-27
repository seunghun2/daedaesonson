const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0030');
if (parkIndex === -1) {
    console.error('park-0030 not found');
    process.exit(1);
}

const park = data[parkIndex];

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            // 단위 단가 
            {
                name: "매장묘 ㎡당 기본 단가",
                description: "15년 분양금액 계산 기준단가",
                price: 222122,
                feeType: "USAGE",
                grade: "㎡당",
                note: "참고용 단위 단가",
                groupType: "기본 시설이용료" // <-- The unified group Type requested by user
            },
            {
                name: "연간 관리비 (㎡당 단가)",
                description: "15년 분양금액 계산 기준단가",
                price: 5364,
                feeType: "MAINTENANCE",
                grade: "㎡당/1년",
                note: "참고용 단위 단가",
                groupType: "기본 시설이용료"
            },
            // 매장묘 패키지 (단장/합장)
            {
                name: "단장형 분양/사용료",
                description: "19.8㎡, 15년 기준 사용료",
                price: 4398000,
                feeType: "USAGE",
                grade: "단장형 19.8㎡",
                note: "15년 선납 기준",
                groupType: "기본 시설이용료", // <-- Combined into same group! No inner tabs will render
                isRepresentative: true
            },
            {
                name: "합장형 분양/사용료 (23.1㎡)",
                description: "23.1㎡, 15년 기준 사용료",
                price: 5131000,
                feeType: "USAGE",
                grade: "합장형 23.1㎡",
                note: "15년 선납 기준",
                groupType: "기본 시설이용료",
                isRepresentative: true
            },
            {
                name: "합장형 분양/사용료 (29.7㎡)",
                description: "29.7㎡, 15년 기준 사용료",
                price: 6597000,
                feeType: "USAGE",
                grade: "합장형 29.7㎡",
                note: "15년 선납 기준",
                groupType: "기본 시설이용료",
                isRepresentative: true
            },
            // 관리비 패키지
            {
                name: "단장형 재단운영관리비",
                description: "19.8㎡ 면적에 대한 15년 관리비",
                price: 1593000,
                feeType: "MAINTENANCE",
                grade: "단장형 19.8㎡",
                note: "15년 선납 기준",
                groupType: "기본 시설이용료"
            },
            {
                name: "합장형 재단운영관리비 (23.1㎡)",
                description: "23.1㎡ 면적에 대한 15년 관리비",
                price: 1858500,
                feeType: "MAINTENANCE",
                grade: "합장형 23.1㎡",
                note: "15년 선납 기준",
                groupType: "기본 시설이용료"
            },
            {
                name: "합장형 재단운영관리비 (29.7㎡)",
                description: "29.7㎡ 면적에 대한 15년 관리비",
                price: 2389500,
                feeType: "MAINTENANCE",
                grade: "합장형 29.7㎡",
                note: "15년 선납 기준",
                groupType: "기본 시설이용료"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "가족 봉안묘",
        rows: [
            // All "가족 봉안묘 분양 금액" items
            {
                name: "풍산특1호 (52위)",
                description: "49.5㎡. 사용료, 15년관리비, 조경비, 방습공사, 봉안석물 일체 포함",
                price: 64000000,
                feeType: "USAGE",
                grade: "52위",
                note: "패키지 가격 (15년 관리비 포함)",
                groupType: "봉안묘 분양 패키지",
                isRepresentative: false
            },
            {
                name: "풍산특2호 (36위)",
                description: "39.6㎡. 사용료, 15년관리비, 조경비, 방습공사, 봉안석물 일체 포함",
                price: 42000000,
                feeType: "USAGE",
                grade: "36위",
                note: "패키지 가격 (15년 관리비 포함)",
                groupType: "봉안묘 분양 패키지",
                isRepresentative: false
            },
            {
                name: "풍산1호 (36위)",
                description: "33㎡. 사용료, 15년관리비, 조경비, 방습공사, 봉안석물 일체 포함",
                price: 33000000,
                feeType: "USAGE",
                grade: "36위",
                note: "패키지 가격 (15년 관리비 포함)",
                groupType: "봉안묘 분양 패키지",
                isRepresentative: false
            },
            {
                name: "풍산2호 (36위)",
                description: "33㎡. 사용료, 15년관리비, 조경비, 방습공사, 봉안석물 일체 포함",
                price: 22000000,
                feeType: "USAGE",
                grade: "36위",
                note: "패키지 가격 (15년 관리비 포함)",
                groupType: "봉안묘 분양 패키지",
                isRepresentative: false
            },
            {
                name: "풍산5호 (24위)",
                description: "23.1㎡. 사용료, 15년관리비, 조경비, 방습공사, 봉안석물 일체 포함",
                price: 17000000,
                feeType: "USAGE",
                grade: "24위",
                note: "패키지 가격 (15년 관리비 포함)",
                groupType: "봉안묘 분양 패키지",
                isRepresentative: false
            },
            {
                name: "풍산3호 (24위)",
                description: "23.1㎡. 사용료, 15년관리비, 조경비, 방습공사, 봉안석물 일체 포함",
                price: 16000000,
                feeType: "USAGE",
                grade: "24위",
                note: "패키지 가격 (15년 관리비 포함)",
                groupType: "봉안묘 분양 패키지",
                isRepresentative: false
            },
            {
                name: "풍산4호 (12위)",
                description: "16.5㎡. 사용료, 15년관리비, 조경비, 방습공사, 봉안석물 일체 포함",
                price: 12000000,
                feeType: "USAGE",
                grade: "12위",
                note: "패키지 가격 (15년 관리비 포함)",
                groupType: "봉안묘 분양 패키지",
                isRepresentative: false
            },
            {
                name: "풍산6호 (8위)",
                description: "13.2㎡. 사용료, 15년관리비, 조경비, 방습공사, 봉안석물 일체 포함",
                price: 11000000,
                feeType: "USAGE",
                grade: "8위",
                note: "패키지 가격 (15년 관리비 포함)",
                groupType: "봉안묘 분양 패키지",
                isRepresentative: false
            },
            {
                name: "풍산7호 (4위)",
                description: "9.9㎡. 사용료, 15년관리비, 조경비, 방습공사, 봉안석물 일체 포함",
                price: 8000000,
                feeType: "USAGE",
                grade: "4위",
                note: "패키지 가격 (15년 관리비 포함)",
                groupType: "봉안묘 분양 패키지",
                isRepresentative: false
            },
            {
                name: "풍산8호 (2위)",
                description: "6.6㎡. 사용료, 15년관리비, 조경비, 방습공사, 봉안석물 일체 포함",
                price: 6000000,
                feeType: "USAGE",
                grade: "2위",
                note: "패키지 가격 (15년 관리비 포함)",
                groupType: "봉안묘 분양 패키지",
                isRepresentative: true // Representative lower-bound price for family Bongsan
            }
        ]
    }
];

if (!park.priceInfo) {
    park.priceInfo = {};
}
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0030 prices updated successfully.');
