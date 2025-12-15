const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { processAllPDFs } = require('./extract_pdf_info');

/**
 * PDF에서 추출한 시설 정보를 엑셀 파일로 저장하는 스크립트
 */

async function createFacilityExcel() {
    console.log('📊 시설 정보를 엑셀로 변환 중...\n');

    // PDF에서 정보 추출
    console.log('1️⃣ PDF 파일 분석 중...');
    const facilities = await processAllPDFs();

    console.log(`\n✅ ${facilities.length}개 시설 정보 추출 완료\n`);

    // 엑셀 데이터 준비
    console.log('2️⃣ 엑셀 데이터 준비 중...');

    const excelData = facilities.map(facility => {
        // 편의시설 아이콘들을 문자열로 변환
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

    const outputPath = path.join(outputDir, 'facilities_info.xlsx');
    XLSX.writeFile(workbook, outputPath);

    console.log('✅ 엑셀 데이터 생성 완료');
    console.log(`\n📁 저장 위치: ${outputPath}`);
    console.log(`📊 총 ${facilities.length}개 시설 데이터 포함\n`);

    // 통계
    const stats = {
        total: facilities.length,
        withPhone: facilities.filter(f => f.phone && f.phone !== '-').length,
        withAddress: facilities.filter(f => f.address).length,
        withCapacity: facilities.filter(f => f.capacity).length,
        withWebsite: facilities.filter(f => f.website).length,
        byType: {}
    };

    facilities.forEach(f => {
        const type = f.facilityType || '미분류';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    console.log('📈 통계:');
    console.log(`  • 전체 시설: ${stats.total}개`);
    console.log(`  • 전화번호 있음: ${stats.withPhone}개`);
    console.log(`  • 주소 있음: ${stats.withAddress}개`);
    console.log(`  • 매장능력 정보: ${stats.withCapacity}개`);
    console.log(`  • 홈페이지 정보: ${stats.withWebsite}개`);
    console.log('\n  📊 유형별 분포:');
    Object.entries(stats.byType).forEach(([type, count]) => {
        console.log(`    - ${type}: ${count}개`);
    });

    return outputPath;
}

if (require.main === module) {
    createFacilityExcel()
        .then(outputPath => {
            console.log('\n🎉 완료! 엑셀 파일을 열려면:');
            console.log(`   open "${outputPath}"`);
        })
        .catch(error => {
            console.error('❌ 오류 발생:', error);
            process.exit(1);
        });
}

module.exports = { createFacilityExcel };
