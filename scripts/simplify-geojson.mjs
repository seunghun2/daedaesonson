import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

// GeoJSON 좌표 정밀도 축소 (소수점 3자리 = ~111m 정확도, 지도 경계 표시에 충분)
function simplifyCoords(coords, precision = 3) {
    if (typeof coords[0] === 'number') {
        return coords.map(c => Math.round(c * Math.pow(10, precision)) / Math.pow(10, precision));
    }
    return coords.map(c => simplifyCoords(c, precision));
}

function simplifyGeoJSON(inputPath, outputPath) {
    console.log(`📂 Reading: ${inputPath}`);
    const data = JSON.parse(readFileSync(inputPath, 'utf-8'));
    const originalSize = readFileSync(inputPath).length;

    data.features = data.features.map(f => ({
        ...f,
        properties: { name: f.properties.name },
        geometry: {
            type: f.geometry.type,
            coordinates: simplifyCoords(f.geometry.coordinates, 3)
        }
    }));

    const output = JSON.stringify(data);
    writeFileSync(outputPath, output);
    const newSize = Buffer.byteLength(output);

    console.log(`✅ ${path.basename(inputPath)}: ${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(newSize / 1024 / 1024).toFixed(1)}MB (${Math.round((1 - newSize / originalSize) * 100)}% 감소)`);
}

const dataDir = path.join(process.cwd(), 'public', 'data');

simplifyGeoJSON(
    path.join(dataDir, 'skorea_gu.json'),
    path.join(dataDir, 'skorea_gu.json')
);

simplifyGeoJSON(
    path.join(dataDir, 'skorea_dong.json'),
    path.join(dataDir, 'skorea_dong.json')
);

console.log('\n🎉 GeoJSON 경량화 완료!');
