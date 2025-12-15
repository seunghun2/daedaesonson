const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/facilities.json');
const outputPath = path.join(__dirname, '../lib/mockData.ts');

if (!fs.existsSync(dataPath)) {
    console.error('❌ facilities.json 파일이 없습니다.');
    process.exit(1);
}

const facilities = fs.readFileSync(dataPath, 'utf-8');
const facilitiesParam = JSON.parse(facilities);

// 데이터 검증 (간단히)
console.log(`📦 데이터 로드: ${facilitiesParam.length}개 시설`);
if (facilitiesParam.length > 0) {
    console.log(`🔍 샘플 데이터 확인: ${facilitiesParam[0].name}, 가격정보 유무: ${!!facilitiesParam[0].priceInfo}`);
}

const fileContent = `// @ts-nocheck
import { Facility } from '@/types';

export const MOCK_FACILITIES: Facility[] = ${facilities};
`;

fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`✅ mockData.ts 복구 완료! (원본: facilities.json)`);
