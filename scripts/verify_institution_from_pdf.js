const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const ARCHIVE_DIR = path.join(__dirname, '../archive');
const PRICING_DB_PATH = path.join(__dirname, '../data/pricing_db.json');
const FACILITIES_PATH = path.join(__dirname, '../data/facilities.json');

async function verifyInstitutionTypes() {
    console.log('🔄 Loading pricing database...');
    let pricingData = [];
    try {
        pricingData = JSON.parse(fs.readFileSync(PRICING_DB_PATH, 'utf-8'));
    } catch (err) {
        console.error('Failed to load pricing_db.json', err);
        return;
    }

    // Facilty Name to ID Mapping
    // pricingData의 parkName을 기준으로 데이터를 묶거나 찾음
    // 문제는 parkName이 중복될 수 있음? -> 거의 없음.

    // Archive 폴더 목록 가져오기
    if (!fs.existsSync(ARCHIVE_DIR)) {
        console.error('Archive directory not found!');
        return;
    }

    const archiveFolders = fs.readdirSync(ARCHIVE_DIR).filter(item => {
        return fs.statSync(path.join(ARCHIVE_DIR, item)).isDirectory();
    });

    console.log(`📂 Found ${archiveFolders.length} folders in archive.`);

    let updateCount = 0;
    let mismatchCount = 0;
    const updates = {}; // parkName -> '공설' | '사설'

    for (const folder of archiveFolders) {
        const folderPath = path.join(ARCHIVE_DIR, folder);
        const files = fs.readdirSync(folderPath);
        const pdfFile = files.find(f => f.endsWith('_price_info.pdf'));

        if (!pdfFile) continue;

        // 폴더명에서 시설명 추출 (예: "32.(재)호정공원(묘지)" -> "(재)호정공원(묘지)")
        // 보통 [숫자].[이름] 형식이므로 첫 번째 점 이후가 이름일 가능성 높음
        // 하지만 이름 자체에 점이 있을 수도 있으니 조심.
        // E-Sky 크롤러 로직상 "index.이름" 형식이었음.
        const firstDotIndex = folder.indexOf('.');
        if (firstDotIndex === -1) continue;

        // 폴더명에서 추출한 이름
        // const facilityNameFromFolder = folder.substring(firstDotIndex + 1).trim(); 

        // 더 정확한 건 PDF 파일명에서 추출? "32.(재)호정공원(묘지)_price_info.pdf"
        // PDF 파일명은 "폴더명_price_info.pdf"임.

        // pricing_db.json과 매칭하기 위해 노력을 좀 해야함.
        // pricing_db.json의 parkName과 폴더명의 시설명 부분을 매칭.
        const folderNameClean = folder.substring(firstDotIndex + 1).trim();

        try {
            const dataBuffer = fs.readFileSync(path.join(folderPath, pdfFile));
            const data = await pdf(dataBuffer);
            const text = data.text;

            let determinedType = null;

            // "공설" 키워드가 PDF 텍스트에 포함되어 있는지 확인
            if (text.includes('공설')) {
                determinedType = '공설';
            } else {
                // "공설"이 없으면 기본적으로 "사설"로 간주하되,
                // 혹시 모르니 "재단법인", "사단법인" 등이 있으면 "사설" 확신
                // 일단 사용자는 "공설/사설" 구분을 원함.
                determinedType = '사설';
            }

            if (determinedType) {
                updates[folderNameClean] = determinedType;
            }

        } catch (err) {
            console.error(`❌ Error reading PDF in ${folder}:`, err.message);
        }
    }

    console.log(`✅ Analyzed PDF files. Applying updates to DB...`);

    // Update pricingData
    const newPricingData = pricingData.map(item => {
        // parkName으로 매칭 시도
        // 1. 정확히 일치
        let type = updates[item.parkName];

        // 2. 매칭 안되면? (폴더명엔 괄호나 공백 등이 다를 수 있음)
        // 일단 정확 매칭만 적용하고 나머지는 로그로 남길 수도.

        if (type) {
            if (item.institutionType !== type) {
                // console.log(`🔄 [${item.parkName}] Type Changed: ${item.institutionType} -> ${type}`);
                updateCount++;
                mismatchCount++;
            }
            return { ...item, institutionType: type };
        }

        // 아카이브에 없으면 기존 값 유지 (facilities.json 기반)
        return item;
    });

    fs.writeFileSync(PRICING_DB_PATH, JSON.stringify(newPricingData, null, 2));
    console.log(`🎉 Finished! Updated ${mismatchCount} items (rows) based on PDF analysis.`);
}

verifyInstitutionTypes();
