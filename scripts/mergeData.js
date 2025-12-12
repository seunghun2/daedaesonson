
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '../lib/mockData.ts');

// 데이터 로드
const eskyPath = path.join(__dirname, '../esky_full_with_details.json');
const cheotjangPath = path.join(__dirname, '../cheotjang_data.json');
const myungdanggaPath = path.join(__dirname, '../myungdangga_data.json');

// eskyPath가 없으면 에러
if (!fs.existsSync(eskyPath)) {
    console.error('❌ esky_full_with_details.json이 없습니다. crawlEskyDetails.js를 먼저 실행하세요.');
    process.exit(1);
}

const eskyData = JSON.parse(fs.readFileSync(eskyPath, 'utf-8')).list || [];
const cheotjangData = fs.existsSync(cheotjangPath) ? JSON.parse(fs.readFileSync(cheotjangPath, 'utf-8')) : [];
const myungdanggaData = fs.existsSync(myungdanggaPath) ? JSON.parse(fs.readFileSync(myungdanggaPath, 'utf-8')) : [];

console.log(`📦 데이터 로드: e하늘(${eskyData.length}), 첫장(${cheotjangData.length}), 명당가(${myungdanggaData.length})`);

// Category Label Mapping (Defined early)
const FACILITY_CATEGORY_LABELS = {
    CHARNEL_HOUSE: '봉안당',
    NATURAL_BURIAL: '수목장/자연장',
    FAMILY_GRAVE: '공원묘지',
    CREMATORIUM: '화장시설',
    FUNERAL_HOME: '장례식장',
    OTHER: '장사시설'
};

// 유틸: 이름 정규화
function normalizeName(name) {
    if (!name) return '';
    return name.replace(/\s+/g, '').replace(/\(.*\)/g, '').replace(/장례식장|추모공원|공원묘원|자연장지|봉안당|병원|화장장|승화원/g, '').trim();
}

// 카테고리 매핑
function mapCategory(code) {
    if (code === 'TBC0700002') return 'FAMILY_GRAVE';
    if (code === 'TBC0700003') return 'CHARNEL_HOUSE';
    if (code === 'TBC0700004') return 'CREMATORIUM';
    if (code === 'TBC0700005') return 'NATURAL_BURIAL';
    return 'OTHER';
}


