const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const archive5Dir = 'archive5';

async function extractAmenities() {
    const pdfFiles = fs.readdirSync(archive5Dir)
        .filter(f => f.endsWith('.pdf'))
        .sort((a, b) => {
            const numA = parseInt(a.match(/^\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/^\d+/)?.[0] || '0');
            return numA - numB;
        });

    console.log(`📄 PDF 파일 ${pdfFiles.length}개 처리 시작`);

    let updated = 0;

    for (const pdfFile of pdfFiles) {
        const pdfPath = path.join(archive5Dir, pdfFile);
        const fileNum = pdfFile.match(/^(\d+)\./)?.[1];
        if (!fileNum) continue;

        const facilityId = `park-${fileNum.padStart(4, '0')}`;
        const facility = facilities.find(f => f.id === facilityId);
        if (!facility) continue;

        try {
            const dataBuffer = fs.readFileSync(pdfPath);
            const data = await pdf(dataBuffer);
            const text = data.text;

            if (!facility.amenities) facility.amenities = {};

            // 편의시설 정보 추출
            // "편의시설 정보" 섹션 찾기
            const amenitiesSection = text.match(/편의시설\s*정보.*?(?=\n\n|\n[가-힣]+\s*정보|$)/s);

            if (amenitiesSection) {
                const sectionText = amenitiesSection[0];

                // 각 편의시설 체크
                if (sectionText.includes('주차장') || sectionText.includes('Parking')) {
                    facility.amenities.parking = true;
                }
                if (sectionText.includes('식당') || sectionText.includes('Restaurant')) {
                    facility.amenities.restaurant = true;
                }
                if (sectionText.includes('매점') || sectionText.includes('Store')) {
                    facility.amenities.store = true;
                }
                if (sectionText.includes('장애인편의시설') || sectionText.includes('Accessibility')) {
                    facility.amenities.accessibility = true;
                }
            }

            updated++;
            if (updated % 100 === 0) {
                console.log(`   진행중... ${updated}/${pdfFiles.length}`);
            }
        } catch (err) {
            // 에러 무시
        }
    }

    fs.writeFileSync('data/facilities.json', JSON.stringify(facilities, null, 2), 'utf8');

    console.log(`\n✅ 완료!`);
    console.log(`   업데이트: ${updated}개`);

    // 통계
    const stats = {
        parking: facilities.filter(f => f.amenities?.parking).length,
        restaurant: facilities.filter(f => f.amenities?.restaurant).length,
        store: facilities.filter(f => f.amenities?.store).length,
        accessibility: facilities.filter(f => f.amenities?.accessibility).length
    };

    console.log(`\n📊 편의시설 통계:`);
    console.log(`   주차장: ${stats.parking}개`);
    console.log(`   식당: ${stats.restaurant}개`);
    console.log(`   매점: ${stats.store}개`);
    console.log(`   장애인편의: ${stats.accessibility}개`);
}

extractAmenities().catch(console.error);
