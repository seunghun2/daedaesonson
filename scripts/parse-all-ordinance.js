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
            .map(m => m.replace(/<hp:t>|<\/hp:t>/g, ''));

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

        // <Text ...>내용</Text> 패턴 추출
        const texts = (result.match(/<Text[^>]*>([^<]+)<\/Text>/g) || [])
            .map(m => m.replace(/<Text[^>]*>|<\/Text>/g, ''));

        return texts;
    } catch (e) {
        console.log('hwp5proc 에러:', e.message);
        return null;
    }
}

// 텍스트 배열에서 가격 데이터 구조화
function structurePriceData(texts, region, fileName) {
    const prices = texts.filter(t => /^[\d,]+$/.test(t.trim()));
    const labels = texts.filter(t =>
        t.includes('단') || t.includes('합') ||
        t.includes('관내') || t.includes('관외') ||
        t.includes('년') || t.includes('사용료') || t.includes('관리비') ||
        t.includes('장') || t.includes('묘')
    );

    return {
        region,
        file: fileName,
        allTexts: texts.slice(0, 100), // 처음 100개만
        prices: prices.map(p => parseInt(p.replace(/,/g, ''))),
        labels: labels.slice(0, 30)
    };
}

// 모든 파일 처리
function processAllFiles() {
    const baseDir = 'data/ordinance_hwp';
    const results = [];

    const regions = fs.readdirSync(baseDir).filter(f =>
        fs.statSync(path.join(baseDir, f)).isDirectory() && !f.startsWith('.')
    );

    for (const region of regions) {
        const regionDir = path.join(baseDir, region);
        const files = fs.readdirSync(regionDir).filter(f =>
            f.endsWith('.hwpx') || f.endsWith('.hwp')
        );

        console.log(`\n=== ${region} (${files.length}개 파일) ===`);

        for (const file of files) {
            const filePath = path.join(regionDir, file);
            let texts = null;

            if (file.endsWith('.hwpx')) {
                console.log(`  HWPX: ${file}`);
                texts = parseHWPX(filePath);
            } else {
                console.log(`  HWP: ${file}`);
                texts = parseHWP(filePath);
            }

            if (texts && texts.length > 0) {
                const result = structurePriceData(texts, region, file);
                results.push(result);
                console.log(`    → 텍스트 ${texts.length}개, 가격 ${result.prices.length}개`);
            } else {
                console.log(`    → 파싱 실패`);
            }
        }
    }

    // 결과 저장
    fs.writeFileSync('data/ordinance_hwp/parsed_all.json', JSON.stringify(results, null, 2));
    console.log(`\n\n=== 저장 완료: data/ordinance_hwp/parsed_all.json ===`);
    console.log(`처리된 파일: ${results.length}개`);

    return results;
}

processAllFiles();
