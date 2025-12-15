import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Mock Type
interface RepresentativePricing {
    cremation?: { resident: number; nonResident: number; };
    enshrinement?: { min: number; max: number; label: string; };
    natural?: { joint?: number; individual?: number; couple?: number; };
    cemetery?: { minLandFee: number; };
}

const DATA_DIR = path.join(process.cwd(), 'data');

async function loadPricingData() {
    console.log('🔄 Loading Pricing Data...');
    const map = new Map<string, RepresentativePricing>();
    const analyzedDir = path.join(DATA_DIR, 'analyzed');

    const files = [
        { name: 'analyzed_pricing_cremation.csv', key: 'cremation', parse: (r: any) => ({ resident: +r.ResidentFee, nonResident: +r.NonResidentFee }) },
        { name: 'analyzed_pricing_enshrinement.csv', key: 'enshrinement', parse: (r: any) => ({ min: +r.MinPrice, max: +r.MaxPrice, label: r.Label }) },
        { name: 'analyzed_pricing_natural.csv', key: 'natural', parse: (r: any) => ({ joint: r.JointMinPrice ? +r.JointMinPrice : undefined, individual: r.IndividualMinPrice ? +r.IndividualMinPrice : undefined, couple: r.CoupleMinPrice ? +r.CoupleMinPrice : undefined }) },
        { name: 'analyzed_pricing_cemetery.csv', key: 'cemetery', parse: (r: any) => ({ minLandFee: +r.MinLandFee }) },
    ];

    for (const f of files) {
        const p = path.join(analyzedDir, f.name);
        if (fs.existsSync(p)) {
            console.log(`   - Reading ${f.name}`);
            const content = fs.readFileSync(p, 'utf-8');
            const rows = parse(content, { columns: true, skip_empty_lines: true });
            console.log(`     (Found ${rows.length} rows)`);

            rows.forEach((r: any) => {
                const id = r.ParkID;
                if (!map.has(id)) map.set(id, {});
                const entry = map.get(id) as any;
                entry[f.key] = f.parse(r);
            });
        } else {
            console.warn(`⚠️ Missing ${f.name}`);
        }
    }

    console.log(`✅ Loaded pricing for ${map.size} facilities.`);
    return map;
}

async function verify() {
    const pricingMap = await loadPricingData();

    // Check specific examples
    // 1. Cremation (e.g. park-0001 or find one)
    const sampleId = 'park-0058'; // Random pick from typical range if exists, or check map entries

    console.log('\n🔍 Sampling Data...');

    // Convert to array to pick samples
    const entries = Array.from(pricingMap.entries());

    const cremationSample = entries.find(e => e[1].cremation);
    if (cremationSample) {
        console.log(`[Cremation] ${cremationSample[0]}:`, cremationSample[1].cremation);
    }

    const naturalSample = entries.find(e => e[1].natural);
    if (naturalSample) {
        console.log(`[Natural] ${naturalSample[0]}:`, naturalSample[1].natural);
    }

    const enshSample = entries.find(e => e[1].enshrinement);
    if (enshSample) {
        console.log(`[Enshrinement] ${enshSample[0]}:`, enshSample[1].enshrinement);
    }

    // Verify park-1178 (Central Memorial Park) - Should have NO natural pricing if filtered correctly
    const p1178 = pricingMap.get('park-1178');
    if (p1178 && p1178.natural) {
        console.error('❌ park-1178 has natural pricing! Filtering FAILED.', p1178.natural);
    } else {
        console.log('✅ park-1178 correctly has NO natural pricing (Accessory filtered).');
    }
}

verify();
