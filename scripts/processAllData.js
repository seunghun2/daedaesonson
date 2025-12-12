const fs = require('fs');
const path = require('path');

// 경로 설정
const rawPath = path.join(__dirname, '../data/crawled_all.json');
const outputPath = path.join(__dirname, '../lib/mockData.ts');

if (!fs.existsSync(rawPath)) {
    console.error('❌ 크롤링 데이터 파일이 없습니다:', rawPath);
    process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
const { esky = [], cheotjang = [], myungdangga = [] } = rawData;

console.log(`📦 데이터 로드 완료: e하늘(${esky.length}), 첫장(${cheotjang.length}), 명당가(${myungdangga.length})`);

// 헬퍼 함수: 이름 정규화 (공백, 주식회사 등 제거)
function normalizeName(name) {
    return name.replace(/\(주\)|주식회사|재단법인|유한회사|\s/g, '');
}

// 헬퍼 함수: 랜덤 가격 생성 (데이터 없을 때)
function generateRandomPrice() {
    const min = Math.floor(Math.random() * 300) + 100; // 100~400만
    const max = min + Math.floor(Math.random() * 1000) + 500; // +500~1500만
    return { min, max };
}

// 헬퍼 함수: 카테고리 추론
function inferCategory(name, facilityGroupCd) {
    if (name.includes('수목') || name.includes('자연') || name.includes('숲')) return 'NATURAL_BURIAL';
    if (name.includes('공원') || name.includes('묘지')) return 'GRAVE'; // 매장묘/공원묘지
    return 'CHARNEL_HOUSE'; // 기본값: 봉안당
}

// 통합 데이터 처리
const processedFacilities = esky.map((item, idx) => {
    // 1. 기본 정보 매핑
    let name = item.companyname;
    const normName = normalizeName(name);

    // 카테고리 결정
    // TBC0700001: 장례식장, 그 외 코드가 봉안당 등일 수 있음. 일단 이름 기반 추론
    const category = inferCategory(name, item.facilitygroupcd);

    // 2. 추가 정보(이미지, 가격) 매칭 시도
    let matchedExtra = null;

    // 첫장 매칭
    const fromCheotjang = cheotjang.find(c => normalizeName(c.name).includes(normName) || normName.includes(normalizeName(c.name)));
    // 명당가 매칭
    const fromMyungdangga = myungdangga.find(m => normalizeName(m.name).includes(normName) || normName.includes(normalizeName(m.name)));

    matchedExtra = fromCheotjang || fromMyungdangga;

    // 가격 설정 (매칭된 정보 우선, 없으면 랜덤)
    let priceRange = generateRandomPrice();
    if (matchedExtra && matchedExtra.priceMin > 0) {
        priceRange = {
            min: matchedExtra.priceMin,
            max: matchedExtra.priceMin + 500 // 최대값은 임의 설정
        };
    }

    // 이미지 설정
    let imageUrl = item.fileurl ? `https://www.15774129.go.kr${item.fileurl}` : "https://source.unsplash.com/800x600/?memorial";
    if (matchedExtra && matchedExtra.imageUrl) {
        imageUrl = matchedExtra.imageUrl;
    }

    // 좌표 처리
    const lat = parseFloat(item.latitude);
    const lng = parseFloat(item.longitude);

    // 유효하지 않은 좌표 건너뛰기 플래그 (나중에 필터링)
    if (!lat || !lng) return null;

    return {
        id: `fac-${item.facilitycd || idx}`,
        name: name,
        category: category,
        address: item.fulladdress || item.roadaddr,
        phone: item.telephone || "02-1234-5678",
        isPublic: item.publiccode === 'TCM0100002',
        priceRange: priceRange,
        coordinates: { lat, lng },
        description: `${name}은(는) 유가족에게 평온한 안식을 제공하는 품격 있는 장사시설입니다.`,
        imageUrl: imageUrl,
        imageGallery: [
            imageUrl,
            "https://source.unsplash.com/800x600/?nature,peace",
            "https://source.unsplash.com/800x600/?architecture,calm"
        ],
        area: Math.floor(Math.random() * 50000) + 10000,
        capacity: Math.floor(Math.random() * 10000) + 1000,
        hasParking: true,
        hasRestaurant: Math.random() > 0.5,
        hasStore: Math.random() > 0.5,
        hasAccessibility: true,
        facilities: {
            elevator: true,
            indoor: category === 'CHARNEL_HOUSE',
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
            driveTime: { fromSeoul: 60, fromGangnam: 50 },
            publicTransport: [],
            parking: { available: true, desc: "무료 주차 가능" }
        },
        highlight: {
            price: priceRange.min < 300 ? "합리적" : "고품격",
            accessibility: "편리함",
            environment: "쾌적함",
            management: matchedExtra ? "검증됨" : "철저",
            availability: "여유"
        },
        tags: [category === 'CHARNEL_HOUSE' ? "봉안당" : "자연장", name.includes("기독") ? "기독교" : (name.includes("불교") ? "불교" : "무종교")],
        status: "SELLING",
        priceInfo: {
            priceTable: {
                "기본형": {
                    unit: "위",
                    rows: [
                        { name: "개인단", grade: "일반", userFee: priceRange.min * 10000, managementFee: 50000, price: priceRange.min * 10000 + 50000 }
                    ]
                }
            },
            additionalCosts: {
                usagePeriod: "영구/15년",
                managementFee: 50000,
                renewable: true
            }
        },
        reviews: [],
        updatedAt: new Date().toISOString().split('T')[0]
    };
}).filter(item => item !== null); // 좌표 없는 항목 제거

// Mock Data 파일 포맷 생성
const fileContent = `// @ts-nocheck
import { Facility } from '@/types';

export const MOCK_FACILITIES: Facility[] = ${JSON.stringify(processedFacilities, null, 4)};
`;

fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`✅ mockData.ts 업데이트 완료! (총 ${processedFacilities.length}개 유효 시설)`);
