const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const ARCHIVE_DIR = path.join(__dirname, '../archive');
const DATA_DIR = path.join(__dirname, '../data');
const PRICING_FILES = [
    'pricing_cemetery.csv',
    'pricing_cremation.csv',
    'pricing_enshrinement.csv',
    'pricing_natural.csv'
];

function getNum(idStr) {
    if (!idStr) return 999999;
    const match = idStr.match(/park-(\d+)/);
    return match ? parseInt(match[1], 10) : 999999;
}

function run() {
    console.log('🔎 Checking Archive for Missing Pricing Data...\n');

    // 1. CSV에서 현재 존재하는 ID 수집
    const existingIds = new Set();
    PRICING_FILES.forEach(filename => {
        const filePath = path.join(DATA_DIR, filename);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
            parsed.data.forEach(r => existingIds.add(getNum(r.ParkID)));
        }
    });

    const maxId = Math.max(...Array.from(existingIds));
    const missingIds = [];
    // 1번부터 Max ID까지 빈 번호 찾기
    for (let i = 1; i <= maxId; i++) {
        if (!existingIds.has(i)) {
            missingIds.push(i);
        }
    }

    console.log(`Target Missing IDs: ${missingIds.length} items (e.g., ${missingIds.slice(0, 5).join(', ')}...)`);

    // 2. 아카이브 폴더 맵핑
    // "81.충현동산" -> 81
    const folderMap = new Map();
    const dirs = fs.readdirSync(ARCHIVE_DIR);
    dirs.forEach(dirName => {
        // .DS_Store 등 제외
        if (dirName.startsWith('.')) return;

        // "숫자." 으로 시작하는 폴더 파싱
        const match = dirName.match(/^(\d+)\./);
        if (match) {
            const id = parseInt(match[1], 10);
            folderMap.set(id, dirName);
        }
    });

    // 3. 결번 ID에 대해 아카이브 검사
    let foundPdfCount = 0;
    let foundFolderCount = 0;
    let completeMissingCount = 0;

    const results = [];

    missingIds.forEach(id => {
        const folderName = folderMap.get(id);
        if (folderName) {
            foundFolderCount++;
            const folderPath = path.join(ARCHIVE_DIR, folderName);

            // 폴더 내 파일 검색
            let hasPdf = false;
            let fileList = [];
            try {
                if (fs.statSync(folderPath).isDirectory()) {
                    const files = fs.readdirSync(folderPath);
                    hasPdf = files.some(f => f.toLowerCase().endsWith('.pdf'));
                    fileList = files;
                }
            } catch (e) {
                console.error(`Error reading ${folderName}: ${e.message}`);
            }

            if (hasPdf) {
                foundPdfCount++;
                results.push(`[FOUND PDF] ID ${id} (${folderName}) has PDF! -> Needs Processing`);
            } else {
                results.push(`[NO PDF]    ID ${id} (${folderName}) -> Folder exists but no PDF (Files: ${fileList.length} items)`);
            }
        } else {
            completeMissingCount++;
            results.push(`[NO FOLDER] ID ${id} -> No archive folder found.`);
        }
    });

    // 결과 출력
    console.log('\n--- Inspection Results ---');
    if (results.length > 0) {
        // 결과가 많으면 일부만, 아니면 전부? (123개면 전부 출력 가능하지만 요약 권장)
        // PDF 찾은 것 위주로 출력
        const foundPdfs = results.filter(r => r.startsWith('[FOUND'));
        const noPdfs = results.filter(r => r.startsWith('[NO PDF'));
        const noFolders = results.filter(r => r.startsWith('[NO FOLDER'));

        if (foundPdfs.length > 0) {
            console.log(`\n🎉 PDF FOUND in Archive (${foundPdfs.length} items):`);
            foundPdfs.forEach(r => console.log(r));
        } else {
            console.log('\n❌ No PDFs found for missing IDs.');
        }

        console.log(`\n📁 Folders exist but NO PDF: ${noPdfs.length} items`);
        // 예시 5개만
        if (noPdfs.length > 0) noPdfs.slice(0, 5).forEach(r => console.log(r));

        console.log(`\n🚫 No Folder at all: ${noFolders.length} items`);
        if (noFolders.length > 0) noFolders.slice(0, 3).forEach(r => console.log(r));
    }

    console.log('\n==================================================');
    console.log(`Summary:`);
    console.log(`- Total Missing in CSV: ${missingIds.length}`);
    console.log(`- Folders Found in Archive: ${foundFolderCount}`);
    console.log(`- REAL PDF Files Found: **${foundPdfCount}**`);
    console.log('==================================================');
}

run();
