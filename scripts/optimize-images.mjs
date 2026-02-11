/**
 * 대대손손 이미지 최적화 스크립트
 * 모든 시설 이미지를 WebP로 변환 + 리사이즈
 * 
 * 사용법: node scripts/optimize-images.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const IMAGE_DIR = path.resolve('public/images/facilities');
const MAX_WIDTH = 1200;
const QUALITY = 80;

let converted = 0;
let skipped = 0;
let totalSavedBytes = 0;

function getAllImages(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...getAllImages(fullPath));
        } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
            results.push(fullPath);
        }
    }
    return results;
}

async function optimizeImage(filePath) {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    const webpPath = path.join(dir, `${base}.webp`);

    // 이미 변환됐으면 스킵
    if (fs.existsSync(webpPath)) {
        skipped++;
        return;
    }

    const originalSize = fs.statSync(filePath).size;
    const originalMB = (originalSize / 1048576).toFixed(2);

    try {
        await sharp(filePath)
            .resize({ width: MAX_WIDTH, withoutEnlargement: true })
            .webp({ quality: QUALITY, effort: 6 })
            .toFile(webpPath);

        const newSize = fs.statSync(webpPath).size;
        const newKB = Math.round(newSize / 1024);
        const savedMB = ((originalSize - newSize) / 1048576).toFixed(2);

        totalSavedBytes += (originalSize - newSize);
        converted++;

        console.log(`✅ ${base} (${originalMB}MB → ${newKB}KB) — ${savedMB}MB 절약`);
    } catch (err) {
        console.error(`❌ ${base}: ${err.message}`);
    }
}

async function main() {
    console.log('🖼️  대대손손 이미지 최적화 시작');
    console.log(`📁 대상: ${IMAGE_DIR}`);
    console.log(`📐 최대 가로: ${MAX_WIDTH}px, 품질: ${QUALITY}`);
    console.log('---');

    const images = getAllImages(IMAGE_DIR);
    console.log(`📊 총 ${images.length}개 이미지 발견\n`);

    // 배치 처리 (동시 5개씩)
    const BATCH_SIZE = 5;
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
        const batch = images.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(optimizeImage));

        // 진행률 표시 (50개마다)
        if ((i + BATCH_SIZE) % 50 === 0) {
            console.log(`\n📈 진행: ${Math.min(i + BATCH_SIZE, images.length)}/${images.length} (${Math.round((i + BATCH_SIZE) / images.length * 100)}%)\n`);
        }
    }

    const totalSavedMB = (totalSavedBytes / 1048576).toFixed(1);
    const totalSavedGB = (totalSavedBytes / 1073741824).toFixed(2);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 변환 완료: ${converted}개 파일`);
    console.log(`⏭️  스킵: ${skipped}개 파일`);
    console.log(`💾 총 절약: ${totalSavedMB}MB (${totalSavedGB}GB)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(console.error);
