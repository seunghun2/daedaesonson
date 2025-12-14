const fs = require('fs');
const path = require('path');

const PRICING_DB_PATH = path.join(__dirname, '../data/pricing_db.json');
const FACILITIES_PATH = path.join(__dirname, '../data/facilities.json');

function updateInstitutionType() {
    console.log('🔄 Loading data...');
    const pricingData = JSON.parse(fs.readFileSync(PRICING_DB_PATH, 'utf-8'));
    const facilitiesData = JSON.parse(fs.readFileSync(FACILITIES_PATH, 'utf-8'));

    // Create a map for quick lookup: parkId -> institutionType
    const facilityMap = {};
    facilitiesData.forEach(fac => {
        // isPublic이 true면 "공설", false면 "사설"
        // 만약 isPublic 필드가 없으면 operatorType 등을 참고할 수도 있지만, 일단 isPublic 우선
        let type = '사설'; // Default
        if (fac.isPublic === true) {
            type = '공설';
        }
        facilityMap[fac.id] = type;
    });

    console.log(`✅ Loaded ${facilitiesData.length} facilities.`);

    let updateCount = 0;
    const updatedPricingData = pricingData.map(item => {
        const type = facilityMap[item.parkId] || '사설'; // 매칭 안되면 기본 사설 간주 (혹은 확인 필요)
        if (item.institutionType !== type) {
            updateCount++;
        }
        return {
            ...item,
            institutionType: type
        };
    });

    console.log(`💾 Updating ${updateCount} items with institution type...`);
    fs.writeFileSync(PRICING_DB_PATH, JSON.stringify(updatedPricingData, null, 2));
    console.log('🎉 Done! pricing_db.json updated.');
}

updateInstitutionType();
