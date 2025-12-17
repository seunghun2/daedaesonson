const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// hwp5proc 경로
const HWP5PROC = '/Users/el/Library/Python/3.9/bin/hwp5proc';

// HWP 파일에서 텍스트 추출
function extractHWPText(hwpPath) {
    try {
        const result = execSync(`${HWP5PROC} cat "${hwpPath}" BodyText/Section0 2>/dev/null`, {
            encoding: 'buffer',
            maxBuffer: 10 * 1024 * 1024
        });
        return result.toString('utf8');
    } catch (err) {
        console.log('hwp5proc 에러:', err.message);
        return '';
    }
}

// 숫자 추출 (1,000,000 형식)
function extractNumbers(text) {
    const matches = text.match(/\d{1,3}(,\d{3})+|\d+/g) || [];
    return matches.map(n => parseInt(n.replace(/,/g, '')));
}

// 가격 패턴 분석
function parseOrdinancePrices(hwpPath) {
    console.log(`\n=== 파싱: ${path.basename(hwpPath)} ===\n`);

    const rawText = extractHWPText(hwpPath);

    // 디버깅: 원본 텍스트에서 숫자 추출
    const numbers = extractNumbers(rawText);
    console.log('추출된 숫자들:');

    // 가격으로 보이는 숫자들 (10만 이상, 1000만 이하)
    const priceNumbers = numbers.filter(n => n >= 100000 && n <= 10000000);
    console.log('가격 후보:', priceNumbers);

    // 가격 패턴 그룹화 시도
    // 보은군 기준: 합계 = 사용료 + 관리비
    // 예: 800,000 = 450,000 + 350,000

    const priceGroups = [];
    for (let i = 0; i < priceNumbers.length - 2; i++) {
        const total = priceNumbers[i];
        const fee1 = priceNumbers[i + 1];
        const fee2 = priceNumbers[i + 2];

        // 합계 = 두 값의 합
        if (fee1 + fee2 === total) {
            priceGroups.push({
                total,
                usageFee: fee1,
                managementFee: fee2
            });
            i += 2; // 다음 그룹으로
        }
    }

    console.log('\n가격 그룹 (합계 = 사용료 + 관리비):');
    priceGroups.forEach((g, i) => {
        console.log(`  ${i + 1}. 합계: ${g.total.toLocaleString()} = 사용료: ${g.usageFee.toLocaleString()} + 관리비: ${g.managementFee.toLocaleString()}`);
    });

    return priceGroups;
}

// 보은군 HWP 파일 파싱
const boeunHWP = '[별표 3] 공설장사시설 사용료 및 관리비(보은군 장사시설 설치 및 운영 조례) (2).hwp';
const hwpPath = path.join(__dirname, '..', boeunHWP);

if (fs.existsSync(hwpPath)) {
    const prices = parseOrdinancePrices(hwpPath);

    // 결과 저장
    fs.writeFileSync('data/ordinance_hwp/boeun_parsed.json', JSON.stringify(prices, null, 2));
    console.log('\n저장 완료: data/ordinance_hwp/boeun_parsed.json');
} else {
    console.log('HWP 파일을 찾을 수 없습니다:', hwpPath);
}
