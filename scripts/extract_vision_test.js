const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyD2qMR8nAEhxZNzbFhJPIz1EgUfNb8pdwE";
const TEST_FILE = 'archive4/1.함안하늘공원(자연장지).png';

async function main() {
  console.log(`🚀 Analyzing Image: ${TEST_FILE}`);

  if (!fs.existsSync(TEST_FILE)) {
    console.error("❌ File not found. Please check if archive4/1... exists.");
    // Try finding any png in archive4
    const files = fs.readdirSync('archive4').filter(f => f.endsWith('.png'));
    if (files.length > 0) {
      console.log(`Callback: Using ${files[0]} instead.`);
      analyze(path.join('archive4', files[0]));
    }
    return;
  }

  await analyze(TEST_FILE);
}

async function analyze(filePath) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Read file
  const fileData = fs.readFileSync(filePath);
  const mimeType = 'image/png';

  const prompt = `
Task: Analyze this cemetery facility information image and extract structured data.
STRICT RULE: EXTRACT ONLY TEXT VISIBLE IN THE IMAGE. DO NOT USE EXTERNAL KNOWLEDGE. 
If address or phone number is NOT visible in the image, return empty string "".

Extract two parts:
1. **Facility Info**:
   - Name (시설명)
   - Type (Tag e.g., 자연, 공설 - Look for tags below title)
   - Religion (Tag e.g., 기독교 - Look for tags)
   - Operation (Tag e.g., 공설, 사설 - Look for tags)
   - Address (주소 - ONLY if visible)
   - Phone (전화번호 - ONLY if visible)

2. **Pricing Table** (List of items):
   - Category (항목 e.g., 관리비, 사용료)
   - Details (내역 e.g., 개인단, 부부단, 관내, 관외)
   - Price (요금 - Extract raw number string with unit)
   
Output JSON Format ONLY:
{
  "info": {
    "name": "...",
    "type": "...",
    "religion": "...",
    "operation": "...",
    "address": "...",
    "phone": "..."
  },
  "prices": [
    { "category": "...", "details": "...", "price": "..." },
    ...
  ]
}
`;

  const result = await model.generateContent([
    { inlineData: { data: fileData.toString("base64"), mimeType } },
    prompt
  ]);

  const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
  console.log("\n📊 AI Analysis Result:\n");
  console.log(text);
}

main();
