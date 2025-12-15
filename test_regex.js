const xlsx = require('xlsx');

// Full Text 샘플 데이터 (방금 출력한 것 기반)
const samples = [
    "\n\n원격지원요청국가상징\n화장예약서비스장례문화 디지털 플랫폼장사시설서비스(시설업무용)\n장사시설/장례용품가격\n장사시설장사시설/장례용품가격\n사설\n(재)개나리추모공원\n전화팩스길찾기공유\n홈페이지\n충청북도 제천시 송학면 도화로 194 (도화리)주소\n043-642-4444전화번호\n-팩스번호\n총매장능력7,630 개편의시설\n22개월전 업데이트업데이트",
    "\n\n원격지원요청국가상징\n화장예약서비스장례문화 디지털 플랫폼장사시설서비스(시설업무용)\n장사시설/장례용품가격\n장사시설장사시설/장례용품가격\n사설\n(재)경맥백합공원\n전화팩스길찾기공유\n홈페이지\n경상북도 경산시 남천면 남천로 188-60 (흥산리)주소\n053-813-6044전화번호\n-팩스번호\n총매장능력10,895 개주차가능대수80 대편의시설\n38개월전 업데이트업데이트"
];

function extractMeta(fullText) {
    const lines = fullText.split('\n');
    const result = { address: '', phone: '', capacity: 0 };

    // 주소 추출
    // 패턴: "xxxx 주소" -> xxxx 추출
    const addressMatch = fullText.match(/(.*?)(?:\s*)주소\n/);
    if (addressMatch) {
        // 뒤에서부터 '주소' 키워드를 찾거나, 줄 단위로 검사하는 게 나음
        // 줄 단위 검사
        const addrLine = lines.find(l => l.endsWith('주소'));
        if (addrLine) result.address = addrLine.replace('주소', '').trim();
    }

    // 전화번호 추출
    // 패턴: "000-0000-0000전화번호"
    const phoneLine = lines.find(l => l.includes('전화번호'));
    if (phoneLine) {
        const match = phoneLine.match(/([\d-]+)전화번호/);
        if (match) result.phone = match[1];
    }

    // 매장능력 (capacity)
    // 패턴: "총매장능력7,630 개"
    const capLine = lines.find(l => l.includes('총매장능력'));
    if (capLine) {
        const match = capLine.match(/총매장능력([\d,]+)\s*개/);
        if (match) {
            result.capacity = parseInt(match[1].replace(/,/g, ''), 10);
        }
    }

    return result;
}

samples.forEach((text, i) => {
    console.log(`Sample ${i + 1}:`, extractMeta(text));
});
