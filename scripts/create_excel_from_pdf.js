const { processAllPDFs } = require('./extract_pdf_info');
const { searchFacilityWebsite } = require('./find_facility_websites');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * 전체 프로세스: PDF 추출 → 홈페이지 검색 → 엑셀 생성
 */

async function main() {
    const args = process.argv.slice(2);
    const skipWebsite = args.includes('--skip-website');

    console.log('═'.repeat(80));
    console.log('📊 시설 정보 추출 및 엑셀 생성 프로세스');
    console.log('═'.repeat(80));
    console.log('');

    try {
        // Step 1: PDF 정보 추출
        console.log('1️⃣ PDF 파일에서 정보 추출 중...');
        console.log('─'.repeat(80));
        const facilities = await processAllPDFs();
        console.log(`\n✅ ${facilities.length}개 시설 정보 추출 완료\n`);

        // Step 2: 홈페이지 검색 (선택)
        if (!skipWebsite) {
            console.log('2️⃣ 홈페이지 검색 중...');
            console.log('─'.repeat(80));
            console.log('⚠️  이 단계는 시간이 오래 걸립니다. --skip-website 옵션으로 건너뛸 수 있습니다.\n');

            for (let i = 0; i < facilities.length; i++) {
                const facility = facilities[i];

                if (!facility.website) {
                    console.log(`[${i + 1}/${facilities.length}] ${facility.name} 검색 중...`);

                    const website = await searchFacilityWebsite(facility.name, facility.address);

                    if (website) {
                        facility.website = website;
                        console.log(`  ✓ 찾음: ${website}`);
                    } else {
                        console.log(`  ⚠️  없음`);
                    }

                    // 딜레이 (서버 부하 방지)
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            console.log('');
        } else {
            console.log('2️⃣ 홈페이지 검색 건너뛰기 (--skip-website)\n');
        }

        // Step 3: 엑셀 파일 생성
        console.log('3️⃣ 엑셀 파일 생성 중...');
        console.log('─'.repeat(80));

        const excelData = facilities.map(facility => {
            const amenityIcons = facility.amenities
                ? facility.amenities.map(a => a.icon).join(' ')
                : '';

            return {
                'No.': facility.no,
                '구분': facility.facilityType || '',
                '시설명': facility.name || '',
                '홈페이지': facility.website || '',
                '주소': facility.address || '',
                '전화번호': facility.phone || '',
                '팩스번호': facility.fax || '',
                '총매장능력': facility.capacity ? Number(facility.capacity) : '',
                '편의시설': amenityIcons,
                '업데이트': facility.update || ''
            };
        });

        // 워크시트 생성
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // 컬럼 너비 설정
        worksheet['!cols'] = [
            { wch: 8 },   // No.
            { wch: 10 },  // 구분
            { wch: 30 },  // 시설명
            { wch: 40 },  // 홈페이지
            { wch: 50 },  // 주소
            { wch: 15 },  // 전화번호
            { wch: 15 },  // 팩스번호
            { wch: 12 },  // 총매장능력
            { wch: 15 },  // 편의시설
            { wch: 12 }   // 업데이트
        ];

        // 워크북 생성
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '시설정보');

        // 파일 저장
        const outputDir = path.join(__dirname, '..', 'facility_data');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().split('T')[0];
        const outputPath = path.join(outputDir, `facilities_info_${timestamp}.xlsx`);
        XLSX.writeFile(workbook, outputPath);

        console.log('✅ 엑셀 파일 생성 완료\n');

        // 최종 요약
        console.log('═'.repeat(80));
        console.log('✨ 완료!');
        console.log('═'.repeat(80));
        console.log('');
        console.log('📊 통계:');
        console.log(`  • 총 시설: ${facilities.length}개`);
        console.log(`  • 전화번호: ${facilities.filter(f => f.phone && f.phone !== '-').length}개`);
        console.log(`  • 주소: ${facilities.filter(f => f.address).length}개`);
        console.log(`  • 매장능력: ${facilities.filter(f => f.capacity).length}개`);
        console.log(`  • 홈페이지: ${facilities.filter(f => f.website).length}개`);

        const byType = {};
        facilities.forEach(f => {
            const type = f.facilityType || '미분류';
            byType[type] = (byType[type] || 0) + 1;
        });

        console.log('\n📈 유형별:');
        Object.entries(byType).forEach(([type, count]) => {
            console.log(`  • ${type}: ${count}개`);
        });

        console.log('\n📁 저장 위치:');
        console.log(`  ${outputPath}`);
        console.log('');
        console.log('💡 파일 열기:');
        console.log(`  open "${outputPath}"`);
        console.log('');

    } catch (error) {
        console.error('❌ 오류:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// 도움말
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
📊 시설 정보 추출 및 엑셀 생성 도구

사용법:
  node scripts/create_excel_from_pdf.js [옵션]

옵션:
  --skip-website    홈페이지 검색 건너뛰기 (빠른 실행)
  --help, -h        도움말 표시

예제:
  # 홈페이지 검색 없이 빠른 실행
  node scripts/create_excel_from_pdf.js --skip-website

  # 홈페이지 검색 포함 전체 실행
  node scripts/create_excel_from_pdf.js

출력:
  • facility_data/facilities_info_YYYY-MM-DD.xlsx

컬럼:
  1. No.           - 시설 번호
  2. 구분          - 사설/공설/법인/종교
  3. 시설명        - 시설 이름
  4. 홈페이지      - 공식 웹사이트 (크롤링)
  5. 주소          - 전체 주소
  6. 전화번호      - 대표 전화
  7. 팩스번호      - 팩스
  8. 총매장능력    - 수용 매장 수
  9. 편의시설      - 편의시설 아이콘
  10. 업데이트     - 마지막 업데이트
`);
    process.exit(0);
}

if (require.main === module) {
    main();
}

module.exports = { main };
