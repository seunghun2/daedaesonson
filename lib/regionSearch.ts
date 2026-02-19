// Types
export interface RegionResult {
    type: 'gu' | 'dong';
    name: string;
    fullName: string; // e.g. "서울특별시 강남구", "서울특별시 강남구 신사동"
    center: { lat: number, lng: number };
}

// Optimization configs
const MAX_RESULTS = 15;

// Lightweight Search Index Item
interface SearchIndexItem {
    type: 'gu' | 'dong';
    name: string;      // Normalized name for display (e.g. "신사동")
    fullName: string;  // Full path (e.g. "서울특별시 강남구 신사동")
    originalName: string; // Original name (e.g. "신사1동")
    searchStr: string; // Pre-processed string for searching (no spaces)
    center: { lat: number, lng: number };
    guName?: string;   // 부모 구 이름 (dong일 때만)
}

let searchIndex: SearchIndexItem[] = [];
let isDataReady = false;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

// GeoJSON에 code가 없으므로 순서(index) 기반으로 시/도 매핑
const PROVINCE_ORDER: { code: string; name: string; count: number }[] = [
    { code: '11', name: '서울특별시', count: 25 },
    { code: '21', name: '부산광역시', count: 16 },
    { code: '22', name: '대구광역시', count: 8 },
    { code: '23', name: '인천광역시', count: 10 },
    { code: '24', name: '광주광역시', count: 5 },
    { code: '25', name: '대전광역시', count: 5 },
    { code: '26', name: '울산광역시', count: 5 },
    { code: '29', name: '세종특별자치시', count: 1 },
    { code: '31', name: '경기도', count: 42 },
    { code: '32', name: '강원특별자치도', count: 18 },
    { code: '33', name: '충청북도', count: 14 },
    { code: '34', name: '충청남도', count: 16 },
    { code: '35', name: '전북특별자치도', count: 15 },
    { code: '36', name: '전라남도', count: 22 },
    { code: '37', name: '경상북도', count: 24 },
    { code: '38', name: '경상남도', count: 22 },
    { code: '39', name: '제주특별자치도', count: 2 },
];

function getRoughCenter(geometry: any) {
    let coord = [0, 0];
    if (geometry.type === 'Polygon') {
        const ring = geometry.coordinates[0];
        let latSum = 0, lngSum = 0;
        ring.forEach((p: any) => { lngSum += p[0]; latSum += p[1]; });
        coord = [lngSum / ring.length, latSum / ring.length];
    } else if (geometry.type === 'MultiPolygon') {
        // 가장 큰 폴리곤(점이 가장 많은)의 centroid 사용
        // 진도읍 등 섬이 포함된 MultiPolygon에서 메인 육지를 찾기 위함
        let largestRing = geometry.coordinates[0][0];
        for (const poly of geometry.coordinates) {
            if (poly[0].length > largestRing.length) {
                largestRing = poly[0];
            }
        }
        let latSum = 0, lngSum = 0;
        largestRing.forEach((p: any) => { lngSum += p[0]; latSum += p[1]; });
        coord = [lngSum / largestRing.length, latSum / largestRing.length];
    }
    return { lat: coord[1], lng: coord[0] };
}

function normalizeDongName(name: string): string {
    return name.replace(/[0-9.·]+동$/, '동');
}

