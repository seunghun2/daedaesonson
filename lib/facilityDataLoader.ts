import fs from 'fs';
import path from 'path';
import { cache } from 'react';

let globalCachedFacilities: any[] | null = null;
let globalCachedFacilitiesMap: Map<string, any> | null = null;

/**
 * facilities.json 파일 로드 (모듈 레벨 싱글톤 캐시 적용)
 * Vercel Serverless Function 웜 상태에서 재사용 및 1회 요청 내 중복 디스크 I/O 완전 방지
 */
export function loadFacilitiesJson(): any[] {
    if (globalCachedFacilities) {
        return globalCachedFacilities;
    }

    try {
        const filePath = path.join(process.cwd(), 'data', 'facilities.json');
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            globalCachedFacilities = JSON.parse(raw);
            return globalCachedFacilities || [];
        }
    } catch (e) {
        console.error('Failed to load facilities.json:', e);
    }
    return [];
}

/**
 * ID로 특정 시설 조회 (Map 인덱스 캐시 적용: O(1) 조회)
 */
export function getFacilityByIdCached(id: string): any | null {
    if (!globalCachedFacilitiesMap) {
        const list = loadFacilitiesJson();
        globalCachedFacilitiesMap = new Map();
        for (const item of list) {
            if (item && item.id) {
                globalCachedFacilitiesMap.set(String(item.id), item);
            }
        }
    }
    return globalCachedFacilitiesMap.get(String(id)) || null;
}

// React Cache 래퍼 (동일 SSR 렌더 패스 내 완전 메모이제이션)
export const getCachedFacility = cache((id: string) => getFacilityByIdCached(id));
export const getCachedAllFacilities = cache(() => loadFacilitiesJson());
