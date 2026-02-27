require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parks = [
    { id: 'park-0013', file: '13.(재)서울공원묘원_price_info.png' },
    { id: 'park-0014', file: '14.(재)자하연 일산(묘지)_price_info.png' },
    { id: 'park-0015', file: '15.(재)이화공원묘원_price_info.png' },
    { id: 'park-0016', file: '16.김해공원묘원_price_info.png' }
];

async function transcribe() {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    for (const p of parks) {
        console.log(`\n\n=== ${p.id} ===`);
        const imgPath = path.join(__dirname, '../archive5_images', p.file);

        if (!fs.existsSync(imgPath)) continue;

        const imageData = fs.readFileSync(imgPath).toString('base64');
        const imagePart = { inlineData: { data: imageData, mimeType: "image/png" } };

        try {
            const result = await model.generateContent(["Extract all text from this pricing table image exactly as it appears. Preserve the table structure using markdown or clear text.", imagePart]);
            console.log(result.response.text());
        } catch (e) {
            console.error(`Failed on ${p.id}:`, e.message);
        }
    }
}

transcribe();
