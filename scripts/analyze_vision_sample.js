const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyD2qMR8nAEhxZNzbFhJPIz1EgUfNb8pdwE";
const ARCHIVE_DIR = 'archive4';

async function main() {
    console.log("🚀 Analyzing Samples 1~10 for Variable Definition...");

    const files = fs.readdirSync(ARCHIVE_DIR)
        .filter(f => f.endsWith('.png'))
        .sort((a, b) => parseInt(a) - parseInt(b))
        .slice(0, 10);

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    for (const file of files) {
        console.log(`\n📸 Image: ${file}`);
        const filePath = path.join(ARCHIVE_DIR, file);
        const fileData = fs.readFileSync(filePath);

        const prompt = `
Task: Analyze this cemetery pricing table image to define the best data structure using Korean keys.

1. **Facility Info** (Top section): What fields are visible? (e.g., Name, Type tags, Address?)
2. **Pricing Table** (Bottom section): What columns are in the table? (e.g., Category, Item, Price?)
   - Note: The table headers in the image might be "사용료 항목", "사용료 내역", "요금".
   
Output JSON with Korean keys mapping what you see:
{
  "시설정보": {
    "시설명": "...",
    "태그": ["...", "..."],
    "주소": "..." (if visible),
    "전화번호": "..." (if visible)
  },
  "가격표_헤더분석": ["헤더1", "헤더2", "헤더3"],
  "가격데이터_샘플": [
    { "항목": "...", "내역": "...", "금액": "..." }
  ]
}
`;
        const result = await model.generateContent([
            { inlineData: { data: fileData.toString("base64"), mimeType: 'image/png' } },
            prompt
        ]);

        console.log(result.response.text());
    }
}

main();
