const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const ARCHIVE_DIR = 'archive5';
const OUTPUT_DIR = 'archive5_images';
const MAX_WIDTH = 1920; // 최대 폭 1920px (웹용 적정 해상도)

// 출력 디렉토리 생성
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function convertPdfToPng(pdfPath, outputPath) {
    try {
        // PDF 로드
        const data = new Uint8Array(fs.readFileSync(pdfPath));
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdfDocument = await loadingTask.promise;

        // 첫 페이지만 변환
        const page = await pdfDocument.getPage(1);

        // 기본 viewport (scale 1.0)
        const viewport_base = page.getViewport({ scale: 1.0 });

        // 1920px 기준으로 scale 계산
        const scale = MAX_WIDTH / viewport_base.width;
        const viewport = page.getViewport({ scale });

        // Canvas 생성
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        // 렌더링
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        // PNG 저장
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);

        const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
        const width = Math.floor(viewport.width);
        const height = Math.floor(viewport.height);

        return { success: true, size: sizeMB, width, height };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🚀 전체 PNG 변환 시작 (1920px 웹용)');
    console.log('='.repeat(50));

    const pdfFiles = fs.readdirSync(ARCHIVE_DIR)
        .filter(f => f.endsWith('.pdf'))
        .sort(); // 전체 변환 (1498개)

    console.log(`📦 총 ${pdfFiles.length}개 파일 변환 예정...\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pdfFiles.length; i++) {
        const pdfFile = pdfFiles[i];
        const pdfPath = path.join(ARCHIVE_DIR, pdfFile);
        const outputPath = path.join(OUTPUT_DIR, pdfFile.replace('.pdf', '.png'));

        // 진행률 표시 (매 10개마다)
        if (i % 10 === 0 || i === pdfFiles.length - 1) {
            const percent = ((i + 1) / pdfFiles.length * 100).toFixed(1);
            console.log(`📊 진행률: ${i + 1}/${pdfFiles.length} (${percent}%)`);
        }

        console.log(`\n📄 [${i + 1}/${pdfFiles.length}] ${pdfFile}`);

        const result = await convertPdfToPng(pdfPath, outputPath);

        if (result.success) {
            console.log(`✅ 완료: ${result.size}MB (${result.width}x${result.height} px)`);
            successCount++;
        } else {
            console.log(`❌ 실패: ${result.error}`);
            failCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 전체 변환 완료!`);
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개\n`);

    // 총 용량 계산
    const pngFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
    let totalSize = 0;
    pngFiles.forEach(file => {
        totalSize += fs.statSync(path.join(OUTPUT_DIR, file)).size;
    });
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`💾 총 용량: ${totalSizeMB}MB (${pngFiles.length}개 파일)`);
}

main().catch(console.error);
