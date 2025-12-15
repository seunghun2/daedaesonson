const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { glob } = require('glob');

require('dotenv').config({ path: '.env.local' });

const TARGET_IDS = ['1', '7'];

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ No GEMINI_API_KEY found');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using the Multimodal Model found in User's dashboard
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

    for (const id of TARGET_IDS) {
        console.log(`\n🚀 Analyzing Facility ID: ${id} with gemini-1.5-flash...`);

        // 1. Find Images
        let imagePaths = await glob(`FLATTENED_IMAGES/${id}.*jpg`);
        if (imagePaths.length === 0) imagePaths = await glob(`archive/${id}.*/**/*.jpg`);

        if (imagePaths.length === 0) {
            console.log(`⚠️ No images found for ID ${id}.`);
            continue;
        }

        console.log(`📸 Found ${imagePaths.length} images. Using top 3.`);
        const selectedImages = imagePaths.slice(0, 3);

        const imageParts = selectedImages.map(img => {
            return {
                inlineData: {
                    data: fs.readFileSync(img).toString("base64"),
                    mimeType: "image/jpeg",
                },
            };
        });

        const prompt = `
        You are an expert in Korean funeral facilities.
        Look at these photos of a facility.
        Classify it into one of the following categories based on what you see (e.g. tombstones, indoor lockers, trees, signs):
        - "공원묘지" (Outdoor Grave Park)
        - "봉안당" (Indoor Charnel House)
        - "수목장" (Natural/Tree Burial)
        - "복합" (Mix of above)

        Strictly return ONLY the category name in Korean.
        `;

        try {
            const result = await model.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            const text = response.text();

            console.log('------------------------------------------------');
            console.log(`🤖 Result for ID ${id}: [ ${text.trim()} ]`);
            console.log('------------------------------------------------');
        } catch (e) {
            console.error(`❌ API Error for ${id}:`, e.message);
        }
    }
}

main();
