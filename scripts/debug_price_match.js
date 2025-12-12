const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const PRICE_CSV_FUNERAL = path.join(__dirname, '../plusplus/2.장례식장가격정보_20230601.csv');
const PRICE_CSV_OTHER = path.join(__dirname, '../plusplus/3.장사시설(장례식장제외)가격정보_20230601.csv');

function readCsv(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const buffer = fs.readFileSync(filePath);
    const decoder = new TextDecoder('euc-kr');
    const content = decoder.decode(buffer);
    const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
    return parsed.data;
}

const funeralPrices = readCsv(PRICE_CSV_FUNERAL);
const otherPrices = readCsv(PRICE_CSV_OTHER);
const allPrices = [...funeralPrices, ...otherPrices];

console.log(`Total Price Records: ${allPrices.length}`);

const targets = ['낙원', '실로암'];

targets.forEach(keyword => {
    console.log(`\n--- Searching for '${keyword}' ---`);
    const matches = allPrices.filter(p => {
        const name = p['시설명'] || p['장사시설명'] || '';
        return name.includes(keyword);
    });

    matches.forEach(m => {
        const name = m['시설명'] || m['장사시설명'];
        const item = m['품목'];
        const price = m['금액'];
        console.log(`[${name}] ${item}: ${price}`);
    });
});
