const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
const playwright = require('playwright');

/**
 * PDF를 브라우저로 열어서 스크린샷 찍고 OCR로 텍스트 추출
 * 더 정확한 정보 추출을 위해
 */

async function extractPDFWithOCR(pdfPath) {
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // PDF를 브라우저로 열기
        await page.goto(`file://${pdfPath}`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        // 스크린샷 촬영
        const screenshotPath = pdfPath.replace('.pdf', '_screenshot.png');
        await page.screenshot({
            path: screenshotPath,
            fullPage: true,
            type: 'png'
        });

        console.log(`  📸 스크린샷 저장: ${path.basename(screenshotPath)}`);

        // OCR로 텍스트 추출
        const worker = await createWorker('kor+eng');
        const { data: { text } } = await worker.recognize(screenshotPath);
        await worker.terminate();

        // 임시 스크린샷 삭제
        if (fs.existsSync(screenshotPath)) {
            fs.unlinkSync(screenshotPath);
        }

        await browser.close();
        return text;

    } catch (error) {
        console.error(`  ❌ OCR 오류: ${error.message}`);
        await browser.close();
        return null;
    }
}

async function extractInfoFromOCRText(text, facilityName) {
    const info = {
        facilityType: null,
        address: null,
        phone: null,
        fax: null,
        capacity: null,
        website: null,
        amenities: [],
        update: null
    };

    // 시설 유형
    const typeMatch = text.match(/(사설|공설|법인|종교)/);
    if (typeMatch) info.facilityType = typeMatch[1];

    // 주소 (주소 키워드 찾기)
    const addressPattern = /(?:주소[:\s]*)?([가-힣]+(?:도|시|군|구)\s+[가-힣\s\d-()]+)\s*(?:주소|전화)/;
    const addressMatch = text.match(addressPattern);
    if (addressMatch) info.address = addressMatch[1].trim();

    // 전화번호
    const phonePattern = /전화번호[:\s]*([\d-]+)/;
    const phoneMatch = text.match(phonePattern);
    if (phoneMatch) info.phone = phoneMatch[1].trim();

    // 팩스번호
    const faxPattern = /팩스번호[:\s]*([\d-]+)/;
    const faxMatch = text.match(faxPattern);
    if (faxMatch && faxMatch[1] !== '-') info.fax = faxMatch[1].trim();

    // 총매장능력
    const capacityPattern = /총매장능력[:\s]*([\d,]+)\s*개/;
    const capacityMatch = text.match(capacityPattern);
    if (capacityMatch) info.capacity = capacityMatch[1].replace(/,/g, '');

    // 업데이트
    const updatePattern = /(\d+개월전)\s*업데이트/;
    const updateMatch = text.match(updatePattern);
    if (updateMatch) info.update = updateMatch[1];

    // 편의시설
    const amenityKeywords = {
        '편의시설': '🍴',
        '주차': '🅿️',
        '화장실': '🚻',
        '휠체어': '♿'
    };

    for (const [keyword, icon] of Object.entries(amenityKeywords)) {
        if (text.includes(keyword)) {
            info.amenities.push({ keyword, icon });
        }
    }

    return info;
}

async function processAllPDFsWithOCR() {
    const archiveDir = path.join(__dirname, '..', 'archive');
    const facilities = fs.readdirSync(archiveDir)
        .filter(item => {
            const fullPath = path.join(archiveDir, item);
            return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
        });

    console.log(`\n📚 총 ${facilities.length}개 시설 발견`);
    console.log('🔍 OCR 방식으로 PDF 분석 시작...\n');

    const results = [];

    for (const facility of facilities.slice(0, 5)) { // 테스트: 처음 5개만
        const facilityPath = path.join(archiveDir, facility);
        const pdfFiles = fs.readdirSync(facilityPath)
            .filter(file => file.endsWith('_price_info.pdf'));

        if (pdfFiles.length > 0) {
            const pdfPath = path.join(facilityPath, pdfFiles[0]);

            console.log(`📄 [${results.length + 1}/${facilities.length}] ${facility}`);

            // 파일명에서 번호와 이름 추출
            const match = facility.match(/^(\d+)\.(.*)/);
            const no = match ? match[1] : null;
            const name = match ? match[2] : facility;

            // OCR로 텍스트 추출
            const ocrText = await extractPDFWithOCR(pdfPath);

            if (ocrText) {
                const info = await extractInfoFromOCRText(ocrText, name);

                results.push({
                    no,
                    name,
                    ...info
                });

                console.log(`  ✓ 추출 완료`);
                console.log(`    - 유형: ${info.facilityType || 'N/A'}`);
                console.log(`    - 주소: ${info.address ? info.address.substring(0, 30) + '...' : 'N/A'}`);
                console.log(`    - 전화: ${info.phone || 'N/A'}`);
                console.log(`    - 매장능력: ${info.capacity || 'N/A'}`);
                console.log('');
            }
        }
    }

    // 결과 저장
    const outputPath = path.join(__dirname, '..', 'extracted_facility_info_ocr.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

    console.log(`\n✅ OCR 추출 완료! 저장: ${outputPath}`);
    console.log(`📊 총 ${results.length}개 시설 정보 추출\n`);

    return results;
}

if (require.main === module) {
    processAllPDFsWithOCR()
        .then(() => console.log('🎉 완료!'))
        .catch(error => {
            console.error('❌ 오류:', error);
            process.exit(1);
        });
}

module.exports = { extractPDFWithOCR, extractInfoFromOCRText, processAllPDFsWithOCR };
