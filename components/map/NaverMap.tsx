'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import { Box, Text, Center, Button } from '@mantine/core';
import { MapPin } from 'lucide-react';
import Script from 'next/script';

import { Facility, FACILITY_CATEGORY_LABELS, FacilityCategory } from '@/types';
// 🚀 개별 임포트로 번들 5MB → ~50KB 절감 (import * as turf 제거)
import { featureCollection } from '@turf/helpers';
import { union as turfUnion } from '@turf/union';
import centerOfMass from '@turf/center-of-mass';

// Naver Maps 타입 선언
declare global {
    interface Window {
        naver: any;
        MarkerClustering: any;
    }
}

interface NaverMapProps {
    facilities: Facility[];
    onMarkerClick: (facility: Facility) => void;
    onBoundsChanged?: (bounds: { south: number; north: number; west: number; east: number }) => void;
    onCenterAddressChange?: (address: string) => void; // 지도 중심 주소 변경 콜백
    isMobile?: boolean;
    onViewList?: (region: string, lat: number, lng: number) => void;
    onMapTap?: () => void; // 빈 지도 탭 시 호출 (UI 토글용)
    onMapDrag?: () => void; // 지도 드래그 시 호출 (검색창 닫기용)
    uiHidden?: boolean; // UI 숨김 상태 (호갱노노 스타일 애니메이션)
    activeCategory?: string[]; // 🚀 카테고리 필터 (마커 visibility 토글용)
    institutionFilter?: 'all' | 'public' | 'private'; // 공설/사설 필터
    hideInquiry?: boolean; // 문의제외 필터
    onUserClick?: () => void; // 사용자 버튼 클릭 콜백
    userButtonLabel?: string; // 우측 상단 사용자 버튼 텍스트 라벨
    selectedId?: string | null; // 현재 선택된 시설 ID (활성 마커 강조용)
}

export interface NaverMapRef {
    panTo: (lat: number, lng: number, zoom?: number, facilityId?: string) => void;
    getCurrentView: () => { lat: number; lng: number; zoom: number } | null;
    highlightRegion: (lat: number, lng: number, zoom: number, type?: 'gu' | 'dong', regionName?: string) => Promise<boolean>;
    searchRegion: (keyword: string) => { lat: number, lng: number, zoom: number, type: 'gu' | 'dong', name: string } | null;
}

const CATEGORY_MARKER_PALETTE: Record<string, { bg: string; subText: string }> = {
    'CHARNEL_HOUSE': { bg: '#2563EB', subText: 'rgba(255,255,255,0.88)' },   // 봉안당: 로얄 블루
    'NATURAL_BURIAL': { bg: '#059669', subText: 'rgba(255,255,255,0.88)' },  // 수목장: 에메랄드 그린
    'FAMILY_GRAVE': { bg: '#6D28D9', subText: 'rgba(255,255,255,0.88)' },    // 공원묘지: 인디고 바이올렛
    'CREMATORIUM': { bg: '#D97706', subText: 'rgba(255,255,255,0.9)' },      // 화장시설: 웜 앰버
    'FUNERAL_HOME': { bg: '#475569', subText: 'rgba(255,255,255,0.85)' },    // 장례식장: 슬레이트
    'ETC': { bg: '#57534E', subText: 'rgba(255,255,255,0.85)' },             // 기타
};

function buildPriceMarkerHtml(categoryLabel: string, priceText: string, category: string, isSelected: boolean): string {
    const palette = CATEGORY_MARKER_PALETTE[category] || CATEGORY_MARKER_PALETTE['CHARNEL_HOUSE'];
    const bg = isSelected ? '#111827' : palette.bg;
    const border = isSelected ? '2px solid #FFFFFF' : '1.5px solid rgba(255, 255, 255, 0.95)';
    const subColor = isSelected ? '#93C5FD' : palette.subText;
    const shadow = isSelected
        ? 'drop-shadow(0 6px 14px rgba(15, 23, 42, 0.42))'
        : 'drop-shadow(0 3px 7px rgba(15, 23, 42, 0.22))';

    return `
    <div class="dds-price-marker ${isSelected ? 'is-selected' : ''}" style="display:inline-flex;flex-direction:column;align-items:center;cursor:pointer;filter:${shadow};user-select:none;-webkit-user-select:none;">
        <div style="background:${bg};border:${border};border-radius:10px;padding:4px 9px 5px;min-width:54px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;">
            <span style="font-size:10px;font-weight:600;color:${subColor};line-height:1.15;letter-spacing:-0.3px;white-space:nowrap;font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif;">${categoryLabel}</span>
            <span style="font-size:13px;font-weight:800;color:#FFFFFF;line-height:1.2;letter-spacing:-0.4px;white-space:nowrap;margin-top:1px;font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif;">${priceText}</span>
        </div>
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${bg};margin-top:-1px;"></div>
    </div>`;
}

function buildClusterPillHtml(displayName: string, count: number): string {
    return `
    <div style="cursor:pointer;min-width:68px;padding:7px 13px;background:rgba(25,31,40,0.92);backdrop-filter:blur(8px);color:#FFFFFF;border-radius:999px;border:1.5px solid rgba(255,255,255,0.88);box-shadow:0 4px 14px rgba(15,23,42,0.26);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Pretendard',-apple-system,sans-serif;user-select:none;">
        <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.8);margin-bottom:2px;line-height:1;white-space:nowrap;letter-spacing:-0.2px;">${displayName}</div>
        <div style="font-size:13px;font-weight:800;color:#60A5FA;line-height:1.1;white-space:nowrap;letter-spacing:-0.3px;">${count}곳</div>
    </div>`;
}

// Ray Casting algorithm for Point in Polygon
function isPointInPolygon(point: { x: number; y: number }, vs: { x: number; y: number }[][]) {
    // vs is array of rings (outer + holes). We only check outer ring (vs[0]) for simplicity unless holes matter.
    // GeoJSON polygon coordinates: [ [ [x, y], ... ] ] -> array of rings -> array of coords
    // Using the first ring (outer boundary)
    const x = point.x, y = point.y;
    let inside = false;

    // Support MultiPolygon structure effectively by iterating passed polygons
    const ring = vs[0]; // Assuming vs passed here is effectively the outer ring coordinate array

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i].x, yi = ring[i].y;
        const xj = ring[j].x, yj = ring[j].y;
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// 하이라이트 매핑 (법정동 -> 행정동 리스트)
const REGION_MAPPINGS: { [key: string]: string[] } = {
    '수유동': ['수유', '인수'] // 수유동 검색 시 인수동도 포함 (수유1,2,3... + 인수)
};

// 좌표별 시설 ID 등록부 (전역 유지 - 필터링되어도 위치 고정)
const LAYOUT_REGISTRY = new Map<string, string[]>();

// 시/도별 대표 마커 고정 좌표 (줌 ≤ 9 광역 모드에서 서울·경기 등 인접 지역 마커 겹침 방지)
const PROVINCE_DISPLAY_COORDS: Record<string, { lat: number; lng: number }> = {
    '서울': { lat: 37.5665, lng: 126.9780 },
    '경기': { lat: 37.2450, lng: 127.1900 },
    '인천': { lat: 37.4563, lng: 126.6452 },
    '강원': { lat: 37.7600, lng: 128.3200 },
    '충북': { lat: 36.7500, lng: 127.7800 },
    '충남': { lat: 36.6200, lng: 126.7200 },
    '세종': { lat: 36.5200, lng: 127.2500 },
    '대전': { lat: 36.3200, lng: 127.4300 },
    '전북': { lat: 35.7500, lng: 127.1400 },
    '광주': { lat: 35.1600, lng: 126.8500 },
    '전남': { lat: 34.8600, lng: 126.9900 },
    '경북': { lat: 36.4400, lng: 128.8200 },
    '대구': { lat: 35.8700, lng: 128.6000 },
    '울산': { lat: 35.5400, lng: 129.3100 },
    '경남': { lat: 35.3300, lng: 128.2500 },
    '부산': { lat: 35.1800, lng: 129.0800 },
    '제주': { lat: 33.3900, lng: 126.5500 },
};

// 주소 문자열에서 정규화된 시/도(provinceKey)와 시/군/구(regionKey, regionDisplayName)를 추출
function parseFacilityRegion(address?: string): {
    provinceKey: string;
    regionKey: string;
    regionDisplayName: string;
} {
    const tokens = (address || '').trim().split(/\s+/).filter(Boolean);
    const t0 = tokens[0] || '';
    const t1 = tokens[1] || '';

    let provinceKey = '기타';
    if (t0.startsWith('서울')) provinceKey = '서울';
    else if (t0.startsWith('경기')) provinceKey = '경기';
    else if (t0.startsWith('인천')) provinceKey = '인천';
    else if (t0.startsWith('강원')) provinceKey = '강원';
    else if (t0.startsWith('충청북') || t0.startsWith('충북')) provinceKey = '충북';
    else if (t0.startsWith('충청남') || t0.startsWith('충남')) provinceKey = '충남';
    else if (t0.startsWith('세종')) provinceKey = '세종';
    else if (t0.startsWith('대전')) provinceKey = '대전';
    else if (t0.startsWith('전라북') || t0.startsWith('전북')) provinceKey = '전북';
    else if (t0.startsWith('광주')) provinceKey = '광주';
    else if (t0.startsWith('전라남') || t0.startsWith('전남')) provinceKey = '전남';
    else if (t0.startsWith('경상북') || t0.startsWith('경북') || t0 === '포항시') provinceKey = '경북';
    else if (t0.startsWith('대구')) provinceKey = '대구';
    else if (t0.startsWith('울산')) provinceKey = '울산';
    else if (t0.startsWith('경상남') || t0.startsWith('경남')) provinceKey = '경남';
    else if (t0.startsWith('부산')) provinceKey = '부산';
    else if (t0.startsWith('제주')) provinceKey = '제주';

    if (provinceKey === '세종') {
        return {
            provinceKey: '세종',
            regionKey: '세종 세종시',
            regionDisplayName: '세종',
        };
    }

    const rawCity = (t0 === '포항시' ? '포항시' : t1) || provinceKey;
    const regionKey = `${provinceKey} ${rawCity}`;

    let regionDisplayName = rawCity;
    if (rawCity.length <= 2) {
        // '서구', '북구', '남구', '동구', '중구' 등 2글자 구 이름은 시/도를 붙여 명확히 표시 ('인천 서구' 등)
        regionDisplayName = `${provinceKey} ${rawCity}`;
    } else if (rawCity.endsWith('시') || rawCity.endsWith('군') || rawCity.endsWith('구')) {
        regionDisplayName = rawCity.slice(0, -1);
    }

    return { provinceKey, regionKey, regionDisplayName };
}

