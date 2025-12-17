const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const GEMINI_API_KEY = 'AIzaSyDpOlkAJ2dB0PkZGLk51wPLkNOlOW9YwpA';

// Gemini API 호출
async function callGemini(prompt) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 4096
            }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
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
                        reject(new Error('No response: ' + body));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// HWPX 텍스트 추출
function extractHWPXText(hwpxPath) {
    const baseName = path.basename(hwpxPath, '.hwpx');
    const tempDir = path.join(path.dirname(hwpxPath), `${baseName}_temp`);

    try {
        execSync(`unzip -o "${hwpxPath}" -d "${tempDir}" 2>/dev/null`);
        const xmlPath = path.join(tempDir, 'Contents', 'section0.xml');
        if (!fs.existsSync(xmlPath)) return null;

        const xml = fs.readFileSync(xmlPath, 'utf8');
        const texts = (xml.match(/<hp:t>([^<]+)<\/hp:t>/g) || [])
            .map(m => m.replace(/<hp:t>|<\/hp:t>/g, '').trim())
            .filter(t => t.length > 0);

        execSync(`rm -rf "${tempDir}"`);
        return texts.join('\n');
    } catch (e) {
        return null;
    }
}

// HWP 텍스트 추출
function extractHWPText(hwpPath) {
    try {
        const result = execSync(
            `/Users/el/Library/Python/3.9/bin/hwp5proc xml "${hwpPath}" 2>/dev/null`,
            { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
        );

        const texts = (result.match(/<Text[^>]*>([^<]+)<\/Text>/g) || [])
            .map(m => m.replace(/<Text[^>]*>|<\/Text>/g, '').trim())
            .filter(t => t.length > 0);

        return texts.join('\n');
    } catch (e) {
        return null;
    }
}

// Gemini로 가격 데이터 파싱
async function parseWithGemini(text, region, fileName) {
    const prompt = `다음은 한국 지자체 장사시설 조례의 사용료 표입니다.
이 데이터를 분석해서 JSON 배열로 변환해주세요.

각 행은 다음 필드를 가져야 합니다:
- facilityType: 시설유형 (봉안당, 봉안담, 자연장지, 화장시설, 묘역시설 등)
- category: 구분 (단장, 합장, 가족장 등)
- residency: 거주구분 (관내, 관외, 또는 구분없음이면 "-")
- period: 사용기간 (30년, 15년 등)
- usageFee: 사용료 (숫자만, 원 단위)
- managementFee: 관리비 (숫자만, 원 단위)
- total: 합계 (숫자만, 원 단위)

주의사항:
- 관내/관외 가격이 다르면 별도 행으로 분리
- 천원 단위인 경우 원 단위로 변환
- JSON만 출력, 다른 설명 없이

조례 텍스트:
${text.substring(0, 3000)}

JSON 배열:`;

    try {
        const response = await callGemini(prompt);
        // JSON 추출
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.map(row => ({
                region,
                fileName,
                ...row
            }));
        }
    } catch (e) {
        console.log(`  에러: ${e.message}`);
    }
    return [];
}

// 테스트: 3개 파일만 처리
async function testParsing() {
    const testFiles = [
        'data/ordinance_hwp/강릉시/[별표 1] 공설묘역시설 사용료 및 관리비(강릉시 장사시설 설치 및 운영 조례).hwpx',
        'data/ordinance_hwp/강릉시/[별표 2] 공설화장시설 사용료(강릉시 장사시설 설치 및 운영 조례).hwpx'
    ];

    const allRows = [];

    for (const filePath of testFiles) {
        if (!fs.existsSync(filePath)) {
            console.log(`파일 없음: ${filePath}`);
            continue;
        }

        const region = path.basename(path.dirname(filePath));
        const fileName = path.basename(filePath);
        console.log(`\n처리 중: ${region} - ${fileName}`);

        let text = null;
        if (filePath.endsWith('.hwpx')) {
            text = extractHWPXText(filePath);
        } else {
            text = extractHWPText(filePath);
        }

        if (text) {
            console.log(`  텍스트 추출: ${text.length}자`);
            const rows = await parseWithGemini(text, region, fileName);
            console.log(`  파싱 결과: ${rows.length}행`);
            allRows.push(...rows);
        }
    }

    console.log('\n=== 결과 ===');
    console.log(JSON.stringify(allRows, null, 2));

    fs.writeFileSync('data/ordinance_hwp/gemini_test_result.json', JSON.stringify(allRows, null, 2));
    console.log('\n저장: data/ordinance_hwp/gemini_test_result.json');
}

testParsing();
