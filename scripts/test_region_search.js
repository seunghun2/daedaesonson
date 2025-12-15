const fs = require('fs');
const path = require('path');

// Mock data paths
const GU_PATH = path.join(__dirname, '../public/data/skorea_gu.json');
const DONG_PATH = path.join(__dirname, '../public/data/skorea_dong.json');

console.log('Loading JSON...');
const guData = JSON.parse(fs.readFileSync(GU_PATH, 'utf8'));
const dongData = JSON.parse(fs.readFileSync(DONG_PATH, 'utf8'));
console.log(`Loaded Gu: ${guData.features.length}, Dong: ${dongData.features.length}`);

function searchRegion(keyword) {
    console.log(`\n🔍 Searching: "${keyword}"`);

    // 1. Gu Search
    const targetName = keyword.replace(/시|군|구/g, '');
    const guMatch = guData.features.find(f => {
        const fName = f.properties.name || '';
        return fName.includes(targetName) || keyword.includes(fName);
    });

    if (guMatch) {
        console.log(`✅ Gu Match: ${guMatch.properties.name}`);
        return { type: 'gu', name: guMatch.properties.name };
    }

    // 2. Dong Search
    const dongMatch = dongData.features.find(f => {
        const fName = f.properties.name || '';
        return fName === keyword || fName.includes(keyword) || (keyword.endsWith('동') && fName.includes(keyword));
    });

    if (dongMatch) {
        console.log(`✅ Dong Match: ${dongMatch.properties.name}`);
        return { type: 'dong', name: dongMatch.properties.name };
    }

    console.log('❌ No match found');
    return null;
}

// Test cases
searchRegion('강남');
searchRegion('강남구');
searchRegion('수유');
searchRegion('수유동');
searchRegion('종로');
searchRegion('서울');
searchRegion('없는지역');