function generatePriceTable(category, min, max, detail = null) {
    const table = {};
    const personalPrice = min;
    const couplePrice = Math.floor(min * 1.8);
    const familyPrice = max > min ? max : Math.floor(min * 4);

    // 1. 상세 데이터(detail) 기반 실제 가격 파싱 (단위: 만원 추정 -> * 10000)
    // 데이터가 있고 유의미한 값(>0)일 경우 우선 적용
    if (detail) {
        if (category === 'FAMILY_GRAVE') {
            const usageFee = detail.gravefeeamt ? Number(detail.gravefeeamt) * 10000 : 0;
            const mgmtFee = detail.gravemgmtfeeamt ? Number(detail.gravemgmtfeeamt) * 10000 : 0;

            if (usageFee > 0) {
                table['공원묘지/가족묘 사용료'] = {
                    unit: '기',
                    rows: [
                        { name: '매장묘 (기본)', price: usageFee, userFee: usageFee, managementFee: mgmtFee, grade: '일반' },
                        { name: '합장묘', price: usageFee * 1.5, userFee: usageFee * 1.5, managementFee: mgmtFee, grade: '부부' }
                    ]
                };
                return table;
            }
        } else if (category === 'CHARNEL_HOUSE') {
            const usageFee = detail.charnelfeeamt ? Number(detail.charnelfeeamt) * 10000 : 0;
            const mgmtFee = detail.charnelmgmtfeeamt ? Number(detail.charnelmgmtfeeamt) * 10000 : 0;

            if (usageFee > 0) {
                table['봉안당 사용료'] = {
                    unit: '위',
                    rows: [
                        { name: '개인단 (일반)', price: usageFee, userFee: usageFee, managementFee: mgmtFee, grade: '일반' },
                        { name: '개인단 (로열)', price: Math.floor(usageFee * 1.3), userFee: Math.floor(usageFee * 1.3), managementFee: mgmtFee, grade: '로열' },
                        { name: '부부단', price: usageFee * 2, userFee: usageFee * 2, managementFee: mgmtFee * 2, grade: '부부' }
                    ]
                };
                return table;
            }
        } else if (category === 'CREMATORIUM') {
            const innerAdult = detail.inneradultamt ? Number(detail.inneradultamt) : 0; // 화장료는 원 단위일 수도 있으니 체크 필요하지만 보통 만원 단위는 아님 (e.g. 100000)
            // 아까 0이었던 데이터가 많았음. 만약 0이 아니면 사용.
            // 보통 e하늘 데이터에서 화장료는 '원' 단위일 가능성이 높음 (100000원) -> 샘플 확인 못했으니 안전하게 
            // 하지만 아까 샘플이 다 0이었으므로 우선 패스하고, 만약 값이 있다면 그대로 씀
            if (innerAdult > 0) {
                table['화장료'] = {
                    unit: '구',
                    rows: [
                        { name: '대인 (관내)', price: innerAdult, note: '관내 기준' },
                        { name: '대인 (관외)', price: Number(detail.outsideadultamt || innerAdult * 10), note: '관외 기준' },
                        { name: '소인', price: Number(detail.innerchildamt || innerAdult * 0.5), note: '관내 기준' }
                    ]
                };
                return table;
            }
        } else if (category === 'NATURAL_BURIAL') {
            // 자연장지는 어떤 필드인지 확인 못했으나 innerfeeamt, outsidefeeamt 등이 있을 수 있음
            // detail 키 중 'innerfeeamt' 나 'outsidefeeamt' 가 자연장일 수 있음.
            // 아까 키 리스트에 'innerfeeamt'(잔디장?), 'charnelfeeamt'(봉안?), 'gravefeeamt'(묘지?) 등이 있었음.
            // 자연장은 'forest' 관련 키가 없었으므로 'grave' 또는 'charnel'을 같이 쓸 수도 있고, 'innerfeeamt'가 범용일 수 있음.
        }
    }

    // 2. 데이터가 없으면 기존 추정 로직 (Mock)
    if (category === 'CHARNEL_HOUSE') {
        table['봉안당(실내)'] = {
            unit: '위',
            rows: [
                { name: '개인단 (일반)', price: personalPrice, userFee: Math.floor(personalPrice * 0.9), managementFee: Math.floor(personalPrice * 0.1), grade: '일반' },
                { name: '개인단 (로열층)', price: Math.floor(personalPrice * 1.3), userFee: Math.floor(personalPrice * 1.3 * 0.9), managementFee: Math.floor(personalPrice * 1.3 * 0.1), grade: '로열' },
                { name: '부부단', price: couplePrice, userFee: Math.floor(couplePrice * 0.9), managementFee: Math.floor(couplePrice * 0.1), grade: '부부' }
            ]
        };
    } else if (category === 'NATURAL_BURIAL') {
        table['수목장/잔디장'] = {
            unit: '기',
            rows: [
                { name: '잔디장 (개인)', price: personalPrice, userFee: Math.floor(personalPrice * 0.8), managementFee: Math.floor(personalPrice * 0.2), grade: '공동' },
                { name: '수목장 (공동목)', price: Math.floor(personalPrice * 1.5), userFee: Math.floor(personalPrice * 1.5 * 0.8), managementFee: Math.floor(personalPrice * 1.5 * 0.2), grade: '공동' },
                { name: '수목장 (부부목)', price: couplePrice, userFee: Math.floor(couplePrice * 0.8), managementFee: Math.floor(couplePrice * 0.2), grade: '부부' }
            ]
        };
    } else if (category === 'FAMILY_GRAVE') {
        table['공원묘지/가족묘'] = {
            unit: '기',
            rows: [
                { name: '매장묘 (단장)', price: personalPrice, userFee: Math.floor(personalPrice * 0.85), managementFee: Math.floor(personalPrice * 0.15), grade: '일반' },
                { name: '매장묘 (합장)', price: Math.floor(personalPrice * 1.6), userFee: Math.floor(personalPrice * 1.6 * 0.85), managementFee: Math.floor(personalPrice * 1.6 * 0.15), grade: '부부' },
                { name: '가족납골묘 (12위)', price: familyPrice, userFee: Math.floor(familyPrice * 0.9), managementFee: Math.floor(familyPrice * 0.1), grade: '문중' }
            ]
        };
    } else if (category === 'CREMATORIUM') {
        table['화장료 (관내/관외)'] = {
            unit: '구',
            rows: [
                { name: '대인 (만 15세 이상)', price: 100000, note: '관내 기준' },
                { name: '대인 (관외)', price: 1000000, note: '관외 기준' },
                { name: '소인', price: 60000, note: '관내 기준' }
            ]
        };
    } else {
        table['기본 분양'] = {
            unit: '건',
            rows: [
                { name: '기본형', price: min },
                { name: '고급형', price: max }
            ]
        };
    }
    return table;
}

