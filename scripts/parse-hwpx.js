const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function parseHWPX(hwpxPath) {
    const baseName = path.basename(hwpxPath, '.hwpx');
    const tempDir = path.join(path.dirname(hwpxPath), `${baseName}_temp`);

    console.log(`\n=== 파싱: ${path.basename(hwpxPath)} ===`);

    // 1. hwpx 압축 해제
    try {
        execSync(`unzip -o "${hwpxPath}" -d "${tempDir}" 2>/dev/null`);
    } catch (e) {
        console.log('압축 해제 실패');
        return null;
    }

    // 2. section0.xml 읽기
    const xmlPath = path.join(tempDir, 'Contents', 'section0.xml');
    if (!fs.existsSync(xmlPath)) {
        console.log('section0.xml 없음');
        return null;
    }

    const xml = fs.readFileSync(xmlPath, 'utf8');

    // 3. <hp:t> 태그 내용 추출 (텍스트 내용)
    const textMatches = xml.match(/<hp:t>([^<]+)<\/hp:t>/g) || [];
    const texts = textMatches.map(m => m.replace(/<hp:t>|<\/hp:t>/g, ''));

    console.log('추출된 텍스트:', texts.slice(0, 50));

    // 4. 가격 패턴 찾기 (숫자,숫자 형식)
    const prices = texts.filter(t => /^[\d,]+$/.test(t.trim()));
    console.log('가격 숫자:', prices);

    // 5. 라벨 찾기 (단장, 합장, 관내, 관외 등)
    const labels = texts.filter(t =>
        t.includes('단') || t.includes('합') ||
        t.includes('관내') || t.includes('관외') ||
        t.includes('년') || t.includes('사용료') || t.includes('관리비')
    );
    console.log('라벨:', labels);

    // 6. 정리 및 반환
    const result = {
        file: path.basename(hwpxPath),
        allTexts: texts,
        prices: prices.map(p => parseInt(p.replace(/,/g, ''))),
        labels: labels
    };

    // 임시 폴더 삭제
    execSync(`rm -rf "${tempDir}"`);

    return result;
}

// 모든 hwpx 파일 처리
function processAllHWPX() {
    const baseDir = 'data/ordinance_hwp';
    const results = [];

    // 하위 폴더 순회
    const regions = fs.readdirSync(baseDir).filter(f =>
        fs.statSync(path.join(baseDir, f)).isDirectory() && !f.startsWith('.')
    );

    for (const region of regions) {
        const regionDir = path.join(baseDir, region);
        const files = fs.readdirSync(regionDir).filter(f => f.endsWith('.hwpx') || f.endsWith('.hwp'));

        for (const file of files) {
            const filePath = path.join(regionDir, file);

            if (file.endsWith('.hwpx')) {
                const result = parseHWPX(filePath);
                if (result) {
                    result.region = region;
                    results.push(result);
                }
            } else {
                console.log(`\n=== 스킵 (hwp): ${file} ===`);
            }
        }
    }

    // 결과 저장
    fs.writeFileSync('data/ordinance_hwp/parsed_results.json', JSON.stringify(results, null, 2));
    console.log('\n\n=== 저장 완료: data/ordinance_hwp/parsed_results.json ===');
    console.log(`처리된 파일: ${results.length}개`);
}

processAllHWPX();
