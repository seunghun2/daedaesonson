require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(supabaseUrl, supabaseKey);

const parks = [
    { id: 'park-0017', file: '17.파주하늘나라공원_price_info.png' },
    { id: 'park-0018', file: '18.보령시모란공원_price_info.png' },
    { id: 'park-0019', file: '19.(재)남양공원묘원_price_info.png' },
    { id: 'park-0020', file: '20.목련공원묘원_price_info.png' },
    { id: 'park-0021', file: '21.물미묘원_price_info.png' },
    { id: 'park-0022', file: '22.천주교안성추모공원(묘원)_price_info.png' },
    { id: 'park-0023', file: '23.함양하늘공원(묘지)_price_info.png' },
    { id: 'park-0024', file: '24.(재)하늘나라공원 포천묘원_price_info.png' },
    { id: 'park-0025', file: '25.금릉공원묘원_price_info.png' }
];

const schemaPrompt = `
You are a precise data extractor. Your job is to extract burial/urn park pricing tables and convert them into a specific JSON format matching our standardizedPrices array.
ServiceTypes allowed: BURIAL (매장묘지 및 봉안묘), BONGSAN (봉안당/납골당), NATURAL (수목장/자연장), OTHER (석물, 부대비용 등).
FeeTypes allowed: USAGE (사용료, 분양가, 안치단, 석물, 대관료), MAINTENANCE (관리비).

Follow these rules STRICTLY:
1. "봉안묘" (urn grave in the ground) MUST use serviceType: 'BURIAL' (NOT BONGSAN or CEMETERY).
2. "매장묘", "합장묘", "단장묘", "평장묘" MUST use serviceType: 'BURIAL'.
3. "봉안당", "납골당", "봉안담" MUST use serviceType: 'BONGSAN'.
4. "석물", "조경", "기타", "선택항목", "부대시설", "텐트" MUST use serviceType: 'OTHER'.
5. Always create groups and explicitly label them in the subType field.
6. MUST OUTPUT THIS EXACT JSON STRUCTURE (Array of groups, where each group has a "rows" array):
[
  {
    "serviceType": "BURIAL",
    "subType": "봉안묘",
    "unit": "원",
    "rows": [
      {
        "name": "묘지사용료",
        "price": 1000000,
        "feeType": "USAGE",
        "grade": "1평",
        "note": "",
        "isRepresentative": true,
        "groupType": "봉안묘 (6기)",
        "duration": null,
        "durationType": null,
        "residency": "ALL"
      }
    ]
  }
]
7. MUST wrap your output ONLY in exactly valid JSON, nothing else. No markdown wrappers.
`;

async function processBatch() {
    const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
    let facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });

    for (const p of parks) {
        console.log(`Processing ${p.id} - ${p.file}...`);
        const imgPath = path.join(__dirname, '../archive5_images', p.file);

        if (!fs.existsSync(imgPath)) {
            console.error(`File missing: ${imgPath}`);
            continue;
        }

        const imageData = fs.readFileSync(imgPath).toString('base64');
        const imagePart = { inlineData: { data: imageData, mimeType: "image/png" } };

        try {
            const result = await model.generateContent([schemaPrompt, imagePart]);
            const responseText = result.response.text();

            // Validate JSON
            const standardizedPrices = JSON.parse(responseText.trim().replace(/```json/g, '').replace(/```/g, ''));

            // Local update
            const idx = facilitiesData.findIndex(f => f.id === p.id);
            if (idx === -1) continue;

            const facility = facilitiesData[idx];
            facility.priceInfo = facility.priceInfo || {};
            facility.priceInfo.standardizedPrices = standardizedPrices;
            delete facility.priceInfo.priceTable;
            facilitiesData[idx] = facility;

            // Supabase update
            const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(facility.priceInfo) }).eq('id', p.id);
            if (error) console.error(`[DB ERROR] ${p.id}:`, error);
            else console.log(`✅ Success ${p.id}`);

        } catch (e) {
            console.error(`Failed on ${p.id}:`, e.message);
        }
    }

    fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2));
    console.log('🎉 Batch completed! 🎉');
}

processBatch();
