const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const ARCHIVE_DIR = path.join(__dirname, '../archive');
const OUTPUT_FILE = path.join(__dirname, '../data/pricing_all.csv');

// 결과 저장 배열
const allRows = [];
const errorLogs = [];

// 정규식: (이름)(가격:콤마포함)(수량:숫자)
// 예: "사용료단장묘359,4401" -> Name:사용료단장묘, Price:359,440, Qty:1
const PATTERN = /(.*?)(\d{1,3}(?:,\d{3})+)(\d*)$/;

// 카테고리 추정 함수
function guessCategory(name) {
    if (name.includes('관리비') || name.includes('사용료')) return '기본비용';
    if (name.includes('상석') || name.includes('비석') || name.includes('매장') || name.includes('봉분')) return '매장묘';
    if (name.includes('봉안당') || name.includes('단')) return '봉안당';
    if (name.includes('봉안묘')) return '봉안묘';
    if (name.includes('수목') || name.includes('자연') || name.includes('평장')) return '수목장';
    return '기타';
}

async function processPdf(filePath, facilityName, facilityId) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const lines = data.text.split('\n');

        lines.forEach(line => {
            const cleanLine = line.trim();
            if (cleanLine.length < 2) return;

            // 제외 키워드
            if (/전화번호|팩스|주소|홈페이지|업데이트|만족도|개인정보|Copyright/.test(cleanLine)) return;

            const match = cleanLine.match(PATTERN);
            if (match) {
                const name = match[1].trim();
                let priceRaw = match[2].replace(/,/g, '');
                let price = parseInt(priceRaw, 10);

                // 후처리: 가격 끝자리가 1이고, 숫자가 표준적인 가격 단위(0,000)가 아닌 경우
                // 예: 3594401 (359,440원 + 수량1) -> 1을 제거
                if (price > 1000 && price % 10 === 1) {
                    const corrected = Math.floor(price / 10);
                    // 보정된 가격이 100원 단위나 000원 단위로 떨어지면 수량 1이 붙은 것으로 간주
                    // 또는 원본 가격이 너무 비정상적(3백5십9만...)인데 보정 후 정상적이면 채택
                    if (corrected % 10 === 0) {
                        price = corrected;
                    }
                }

                // 이름이 너무 짧거나 숫자로만 된 경우 스킵
                if (name.length < 2 || /^\d+$/.test(name)) return;

                // 중복 방지 (같은 파일 내)
                // (일단 다 넣고 CSV에서 필터링 가능하지만, 여기선 바로 추가)

                allRows.push({
                    id: facilityId,
                    facility: facilityName,
                    category: guessCategory(name),
                    item: name,
                    price: price,
                    raw: name // 숫자(가격/수량) 제거된 텍스트
                });
            }
        });
    } catch (e) {
        errorLogs.push(`${facilityId} (${facilityName}): ${e.message}`);
    }
}

(async () => {
    console.log('PDF 전체 추출 시작...');

    // 시설 이름 매핑용
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
    const nameMap = {};
    facilities.forEach(f => nameMap[f.id] = f.name);

    if (fs.existsSync(ARCHIVE_DIR)) {
        const dirs = fs.readdirSync(ARCHIVE_DIR);

        let count = 0;
        for (const dir of dirs) {
            if (dir.startsWith('.')) continue; // 숨김파일 제외

            // dir 이름에서 ID 추출 (예: "47.양양군..." -> park-0047)
            const numMatch = dir.match(/^(\d+)\./);
            if (!numMatch) continue;

            const num = parseInt(numMatch[1], 10);
            const facilityId = `park-${String(num).padStart(4, '0')}`;
            const facilityName = nameMap[facilityId] || dir; // 매핑 없으면 폴더명 사용

            const dirPath = path.join(ARCHIVE_DIR, dir);
            if (fs.statSync(dirPath).isDirectory()) {
                const files = fs.readdirSync(dirPath);
                const pdfFile = files.find(f => f.toLowerCase().endsWith('price_info.pdf'));

                if (pdfFile) {
                    process.stdout.write(`\r처리중: ${dir}               `);
                    await processPdf(path.join(dirPath, pdfFile), facilityName, facilityId);
                    count++;
                }
            }
        }
        console.log(`\n\n총 ${count}개 PDF 파일 처리 완료.`);
    }

    // CSV 저장
    const csvHeader = 'FacilityID,FacilityName,Category,ItemName,Price,RawText\n';
    const csvBody = allRows.map(r => {
        // CSV 이스케이프: 이름에 콤마가 있으면 따옴표 감싸기
        const safeName = r.item.includes(',') ? `"${r.item}"` : r.item;
        return `${r.id},${r.facility},${r.category},${safeName},${r.price},"${r.raw.replace(/"/g, '""')}"`;
    }).join('\n');

    fs.writeFileSync(OUTPUT_FILE, csvHeader + csvBody);

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`총 ${allRows.length}개 가격 항목 추출됨.`);
    console.log(`결과 파일: ${OUTPUT_FILE}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 미리보기
    console.log('앞부분 10개 미리보기:');
    allRows.slice(0, 10).forEach(r => console.log(`${r.facility} | ${r.item} | ${r.price}`));

})();
