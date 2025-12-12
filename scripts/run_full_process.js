const { processAllPDFs } = require('./extract_pdf_info');
const { enrichFacilitiesWithWebsites } = require('./find_facility_websites');
const { generateAllFacilitiesSVG, generateFacilitySVG } = require('./generate_facility_svg');
const fs = require('fs');
const path = require('path');

/**
 * 전체 프로세스를 실행하는 마스터 스크립트
 * 
 * 1. PDF에서 시설 정보 추출
 * 2. 홈페이지 검색 및 추가 (선택사항)
 * 3. SVG 시각화 생성
 */

async function main() {
    console.log('═'.repeat(80));
    console.log('🚀 시설 정보 추출 및 시각화 프로세스 시작');
    console.log('═'.repeat(80));
    console.log('');

    const args = process.argv.slice(2);
    const skipWebsiteSearch = args.includes('--skip-website');
    const fullProcess = args.includes('--full');

    try {
        // Step 1: PDF 정보 추출
        console.log('📄 Step 1: PDF에서 시설 정보 추출 중...');
        console.log('─'.repeat(80));
        const facilities = await processAllPDFs();
        console.log(`\n✅ ${facilities.length}개 시설 정보 추출 완료\n`);

        // Step 2: 홈페이지 검색 (선택사항)
        if (!skipWebsiteSearch) {
            console.log('🌐 Step 2: 홈페이지 검색 중...');
            console.log('─'.repeat(80));
            console.log('⚠️  이 단계는 시간이 오래 걸립니다. --skip-website 옵션으로 건너뛸 수 있습니다.\n');

            await enrichFacilitiesWithWebsites();
            console.log('');
        } else {
            console.log('⏭️  Step 2: 홈페이지 검색 건너뛰기 (--skip-website)\n');
        }

        // Step 3: SVG 생성
        console.log('🎨 Step 3: SVG 시각화 생성 중...');
        console.log('─'.repeat(80));

        const { generateAllFacilitiesSVG: genAllSVG, generateFacilitySVG: genSVG } = require('./generate_facility_svg');
        const inputFile = path.join(__dirname, '..', 'extracted_facility_info.json');
        const outputDir = path.join(__dirname, '..', 'facility_svg');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const finalFacilities = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

        // 개별 SVG 생성
        finalFacilities.forEach((facility, index) => {
            const svg = genSVG(facility);
            const filename = `${facility.no}.${facility.name.replace(/[\/\\?%*:|"<>]/g, '_')}.svg`;
            const filepath = path.join(outputDir, filename);
            fs.writeFileSync(filepath, svg, 'utf-8');
        });

        // 대시보드 SVG 생성
        const dashboardSVG = genAllSVG(finalFacilities);
        const dashboardPath = path.join(outputDir, '_dashboard.svg');
        fs.writeFileSync(dashboardPath, dashboardSVG, 'utf-8');

        console.log(`✅ ${finalFacilities.length}개 SVG 파일 생성 완료`);
        console.log(`📁 출력 디렉토리: ${outputDir}`);
        console.log(`📊 대시보드: ${dashboardPath}\n`);

        // 최종 요약
        console.log('═'.repeat(80));
        console.log('✨ 전체 프로세스 완료!');
        console.log('═'.repeat(80));
        console.log('');
        console.log('📊 최종 요약:');
        console.log(`  • 처리된 시설: ${finalFacilities.length}개`);
        console.log(`  • 홈페이지 보유: ${finalFacilities.filter(f => f.website).length}개`);
        console.log(`  • 생성된 SVG: ${finalFacilities.length + 1}개 (개별 + 대시보드)`);
        console.log('');
        console.log('📂 생성된 파일:');
        console.log(`  • JSON: ${inputFile}`);
        console.log(`  • SVG 디렉토리: ${outputDir}`);
        console.log('');
        console.log('💡 다음 단계:');
        console.log('  • SVG 파일 확인: open facility_svg/_dashboard.svg');
        console.log('  • JSON 데이터 확인: cat extracted_facility_info.json');
        console.log('');

    } catch (error) {
        console.error('❌ 오류 발생:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// 도움말
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
사용법: node scripts/run_full_process.js [옵션]

옵션:
  --skip-website    홈페이지 검색 단계 건너뛰기 (시간 절약)
  --full            전체 프로세스 실행 (모든 시설, 홈페이지 검색 포함)
  --help, -h        이 도움말 표시

예제:
  # 홈페이지 검색 포함 전체 실행
  node scripts/run_full_process.js

  # 홈페이지 검색 없이 빠른 실행
  node scripts/run_full_process.js --skip-website

  # 전체 시설 대상 풀 프로세스
  node scripts/run_full_process.js --full
`);
    process.exit(0);
}

if (require.main === module) {
    main();
}

module.exports = { main };
