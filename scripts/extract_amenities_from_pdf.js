const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const archive5Dir = 'archive5';

async function extractFacilityInfo() {
    const pdfFiles = fs.readdirSync(archive5Dir)
        .filter(f => f.endsWith('.pdf'))
        .sort((a, b) => {
            const numA = parseInt(a.match(/^\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/^\d+/)?.[0] || '0');
            return numA - numB;
        });

    console.log(`📄 PDF 파일 ${pdfFiles.length}개 발견`);

    let updated = 0;
    let skipped = 0;

    for (const pdfFile of pdfFiles) {
        const pdfPath = path.join(archive5Dir, pdfFile);

        // 파일명에서 번호 추출 (e.g., "1.(재)낙원추모공원_price_info.pdf" -> 1)
        const fileNum = pdfFile.match(/^(\d+)\./)?.[1];
        if (!fileNum) {
            skipped++;
            continue;
        }

        const facilityId = `park-${fileNum.padStart(4, '0')}`;
        const facility = facilities.find(f => f.id === facilityId);

        if (!facility) {
            skipped++;
            continue;
        }

        try {
            const dataBuffer = fs.readFileSync(pdfPath);
            const data = await pdf(dataBuffer);
            const text = data.text;

            // 총매장능력 추출 (예: "총매장능력 1,455 개" 또는 "총매장능력:1455개")
            const capacityMatch = text.match(/총매장능력[:\s]*([0-9,]+)\s*개/i);
            if (capacityMatch) {
                const capacity = parseInt(capacityMatch[1].replace(/,/g, ''));
                facility.capacity = capacity;
            }

            // 주차가능대수 추출 (예: "주차가능대수 100 대" 또는 "주차가능대수:100대")
            const parkingMatch = text.match(/주차가능대수[:\s]*([0-9,]+)\s*대/i);
            if (parkingMatch) {
                const parkingSpaces = parseInt(parkingMatch[1].replace(/,/g, ''));
                if (!facility.amenities) facility.amenities = {};
                facility.amenities.parkingSpaces = parkingSpaces;
                facility.amenities.parking = true;
            }

            updated++;
            if (updated % 100 === 0) {
                console.log(`   진행중... ${updated}/${pdfFiles.length}`);
            }
        } catch (err) {
            // PDF 읽기 실패시 건너뛰기
            skipped++;
        }
    }

    // 저장
    fs.writeFileSync('data/facilities.json', JSON.stringify(facilities, null, 2), 'utf8');

    console.log(`\n✅ 완료!`);
    console.log(`   업데이트: ${updated}개`);
    console.log(`   건너뜀: ${skipped}개`);
}

extractFacilityInfo().catch(console.error);
