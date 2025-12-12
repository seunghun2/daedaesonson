import { ActionIcon, Affix, Transition, Stack, Text, Box, ScrollArea, Center, Loader, Button } from '@mantine/core';

// Types
export interface RegionResult {
    type: 'gu' | 'dong';
    name: string;
    fullName: string; // e.g. "서울특별시 강남구", "서울특별시 강북구 수유동"
    center: { lat: number, lng: number };
}

// Optimization configs
const MAX_RESULTS = 15;

// Lightweight Search Index Item
interface SearchIndexItem {
    type: 'gu' | 'dong';
    name: string;      // Normalized name for display/logic (e.g. "수유동")
    fullName: string;  // Full text for matching (e.g. "서울특별시 강북구 수유동")
    originalName: string; // Original name for specific matching (e.g. "수유1동")
    searchStr: string; // Pre-processed string for searching (no spaces)
    center: { lat: number, lng: number };
}

let searchIndex: SearchIndexItem[] = [];
let isDataReady = false;
let isLoading = false;
let loadPromise: Promise<void> | null = null;
let guData: any = null; // Still keep for reference if needed, but mostly unused for search
let dongData: any = null;
let guMap: Record<string, string> = {}; // code -> name

const PROVINCE_MAP: Record<string, string> = {
    '11': '서울특별시',
    '26': '부산광역시',
    '27': '대구광역시',
    '28': '인천광역시',
    '29': '광주광역시',
    '30': '대전광역시',
    '31': '울산광역시',
    '36': '세종특별자치시',
    '41': '경기도',
    '42': '강원특별자치도',
    '43': '충청북도',
    '44': '충청남도',
    '45': '전북특별자치도',
    '46': '전라남도',
    '47': '경상북도',
    '48': '경상남도',
    '50': '제주특별자치도'
};

function getRoughCenter(geometry: any) {
    let coord = [0, 0];
    if (geometry.type === 'Polygon') {
        const ring = geometry.coordinates[0];
        let latSum = 0, lngSum = 0;
        ring.forEach((p: any) => { lngSum += p[0]; latSum += p[1]; });
        coord = [lngSum / ring.length, latSum / ring.length];
    } else if (geometry.type === 'MultiPolygon') {
        const ring = geometry.coordinates[0][0];
        let latSum = 0, lngSum = 0;
        ring.forEach((p: any) => { lngSum += p[0]; latSum += p[1]; });
        coord = [lngSum / ring.length, latSum / ring.length];
    }
    return { lat: coord[1], lng: coord[0] };
}

function normalizeDongName(name: string): string {
    return name.replace(/[0-9.]+동$/, '동');
}

export async function ensureRegionDataLoaded() {
    if (isDataReady) return;
    if (loadPromise) return loadPromise;

    isLoading = true;
    loadPromise = Promise.all([
        fetch('/data/skorea_gu.json').then(r => r.json()),
        fetch('/data/skorea_dong.json').then(r => r.json())
    ]).then(([gu, dong]) => {
        guData = gu;
        dongData = dong; // Store ref

        // 1. Build Gu Map & Index
        gu.features.forEach((f: any) => {
            const props = f.properties;
            if (props.code) {
                guMap[props.code] = props.name;

                const provCode = props.code.substring(0, 2);
                const province = PROVINCE_MAP[provCode] || '';
                const fullName = `${province} ${props.name}`;
                const center = getRoughCenter(f.geometry);

                searchIndex.push({
                    type: 'gu',
                    name: props.name,
                    originalName: props.name,
                    fullName: fullName,
                    searchStr: fullName.replace(/ /g, ''),
                    center: center
                });
            }
        });

        // 2. Build Dong Index
        dong.features.forEach((f: any) => {
            let name = f.properties.name || '';
            const code = f.properties.code || '';

            const guCode = code.substring(0, 5);
            const parentGuName = guMap[guCode];
            if (!parentGuName) return;

            const provCode = code.substring(0, 2);
            const province = PROVINCE_MAP[provCode] || '';

            const normalizedName = normalizeDongName(name); // "수유동"
            const fullName = `${province} ${parentGuName} ${normalizedName}`; // "서울 강북 수유동"
            const center = getRoughCenter(f.geometry);

            searchIndex.push({
                type: 'dong',
                name: normalizedName,
                originalName: name,
                fullName: fullName,
                searchStr: fullName.replace(/ /g, '') + name, // Index both full and original "수유1동"
                center: center
            });
        });

        isDataReady = true;
        isLoading = false;
        console.log(`✅ Region Index Built: ${searchIndex.length} entries`);
    }).catch(e => {
        console.error('❌ Failed to load region data', e);
        isLoading = false;
    });

    return loadPromise;
}

export async function searchRegions(keyword: string): Promise<RegionResult[]> {
    if (!keyword.trim()) return [];

    // Ensure data is loaded
    if (!isDataReady) {
        await ensureRegionDataLoaded();
    }

    // Fast Filter on Lightweight Index
    const results: RegionResult[] = [];
    const searchKey = keyword.trim().replace(/ /g, '').normalize('NFC');
    const cleanQuery = searchKey.replace(/동$/, '');

    const seenFullNames = new Set<string>();

    for (const item of searchIndex) {
        if (results.length >= MAX_RESULTS) break;

        // Match Logic
        // item.searchStr contains: "서울특별시강북구수유동수유1동" (No spaces)
        // This allows matching "수유", "수유1", "강북구수유" etc.
        if (item.searchStr.includes(searchKey)) {
            if (!seenFullNames.has(item.fullName)) {
                seenFullNames.add(item.fullName);
                results.push({
                    type: item.type,
                    name: item.name,
                    fullName: item.fullName,
                    center: item.center
                });
            }
        }
    }

    return results;
}
