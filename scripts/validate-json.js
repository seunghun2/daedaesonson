const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    JSON.parse(raw);
    console.log('✅ JSON is valid.');
} catch (e) {
    console.error('❌ JSON Error:', e.message);
}
