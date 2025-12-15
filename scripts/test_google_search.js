const { searchFacilityWebsite } = require('./find_facility_websites');
const fs = require('fs');
const path = require('path');

/**
 * 1~10번 시설만 구글로 홈페이지 검색 테스트
 */

async function testGoogleSearch() {
    const inputFile = path.join(__dirname, '..', 'extracted_facility_info.json');
    const facilities = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

    console.log('🔍 구글 검색 테스트 (1~10번 시설)\n');

    const first10 = facilities.slice(0, 10);
    const results = [];

    for (let i = 0; i < first10.length; i++) {
        const facility = first10[i];
        console.log(`[${i + 1}/10] ${facility.name}`);

        const website = await searchFacilityWebsite(facility.name, facility.address);

        results.push({
            no: facility.no,
            name: facility.name,
            website: website || 'NOT FOUND'
        });

        if (website) {
            console.log(`  ✅ ${website}\n`);
        } else {
            console.log(`  ❌ 찾지 못함\n`);
        }

        // 딜레이
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 결과 요약:\n');
    results.forEach(r => {
        console.log(`${r.no}. ${r.name}`);
        console.log(`   ${r.website}\n`);
    });

    // 파일로 저장
    const outputPath = path.join(__dirname, '..', 'google_search_test_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`💾 저장: ${outputPath}`);
}

testGoogleSearch()
    .then(() => console.log('\n✅ 완료!'))
    .catch(error => {
        console.error('❌ 오류:', error);
        process.exit(1);
    });
