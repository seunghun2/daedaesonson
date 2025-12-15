const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');

const folders = fs.readdirSync(ARCHIVE_DIR).filter(f => !f.startsWith('.'));
const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

const samdeokFolder = folders.find(f => f.startsWith('3.'));
const samdeokItem = facilities.find(i => i.name.includes('삼덕') || i.description.includes('삼덕'));

console.log('--- DEBUG SAMDEOK ---');
console.log('Folder Original:', samdeokFolder);
if (samdeokFolder) {
    const normalized = samdeokFolder.normalize('NFC');
    console.log('Folder NFC:', normalized);

    // Test Parsing
    const dotIndex = normalized.indexOf('.');
    const rawName = normalized.substring(dotIndex + 1).trim();
    console.log('Parsed Raw Name:', rawName);
    console.log('Hex Raw:', Buffer.from(rawName).toString('hex'));

    // Test Clean
    const clean = rawName.replace(/^(\(재\)|\(주\)|\(사\)|\(종\)|재단법인|주식회사|사단법인|종교법인|공설)/, '').trim();
    console.log('Parsed Clean Name:', clean);
}

console.log('--- JSON ITEM ---');
if (samdeokItem) {
    console.log('Item Name:', samdeokItem.name);
    const itemNFC = samdeokItem.name.normalize('NFC').trim();
    console.log('Item NFC:', itemNFC);
    console.log('Hex Item:', Buffer.from(itemNFC).toString('hex'));

    // Compare
    const folderName = samdeokFolder ? samdeokFolder.normalize('NFC').split('.')[1].trim() : '';
    console.log('Does Item NFC === Folder Raw NFC?', itemNFC === folderName);
} else {
    console.log('Item NOT FOUND in JSON');
}

console.log('--- Why Ulsan is 3? ---');
const ulsanFolder = folders.find(f => f.includes('울산'));
console.log('Ulsan Folder:', ulsanFolder);
const ulsanItem = facilities.find(i => i.name.includes('울산'));
console.log('Ulsan Item:', ulsanItem ? ulsanItem.name : 'Missing');
