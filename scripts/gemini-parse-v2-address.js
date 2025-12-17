const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { google } = require('googleapis');

const GEMINI_API_KEY = 'AIzaSyDpOlkAJ2dB0PkZGLk51wPLkNOlOW9YwpA';
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json', 'utf8'));

// Gemini API 호출
function callGemini(prompt) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.candidates && json.candidates[0]) {
                        resolve(json.candidates[0].content.parts[0].text);
                    } else {
                        reject(new Error('No response'));
                    }
                } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// HWPX 텍스트 추출
function extractHWPXText(hwpxPath) {
    const tempDir = hwpxPath + '_temp';
    try {
        execSync(`unzip -o "${hwpxPath}" -d "${tempDir}" 2>/dev/null`);
        const xmlPath = path.join(tempDir, 'Contents', 'section0.xml');
        if (!fs.existsSync(xmlPath)) return null;
        const xml = fs.readFileSync(xmlPath, 'utf8');
        const texts = (xml.match(/<hp:t>([^<]+)<\/hp:t>/g) || []).map(m => m.replace(/<hp:t>|<\/hp:t>/g, '').trim()).filter(t => t.length > 0);
        execSync(`rm -rf "${tempDir}"`);
        return texts.join('\n');
    } catch (e) { return null; }
}

// HWP 텍스트 추출
function extractHWPText(hwpPath) {
    try {
        const result = execSync(`/Users/el/Library/Python/3.9/bin/hwp5proc xml "${hwpPath}" 2>/dev/null`, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
        const texts = (result.match(/<Text[^>]*>([^<]+)<\/Text>/g) || []).map(m => m.replace(/<Text[^>]*>|<\/Text>/g, '').trim()).filter(t => t.length > 0);
        return texts.join('\n');
    } catch (e) { return null; }
}

// Gemini로 시설 정보 + 가격 추출
async function parseWithGemini(text, region, fileName) {
    const prompt = `다음은 한국 지자체 장사시설 조례 문서입니다.
이 문서에서 **시설 정보와 가격**을 모두 추출해서 JSON 배열로 만들어주세요.

각 행은 다음 필드를 가져야 합니다:
- facilityName: 시설명 (예: "OO시 공설봉안당", "OO군 추모공원" 등)
- address: 주소 (예: "OO시 OO읍 OO리 123" - 없으면 null)
- facilityType: 시설유형 (봉안당, 봉안담, 자연장지, 화장시설, 묘역시설 등)
- category: 구분 (단장, 합장, 가족장 등, 없으면 "-")
- residency: 거주구분 (관내, 관외, 구분없음이면 "-")
- period: 사용기간 (30년, 15년 등, 없으면 "-")
- usageFee: 사용료 (숫자만, 원 단위)
- managementFee: 관리비 (숫자만, 원 단위, 없으면 0)
- total: 합계 (숫자만, 원 단위)

주의사항:
- 시설 명칭과 위치가 있으면 반드시 추출
- 주소는 "OO도 OO시 OO동" 형식으로 가능한 상세히
- 관내/관외 가격이 다르면 별도 행으로 분리
- 천원 단위인 경우 원 단위로 변환
- JSON만 출력, 다른 설명 없이

조례 텍스트:
${text.substring(0, 5000)}

JSON 배열:`;

    try {
        const response = await callGemini(prompt);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.map(row => ({ region, fileName, ...row }));
        }
    } catch (e) {
        console.log(`  에러: ${e.message}`);
    }
    return [];
}

// 모든 파일 찾기
function findAllFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        if (item.startsWith('.')) continue;
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            files.push(...findAllFiles(itemPath));
        } else if (item.endsWith('.hwpx') || item.endsWith('.hwp')) {
            files.push(itemPath);
        }
    }
    return files;
}

// 메인 실행
async function main() {
    console.log('파일 탐색 중...');
    const allFiles = findAllFiles('data/ordinance_hwp');
    console.log(`총 ${allFiles.length}개 파일 발견\n`);

    const allRows = [];
    let processed = 0;

    for (const filePath of allFiles) {
        const region = path.basename(path.dirname(filePath));
        const fileName = path.basename(filePath);

        process.stdout.write(`[${++processed}/${allFiles.length}] ${region} - ${fileName.substring(0, 30)}...`);

        let text = filePath.endsWith('.hwpx') ? extractHWPXText(filePath) : extractHWPText(filePath);

        if (text && text.length > 50) {
            const rows = await parseWithGemini(text, region, fileName);
            console.log(` → ${rows.length}행`);
            allRows.push(...rows);

            // Rate limit 방지
            await new Promise(r => setTimeout(r, 500));
        } else {
            console.log(' → 텍스트 없음');
        }
    }

    // JSON 저장
    fs.writeFileSync('data/ordinance_hwp/gemini_parsed_v2_with_address.json', JSON.stringify(allRows, null, 2));
    console.log(`\n총 ${allRows.length}행 저장: data/ordinance_hwp/gemini_parsed_v2_with_address.json`);

    // Google Sheet 업로드
    console.log('\nGoogle Sheet 업로드 중...');
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const sheetName = '조례_가격_v2_주소포함';

    // 시트 생성 시도
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: [{ addSheet: { properties: { title: sheetName } } }] }
        });
    } catch (e) { /* 이미 존재 */ }

    // 데이터 업로드
    const headers = [['지자체', '파일명', '시설명', '주소', '시설유형', '구분', '거주구분', '사용기간', '사용료', '관리비', '합계']];
    const rows = allRows.map(d => [
        d.region,
        d.fileName,
        d.facilityName || '-',
        d.address || '-',
        d.facilityType || '-',
        d.category || '-',
        d.residency || '-',
        d.period || '-',
        d.usageFee || 0,
        d.managementFee || 0,
        d.total || 0
    ]);

    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: `${sheetName}!A:K` });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:K${rows.length + 1}`,
        valueInputOption: 'RAW',
        resource: { values: [...headers, ...rows] }
    });

    console.log(`완료! ${rows.length}행 업로드됨`);

    // 주소 있는 행 통계
    const withAddress = allRows.filter(r => r.address && r.address !== '-' && r.address !== null).length;
    console.log(`\n주소 포함된 행: ${withAddress}/${allRows.length} (${(withAddress / allRows.length * 100).toFixed(1)}%)`);
}

main().catch(console.error);
