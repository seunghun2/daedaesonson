const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// HWPX 파싱 (ZIP 기반)
function parseHWPX(hwpxPath) {
    const baseName = path.basename(hwpxPath, '.hwpx');
    const tempDir = path.join(path.dirname(hwpxPath), `${baseName}_temp`);

    try {
        execSync(`unzip -o "${hwpxPath}" -d "${tempDir}" 2>/dev/null`);
        const xmlPath = path.join(tempDir, 'Contents', 'section0.xml');
        if (!fs.existsSync(xmlPath)) return null;

        const xml = fs.readFileSync(xmlPath, 'utf8');
        const texts = (xml.match(/<hp:t>([^<]+)<\/hp:t>/g) || [])
            .map(m => m.replace(/<hp:t>|<\/hp:t>/g, '').trim())
            .filter(t => t.length > 0);

        execSync(`rm -rf "${tempDir}"`);
        return texts;
    } catch (e) {
        return null;
    }
}

// HWP 파싱 (hwp5proc xml)
function parseHWP(hwpPath) {
    try {
        const result = execSync(
            `/Users/el/Library/Python/3.9/bin/hwp5proc xml "${hwpPath}" 2>/dev/null`,
            { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
        );

        const texts = (result.match(/<Text[^>]*>([^<]+)<\/Text>/g) || [])
            .map(m => m.replace(/<Text[^>]*>|<\/Text>/g, '').trim())
            .filter(t => t.length > 0);

        return texts;
    } catch (e) {
        return null;
    }
}

// 시설유형 추출
function extractFacilityType(fileName, texts) {
    const fileNameLower = fileName.toLowerCase();
    const allText = texts.join(' ');

    if (allText.includes('화장') || fileNameLower.includes('화장')) return '화장시설';
    if (allText.includes('봉안담') || fileNameLower.includes('봉안담')) return '봉안담';
    if (allText.includes('봉안당') || fileNameLower.includes('봉안당')) return '봉안당';
    if (allText.includes('추모의 집') || fileNameLower.includes('추모')) return '추모시설';
    if (allText.includes('자연장') || fileNameLower.includes('자연장')) return '자연장지';
    if (allText.includes('묘역') || allText.includes('묘지') || allText.includes('분묘')) return '묘역시설';
    if (allText.includes('안식공원')) return '안식공원';
    return '장사시설';
}

// 가격 행 추출
function extractPriceRows(texts, region, fileName) {
    const rows = [];
    const facilityType = extractFacilityType(fileName, texts);
    const allText = texts.join(' ');

    // (천원) 단위 감지
    const isThousandUnit = allText.includes('천원') || allText.includes('千원') ||
        allText.includes('(천)') || allText.includes('단위: 천');

    // 가격 패턴 (콤마 포함)
    const pricePattern = /^[\d,]+$/;

    // 기간 패턴
    const periodPattern = /^\d+년$/;

    // 구분 키워드
    const categoryKeywords = ['단장', '합장', '단 장', '합 장', '1기당', '1기', '개인', '부부', '가족'];
    const residencyKeywords = ['관내', '관외'];

    let currentCategory = '';
    let currentResidency = '';
    let currentPeriod = '';
    let prices = [];

    for (let i = 0; i < texts.length; i++) {
        const text = texts[i].trim();

        // 카테고리 감지
        for (const kw of categoryKeywords) {
            if (text.includes(kw)) {
                currentCategory = text;
                break;
            }
        }

        // 거주구분 감지
        for (const kw of residencyKeywords) {
            if (text === kw || text.includes(kw)) {
                currentResidency = kw;
                break;
            }
        }

        // 기간 감지
        if (periodPattern.test(text)) {
            currentPeriod = text;
        }

        // 가격 감지
        if (pricePattern.test(text)) {
            let price = parseInt(text.replace(/,/g, ''));

            // 천원 단위면 1000 곱하기
            if (isThousandUnit && price >= 10 && price <= 99999) {
                price = price * 1000;
            }

            if (price >= 10000 && price <= 100000000) {
                prices.push(price);

                // 3개의 가격이 모이면 검증 후 행 생성
                if (prices.length === 3) {
                    let usageFee, managementFee, total;

                    // 기본: 사용료, 관리비, 합계 순서
                    if (prices[0] + prices[1] === prices[2]) {
                        usageFee = prices[0];
                        managementFee = prices[1];
                        total = prices[2];
                    }
                    // 대안1: 합계, 사용료, 관리비 순서
                    else if (prices[1] + prices[2] === prices[0]) {
                        total = prices[0];
                        usageFee = prices[1];
                        managementFee = prices[2];
                    }
                    // 대안2: 사용료, 합계, 관리비 순서 (비정상이지만 기록)
                    else {
                        // 가장 큰 값을 합계로 추정
                        const sorted = [...prices].sort((a, b) => b - a);
                        total = sorted[0];
                        usageFee = sorted[1];
                        managementFee = sorted[2];
                    }

                    rows.push({
                        region,
                        fileName: path.basename(fileName),
                        facilityType,
                        category: currentCategory || '-',
                        residency: currentResidency || '-',
                        period: currentPeriod || '-',
                        usageFee,
                        managementFee,
                        total
                    });
                    prices = [];
                }
            }
        }
    }

    // 남은 가격 처리 (2개만 있는 경우: 사용료, 합계)
    if (prices.length === 2) {
        rows.push({
            region,
            fileName: path.basename(fileName),
            facilityType,
            category: currentCategory || '-',
            residency: currentResidency || '-',
            period: currentPeriod || '-',
            usageFee: prices[0],
            managementFee: 0,
            total: prices[1]
        });
    }

    return rows;
}

// 모든 파일 처리 (중첩 폴더 지원)
function processAllFiles() {
    const baseDir = 'data/ordinance_hwp';
    const allRows = [];

    // 재귀적으로 모든 hwp/hwpx 파일 찾기
    function findFiles(dir, regionName) {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            if (item.startsWith('.')) continue;

            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                // 중첩 폴더면 재귀 탐색 (지역명 유지 또는 업데이트)
                const newRegion = regionName || item;
                findFiles(itemPath, newRegion);
            } else if (item.endsWith('.hwpx') || item.endsWith('.hwp')) {
                // 파일 처리
                const region = regionName || path.basename(path.dirname(itemPath));
                let texts = null;

                if (item.endsWith('.hwpx')) {
                    texts = parseHWPX(itemPath);
                } else {
                    texts = parseHWP(itemPath);
                }

                if (texts && texts.length > 0) {
                    const rows = extractPriceRows(texts, region, item);
                    if (rows.length > 0) {
                        console.log(`  ${region} | ${item.substring(0, 35)}... → ${rows.length}행`);
                        allRows.push(...rows);
                    }
                }
            }
        }
    }

    console.log('파일 탐색 중...');
    findFiles(baseDir, null);

    // JSON 저장
    fs.writeFileSync('data/ordinance_hwp/structured_prices.json', JSON.stringify(allRows, null, 2));
    console.log(`\n\n=== 저장 완료 ===`);
    console.log(`총 ${allRows.length}행 데이터`);

    return allRows;
}

const rows = processAllFiles();
console.log('\n샘플 데이터 (처음 10개):');
rows.slice(0, 10).forEach((r, i) => {
    console.log(`${i + 1}. ${r.region} | ${r.facilityType} | ${r.category} | ${r.residency} | ${r.period} | ${r.usageFee} | ${r.managementFee} | ${r.total}`);
});
