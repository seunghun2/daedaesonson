const fs = require('fs');
const path = require('path');

// 크롤링된 데이터 읽기 (전체 데이터)
const rawPath = path.join(__dirname, '../crawled_full.json');
const outputPath = path.join(__dirname, '../lib/mockData.ts');

if (!fs.existsSync(rawPath)) {
    console.error('❌ 크롤링 데이터 파일이 없습니다:', rawPath);
    process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
const eskyList = rawData.list || [];

console.log(`📦 ${eskyList.length}개 전체 데이터 처리 중...`);

// 랜덤 가격 생성 함수
function generateRandomPrice() {
    const min = Math.floor(Math.random() * 300) + 100; // 100~400만
    const max = min + Math.floor(Math.random() * 1000) + 500; // +500~1500만
    return { min, max };
}

// 데이터 변환
const newFacilities = eskyList.map((item, idx) => {
    const isCharnel = idx % 2 === 0; // 짝수는 봉안당, 홀수는 수목장 흉내
    const category = isCharnel ? 'CHARNEL_HOUSE' : 'NATURAL_BURIAL';

    // 이름 변환 (장례식장 -> 추모공원/재단)
    let name = item.companyname
        .replace('장례식장', isCharnel ? ' 봉안당' : ' 자연장지')
        .replace('병원', '추모공원');

    const priceRange = generateRandomPrice();
    const area = Math.floor(Math.random() * 50000) + 10000;
    const capacity = Math.floor(Math.random() * 30000) + 5000;

    return {
        id: `esky-${item.facilitycd}`,
        name: name,
        category: category,
        address: item.fulladdress,
        phone: item.telephone || "02-1234-5678",
        isPublic: item.publiccode === 'TCM0100002', // 대충 매핑
        priceRange: priceRange,
        coordinates: {
            lat: parseFloat(item.latitude),
            lng: parseFloat(item.longitude)
        },
        description: `${name}은(는) 유가족에게 평온한 안식을 제공하는 품격 있는 장사시설입니다.`,
        imageUrl: item.fileurl ? `https://www.15774129.go.kr${item.fileurl}` : "https://source.unsplash.com/800x600/?memorial",
        imageGallery: [
            item.fileurl ? `https://www.15774129.go.kr${item.fileurl}` : "https://source.unsplash.com/800x600/?memorial",
            "https://source.unsplash.com/800x600/?nature,peace",
            "https://source.unsplash.com/800x600/?architecture,calm"
        ],
        area: area,
        capacity: capacity,
        hasParking: true,
        hasRestaurant: Math.random() > 0.5,
        hasStore: Math.random() > 0.5,
        hasAccessibility: true,
        facilities: {
            elevator: true,
            indoor: isCharnel,
            crematorium: false,
            restArea: true
        },
        environment: {
            quiet: true,
            nature: "우수",
            view: "탁 트임",
            congestion: "보통"
        },
        transportInfo: {
            driveTime: {
                fromSeoul: Math.floor(Math.random() * 60) + 30,
                fromGangnam: Math.floor(Math.random() * 60) + 40
            },
            publicTransport: [],
            parking: { available: true, desc: "무료 주차 가능" }
        },
        highlight: {
            price: "합리적",
            accessibility: "편리함",
            environment: "쾌적함",
            management: "철저",
            availability: "여유"
        },
        tags: [isCharnel ? "봉안당" : "수목장", "시설우수"],
        status: "SELLING",
        priceInfo: {
            priceTable: {
                "기본형": {
                    unit: "명",
                    rows: [
                        { name: "일반실", grade: "일반", userFee: priceRange.min * 10000, managementFee: 50000, price: priceRange.min * 10000 + 50000 },
                        { name: "고급실", grade: "고급", userFee: priceRange.max * 10000, managementFee: 100000, price: priceRange.max * 10000 + 100000 }
                    ]
                }
            },
            additionalCosts: {
                usagePeriod: "영구",
                managementFee: 50000,
                renewable: false
            }
        },
        reviews: [], // 새 데이터라 리뷰 없음
        updatedAt: new Date().toISOString().split('T')[0]
    };
});

// 선불교 데이터 (고정)
const seonbulgyo = {
    id: "sample-seonbulgyo",
    name: "선불교자연장지",
    category: "NATURAL_BURIAL",
    address: "충청북도 영동군 심천면 마곡리 185-3",
    phone: "043-745-7820",
    isPublic: false,
    priceRange: { min: 150, max: 1480 },
    coordinates: { lat: 36.2195, lng: 127.7289 },
    description: "영동군 심천면에 위치한 자연 친화적인 수목장입니다. 선불교의 정신을 담아 평온한 안식을 제공합니다.",
    imageUrl: "https://source.unsplash.com/800x600/?forest,tree,nature&sig=seon",
    imageGallery: [
        "https://source.unsplash.com/800x600/?forest,sunlight",
        "https://source.unsplash.com/800x600/?tree,roots",
        "https://source.unsplash.com/800x600/?mountain,view",
        "https://source.unsplash.com/800x600/?nature,path"
    ],
    area: 45000,
    capacity: 10000,
    hasParking: true,
    hasRestaurant: false,
    hasStore: true,
    hasAccessibility: true,
    facilities: {
        elevator: false, indoor: false, crematorium: false, restArea: true
    },
    environment: {
        quiet: true, nature: "최상", view: "탁 트임", congestion: "여유"
    },
    transportInfo: {
        driveTime: { fromSeoul: 150, fromGangnam: 140 },
        publicTransport: [{ type: "기차", name: "무궁화호", desc: "심천역 하차 후 택시 10분" }],
        parking: { available: true, desc: "전용 주차장 완비" }
    },
    highlight: {
        price: "합리적", accessibility: "차량 필요", environment: "자연 친화", management: "철저", availability: "여유 있음"
    },
    tags: ["수목장", "종교형", "자연", "영동군"],
    status: "SELLING",
    priceInfo: {
        priceTable: {
            "개별 수목장": {
                unit: "명",
                rows: [
                    { name: "개인형 (기본)", grade: "일반", userFee: 1500000, managementFee: 50000, price: 1550000, count: 1 },
                    { name: "개인형 (로얄)", grade: "로얄", userFee: 2500000, managementFee: 50000, price: 2550000, count: 1 }
                ]
            },
            "부부 수목장": {
                unit: "명",
                rows: [
                    { name: "부부형 (기본)", grade: "일반", userFee: 3000000, managementFee: 100000, price: 3100000, count: 2 },
                    { name: "부부형 (대목)", grade: "VIP", userFee: 5000000, managementFee: 100000, price: 5100000, count: 2 }
                ]
            }
        },
        additionalCosts: {
            usagePeriod: "영구",
            managementFee: 50000,
            renewable: false
        }
    },
    operator: { name: "재단법인 선불교", contact: "043-745-7820" },
    reviews: [],
    updatedAt: "2025-12-06"
};

const finalFacilities = [seonbulgyo, ...newFacilities];

const fileContent = `import { Facility } from '@/types';

export const MOCK_FACILITIES: Facility[] = ${JSON.stringify(finalFacilities, null, 4)};
`;

fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`✅ mockData.ts 업데이트 완료! (총 ${finalFacilities.length}개 시설)`);
