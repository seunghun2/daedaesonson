const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname, '../public/images/facilities');
const MAX_W = 1200, Q = 80;
let converted = 0, skipped = 0, saved = 0, errors = 0;

function getImages(dir) {
    const r = [];
    if (!fs.existsSync(dir)) return r;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) r.push(...getImages(p));
        else if (/\.(jpg|jpeg|png)$/i.test(e.name)) r.push(p);
    }
    return r;
}

async function run() {
    const imgs = getImages(DIR);
    console.log('Total: ' + imgs.length + ' images');

    for (let i = 0; i < imgs.length; i += 5) {
        const batch = imgs.slice(i, i + 5);
        await Promise.all(batch.map(async (f) => {
            const d = path.dirname(f);
            const b = path.basename(f, path.extname(f));
            const wp = path.join(d, b + '.webp');
            if (fs.existsSync(wp)) { skipped++; return; }
            const sz = fs.statSync(f).size;
            try {
                await sharp(f)
                    .resize({ width: MAX_W, withoutEnlargement: true })
                    .webp({ quality: Q, effort: 6 })
                    .toFile(wp);
                const ns = fs.statSync(wp).size;
                saved += (sz - ns);
                converted++;
            } catch (e) {
                errors++;
            }
        }));
        if ((i + 5) % 100 === 0) {
            process.stdout.write('\rProgress: ' + Math.min(i + 5, imgs.length) + '/' + imgs.length + ' converted:' + converted + ' skipped:' + skipped);
        }
    }
    console.log('');
    console.log('Done! converted:' + converted + ' skipped:' + skipped + ' errors:' + errors + ' saved:' + Math.round(saved / 1048576) + 'MB');
}

run();