export async function ensureRegionDataLoaded() {
    if (isDataReady) return;
    if (loadPromise) return loadPromise;

    isLoading = true;
    loadPromise = Promise.all([
        fetch('/data/skorea_gu.json').then(r => r.json()),
        fetch('/data/skorea_dong.json').then(r => r.json()),
        fetch('/data/dong_gu_mapping.json').then(r => r.json()),
        fetch('/data/legal_dong.csv').then(r => r.text()),
    ]).then(([gu, dong, dongGuMapping, legalDongCsv]) => {
        const guFeatures = gu.features || [];
        const dongFeatures = dong.features || [];

        // 1. Build 구 province map (index 기반)
        const guProvinceMap: string[] = [];
        for (const prov of PROVINCE_ORDER) {
            for (let i = 0; i < prov.count; i++) {
                guProvinceMap.push(prov.name);
            }
        }

        // 2. Build Gu Index + 구별 center 맵
        const guCenterMap: Record<string, { lat: number, lng: number }> = {};
        guFeatures.forEach((f: any, idx: number) => {
            const name = f.properties.name;
            const province = guProvinceMap[idx] || '';
            const fullName = `${province} ${name}`;
            const center = getRoughCenter(f.geometry);

            guCenterMap[fullName] = center;

            searchIndex.push({
                type: 'gu',
                name: name,
                originalName: name,
                fullName: fullName,
                searchStr: fullName.replace(/ /g, ''),
                center: center
            });
        });

        // 3. Build Dong Index (행정동 - dong_gu_mapping.json 사용)
        const existingDongFullNames = new Set<string>();
        // 읍/면 center 맵 (리의 부모 center로 사용)
        const eupMyeonCenterMap: Record<string, { lat: number, lng: number }> = {};
        dongFeatures.forEach((f: any, idx: number) => {
            const originalName = f.properties.name || '';
            const normalizedName = normalizeDongName(originalName);
            const center = getRoughCenter(f.geometry);

            const mapping = dongGuMapping[idx];
            if (!mapping) return;

            const province = mapping.prov || '';
            const guName = mapping.gu || '';
            const fullName = `${province} ${guName} ${normalizedName}`;

            existingDongFullNames.add(fullName);

            // 읍/면 center 저장 (리 단위의 부모 center로 사용)
            if (originalName.endsWith('읍') || originalName.endsWith('면')) {
                const eupMyeonKey = `${province} ${guName} ${originalName}`;
                eupMyeonCenterMap[eupMyeonKey] = center;
            }

            searchIndex.push({
                type: 'dong',
                name: normalizedName,
                originalName: originalName,
                fullName: fullName,
                searchStr: fullName.replace(/ /g, '') + originalName,
                center: center,
                guName: guName,
            });
        });

        // 4. 법정동 CSV에서 행정동에 없는 동/리 추가
        let legalDongCount = 0;
        const legalLines = legalDongCsv.split('\n').slice(1); // 헤더 스킵
        for (const line of legalLines) {
            if (!line.trim()) continue;
            const cols = line.split(',');
            // code,siCode,siName,guCode,guName,fullName,name,active
            const active = cols[7]?.trim();
            if (active !== 'true') continue;

            const siName = cols[2];
            const guName = cols[4];
            const dongName = cols[6];
            const fullName = `${siName} ${guName} ${dongName}`;

            // 이미 행정동 인덱스에 있으면 스킵
            if (existingDongFullNames.has(fullName)) continue;

            // 리 단위인 경우 부모 읍/면 center 우선 사용
            let center = { lat: 0, lng: 0 };
            if (dongName.endsWith('리')) {
                // "진도읍 수유리" → 읍면 = "진도읍"
                const eupMyeonMatch = dongName.match(/^(.+[읍면])\s/);
                if (eupMyeonMatch) {
                    const eupMyeonKey = `${siName} ${guName} ${eupMyeonMatch[1]}`;
                    center = eupMyeonCenterMap[eupMyeonKey] || center;
                }
            }
            // 읍/면 center를 못 찾았으면 부모 구/시 center 사용
            if (center.lat === 0 && center.lng === 0) {
                const guFullName = `${siName} ${guName}`;
                center = guCenterMap[guFullName] || { lat: 0, lng: 0 };
            }
            if (center.lat === 0 && center.lng === 0) continue; // 매칭 안 되면 스킵

            existingDongFullNames.add(fullName);
            searchIndex.push({
                type: 'dong',
                name: dongName,
                originalName: dongName,
                fullName: fullName,
                searchStr: fullName.replace(/ /g, '') + dongName,
                center: center,
                guName: guName,
            });
            legalDongCount++;
        }

        isDataReady = true;
        isLoading = false;
        console.log(`✅ Region Index Built: ${searchIndex.length} entries (gu: ${guFeatures.length}, 행정동: ${dongFeatures.length}, 법정동추가: ${legalDongCount})`);
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

    const results: RegionResult[] = [];
    const searchKey = keyword.trim().replace(/ /g, '').normalize('NFC');

    const seenFullNames = new Set<string>();

    // 1단계: 구/시 매칭 (우선)
    for (const item of searchIndex) {
        if (results.length >= MAX_RESULTS) break;
        if (item.type !== 'gu') continue;

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

    // 2단계: 직접 동 매칭
    // - 동 이름 자체에 검색어 포함: "수유" → 수유동
    // - 전체 경로에 검색어 포함 (2글자 이상): "강북구 수유동" → 서울특별시 강북구 수유동
    // - 단, 구 이름만 매칭되는 건 3단계에서 처리 (하위 동 자동 표시)
    for (const item of searchIndex) {
        if (results.length >= MAX_RESULTS) break;
        if (item.type !== 'dong') continue;

        const dongNameMatch = item.name.includes(searchKey) || item.originalName.includes(searchKey);
        // 전체 경로 매칭 (구 이름만으로 잡히는 건 제외하기 위해, 동 이름에도 검색어 일부가 포함되어야 함)
        const fullPathMatch = searchKey.length >= 2 && item.searchStr.includes(searchKey) && !(item.guName ?? '').endsWith(searchKey + '구');
        if (dongNameMatch || fullPathMatch) {
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

    // 3단계: 매칭된 구의 하위 동 (최대 4개씩만)
    const matchedGuNames = results
        .filter(r => r.type === 'gu')
        .map(r => r.fullName); // "서울특별시 강남구"

    if (matchedGuNames.length > 0) {
        const MAX_CHILD_DONGS = 4;
        for (const guFullName of matchedGuNames) {
            let childCount = 0;
            for (const item of searchIndex) {
                if (results.length >= MAX_RESULTS) break;
                if (childCount >= MAX_CHILD_DONGS) break;
                if (item.type !== 'dong') continue;

                if (item.fullName.startsWith(guFullName) && !seenFullNames.has(item.fullName)) {
                    seenFullNames.add(item.fullName);
                    results.push({
                        type: item.type,
                        name: item.name,
                        fullName: item.fullName,
                        center: item.center
                    });
                    childCount++;
                }
            }
        }
    }

    return results;
}
