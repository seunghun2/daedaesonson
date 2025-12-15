
const fs = require('fs');
const path = require('path');

// 주요 도시 좌표 및 비중설정
const CITIES = [
    { name: 'Seoul', lat: 37.5665, lng: 126.9780, weight: 0.3 },     // 서울
    { name: 'Gyeonggi', lat: 37.4138, lng: 127.5183, weight: 0.2 },  // 경기
    { name: 'Busan', lat: 35.1796, lng: 129.0756, weight: 0.15 },    // 부산
    { name: 'Daegu', lat: 35.8714, lng: 128.6014, weight: 0.1 },     // 대구
    { name: 'Incheon', lat: 37.4563, lng: 126.7052, weight: 0.1 },   // 인천
    { name: 'Gwangju', lat: 35.1595, lng: 126.8526, weight: 0.05 },  // 광주
    { name: 'Daejeon', lat: 36.3504, lng: 127.3845, weight: 0.05 },  // 대전
    { name: 'Ulsan', lat: 35.5384, lng: 129.3114, weight: 0.05 },    // 울산
];

function getRandomCoordinates(centerLat, centerLng, radiusKm = 10) {
    const r = radiusKm / 111.32; // 대략적인 도 단위 변환
    const u = Math.random();
    const v = Math.random();
    const w = r * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);

    // 경도는 위도에 따라 거리가 다르므로 보정 필요하지만 대략적으로 계산
    return {
        lat: centerLat + y,
        lng: centerLng + x / Math.cos(centerLat * Math.PI / 180)
    };
}

function selectCity() {
    const rand = Math.random();
    let sum = 0;
    for (const city of CITIES) {
        sum += city.weight;
        if (rand <= sum) return city;
    }
    return CITIES[0];
}

async function main() {
    const dataPath = path.join(__dirname, '../lib/mockData.ts');
    const content = fs.readFileSync(dataPath, 'utf8');

    // MOCK_FACILITIES 배열 부분 찾기 (단순 정규식으로 파싱 시도)
    // 실제 파일 내용을 좀 봐야겠지만, 기본적으로 객체 형태를 유지하면서 좌표만 바꿈.
    // TS 파일을 직접 파싱하긴 어려우니, 기존 mockData의 구조를 정규식으로 읽어서
    // coordinates: { lat: ..., lng: ... } 부분만 교체하는 방식을 씁니다.

    let newContent = content.replace(/coordinates:\s*{\s*lat:\s*[\d.]+\s*,\s*lng:\s*[\d.]+\s*}/g, () => {
        const city = selectCity();
        const coords = getRandomCoordinates(city.lat, city.lng, 15); // 반경 15km 내
        return `coordinates: { lat: ${coords.lat.toFixed(6)}, lng: ${coords.lng.toFixed(6)} }`;
    });

    fs.writeFileSync(dataPath, newContent, 'utf8');
    console.log('✅ 좌표 무작위 분산 완료!');
}

main();