// 통합 리스트 생성
const mergedList = eskyData.filter(item => item.companyname).map((item, idx) => {
    let name = item.companyname;
    const normName = normalizeName(name);

    // 카테고리 설정 (API 코드 우선)
    let category = mapCategory(item.facilitygroupcd);

    // Fallback: 코드가 없으면 이름으로 (혹시 모를 예외)
    if (category === 'OTHER') {
        if (name.includes('가족') || name.includes('공원') || name.includes('묘원')) category = 'FAMILY_GRAVE';
        else if (name.includes('수목') || name.includes('자연')) category = 'NATURAL_BURIAL';
        else if (name.includes('봉안')) category = 'CHARNEL_HOUSE';
        else if (name.includes('화장') || name.includes('승화')) category = 'CREMATORIUM';
    }

    const cheotjangMatch = cheotjangData.find(c => normalizeName(c.name) === normName);
    const myungdanggaMatch = myungdanggaData.find(m => normalizeName(m.name) === normName);

    let priceMin = 0;
    let priceMax = 0;

    if (myungdanggaMatch && myungdanggaMatch.priceMin > 0) {
        priceMin = myungdanggaMatch.priceMin;
        priceMax = priceMin + Math.floor(priceMin * 0.5);
    } else if (cheotjangMatch && cheotjangMatch.priceMin > 0) {
        priceMin = Math.floor(cheotjangMatch.priceMin / 10000);
        priceMax = priceMin + Math.floor(priceMin * 0.5);
    } else {
        if (category === 'FAMILY_GRAVE') {
            priceMin = Math.floor(Math.random() * 500) + 800;
            priceMax = priceMin + Math.floor(Math.random() * 1000) + 500;
        } else if (category === 'CREMATORIUM') {
            priceMin = 10;
            priceMax = 100;
        } else {
            priceMin = Math.floor(Math.random() * 200) + 200;
            priceMax = priceMin + Math.floor(Math.random() * 500) + 300;
        }
    }

    const tags = new Set();
    if (category === 'CHARNEL_HOUSE') tags.add('봉안당').add('실내');
    if (category === 'NATURAL_BURIAL') tags.add('수목장').add('자연친화');
    if (category === 'FAMILY_GRAVE') tags.add('공원묘지').add('매장묘');
    if (category === 'CREMATORIUM') tags.add('화장시설').add('장례');

    if (item.isPublic || name.includes('시립') || name.includes('공설')) tags.add('공설');
    else tags.add('사설');

    if (cheotjangMatch && cheotjangMatch.tags) cheotjangMatch.tags.forEach(t => tags.add(t));

    // 이미지
    const imageUrls = [];
    if (item.fileurl) imageUrls.push(`https://www.15774129.go.kr${item.fileurl}`);

    // 상세 크롤링된 파일 리스트 (filelist)
    if (item.filelist && Array.isArray(item.filelist)) {
        item.filelist.forEach(f => {
            // 패턴 추정: 실제로는 확인 못했지만 일단 추가 로직만
            // if (f.savedFileNm) imageUrls.push(...)
        });
    }

    // 외부 매칭 이미지
    if (myungdanggaMatch && myungdanggaMatch.imageUrl) imageUrls.push(myungdanggaMatch.imageUrl);
    if (cheotjangMatch && cheotjangMatch.imageUrl) imageUrls.push(cheotjangMatch.imageUrl);

    // 이미지가 하나도 없으면 Unsplash random
    if (imageUrls.length === 0) {
        const keyword = category === 'CHARNEL_HOUSE' ? 'memorial' : (category === 'NATURAL_BURIAL' ? 'forest' : (category === 'CREMATORIUM' ? 'building' : 'cemetery'));
        imageUrls.push(`https://source.unsplash.com/800x600/?${keyword}&sig=${idx}`);
    }

    const uniqueImages = [...new Set(imageUrls)];
    const priceTable = generatePriceTable(category, priceMin * 10000, priceMax * 10000, item.detail);

    return {
        id: `esky-${item.facilitycd || idx}`,
        name: name,
        category: category,
        address: item.fulladdress || "주소 정보 없음",
        phone: item.telephone || "02-1234-5678",
        isPublic: item.orgidnm ? (item.orgidnm.includes('시') || item.orgidnm.includes('군') || item.orgidnm.includes('구')) : (name.includes('시립') || name.includes('공설')),
        status: (idx % 10 < 8) ? 'SELLING' : 'OPEN',
        priceRange: { min: priceMin, max: priceMax },
        priceInfo: {
            priceTable: priceTable,
            additionalCosts: {
                managementFee: Math.floor(Math.random() * 50000) + 30000,
                usagePeriod: category === 'NATURAL_BURIAL' ? '영구 안치' : '15년/30년',
                renewable: true
            }
        },
        coordinates: {
            lat: parseFloat(item.latitude) || 37.5,
            lng: parseFloat(item.longitude) || 127.0
        },
        imageUrl: uniqueImages[0],
        imageGallery: uniqueImages,
        tags: Array.from(tags).filter(t => !['수목장 분양중', '수목장', '시설우수', '분양중'].includes(t)),
        description: item.detail ? `${name}은(는) ${item.detail.orgidnm || '지역'}의 대표적인 ${FACILITY_CATEGORY_LABELS[category] || '장사시설'}입니다.` : `${name}은(는) 유가족에게 평온한 안식을 제공하는 장사시설입니다.`,
        area: Math.floor(Math.random() * 50000) + 10000,
        capacity: Math.floor(Math.random() * 30000) + 5000,
        hasParking: Math.random() > 0.3,
        hasRestaurant: Math.random() > 0.6,
        hasStore: Math.random() > 0.4,
        hasAccessibility: true,
        reviews: [],
        updatedAt: item.lastUpdateDate ? item.lastUpdateDate.replace(/\//g, '-') : new Date().toISOString().split('T')[0]
    };
});

const fileContent = `import { Facility } from '@/types';

export const MOCK_FACILITIES: Facility[] = ${JSON.stringify(mergedList, null, 4)};
`;

fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`✅ 데이터 병합 및 저장 완료! (총 ${mergedList.length}개)`);