const NaverMap = forwardRef<NaverMapRef, NaverMapProps>(({ facilities, onMarkerClick, onBoundsChanged, onCenterAddressChange, isMobile, onViewList, onMapTap, onMapDrag, uiHidden, activeCategory = ['all'], institutionFilter = 'all', hideInquiry = true, onUserClick, userButtonLabel, selectedId = null }, ref) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isMainLoaded, setIsMainLoaded] = useState(false);
    const [mapError, setMapError] = useState(false);
    const [centerAddress, setCenterAddress] = useState<string>('');
    const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number } | null>(null);

    const N_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '9ynkl22koz';

    // 지도 인스턴스 저장용 Ref
    const mapInstanceRef = useRef<any>(null);
    // 마커 인스턴스 저장용 Ref (삭제를 위해)
    const markersRef = useRef<any[]>([]);
    // 클러스터러 인스턴스
    const clustererRef = useRef<any>(null);
    // 내 위치 마커 Ref
    const myLocationMarkerRef = useRef<any>(null);
    // 영역 하이라이트(Circle/Polygon) Ref - 배열로 변경 (여러 개 그려질 수 있음)
    const highlightOverlaysRef = useRef<any[]>([]);
    // GeoJSON 데이터 저장 Ref
    const geomRef = useRef<any>(null);
    const geomGuRef = useRef<any>(null);

    // 🚀 모바일 60FPS 및 DOM 렉 방지 디바운스 타이머 Refs
    const centerAddressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const labelDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const boundsDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    // 🎯 마커 호버 툴팁용 InfoWindow
    const hoverInfoWindowRef = useRef<any>(null);

    // ♻️ 마커 풀링 (재사용)
    const markerPoolRef = useRef<any[]>([]);

    // 🔒 시설별 마커 캐시 (ID -> 마커 인스턴스) - 한 번 생성된 마커는 재사용
    const markerCacheRef = useRef<Map<string, any>>(new Map());

    // 🔒 시설별 고정 좌표 캐시 (한 번 계산되면 영구 고정)
    const fixedCoordsCache = useRef<Map<string, { lat: number; lng: number }>>(new Map());

    // props를 ref에 저장 (이벤트 리스너 내부에서 최신 값 참조 위함)
    const propsRef = useRef({ facilities, onMarkerClick, onBoundsChanged });
    const activeCategoryRef = useRef(activeCategory);
    const institutionFilterRef = useRef(institutionFilter);
    const hideInquiryRef = useRef(hideInquiry);

    useEffect(() => {
        propsRef.current = { facilities, onMarkerClick, onBoundsChanged };
        activeCategoryRef.current = activeCategory;
        institutionFilterRef.current = institutionFilter;
        hideInquiryRef.current = hideInquiry;
    }, [facilities, onMarkerClick, onBoundsChanged, activeCategory, institutionFilter, hideInquiry]);

    // 🚀 GeoJSON lazy load 플래그 (첫 사용 시에만 로드, 초기 로딩 50MB 제거!)
    const geomLoadingRef = useRef<{ dong: boolean; gu: boolean }>({ dong: false, gu: false });

    const ensureGeoJsonLoaded = async (type: 'dong' | 'gu') => {
        if (type === 'dong' && !geomRef.current && !geomLoadingRef.current.dong) {
            geomLoadingRef.current.dong = true;
            try {
                const res = await fetch('/data/skorea_dong.json');
                geomRef.current = await res.json();
            } catch (err) { console.error('❌ 행정동 데이터 로드 실패:', err); }
        }
        if (type === 'gu' && !geomGuRef.current && !geomLoadingRef.current.gu) {
            geomLoadingRef.current.gu = true;
            try {
                const res = await fetch('/data/skorea_gu.json');
                geomGuRef.current = await res.json();
            } catch (err) { console.error('❌ 시군구 데이터 로드 실패:', err); }
        }
    };

    useImperativeHandle(ref, () => ({
        panTo: (lat: number, lng: number, zoom?: number, facilityId?: string) => {
            if (mapInstanceRef.current && window.naver) {
                const newCenter = new window.naver.maps.LatLng(lat, lng);
                const currentBounds = mapInstanceRef.current.getBounds();
                if (zoom) {
                    mapInstanceRef.current.morph(newCenter, zoom);
                } else if (!currentBounds || !currentBounds.hasPoint(newCenter)) {
                    // 화면 밖의 시설을 선택한 경우에만 이동하고, 현재 화면에 보이는 마커 클릭 시 지도 상태 그대로 유지
                    mapInstanceRef.current.panTo(newCenter);
                }

                // 🎯 시설 ID로 마커 찾아서 bounce 애니메이션
                setTimeout(() => {
                    // 0. 현재 viewport에 있는 마커들 보이게 (활성 필터 준수)
                    if (prevZoomModeRef.current === 'individual' && mapInstanceRef.current) {
                        const bounds = mapInstanceRef.current.getBounds();
                        const catMap: Record<string, string> = { 'charnel': 'CHARNEL_HOUSE', 'natural': 'NATURAL_BURIAL', 'park': 'FAMILY_GRAVE', 'crematorium': 'CREMATORIUM' };
                        const ac = activeCategoryRef.current;
                        const isAll = ac.includes('all');
                        const selCats = isAll ? [] : ac.filter(c => catMap[c]).map(c => catMap[c]);
                        const instF = institutionFilterRef.current;
                        const hi = hideInquiryRef.current;

                        markersRef.current.forEach(m => {
                            const fac = (m as any).__facilityData;
                            let catOk = isAll || selCats.includes(fac?.category);
                            if (catOk && instF !== 'all') {
                                catOk = instF === 'public' ? fac?.isPublic === true : fac?.isPublic === false;
                            }
                            if (catOk && hi) {
                                catOk = (fac?.priceRange?.min ?? 0) > 0;
                            }
                            m.setVisible(catOk && bounds.hasPoint(m.getPosition()));
                        });
                    }

                    // 1. 모든 마커 애니메이션 초기화
                    markersRef.current.forEach(m => {
                        const el = m.getElement();
                        if (el) {
                            el.style.animation = '';
                            el.style.zIndex = '';
                        }
                        m.setZIndex(1);
                    });

                    // 2. ID로 마커 찾기 (좌표 검색보다 정확)
                    let targetMarker = null;
                    if (facilityId) {
                        targetMarker = markersRef.current.find(m =>
                            (m as any).__facilityId === facilityId
                        );
                    }

                    // 3. ID로 못 찾으면 좌표로 fallback
                    if (!targetMarker) {
                        targetMarker = markersRef.current.find(m => {
                            const pos = m.getPosition();
                            const dist = Math.abs(pos.lat() - lat) + Math.abs(pos.lng() - lng);
                            return dist < 0.001;
                        });
                    }

                    if (targetMarker) {
                        targetMarker.setVisible(true); // 🔥 강제로 보이게
                        const el = targetMarker.getElement();
                        if (el) {
                            el.style.animation = 'markerBounce 1.2s ease-in-out infinite';
                            el.style.zIndex = '9999';
                        }
                        targetMarker.setZIndex(9999);
                    }
                }, zoom ? 400 : 80);
            }
        },

        // 🗺️ 현재 지도 위치/줌 반환 (뒤로가기 시 복원용)
        getCurrentView: () => {
            if (mapInstanceRef.current) {
                const center = mapInstanceRef.current.getCenter();
                return { lat: center.lat(), lng: center.lng(), zoom: mapInstanceRef.current.getZoom() };
            }
            return null;
        },

        highlightRegion: async (lat: number, lng: number, zoom: number, type: 'gu' | 'dong' = 'dong', regionName?: string): Promise<boolean> => {
            if (mapInstanceRef.current && window.naver) {
                const map = mapInstanceRef.current;

                // 기존 하이라이트 제거
                highlightOverlaysRef.current.forEach(overlay => overlay.setMap(null));
                highlightOverlaysRef.current = [];

                let finalLat = lat;
                let finalLng = lng;

                // 리 단위인 경우, Naver 지오코딩으로 정확한 좌표 획득
                if (regionName?.endsWith('리') && window.naver.maps.Service) {
                    // URL에서 fullName(예: "전라남도 진도군 진도읍 수유리") 가져오기
                    const urlParams = new URLSearchParams(window.location.search);
                    const fullName = urlParams.get('region') || '';
                    const geocodeQuery = fullName || regionName;

                    try {
                        const geocodedCenter = await new Promise<{ lat: number, lng: number } | null>((resolve) => {
                            window.naver.maps.Service.geocode(
                                { query: geocodeQuery },
                                (status: any, response: any) => {
                                    if (status === window.naver.maps.Service.Status.OK && response.v2?.addresses?.length > 0) {
                                        const addr = response.v2.addresses[0];
                                        resolve({ lat: parseFloat(addr.y), lng: parseFloat(addr.x) });
                                    } else {
                                        resolve(null);
                                    }
                                }
                            );
                        });
                        if (geocodedCenter) {
                            finalLat = geocodedCenter.lat;
                            finalLng = geocodedCenter.lng;
                        }
                    } catch (e) {
                        console.warn('Geocoding failed for ri, using fallback center', e);
                    }
                }

                const center = new window.naver.maps.LatLng(finalLat, finalLng);
                map.morph(center, zoom);

                // 🚀 GeoJSON lazy load (필요할 때만 로드)
                await ensureGeoJsonLoaded(type);

                let polygonDrawn = false;
                const isSi = regionName?.endsWith('시');

                // 1. 구 단위 폴리곤 처리
                if (type === 'gu' && geomGuRef.current && regionName) {
                    // 구 이름 매칭 ("강남구" -> "강남구" or "강남")
                    const targetName = regionName.replace(/시|군|구/g, ''); // "강남"
                    const validFeatures = geomGuRef.current.features.filter((f: any) => {
                        const fName = f.properties.name || '';
                        // 정확히 포함되거나 같으면
                        return fName.includes(targetName) || regionName.includes(fName);
                    });

                    if (validFeatures.length > 0) {
                        validFeatures.forEach((targetFeature: any) => {
                            drawFeature(map, targetFeature);
                        });
                        polygonDrawn = true;
                    }
                }

                // 2. 동 단위 폴리곤 처리 (Union 적용)
                if (!polygonDrawn && type === 'dong' && geomRef.current && regionName) {
                    let candidates: any[] = [];

                    // 리 단위인 경우 부모 읍/면 이름으로 매칭
                    // 예: "진도읍 수유리" → "진도읍"
                    let matchName = regionName;
                    if (regionName.endsWith('리')) {
                        const eupMyeonMatch = regionName.match(/^(.+[읍면])\s/);
                        if (eupMyeonMatch) {
                            matchName = eupMyeonMatch[1];
                        }
                    }

                    // 매핑 확인
                    if (REGION_MAPPINGS[matchName]) {
                        const keywords = REGION_MAPPINGS[matchName];
                        candidates = geomRef.current.features.filter((f: any) => {
                            const fName = f.properties.name || '';
                            return keywords.some(k => fName.includes(k));
                        });
                    } else {
                        // 기본 퍼지 매칭
                        const targetBase = matchName.replace(/[0-9]/g, '');
                        candidates = geomRef.current.features.filter((f: any) => {
                            const fName = f.properties.name || '';
                            const fBase = fName.replace(/[0-9]/g, '');
                            return fName === matchName || fBase === targetBase;
                        });
                    }

                    // 거리 필터링 (동명이인 방지)
                    const filteredCandidates = candidates.filter((cand: any) => {
                        let sampleCoord = null;
                        if (cand.geometry.type === 'Polygon') {
                            sampleCoord = cand.geometry.coordinates[0][0];
                        } else if (cand.geometry.type === 'MultiPolygon') {
                            sampleCoord = cand.geometry.coordinates[0][0][0];
                        }
                        if (!sampleCoord) return true; // 좌표 파싱 실패시 일단 포함
                        const dx = Math.abs(sampleCoord[0] - lng);
                        const dy = Math.abs(sampleCoord[1] - lat);
                        return dx < 0.1 && dy < 0.1;
                    });

                    if (filteredCandidates.length > 0) {
                        // Turf Union (병합)
                        let mergedFeature = filteredCandidates[0];
                        if (filteredCandidates.length > 1) {
                            try {
                                // Turf v7 대응: FeatureCollection 전달
                                const collection = featureCollection(filteredCandidates);
                                mergedFeature = turfUnion(collection as any);
                            } catch (e) {
                                console.error('Polygon merge failed', e);
                                // 실패 시 개별 그리기
                                mergedFeature = null;
                                filteredCandidates.forEach(f => drawFeature(map, f));
                                polygonDrawn = true;
                            }
                        }

                        if (mergedFeature) {
                            drawFeature(map, mergedFeature);
                            polygonDrawn = true;
                        }
                    }
                }

                // 폴리곤 실패 시 원형 펄백
                return true;
            }
            return false;

            function drawFeature(map: any, feature: any) {
                const paths = [];
                if (feature.geometry.type === 'Polygon') {
                    paths.push(feature.geometry.coordinates[0].map((c: any) => new window.naver.maps.LatLng(c[1], c[0])));
                } else if (feature.geometry.type === 'MultiPolygon') {
                    feature.geometry.coordinates.forEach((poly: any) => {
                        paths.push(poly[0].map((c: any) => new window.naver.maps.LatLng(c[1], c[0])));
                    });
                }

                if (paths.length > 0) {
                    const polygon = new window.naver.maps.Polygon({
                        map: map,
                        paths: paths,
                        fillColor: '#FF0000',
                        fillOpacity: 0.05, // 요청 사항: 5%
                        strokeColor: '#000000',
                        strokeOpacity: 0.7, // 요청 사항: 70%
                        strokeWeight: 2,
                        clickable: false,
                        zIndex: 10
                    });
                    highlightOverlaysRef.current.push(polygon);
                }
            }
        },

        searchRegion: (keyword: string) => {
            if (!keyword || !window.naver) {
                return null;
            }

            const normKeyword = keyword.normalize('NFC');

            // 1. 구 단위 검색 (geomGuRef)
            if (geomGuRef.current && geomGuRef.current.features) {
                // 🔧 수정: "서울특별시 도봉구" → "도봉" 추출 (마지막 구/군/시 이름만)
                const guMatch = normKeyword.match(/([가-힣]+)(구|군|시)(?:\s|$)/);
                const targetName = guMatch ? guMatch[1] : normKeyword.replace(/시|군|구/g, '');

                // 🔒 최소 2글자 이상
                if (targetName.length < 2) {
                } else {
                    const match = geomGuRef.current.features.find((f: any) => {
                        const fName = (f.properties.name || '').normalize('NFC');
                        const fNameClean = fName.replace(/시|군|구/g, '');
                        // 🔧 수정: 정확한 매칭만 허용 (부분 매칭 제거)
                        return fNameClean === targetName;
                    });

                    if (match) {
                        try {
                            const center = centerOfMass(match);
                            const [lng, lat] = center.geometry.coordinates;
                            return {
                                lat: lat,
                                lng: lng,
                                zoom: 12,
                                type: 'gu' as const,
                                name: match.properties.name
                            };
                        } catch (e) {
                            console.error('   ❌ Centroid calc failed', e);
                        }
                    } else {
                    }
                }
            } else {
            }

            // 2. 동 단위 검색 (geomRef)
            if (geomRef.current && geomRef.current.features) {
                let targetFeatures: any[] = [];

                // 2-1. 매핑 확인 (REGION_MAPPINGS)
                // 예: "수유동" -> ["수유", "인수"]
                if (REGION_MAPPINGS[normKeyword]) {
                    const keywords = REGION_MAPPINGS[normKeyword];
                    targetFeatures = geomRef.current.features.filter((f: any) => {
                        const fName = (f.properties.name || '').normalize('NFC');
                        return keywords.some(k => fName.includes(k));
                    });
                }

                // 2-2. 매핑 없으면 일반 검색
                if (targetFeatures.length === 0) {
                    // "수유동" -> "수유"로 변환하여 "수유1동", "수유2동" 등 매칭 허용
                    const cleanKeyword = normKeyword.replace(/동$/, '');

                    // 🔒 최소 2글자 이상이어야 검색 (너무 짧으면 이상한 매칭 방지)
                    if (cleanKeyword.length < 2) {
                        return null;
                    }

                    // exact match 또는 이름이 검색어로 시작하는 경우만 (더 정확한 매칭)
                    targetFeatures = geomRef.current.features.filter((f: any) => {
                        const fName = (f.properties.name || '').normalize('NFC');
                        // 정확히 일치
                        if (fName === normKeyword) return true;
                        // "동"으로 끝나는 검색어가 포함된 경우
                        if (normKeyword.endsWith('동') && fName.includes(normKeyword)) return true;
                        // 이름이 검색어로 시작하는 경우 (더 정확)
                        if (fName.startsWith(cleanKeyword)) return true;
                        return false;
                    });
                }

                if (targetFeatures.length > 0) {
                    // 여러 개가 검색되면(수유1동, 수유2동 등) 그 중 하나를 대표로 쓰거나 중심점 계산
                    // 여기선 첫 번째 매칭을 사용하되, highlightRegion에서 다시 병합하여 그림.
                    // But for better centering, let's use turf on the collection if multiple.
                    let centerFeature = targetFeatures[0];
                    if (targetFeatures.length > 1) {
                        const fc = featureCollection(targetFeatures);
                        // Center of mass for the whole collection
                        const center = centerOfMass(fc as any);
                        const [lng, lat] = center.geometry.coordinates;
                        return {
                            lat, lng, zoom: 14, type: 'dong' as const, name: normKeyword // Use input keyword so highlightRegion uses mapping
                        };
                    }

                    const representative = centerFeature;
                    const center = centerOfMass(representative);
                    const [lng, lat] = center.geometry.coordinates;

                    return {
                        lat: lat,
                        lng: lng,
                        zoom: 14,
                        type: 'dong' as const,
                        name: representative.properties.name // Or keyword? If mapped, keyword is better key.
                    };
                } else {
                }
            } else {
            }

            return null;
        }
    }));

    const handleZoomIn = () => {
        if (mapInstanceRef.current) {
            const currentZoom = mapInstanceRef.current.getZoom();
            mapInstanceRef.current.setZoom(currentZoom + 1, true);
        }
    };

    const handleZoomOut = () => {
        if (mapInstanceRef.current) {
            const currentZoom = mapInstanceRef.current.getZoom();
            mapInstanceRef.current.setZoom(currentZoom - 1, true);
        }
    };

    const handleMyLocation = () => {
        if (!navigator.geolocation) {
            alert('위치 정보를 사용할 수 없습니다.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const map = mapInstanceRef.current;
                if (!map || !window.naver) return;

                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const loc = new window.naver.maps.LatLng(lat, lng);

                // 부드러운 이동과 줌을 동시에 처리 (panTo + setZoom 충돌 방지)
                map.morph(loc, 14, { duration: 500 });

                // 내 위치 마커 표시 (기존 마커 있으면 제거 후 생성)
                if (myLocationMarkerRef.current) {
                    myLocationMarkerRef.current.setMap(null);
                }

                myLocationMarkerRef.current = new window.naver.maps.Marker({
                    position: loc,
                    map: map,
                    icon: {
                        content: `
                            <div style="position:relative; width:24px; height:24px;">
                                <div style="position:absolute; top:0; left:0; width:24px; height:24px; background:#4263eb; border:2px solid white; border-radius:50%; box-shadow:0 0 5px rgba(0,0,0,0.3);"></div>
                                <div style="position:absolute; top:-4px; left:-4px; width:32px; height:32px; background:#4263eb; opacity:0.2; border-radius:50%; animation: pulse 2s infinite;"></div>
                            </div>
                        `,
                        anchor: new window.naver.maps.Point(12, 12),
                    },
                    zIndex: 1000
                });
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('위치 정보를 가져올 수 없습니다. 브라우저의 위치 권한을 확인해주세요.');
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const updateCenterAddress = (map: any) => {
        if (!map || !window.naver || !window.naver.maps.Service) return;

        if (centerAddressTimerRef.current) {
            clearTimeout(centerAddressTimerRef.current);
        }

        centerAddressTimerRef.current = setTimeout(() => {
            const center = map.getCenter();
            // 중심 좌표 상태 업데이트
            setCenterCoords({ lat: center.lat(), lng: center.lng() });

            window.naver.maps.Service.reverseGeocode({
                coords: center,
                orders: [
                    window.naver.maps.Service.OrderType.ADDR,
                    window.naver.maps.Service.OrderType.ROAD_ADDR
                ].join(',')
            }, (status: any, response: any) => {
                if (status !== window.naver.maps.Service.Status.OK) {
                    setCenterAddress('주변');
                    return;
                }

                const result = response.v2; // v2 response structure
                let text = '';

                if (result && result.address && result.address.jibunAddress) {
                    text = result.address.jibunAddress;
                } else if (result && result.results && result.results.length > 0) {
                    // Fallback to iterating results if jibunAddress is not direct
                    const region = result.results[0].region;
                    if (region) {
                        if (region.area2 && region.area2.name) text += region.area2.name + ' ';
                        if (region.area3 && region.area3.name) text += region.area3.name;
                    }
                }

                if (!text) text = '주변';

                if (result && result.results && result.results.length > 0) {
                    const r = result.results[0]; // First result
                    if (r.region) {
                        const currentZoom = map.getZoom();
                        const a1 = r.region.area1?.name || '';
                        const a2 = r.region.area2?.name || '';
                        const a3 = r.region.area3?.name || '';

                        if (currentZoom <= 9) {
                            text = '전국';
                        } else if (currentZoom <= 11) {
                            text = a1 || '광역';
                        } else if (currentZoom < 14) {
                            // Wide view: Area1 + Area2 (e.g., 경기도 성남시)
                            text = `${a1} ${a2}`;
                        } else {
                            // Close view: Area2 + Area3 (e.g., 성남시 정자동)
                            text = `${a2} ${a3}`;
                        }
                    }
                } else {
                    const currentZoom = map.getZoom();
                    if (currentZoom <= 9) text = '전국';
                }
                setCenterAddress(text.trim());
                onCenterAddressChange?.(text.trim());
            });
        }, 180);
    };

    // 🚀 [핵심 수정] 시설 데이터가 변경될 때마다 좌표 오프셋을 **영구 고정** (Global Registry)
    // 화면에 누가 보이고 안 보이고, 필터링이 되든 말든, 한 번 자리를 잡은 놈은 절대 안 움직임.
    // 🚀 [핵심 수정] 시설별 고정 좌표를 **캐시**하여 절대 변경되지 않도록 함
    const processedFacilities = useMemo<Array<Facility & { fixedCoordinates: { lat: number; lng: number } }>>(() => {
        const targetFacilities = facilities;

        return targetFacilities.map(fac => {
            if (!fac.coordinates || !fac.coordinates.lat || !fac.coordinates.lng) {
                return { ...fac, fixedCoordinates: { lat: 0, lng: 0 } };
            }

            // 🔒 캐시에 이미 있으면 캐시 값 사용 (절대 재계산 안 함)
            if (fixedCoordsCache.current.has(fac.id)) {
                return {
                    ...fac,
                    fixedCoordinates: fixedCoordsCache.current.get(fac.id)!
                };
            }

            const key = `${fac.coordinates.lat.toFixed(5)},${fac.coordinates.lng.toFixed(5)}`;

            // 1. 레지스트리에 내 ID 등록 (없으면 추가, 있으면 기존 인덱스 유지)
            if (!LAYOUT_REGISTRY.has(key)) {
                LAYOUT_REGISTRY.set(key, []);
            }
            const registry = LAYOUT_REGISTRY.get(key)!;
            let index = registry.indexOf(fac.id);
            if (index === -1) {
                index = registry.length;
                registry.push(fac.id);
            }

            // 2. 고정적이고 결정적인(deterministic) 오프셋 계산
            let offsetLat = 0;
            let offsetLng = 0;

            if (index > 0) {
                const ringIndex = Math.floor((index - 1) / 8);
                const slotIndex = (index - 1) % 8;

                const radius = 0.0001 * (ringIndex + 1);
                const angle = slotIndex * (Math.PI / 4);

                offsetLat = Math.sin(angle) * radius;
                offsetLng = Math.cos(angle) * radius;
            }

            const fixedCoords = {
                lat: fac.coordinates.lat + offsetLat,
                lng: fac.coordinates.lng + offsetLng
            };

            // 🔒 캐시에 저장 (이후 절대 재계산 안 함)
            fixedCoordsCache.current.set(fac.id, fixedCoords);

            return {
                ...fac,
                fixedCoordinates: fixedCoords
            };
        });
    }, [facilities]);

    // 🔒 시/군/구별 그룹화 (정규화된 시/도 + 시/군/구 키 사용)
    const regionGroups = useMemo(() => {
        const groups: Record<string, {
            facilities: typeof processedFacilities;
            representative: typeof processedFacilities[0];
            displayName: string;
            count: number;
        }> = {};

        for (const fac of processedFacilities) {
            if (!fac.fixedCoordinates?.lat || !fac.fixedCoordinates?.lng) continue;

            const { regionKey, regionDisplayName } = parseFacilityRegion(fac.address);

            if (!groups[regionKey]) {
                groups[regionKey] = {
                    facilities: [],
                    representative: fac,
                    displayName: regionDisplayName,
                    count: 0
                };
            }
            groups[regionKey].facilities.push(fac);
            groups[regionKey].count++;
        }

        return groups;
    }, [processedFacilities]);

    // 🔒 시/도별 그룹화 (줌 ≤ 9 용 - 정규화된 17개 광역 시/도 기준 통합)
    const provinceGroups = useMemo(() => {
        const groups: Record<string, {
            facilities: typeof processedFacilities;
            count: number;
            centerLat: number;
            centerLng: number;
        }> = {};

        for (const fac of processedFacilities) {
            if (!fac.fixedCoordinates?.lat || !fac.fixedCoordinates?.lng) continue;
            const { provinceKey } = parseFacilityRegion(fac.address);

            if (!groups[provinceKey]) {
                groups[provinceKey] = { facilities: [], count: 0, centerLat: 0, centerLng: 0 };
            }
            groups[provinceKey].facilities.push(fac);
            groups[provinceKey].count++;
            groups[provinceKey].centerLat += fac.fixedCoordinates.lat;
            groups[provinceKey].centerLng += fac.fixedCoordinates.lng;
        }

        for (const key of Object.keys(groups)) {
            const g = groups[key];
            const preset = PROVINCE_DISPLAY_COORDS[key];
            if (preset) {
                g.centerLat = preset.lat;
                g.centerLng = preset.lng;
            } else {
                g.centerLat /= g.count;
                g.centerLng /= g.count;
            }
        }

        return groups;
    }, [processedFacilities]);

    // 🔒 시/군별 그룹 중심 좌표 (고정)
    const regionGroupCenters = useMemo(() => {
        const centers: Record<string, { lat: number; lng: number }> = {};
        for (const [key, group] of Object.entries(regionGroups)) {
            let sumLat = 0, sumLng = 0, n = 0;
            for (const fac of group.facilities) {
                if (fac.fixedCoordinates?.lat && fac.fixedCoordinates?.lng) {
                    sumLat += fac.fixedCoordinates.lat;
                    sumLng += fac.fixedCoordinates.lng;
                    n++;
                }
            }
            if (n > 0) centers[key] = { lat: sumLat / n, lng: sumLng / n };
        }
        return centers;
    }, [regionGroups]);

    // 🔒 고정 마커 refs
    const regionMarkersArrayRef = useRef<any[]>([]);
    const provinceMarkersArrayRef = useRef<any[]>([]);

    // 🔒 마커/클러스터 초기 생성 여부 (한 번만 생성)
    const isMarkersInitializedRef = useRef(false);

    // 🔒 이전 facilities 개수 저장 (필터 변경 감지용)
    const prevFacilitiesCountRef = useRef(0);

    // 🏷️ 시설명 레이블 마커 (줌 레벨 높을 때 표시)
    const nameLabelMarkersRef = useRef<any[]>([]);
    const nameLabelsVisibleRef = useRef(false);

    // 🚀 줌 모드 추적 (성능 최적화: 모드 변경 시에만 마커 전환)
    const prevZoomModeRef = useRef<'province' | 'region' | 'individual'>('individual');

    const updateVisibleMarkers = useCallback(() => {
        const map = mapInstanceRef.current;
        if (!map || !window.naver || !window.naver.maps) return;

        const currentZoom = map.getZoom();
        // 잡음 방지: 로그 제거

        // 🔒 이미 마커가 초기화되었으면 재생성하지 않음 (카테고리 필터는 visibility로 처리)
        if (isMarkersInitializedRef.current) {
            return;
        }

        // 🔒 데이터가 없으면 초기화하지 않음
        if (processedFacilities.length === 0) {
            return;
        }


        // 1. 기존 마커/클러스터 제거
        if (clustererRef.current) {
            clustererRef.current.setMap(null);
            clustererRef.current = null;
        }
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        const createdMarkers: any[] = [];

        // 2. 모든 시설에 대해 개별 마커 생성 (전체 1,495개 초기 완전 로딩)
        for (const fac of processedFacilities) {
            if (!fac.fixedCoordinates?.lat || !fac.fixedCoordinates?.lng) continue;

            const { lat, lng } = fac.fixedCoordinates;

            // [Price Logic] ⭐ 별표(isRepresentative)만 사용. 없으면 "문의"
            let priceText = '문의';
            let formattedPrice = 0;

            // 1) 신형(standardizedPrices) 먼저 확인
            const sp = (fac as any).priceInfo?.standardizedPrices;
            if (Array.isArray(sp) && sp.length > 0) {
                for (const group of sp) {
                    if (Array.isArray(group.rows)) {
                        const repItem = group.rows.find((r: any) => r.isRepresentative);
                        if (repItem && repItem.price > 0) {
                            formattedPrice = repItem.price < 10000 ? repItem.price : Math.round(repItem.price / 10000);
                            break;
                        }
                    }
                }
            }

            // 2) 구형(priceTable) 확인
            if (formattedPrice === 0) {
                const priceTable = (fac as any).priceInfo?.priceTable || fac.pricing;
                if (priceTable) {
                    for (const catKey of Object.keys(priceTable)) {
                        if (/옵션|관리비|기타|공통|제외|석물|비고|안내|별도/.test(catKey)) continue;

                        const category = priceTable[catKey];
                        if (category && Array.isArray(category.rows)) {
                            const repItem = category.rows.find((r: any) => r.isRepresentative);
                            if (repItem && repItem.price > 0) {
                                formattedPrice = repItem.price < 10000 ? repItem.price : Math.round(repItem.price / 10000);
                                break;
                            }
                        }
                    }
                }
            }

            // 3) 최종 fallback: representativePrice 또는 priceRange.min (page.tsx에서 계산해서 내려줌)
            if (formattedPrice === 0) {
                const repPrice = (fac as any).representativePrice || 0;
                const minPrice = (fac as any).priceRange?.min || 0;
                const fallback = repPrice > 0 ? repPrice : minPrice;
                if (fallback > 0) {
                    formattedPrice = fallback < 10000 ? fallback : Math.round(fallback / 10000);
                }
            }

            if (formattedPrice > 0) {
                priceText = `${formattedPrice.toLocaleString()}만`;
            }

            const categoryLabel = FACILITY_CATEGORY_LABELS[fac.category as FacilityCategory] || fac.category;

            // 만장 여부 체크
            const isFull = !!(fac as any).isFull;
            const isSelected = selectedId === fac.id;

            let svgContent: string;
            let anchorPoint: any;

            if (isFull) {
                // ⚫ 만장 마커: 검은 점만 (네이버 지도 자체 라벨 활용)
                const dotSize = 18;
                const hitArea = 32;
                svgContent = `
                <div style="width:${hitArea}px; height:${hitArea}px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                    <div style="width:${dotSize}px; height:${dotSize}px; background:rgba(15,23,42,0.55); border:2.5px solid white; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.28);"></div>
                </div>
                `;
                anchorPoint = new window.naver.maps.Point(hitArea / 2, hitArea / 2);
            } else {
                svgContent = buildPriceMarkerHtml(categoryLabel, priceText, fac.category as string, isSelected);
                anchorPoint = new window.naver.maps.Point(28, 44);
            }

            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(lat, lng),
                map: map,
                visible: false,
                title: isFull ? '' : fac.name,
                zIndex: isFull ? 50 : (isSelected ? 999 : 100),
                icon: {
                    content: svgContent,
                    anchor: anchorPoint,
                }
            });

            (marker as any).__facilityData = fac;
            (marker as any).__facilityId = fac.id;
            (marker as any).__categoryLabel = categoryLabel;
            (marker as any).__priceText = priceText;
            (marker as any).__isFull = isFull;
            (marker as any).__regionKey = (fac.address || '').split(' ')[1] || '기타';

            window.naver.maps.Event.addListener(marker, 'click', () => {
                onMarkerClick(fac);
            });

            // 🎯 마커 호버 시 툴팁 표시
            window.naver.maps.Event.addListener(marker, 'mouseover', () => {
                if (!hoverInfoWindowRef.current) {
                    hoverInfoWindowRef.current = new window.naver.maps.InfoWindow({
                        content: '',
                        borderWidth: 0,
                        backgroundColor: 'transparent',
                        disableAnchor: true,
                        pixelOffset: new window.naver.maps.Point(0, -8),
                    });
                }

                const tooltipContent = `
                    <div style="
                        background: rgba(25, 31, 40, 0.95);
                        backdrop-filter: blur(8px);
                        padding: 9px 13px;
                        border-radius: 10px;
                        border: 1px solid rgba(255,255,255,0.14);
                        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.28);
                        font-family: 'Pretendard', -apple-system, sans-serif;
                        min-width: 130px;
                        max-width: 220px;
                    ">
                        <div style="font-weight: 700; font-size: 13px; color: #FFFFFF; margin-bottom: 3px; letter-spacing: -0.3px;">
                            ${isFull ? '<span style="display:inline-block;width:8px;height:8px;background:#94A3B8;border:1.5px solid white;border-radius:50%;margin-right:5px;vertical-align:middle;"></span>' : ''}${fac.name}
                        </div>
                        <div style="font-size: 11px; color: rgba(255,255,255,0.72); letter-spacing: -0.2px;">
                            ${fac.address || ''}
                        </div>
                    </div>
                `;

                hoverInfoWindowRef.current.setContent(tooltipContent);
                hoverInfoWindowRef.current.open(map, marker);
            });

            window.naver.maps.Event.addListener(marker, 'mouseout', () => {
                if (hoverInfoWindowRef.current) {
                    hoverInfoWindowRef.current.close();
                }
            });

            createdMarkers.push(marker);
        }

        markersRef.current = createdMarkers;

        // 3. 🔒 고정 지역 마커 생성 (MarkerClustering 대신)
        // 기존 지역 마커 제거
        regionMarkersArrayRef.current.forEach(m => m.setMap(null));
        regionMarkersArrayRef.current = [];
        provinceMarkersArrayRef.current.forEach(m => m.setMap(null));
        provinceMarkersArrayRef.current = [];

        // 현재 활성 필터 기준 계산 헬퍼
        const catMapInit: Record<string, string> = { 'charnel': 'CHARNEL_HOUSE', 'natural': 'NATURAL_BURIAL', 'park': 'FAMILY_GRAVE', 'crematorium': 'CREMATORIUM' };
        const acInit = activeCategoryRef.current;
        const isAllInit = acInit.includes('all');
        const selCatsInit = isAllInit ? [] : acInit.filter(c => catMapInit[c]).map(c => catMapInit[c]);
        const instInit = institutionFilterRef.current;
        const hiInit = hideInquiryRef.current;
        const matchesInitFilter = (fac: any) => {
            let ok = isAllInit || selCatsInit.includes(fac?.category);
            if (ok && instInit !== 'all') {
                ok = instInit === 'public' ? fac?.isPublic === true : fac?.isPublic === false;
            }
            if (ok && hiInit) {
                ok = (fac?.priceRange?.min ?? 0) > 0;
            }
            return ok;
        };

        // 시/군 레벨 고정 마커 생성
        for (const [regionKey, group] of Object.entries(regionGroups)) {
            const center = regionGroupCenters[regionKey];
            if (!center) continue;

            const displayName = group.displayName;
            const filteredCount = group.facilities.filter(matchesInitFilter).length;

            const regionMarker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(center.lat, center.lng),
                map: map,
                visible: false,
                icon: {
                    content: buildClusterPillHtml(displayName, filteredCount),
                    size: new window.naver.maps.Size(68, 42),
                    anchor: new window.naver.maps.Point(34, 21),
                },
                zIndex: 200,
            });

            window.naver.maps.Event.addListener(regionMarker, 'click', () => {
                map.setCenter(new window.naver.maps.LatLng(center.lat, center.lng));
                map.setZoom(12);
            });

            (regionMarker as any).__regionKey = regionKey;
            (regionMarker as any).__hasVisibleCount = filteredCount > 0;
            regionMarkersArrayRef.current.push(regionMarker);
        }

        // 시/도 레벨 고정 마커 생성
        for (const [provinceKey, group] of Object.entries(provinceGroups)) {
            const displayName = provinceKey;
            const filteredCount = group.facilities.filter(matchesInitFilter).length;

            const provinceMarker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(group.centerLat, group.centerLng),
                map: map,
                visible: false,
                icon: {
                    content: buildClusterPillHtml(displayName, filteredCount),
                    size: new window.naver.maps.Size(68, 42),
                    anchor: new window.naver.maps.Point(34, 21),
                },
                zIndex: 200,
            });

            window.naver.maps.Event.addListener(provinceMarker, 'click', () => {
                map.setCenter(new window.naver.maps.LatLng(group.centerLat, group.centerLng));
                map.setZoom(10);
            });

            (provinceMarker as any).__provinceKey = provinceKey;
            (provinceMarker as any).__hasVisibleCount = filteredCount > 0;
            provinceMarkersArrayRef.current.push(provinceMarker);
        }

        // 4. 현재 줌에 따라 마커 모드 설정 (setVisible = CSS 토글, 초고속)
        const zoomNow = map.getZoom();
        const initialMode = zoomNow <= 9 ? 'province' : zoomNow <= 11 ? 'region' : 'individual';
        prevZoomModeRef.current = initialMode;

        if (initialMode === 'province') {
            provinceMarkersArrayRef.current.forEach(m => m.setVisible((m as any).__hasVisibleCount !== false));
        } else if (initialMode === 'region') {
            regionMarkersArrayRef.current.forEach(m => m.setVisible((m as any).__hasVisibleCount !== false));
        } else {
            const bounds = map.getBounds();
            createdMarkers.forEach(m => {
                const fac = (m as any).__facilityData;
                m.setVisible(matchesInitFilter(fac) && bounds.hasPoint(m.getPosition()));
            });
        }

        // 🔒 초기화 완료 플래그
        isMarkersInitializedRef.current = true;

    }, [processedFacilities, regionGroups, provinceGroups, regionGroupCenters, onMarkerClick, selectedId]);

    // 🎯 선택된 마커(selectedId) 변경 시 이전/현재 마커 아이콘만 즉시 갱신
    const prevSelectedIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (!window.naver?.maps || markersRef.current.length === 0) return;
        const prevId = prevSelectedIdRef.current;
        if (prevId === selectedId) return;
        prevSelectedIdRef.current = selectedId ?? null;

        for (const marker of markersRef.current) {
            const fid = (marker as any).__facilityId;
            if (fid !== prevId && fid !== selectedId) continue;
            const isFull = (marker as any).__isFull;
            if (isFull) continue;
            const fac = (marker as any).__facilityData;
            const categoryLabel = (marker as any).__categoryLabel || '';
            const priceText = (marker as any).__priceText || '문의';
            const isNowSelected = fid === selectedId;
            marker.setZIndex(isNowSelected ? 999 : 100);
            marker.setIcon({
                content: buildPriceMarkerHtml(categoryLabel, priceText, fac?.category || 'CHARNEL_HOUSE', isNowSelected),
                anchor: new window.naver.maps.Point(28, 44),
            });
        }
    }, [selectedId]);

    // 🚀 Effect: 데이터 변경 시 업데이트 (최적화: 즉시 1회만 호출)
    useEffect(() => {
        if (isMapLoaded && processedFacilities.length > 0) {
            updateVisibleMarkers();
        }
    }, [facilities, isMapLoaded, updateVisibleMarkers, processedFacilities.length]);

    // 🚀🚀🚀 핵심 성능 최적화: 카테고리/공설사설 필터 변경 시 마커 visibility만 토글 (재생성 없음!)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !window.naver || markersRef.current.length === 0) return;

        const catMap: Record<string, string> = {
            'charnel': 'CHARNEL_HOUSE',
            'natural': 'NATURAL_BURIAL',
            'park': 'FAMILY_GRAVE',
            'crematorium': 'CREMATORIUM'
        };

        const isAllCategory = activeCategory.includes('all');
        const selectedDbCategories = isAllCategory ? [] : activeCategory
            .filter(c => catMap[c])
            .map(c => catMap[c]);

        const currentZoom = map.getZoom();
        const bounds = map.getBounds();
        const isIndividualMode = currentZoom > 11;

        // 개별 마커 visibility 토글
        for (const marker of markersRef.current) {
            const fac = (marker as any).__facilityData;
            if (!fac) continue;

            // 카테고리 필터
            let catVisible = isAllCategory || selectedDbCategories.includes(fac.category);

            // 공설/사설 필터
            if (catVisible && institutionFilter !== 'all') {
                if (institutionFilter === 'public') catVisible = fac.isPublic === true;
                else if (institutionFilter === 'private') catVisible = fac.isPublic === false;
            }

            // 문의제외 필터
            if (catVisible && hideInquiry) {
                catVisible = (fac.priceRange?.min ?? 0) > 0;
            }

            // 줌 모드: individual 모드일 때만 개별 마커 표시
            if (isIndividualMode) {
                marker.setVisible(catVisible && bounds.hasPoint(marker.getPosition()));
            } else {
                marker.setVisible(false);
            }
        }

        // 지역/도 마커 카운트도 업데이트 (필터 반영)
        // 지역 마커
        for (const regionMarker of regionMarkersArrayRef.current) {
            const regionKey = (regionMarker as any).__regionKey;
            if (!regionKey || !regionGroups[regionKey]) {
                regionMarker.setVisible(false);
                continue;
            }

            // 해당 지역의 필터된 시설 수 계산
            let count = 0;
            for (const fac of regionGroups[regionKey].facilities) {
                let visible = isAllCategory || selectedDbCategories.includes(fac.category);
                if (visible && institutionFilter !== 'all') {
                    if (institutionFilter === 'public') visible = fac.isPublic === true;
                    else if (institutionFilter === 'private') visible = fac.isPublic === false;
                }
                if (visible && hideInquiry) {
                    visible = (fac.priceRange?.min ?? 0) > 0;
                }
                if (visible) count++;
            }

            (regionMarker as any).__hasVisibleCount = count > 0;
            if (count === 0) {
                regionMarker.setVisible(false);
            } else {
                const displayName = regionGroups[regionKey].displayName;
                regionMarker.setIcon({
                    content: buildClusterPillHtml(displayName, count),
                    size: new window.naver.maps.Size(68, 42),
                    anchor: new window.naver.maps.Point(34, 21),
                });
                const isRegionMode = currentZoom >= 10 && currentZoom <= 11;
                regionMarker.setVisible(isRegionMode);
            }
        }

        // 도 마커 업데이트  
        for (const provMarker of provinceMarkersArrayRef.current) {
            const provKey = (provMarker as any).__provinceKey;
            if (!provKey || !provinceGroups[provKey]) continue;

            // 해당 도의 필터된 시설 수 계산
            let count = 0;
            for (const fac of provinceGroups[provKey].facilities) {
                let visible = isAllCategory || selectedDbCategories.includes(fac.category);
                if (visible && institutionFilter !== 'all') {
                    if (institutionFilter === 'public') visible = fac.isPublic === true;
                    else if (institutionFilter === 'private') visible = fac.isPublic === false;
                }
                if (visible && hideInquiry) {
                    visible = (fac.priceRange?.min ?? 0) > 0;
                }
                if (visible) count++;
            }

            (provMarker as any).__hasVisibleCount = count > 0;
            if (count === 0) {
                provMarker.setVisible(false);
            } else {
                const displayName = provKey;
                provMarker.setIcon({
                    content: buildClusterPillHtml(displayName, count),
                    size: new window.naver.maps.Size(68, 42),
                    anchor: new window.naver.maps.Point(34, 21),
                });
                const isProvinceMode = currentZoom <= 9;
                provMarker.setVisible(isProvinceMode);
            }
        }
        // 🏷️ 필터 변경 후 이름 라벨도 갱신 (idle 트리거)
        if (window.naver?.maps?.Event && map) {
            window.naver.maps.Event.trigger(map, 'idle');
        }
    }, [activeCategory, institutionFilter, hideInquiry, processedFacilities, regionGroups, provinceGroups]);

    const initMap = () => {
        if (!window.naver || !window.naver.maps) {
            setTimeout(initMap, 100);
            return;
        }
        if (!mapRef.current) {
            setTimeout(initMap, 100);
            return;
        }

        try {
            // 🗺️ pendingMapView가 있으면 해당 좌표로 시작 (시설 상세 → 지도보기)
            let initLat = 37.4760;
            let initLng = 126.9810;
            let initZoom = 12;
            let pendingFacilityId: string | null = null;

            try {
                const pending = sessionStorage.getItem('pendingMapView');
                if (pending) {
                    const parsed = JSON.parse(pending);
                    initLat = parsed.lat;
                    initLng = parsed.lng;
                    initZoom = parsed.zoom || 17;
                    pendingFacilityId = parsed.facilityId || null;
                    sessionStorage.removeItem('pendingMapView');
                }
            } catch { /* ignore */ }

            const location = new window.naver.maps.LatLng(initLat, initLng);
            const map = new window.naver.maps.Map(mapRef.current, {
                center: location,
                zoom: initZoom,
                minZoom: 6,
                scaleControl: false,
                logoControl: false,
                mapDataControl: false,
                zoomControl: false,
            });
            mapInstanceRef.current = map;

            const notifyBounds = () => {
                const cb = propsRef.current.onBoundsChanged;
                if (cb && map) {
                    const bounds = map.getBounds();
                    if (bounds) {
                        const sw = bounds.getSW();
                        const ne = bounds.getNE();
                        cb({
                            south: sw.lat(), north: ne.lat(), west: sw.lng(), east: ne.lng(),
                        });
                    }
                }
            };

            // 🔥 핵심: Idle(멈춤) 이벤트에서 마커 업데이트 및 bounds 알림 (60FPS 디바운스 최적화)
            window.naver.maps.Event.addListener(map, 'idle', () => {
                // 부모에게 bounds 알림 (40ms 디바운스로 미세 떨림/관성 중복 계산 방지)
                if (boundsDebounceTimerRef.current) clearTimeout(boundsDebounceTimerRef.current);
                boundsDebounceTimerRef.current = setTimeout(() => {
                    notifyBounds();
                }, 40);

                // 중심 주소 업데이트 (180ms 디바운스 내장)
                updateCenterAddress(map);

                // 🏷️ 줌 레벨에 따라 시설명 레이블 표시/숨김
                const currentZoom = map.getZoom();
                const SHOW_LABELS_ZOOM = 13; // 줌 13 이상이면 이름 표시

                if (labelDebounceTimerRef.current) {
                    clearTimeout(labelDebounceTimerRef.current);
                }

                if (currentZoom >= SHOW_LABELS_ZOOM) {
                    labelDebounceTimerRef.current = setTimeout(() => {
                        // 레이블 표시
                        nameLabelsVisibleRef.current = true;

                        // 기존 레이블 제거
                        nameLabelMarkersRef.current.forEach(m => m.setMap(null));
                        nameLabelMarkersRef.current = [];

                        // 화면에 보이는 마커들만 레이블 생성 (모바일 DOM 과부하 방지: 최대 35개 제한)
                        const bounds = map.getBounds();
                        let labelCount = 0;
                        const MAX_VISIBLE_LABELS = 35;

                        for (let idx = 0; idx < markersRef.current.length; idx++) {
                            if (labelCount >= MAX_VISIBLE_LABELS) break;
                            const marker = markersRef.current[idx];
                            // 필터로 숨겨진 마커는 라벨도 스킵
                            if (!marker.getVisible()) continue;
                            const pos = marker.getPosition();
                            if (!bounds.hasPoint(pos)) continue;

                            const fac = (marker as any).__facilityData;
                            if (!fac || fac.isFull) continue;

                            labelCount++;
                            // 시설명 (최대 10자)
                            const name = fac.name?.length > 10 ? fac.name.slice(0, 10) + '...' : fac.name;

                            const labelMarker = new window.naver.maps.Marker({
                                position: pos,
                                map: map,
                                icon: {
                                    content: `
                                        <div class="facility-label" style="display: flex; flex-direction: column; align-items: center; transform: translateX(-50%); pointer-events: none;">
                                            <div class="facility-label-inner">${name}</div>
                                        </div>
                                    `,
                                    anchor: new window.naver.maps.Point(0, -4),
                                },
                                zIndex: 200
                            });

                            window.naver.maps.Event.addListener(labelMarker, 'click', () => {
                                onMarkerClick(fac);
                            });

                            nameLabelMarkersRef.current.push(labelMarker);
                        }
                    }, 120);
                } else if (currentZoom < SHOW_LABELS_ZOOM && nameLabelsVisibleRef.current) {
                    // 레이블 숨김
                    nameLabelsVisibleRef.current = false;
                    nameLabelMarkersRef.current.forEach(m => m.setMap(null));
                    nameLabelMarkersRef.current = [];
                }

                // 🔒 줌 레벨에 따라 마커 전환 (setVisible = CSS 토글)
                const newMode = currentZoom <= 9 ? 'province' : currentZoom <= 11 ? 'region' : 'individual';
                if (newMode !== prevZoomModeRef.current) {
                    const oldMode = prevZoomModeRef.current;
                    prevZoomModeRef.current = newMode;

                    // 이전 모드 숨기기
                    if (oldMode === 'province') {
                        provinceMarkersArrayRef.current.forEach(m => m.setVisible(false));
                    } else if (oldMode === 'region') {
                        regionMarkersArrayRef.current.forEach(m => m.setVisible(false));
                    } else {
                        markersRef.current.forEach(m => m.setVisible(false));
                    }

                    // 새 모드 보이기
                    if (newMode === 'province') {
                        provinceMarkersArrayRef.current.forEach(m => m.setVisible((m as any).__hasVisibleCount !== false));
                    } else if (newMode === 'region') {
                        regionMarkersArrayRef.current.forEach(m => m.setVisible((m as any).__hasVisibleCount !== false));
                    } else {
                        const bounds = map.getBounds();
                        const catMap: Record<string, string> = { 'charnel': 'CHARNEL_HOUSE', 'natural': 'NATURAL_BURIAL', 'park': 'FAMILY_GRAVE', 'crematorium': 'CREMATORIUM' };
                        const ac = activeCategoryRef.current;
                        const isAll = ac.includes('all');
                        const selCats = isAll ? [] : ac.filter(c => catMap[c]).map(c => catMap[c]);
                        const instF = institutionFilterRef.current;
                        const hi = hideInquiryRef.current;
                        markersRef.current.forEach(m => {
                            const fac = (m as any).__facilityData;
                            let catOk = isAll || selCats.includes(fac?.category);
                            if (catOk && instF !== 'all') {
                                catOk = instF === 'public' ? fac?.isPublic === true : fac?.isPublic === false;
                            }
                            if (catOk && hi) {
                                catOk = (fac?.priceRange?.min ?? 0) > 0;
                            }
                            m.setVisible(catOk && bounds.hasPoint(m.getPosition()));
                        });
                    }
                } else if (newMode === 'individual') {
                    // 🔥 같은 모드에서도 줌/이동 시 viewport 마커 갱신 (CSS 토글만이라 빠름)
                    const bounds = map.getBounds();
                    const catMap2: Record<string, string> = { 'charnel': 'CHARNEL_HOUSE', 'natural': 'NATURAL_BURIAL', 'park': 'FAMILY_GRAVE', 'crematorium': 'CREMATORIUM' };
                    const ac2 = activeCategoryRef.current;
                    const isAll2 = ac2.includes('all');
                    const selCats2 = isAll2 ? [] : ac2.filter(c => catMap2[c]).map(c => catMap2[c]);
                    const instF2 = institutionFilterRef.current;
                    const hi2 = hideInquiryRef.current;
                    markersRef.current.forEach(m => {
                        const fac = (m as any).__facilityData;
                        let catOk = isAll2 || selCats2.includes(fac?.category);
                        if (catOk && instF2 !== 'all') {
                            catOk = instF2 === 'public' ? fac?.isPublic === true : fac?.isPublic === false;
                        }
                        if (catOk && hi2) {
                            catOk = (fac?.priceRange?.min ?? 0) > 0;
                        }
                        m.setVisible(catOk && bounds.hasPoint(m.getPosition()));
                    });
                }
            });

            // 🎯 빈 지도 탭 이벤트 (UI 토글용) - 드래그와 더블클릭 구분
            let isDragging = false;
            let lastClickTime = 0;
            const DOUBLE_CLICK_THRESHOLD = 300; // 300ms 이내 두 번 클릭이면 더블클릭

            window.naver.maps.Event.addListener(map, 'dragstart', () => {
                isDragging = true;
                // 🔍 검색 자동완성 창 닫기
                if (onMapDrag) onMapDrag();
            });
            window.naver.maps.Event.addListener(map, 'dragend', () => {
                // 드래그 끝난 후 약간 지연 (클릭 이벤트와 분리)
                setTimeout(() => { isDragging = false; }, 100);

                // 🚀 드래그 후 새 영역 마커 표시 (individual 모드에서만)
                if (prevZoomModeRef.current === 'individual') {
                    const bounds = map.getBounds();
                    const catMap3: Record<string, string> = { 'charnel': 'CHARNEL_HOUSE', 'natural': 'NATURAL_BURIAL', 'park': 'FAMILY_GRAVE', 'crematorium': 'CREMATORIUM' };
                    const ac3 = activeCategoryRef.current;
                    const isAll3 = ac3.includes('all');
                    const selCats3 = isAll3 ? [] : ac3.filter(c => catMap3[c]).map(c => catMap3[c]);
                    const instF3 = institutionFilterRef.current;
                    const hi3 = hideInquiryRef.current;
                    markersRef.current.forEach(m => {
                        const fac = (m as any).__facilityData;
                        let catOk = isAll3 || selCats3.includes(fac?.category);
                        if (catOk && instF3 !== 'all') {
                            catOk = instF3 === 'public' ? fac?.isPublic === true : fac?.isPublic === false;
                        }
                        if (catOk && hi3) {
                            catOk = (fac?.priceRange?.min ?? 0) > 0;
                        }
                        m.setVisible(catOk && bounds.hasPoint(m.getPosition()));
                    });
                }
            });
            window.naver.maps.Event.addListener(map, 'click', (e: any) => {
                if (isDragging) return; // 드래그 중이면 무시

                const now = Date.now();
                const timeSinceLastClick = now - lastClickTime;
                lastClickTime = now;

                // 더블클릭이면 UI 토글 안 함 (지도 확대 기능)
                if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD) {
                    return;
                }

                // 싱글 클릭: 약간 지연 후 실행 (더블클릭 확인 후)
                setTimeout(() => {
                    // 지연 시간 내에 다시 클릭했으면 더블클릭이므로 무시
                    if (Date.now() - lastClickTime < DOUBLE_CLICK_THRESHOLD) {
                        return;
                    }
                    if (onMapTap) {
                        onMapTap();
                    }
                }, DOUBLE_CLICK_THRESHOLD);
            });

            // 초기 로드 시 실행
            // updateVisibleMarkers() will be called by the useEffect when isMapLoaded becomes true
            setIsMapLoaded(true);

            // 🎯 초기 로드 시에도 중심 주소 및 bounds 업데이트
            updateCenterAddress(map);
            notifyBounds();

        } catch (e) {
            console.error('❌ 지도 초기화 에러:', e);
            setMapError(true);
        }
    };

    return (
        <>
            {N_CLIENT_ID && (
                <Script
                    strategy="afterInteractive"
                    src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${N_CLIENT_ID}&submodules=geocoder`}
                    onReady={() => {
                        setIsMainLoaded(true);
                    }}
                    onError={() => {
                        console.error('❌ 메인 스크립트 로드 실패');
                        setMapError(true);
                    }}
                />
            )}

            {isMainLoaded && (
                <Script
                    strategy="afterInteractive"
                    src="/MarkerClustering.js?v=2"
                    onReady={() => {
                        initMap();
                    }}
                    onError={() => {
                        console.error('❌ 클러스터링 스크립트 로드 실패');
                        // 클러스터링 없어도 지도는 그려야 함
                        initMap();
                    }}
                />
            )}

            <Box pos="relative" w="100%" h="100%">
                <div id="map" ref={mapRef} style={{ width: '100%', height: '100%' }} />

                {/* 좌측 상단 빠른 메뉴 (PC only): 우측 하단 챗봇 FAB와 겹치지 않도록 상단 좌측에 깔끔한 글래스 필로 배치 */}
                {isMapLoaded && !isMobile && (
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transform: uiHidden ? 'translateY(-80px)' : 'translateY(0)',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: uiHidden ? 'none' : 'auto',
                    }}>
                        <a
                            href="/about"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                backdropFilter: 'blur(8px)',
                                color: '#191F28',
                                padding: '8px 14px',
                                borderRadius: '999px',
                                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.1)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap' as const,
                                textDecoration: 'none',
                                border: '1px solid rgba(229, 232, 235, 0.9)',
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B389D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            <span>서비스 소개</span>
                        </a>
                        <a
                            href="/blog"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                backdropFilter: 'blur(8px)',
                                color: '#191F28',
                                padding: '8px 14px',
                                borderRadius: '999px',
                                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.1)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap' as const,
                                textDecoration: 'none',
                                border: '1px solid rgba(229, 232, 235, 0.9)',
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            <span>장례 가이드·블로그</span>
                        </a>
                    </div>
                )}

                {/* 커스텀 컨트롤 버튼 (우측 상단), UI 숨김 시 오른쪽으로 슬라이드 아웃 */}
                {isMapLoaded && (
                    <div style={{
                        position: 'absolute',
                        top: isMobile ? '118px' : '16px', // 모바일: 상단 헤더 아래로
                        right: '14px',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '8px',
                        transform: uiHidden ? 'translateX(100px)' : 'translateX(0)',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}>
                        {/* 0. 내 정보 / 관심장지 보관함 버튼 (PC만) */}
                        {onUserClick && (
                            <button
                                type="button"
                                onClick={onUserClick}
                                aria-label={userButtonLabel || '내 정보 및 로그인'}
                                style={{
                                    height: '38px',
                                    padding: userButtonLabel ? '0 13px' : '0 9px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.97)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '999px',
                                    border: '1px solid #BFDBFE',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.12)',
                                    color: '#1D4ED8',
                                    fontSize: '12.5px',
                                    fontWeight: 800,
                                    letterSpacing: '-0.2px',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                {userButtonLabel && <span>{userButtonLabel}</span>}
                            </button>
                        )}
                        {/* 1. 줌 컨트롤 그룹 */}
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            borderRadius: '10px', overflow: 'hidden',
                            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.12)',
                            border: '1px solid rgba(229, 232, 235, 0.9)',
                        }}>
                            <CustomControlBtn
                                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#191F28" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
                                onClick={handleZoomIn}
                                style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid #F2F4F6', boxShadow: 'none' }}
                            />
                            <CustomControlBtn
                                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#191F28" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>}
                                onClick={handleZoomOut}
                                style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}
                            />
                        </div>

                        {/* 3. 내 위치 */}
                        <CustomControlBtn
                            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="#191F28"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>}
                            onClick={handleMyLocation}
                        />
                    </div>
                )}

                {/* 하단 주소 버튼 (호갱노노 스타일 다크 플로팅 필) - PC 전용 (모바일은 3단 드래그 바텀시트 사용) */}
                {!isMobile && isMapLoaded && centerAddress && (
                    <div style={{
                        position: 'absolute',
                        bottom: isMobile ? '72px' : '24px',
                        left: isMobile ? '16px' : '50%',
                        maxWidth: isMobile ? 'calc(100vw - 92px)' : 'none',
                        transform: uiHidden
                            ? (isMobile ? 'translateY(150%)' : 'translateX(-50%) translateY(150%)')
                            : (isMobile ? 'translateY(0)' : 'translateX(-50%) translateY(0)'),
                        opacity: uiHidden ? 0 : 1,
                        pointerEvents: uiHidden ? 'none' : 'auto',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}>
                        <div
                            className="touch-press"
                            onClick={() => {
                                if (onViewList) {
                                    onViewList(centerAddress, centerCoords?.lat ?? 37.5, centerCoords?.lng ?? 127);
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: 'rgba(25, 31, 40, 0.94)',
                                backdropFilter: 'blur(10px)',
                                color: '#FFFFFF',
                                padding: isMobile ? '10px 16px' : '11px 20px',
                                borderRadius: '999px',
                                border: '1px solid rgba(255, 255, 255, 0.16)',
                                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.26)',
                                cursor: 'pointer',
                                fontSize: isMobile ? '13px' : '13.5px',
                                fontWeight: 700,
                                letterSpacing: '-0.3px',
                                whiteSpace: 'nowrap',
                                textDecoration: 'none',
                                maxWidth: '100%',
                            }}
                        >
                            <MapPin size={15} color="#60A5FA" style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {centerAddress} 주변 목록보기
                            </span>
                        </div>
                    </div>
                )}

                {/* PC 우측 하단 빠른 메뉴 (제휴문의 · 대대손손 소개 · 블로그) */}
                {isMapLoaded && !isMobile && (
                    <div style={{
                        position: 'absolute',
                        bottom: '22px',
                        right: '84px',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transform: uiHidden ? 'translateY(150%)' : 'translateY(0)',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: uiHidden ? 'none' : 'auto',
                    }}>
                        <a
                            href="/partnership"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                backdropFilter: 'blur(8px)',
                                color: '#191F28',
                                padding: '10px 16px',
                                borderRadius: '999px',
                                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                textDecoration: 'none',
                                border: '1px solid #DBEAFE',
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                            <span>제휴문의</span>
                        </a>
                        <a
                            href="/about"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                backdropFilter: 'blur(8px)',
                                color: '#191F28',
                                padding: '10px 16px',
                                borderRadius: '999px',
                                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                textDecoration: 'none',
                                border: '1px solid #E2E8F0',
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            <span>대대손손 소개</span>
                        </a>
                        <a
                            href="/blog"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                backdropFilter: 'blur(8px)',
                                color: '#191F28',
                                padding: '10px 16px',
                                borderRadius: '999px',
                                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                textDecoration: 'none',
                                border: '1px solid #E2E8F0',
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            <span>블로그</span>
                        </a>
                    </div>
                )}

                {/* 로딩/에러 화면 */}
                {(!isMapLoaded || mapError) && (
                    <Center
                        pos="absolute"
                        top={0}
                        left={0}
                        w="100%"
                        h="100%"
                        bg="gray.0"
                        style={{ zIndex: 10 }}
                    >
                        <Box ta="center">
                            <Text c="dimmed" size="sm">
                                {mapError ? '지도를 불러올 수 없습니다.' : '지도 로딩 중...'}
                            </Text>
                            {mapError && (
                                <Button mt="sm" size="xs" variant="subtle" onClick={() => window.location.reload()}>
                                    새로고침
                                </Button>
                            )}
                        </Box>
                    </Center>
                )}
            </Box>
        </>
    );
});

// 버튼 컴포넌트
function CustomControlBtn({ icon, onClick, style }: any) {
    return (
        <div
            onClick={onClick}
            style={{
                width: '38px',
                height: '38px',
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(8px)',
                borderRadius: '10px',
                border: '1px solid rgba(229, 232, 235, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.12)',
                transition: 'background-color 0.15s ease',
                ...style // 덮어쓰기 허용
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.96)'}
        >
            {icon}
        </div>
    );
}

export default NaverMap;
