const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { pdfToPng } = require('pdf-to-png-converter');

// ENV Loader
['.env', '.env.local'].forEach(fileName => {
    const envPath = path.join(__dirname, '../', fileName);
    if (fs.existsSync(envPath)) {
        console.log(`Loading env from ${fileName}`);
        const envConfig = fs.readFileSync(envPath, 'utf-8');
        envConfig.split('\n').forEach(line => {
            const [key, val] = line.split('=');
            if (key && val && !process.env[key.trim()]) {
                process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
            }
        });
    }
});

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY missing in .env");
    process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');

const PROMPT = `당신은 한국 장사시설 가격표 전문가입니다.

이 PDF 가격표를 분석하여 JSON으로 추출해주세요.

**분류 규칙:**
1. **기본비용**: 묘지/봉안당 사용료, 분양금, 안치료 + 연간/5년 관리비
2. **시설설치비**: 석물, 비석, 상석, 각자비, 작업비, 봉분 등
3. **기타서비스**: 벌초, 제사, 이장, 식사 등

**중요:**
- 가격은 반드시 숫자만 (300만원 → 3000000)
- 기본비용 내에서 **사용료가 위**, **관리비가 아래** 순서로
- m²가 있으면 평으로도 변환 (1평 = 3.3m²)

**JSON 형식:**
{
  "basic": {
    "rows": [
      {"name": "개인단 사용료", "price": 3000000, "grade": "1인형"},
      {"name": "연 관리비", "price": 50000, "grade": ""}
    ]
  },
  "installation": {
    "rows": [
      {"name": "비석 설치비", "price": 2000000, "grade": ""}
    ]
  },
  "services": {
    "rows": [
      {"name": "벌초대행", "price": 100000, "grade": "1회"}
    ]
  }
}`;

async function analyzePdfWithClaude(pdfPath) {
    try {
        console.log(`   Converting PDF to images...`);
        const pngPages = await pdfToPng(pdfPath, {
            disableFontFace: false,
            useSystemFonts: false,
            viewportScale: 2.0,
            outputFolder: path.join(__dirname, '../temp_pdf_images')
        });

        // Take first 3 pages (most price info is usually in first few pages)
        const imagesToAnalyze = pngPages.slice(0, 3);

        const imageContent = imagesToAnalyze.map(page => ({
            type: "image",
            source: {
                type: "base64",
                media_type: "image/png",
                data: fs.readFileSync(page.path).toString('base64')
            }
        }));

        console.log(`   Analyzing ${imagesToAnalyze.length} pages with Claude...`);

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4096,
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: PROMPT },
                    ...imageContent
                ]
            }]
        });

        // Clean up temp images
        pngPages.forEach(page => {
            if (fs.existsSync(page.path)) fs.unlinkSync(page.path);
        });
        const tempDir = path.join(__dirname, '../temp_pdf_images');
        if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir, { recursive: true });

        const responseText = message.content[0].text;
        console.log(`   Claude response length: ${responseText.length}`);

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.log(`   Response: ${responseText.substring(0, 200)}...`);
            throw new Error('No JSON found in response');
        }

        return JSON.parse(jsonMatch[0]);

    } catch (e) {
        console.error(`   Claude Error:`, e.message);
        return null;
    }
}

(async () => {
    console.log("=== Syncing TOP 10 Facilities using Claude AI ===\n");

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const targets = facilities.slice(0, 10);

    for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        const sortNum = i + 1;
        console.log(`[${sortNum}] ${item.name}`);

        // Find folder
        const folders = fs.readdirSync(ARCHIVE_DIR).filter(f => !f.startsWith('.'));
        const targetFolder = folders.find(f =>
            f.startsWith(`${sortNum}.`) || f.includes(item.name.replace(/\(.*\)/g, '').trim())
        );

        if (!targetFolder) {
            console.log(`   ❌ Folder not found\n`);
            continue;
        }

        const facilityFolder = path.join(ARCHIVE_DIR, targetFolder);
        const pdfFile = fs.readdirSync(facilityFolder).find(f => f.toLowerCase().endsWith('.pdf'));

        if (!pdfFile) {
            console.log(`   ❌ PDF not found\n`);
            continue;
        }

        // Analyze with Claude
        const aiData = await analyzePdfWithClaude(path.join(facilityFolder, pdfFile));

        if (aiData) {
            const finalPriceTable = {};

            // Build Basic Cost (Usage + Management)
            if (aiData.basic && aiData.basic.rows) {
                const usageRows = [];
                const mgmtRows = [];

                aiData.basic.rows.forEach(row => {
                    const name = row.name || '';
                    if (name.includes('관리비')) {
                        mgmtRows.push(row);
                    } else {
                        usageRows.push(row);
                    }
                });

                // Sort: usage expensive first, mgmt cheap first
                usageRows.sort((a, b) => (b.price || 0) - (a.price || 0));
                mgmtRows.sort((a, b) => (a.price || 0) - (b.price || 0));

                finalPriceTable['기본비용'] = {
                    unit: '원',
                    rows: [...usageRows, ...mgmtRows],
                    category: 'BASIC_COST'
                };
            }

            // Build Installation
            if (aiData.installation && aiData.installation.rows && aiData.installation.rows.length > 0) {
                finalPriceTable['[별도] 시설설치비'] = {
                    unit: '원',
                    rows: aiData.installation.rows,
                    category: 'INSTALLATION'
                };
            }

            // Build Services
            if (aiData.services && aiData.services.rows && aiData.services.rows.length > 0) {
                finalPriceTable['[안내] 관리비 및 기타'] = {
                    unit: '원',
                    rows: aiData.services.rows,
                    category: 'MANAGEMENT'
                };
            }

            if (!item.priceInfo) item.priceInfo = {};
            item.priceInfo.priceTable = finalPriceTable;

            console.log(`   ✅ Updated (${Object.keys(finalPriceTable).length} categories)\n`);

            // Rate limit: 1 request per 3 seconds
            await new Promise(r => setTimeout(r, 3000));
        } else {
            console.log(`   ⚠️ Analysis failed\n`);
        }
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
    console.log("✅ Top 10 Update Complete!");
})();
