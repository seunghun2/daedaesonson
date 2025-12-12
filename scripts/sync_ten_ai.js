const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- ENV LOADER ---
['.env', '.env.local'].forEach(fileName => {
    const envPath = path.join(__dirname, '../', fileName);
    if (fs.existsSync(envPath)) {
        console.log(`Loading env from ${fileName}`);
        const envConfig = fs.readFileSync(envPath, 'utf-8');
        envConfig.split('\n').forEach(line => {
            const [key, val] = line.split('=');
            if (key && val) {
                // simple parser, ignores comments or complex values
                if (!process.env[key.trim()]) {
                    process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
                }
            }
        });
    }
});

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY missing in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: { responseMimeType: "application/json" }
});

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');

// --- PROMPT (Copied & Adapted for JSON only) ---
const PROMPT = `
당신은 한국 장사 시설 가격표 분석 전문가입니다.
PDF 문서에서 가격 데이터를 추출하여 JSON으로 반환하세요.

규칙:
1. **데이터 분류**:
   - **products (메인/분양/사용료)**: 묘지, 봉안당, 수목장 등 '공간 사용권'에 대한 비용.
   - **installationCosts (시설설치비)**: 석물, 비석, 상석, 각자, 작업비, 봉분, 조경 등 '하드웨어/설치' 비용.
   - **managementCosts (관리비)**: 연간 관리비, 5년 선납 관리비, 벌초비 등 '유지관리' 비용.

2. **가격 변환**: 숫자만 추출 (예: 300만원 -> 3000000).

3. **JSON 구조**:
{
    "products": {
        "그룹명(예: 1단지)": {
            "rows": [ { "name": "상품명", "price": 0, "grade": "규격" } ]
        }
    },
    "installationCosts": {
        "rows": [ { "name": "항목명", "price": 0 } ]
    },
    "managementCosts": {
        "rows": [ { "name": "항목명", "price": 0 } ]
    }
}
`;

async function analyzePdfWithGemini(pdfPath) {
    try {
        const fileData = fs.readFileSync(pdfPath);
        const base64Data = fileData.toString('base64');

        const result = await model.generateContent([
            PROMPT,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "application/pdf"
                }
            }
        ]);

        const text = result.response.text();
        // Extract JSON block if wrapped
        const jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (e) {
        console.error("Gemini Error:", e.message);
        return null;
    }
}

(async () => {
    console.log("=== Syncing TOP 10 Facilities using Gemini AI ===");

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const targets = facilities.slice(0, 10);

    for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        const sortNum = i + 1;
        console.log(`[${sortNum}] AI Analysis: ${item.name}...`);

        // Find PDF
        const folders = fs.readdirSync(ARCHIVE_DIR).filter(f => !f.startsWith('.'));
        const targetFolder = folders.find(f => {
            return f.startsWith(`${sortNum}.`) || f.includes(item.name.replace(/\(.*\)/g, '').trim());
        });

        if (!targetFolder) {
            console.log("   ❌ Folder not found");
            continue;
        }

        const facilityFolder = path.join(ARCHIVE_DIR, targetFolder);
        const folderPdf = fs.readdirSync(facilityFolder).find(f => f.toLowerCase().endsWith('.pdf'));

        if (!folderPdf) {
            console.log("   ❌ PDF not found");
            continue;
        }

        // --- GEMINI CALL ---
        const aiData = await analyzePdfWithGemini(path.join(facilityFolder, folderPdf));

        if (aiData) {
            const finalPriceTable = {};

            // 1. Build BASIC COST (Products + Management)
            // Rules: Usage Fee (Products) TOP, Management (Mgmt) BOTTOM.
            const basicRows = [];

            // Collect User Fees
            if (aiData.products) {
                Object.values(aiData.products).forEach(group => {
                    if (group.rows) {
                        basicRows.push(...group.rows);
                    }
                });
            }
            // Sort Usage Fees (Expensive first)
            basicRows.sort((a, b) => b.price - a.price);

            // Collect Management Fees
            const mgmtRows = [];
            if (aiData.managementCosts && aiData.managementCosts.rows) {
                mgmtRows.push(...aiData.managementCosts.rows);
            }
            // Sort Mgmt Fees (Cheap first)
            mgmtRows.sort((a, b) => a.price - b.price); // Asc

            // Merge: Usage -> Mgmt
            finalPriceTable['기본비용'] = {
                unit: '원',
                rows: [...basicRows, ...mgmtRows],
                category: 'BASIC_COST'
            };

            // 2. Build INSTALLATION
            if (aiData.installationCosts && aiData.installationCosts.rows) {
                finalPriceTable['[별도] 시설설치비'] = {
                    unit: '원',
                    rows: aiData.installationCosts.rows,
                    category: 'INSTALLATION'
                };
            }

            // Update Data
            // Keep existing images (user said they are good)
            if (!item.priceInfo) item.priceInfo = {};
            item.priceInfo.priceTable = finalPriceTable;

            console.log("   ✅ Price Updated via AI.");

            // Wait to avoid rate limit (just in case 10 is fast)
            await new Promise(r => setTimeout(r, 2000));
        } else {
            console.log("   ⚠️ AI Analysis Failed.");
        }
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
    console.log("✅ Top 10 Update Complete.");
})();
