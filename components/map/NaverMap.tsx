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
    onUserClick?: () => void; // 사용자 버튼 클릭 콜백
}

export interface NaverMapRef {
    panTo: (lat: number, lng: number, zoom?: number, facilityId?: string) => void;
    getCurrentView: () => { lat: number; lng: number; zoom: number } | null;
    highlightRegion: (lat: number, lng: number, zoom: number, type?: 'gu' | 'dong', regionName?: string) => Promise<boolean>;
    searchRegion: (keyword: string) => { lat: number, lng: number, zoom: number, type: 'gu' | 'dong', name: string } | null;
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

const NaverMap = forwardRef<NaverMapRef, NaverMapProps>(({ facilities, onMarkerClick, onBoundsChanged, onCenterAddressChange, isMobile, onViewList, onMapTap, onMapDrag, uiHidden, activeCategory = ['all'], institutionFilter = 'all', onUserClick }, ref) => {
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

    useEffect(() => {
        propsRef.current = { facilities, onMarkerClick, onBoundsChanged };
        activeCategoryRef.current = activeCategory;
        institutionFilterRef.current = institutionFilter;
    }, [facilities, onMarkerClick, onBoundsChanged, activeCategory, institutionFilter]);

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
                if (zoom) {
                    mapInstanceRef.current.morph(newCenter, zoom);
                } else {
                    mapInstanceRef.current.panTo(newCenter);
                }

                // 🎯 시설 ID로 마커 찾아서 bounce 애니메이션
                setTimeout(() => {
                    // 0. 현재 viewport에 있는 마커들 보이게 (morph 후 idle 전에 마커가 숨겨져 있을 수 있음)
                    if (prevZoomModeRef.current === 'individual' && mapInstanceRef.current) {
                        const bounds = mapInstanceRef.current.getBounds();
                        markersRef.current.forEach(m => {
                            m.setVisible(bounds.hasPoint(m.getPosition()));
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
                }, 400);
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

    const handleInquiries = () => {
        window.location.href = '/inquiries';
    };

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
            // 간단하게 '동' 단위까지만 표시하거나 전체 주소 표시
            // 대대손손 포맷: 지역명 (예: 강북구 수유동)
            // jibunAddress가 보통 "서울특별시 강북구 수유동 123-4" 형식이므로 파싱 필요

            if (result && result.results && result.results.length > 0) {
                const r = result.results[0]; // First result
                if (r.region) {
                    const currentZoom = map.getZoom();
                    const a1 = r.region.area1?.name || '';
                    const a2 = r.region.area2?.name || '';
                    const a3 = r.region.area3?.name || '';

                    if (currentZoom < 14) {
                        // Wide view: Area1 + Area2 (e.g., 경기도 성남시)
                        text = `${a1} ${a2}`;
                    } else {
                        // Close view: Area2 + Area3 (e.g., 성남시 정자동)
                        text = `${a2} ${a3}`;
                    }
                }
            }
            setCenterAddress(text.trim());
            onCenterAddressChange?.(text.trim());
        });
    };

    // 🚀 [초기 로딩 최적화] 처음엔 30개만 렌더링하고, 잠시 후 전체 렌더링
    const [renderLimit, setRenderLimit] = useState(100);

    useEffect(() => {
        // 0.5초 뒤에 제한 해제 (사용자가 지도 보고 있을 때 스윽 로딩)
        const timer = setTimeout(() => {
            setRenderLimit(facilities.length); // 전체 로딩
        }, 500);
        return () => clearTimeout(timer);
    }, [facilities.length]);

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

    // 🔒 구/군별 그룹화 (대표 좌표 고정) - 한 번 계산되면 절대 변경 안 함
    const regionGroups = useMemo(() => {
        const groups: Record<string, {
            facilities: typeof processedFacilities;
            representative: typeof processedFacilities[0];
            count: number;
        }> = {};

        for (const fac of processedFacilities) {
            if (!fac.fixedCoordinates?.lat || !fac.fixedCoordinates?.lng) continue;

            // 주소에서 구/군 추출 (예: "경기도 용인시 처인구" -> "용인시")
            const addr = fac.address || '';
            const tokens = addr.split(' ');
            const regionKey = tokens[1] || tokens[0] || '기타'; // 시/군 레벨

            if (!groups[regionKey]) {
                groups[regionKey] = {
                    facilities: [],
                    representative: fac, // 첫 번째 시설 = 대표 좌표 (고정)
                    count: 0
                };
            }
            groups[regionKey].facilities.push(fac);
            groups[regionKey].count++;
        }

        return groups;
    }, [processedFacilities]);

    // 🔒 시/도별 그룹화 (줌 ≤ 9 용)
    const provinceGroups = useMemo(() => {
        const groups: Record<string, { count: number; centerLat: number; centerLng: number }> = {};

        for (const fac of processedFacilities) {
            if (!fac.fixedCoordinates?.lat || !fac.fixedCoordinates?.lng) continue;
            const provinceKey = (fac.address || '').split(' ')[0] || '기타';

            if (!groups[provinceKey]) {
                groups[provinceKey] = { count: 0, centerLat: 0, centerLng: 0 };
            }
            groups[provinceKey].count++;
            groups[provinceKey].centerLat += fac.fixedCoordinates.lat;
            groups[provinceKey].centerLng += fac.fixedCoordinates.lng;
        }

        for (const key of Object.keys(groups)) {
            const g = groups[key];
            g.centerLat /= g.count;
            g.centerLng /= g.count;
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

        // 2. 모든 시설에 대해 개별 마커 생성
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
            const categoryColors: Record<string, string> = {
                'CHARNEL_HOUSE': '#0097a7',
                'NATURAL_BURIAL': '#43a047',
                'FAMILY_GRAVE': '#7e57c2',
                'CREMATORIUM': '#f57c00',
                'FUNERAL_HOME': '#78909c',
                'ETC': '#8d6e63'
            };

            // 만장 여부 체크
            const isFull = !!(fac as any).isFull;
            const markerColor = categoryColors[fac.category as FacilityCategory] || '#0097a7';

            let svgContent: string;
            let anchorPoint: any;

            if (isFull) {
                // ⚫ 만장 마커: 검은 점만 (네이버 지도 자체 라벨 활용)
                const dotSize = 18;
                const hitArea = 32;
                svgContent = `
                <div style="width:${hitArea}px; height:${hitArea}px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                    <div style="width:${dotSize}px; height:${dotSize}px; background:rgba(0,0,0,0.5); border:2.5px solid white; border-radius:50%; box-shadow:0 0 6px rgba(0,0,0,0.25);"></div>
                </div>
                `;
                anchorPoint = new window.naver.maps.Point(hitArea / 2, hitArea / 2);
            } else {
                // 일반 마커: 기존 가격 태그 스타일
                const contentWidth = 56;
                const contentHeight = 52;
                const tailSize = 10;
                const archHeight = 14;

                svgContent = `
                <svg width="${contentWidth}" height="${contentHeight + tailSize}" viewBox="0 0 ${contentWidth} ${contentHeight + tailSize}" xmlns="http://www.w3.org/2000/svg">
                    <path d="
                        M 0 ${archHeight}
                        Q 0 0, ${contentWidth / 2} 0
                        Q ${contentWidth} 0, ${contentWidth} ${archHeight}
                        L ${contentWidth} ${contentHeight - 8}
                        Q ${contentWidth} ${contentHeight}, ${contentWidth - 8} ${contentHeight}
                        L ${tailSize} ${contentHeight}
                        L 0 ${contentHeight + tailSize}
                        L 0 ${archHeight}
                        Z
                    " fill="${markerColor}" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
                    <text x="${contentWidth / 2}" y="20" font-family="-apple-system, sans-serif" font-size="10" fill="white" fill-opacity="0.9" text-anchor="middle">${categoryLabel}</text>
                    <text x="${contentWidth / 2}" y="38" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="white" text-anchor="middle">${priceText}</text>
                </svg>
                `;
                anchorPoint = new window.naver.maps.Point(0, 52 + 10);
            }

            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(lat, lng),
                map: map,
                visible: false,
                title: isFull ? '' : fac.name,
                zIndex: isFull ? 50 : 100,
                icon: {
                    content: svgContent,
                    anchor: anchorPoint,
                }
            });

            (marker as any).__facilityData = fac;
            (marker as any).__facilityId = fac.id;
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
                        pixelOffset: new window.naver.maps.Point(30, -10),
                    });
                }

                const tooltipContent = `
                    <div style="
                        background: white;
                        padding: 8px 12px;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                        font-family: -apple-system, sans-serif;
                        min-width: 120px;
                        max-width: 200px;
                    ">
                        <div style="font-weight: 700; font-size: 13px; color: #333; margin-bottom: 4px;">
                            ${isFull ? '<span style="display:inline-block;width:10px;height:10px;background:rgba(0,0,0,0.5);border:1.5px solid white;border-radius:50%;margin-right:4px;vertical-align:middle;box-shadow:0 0 3px rgba(0,0,0,0.2);"></span>' : ''}${fac.name}
                        </div>
                        <div style="font-size: 11px; color: #666;">
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

        // 시/군 레벨 고정 마커 생성
        for (const [regionKey, group] of Object.entries(regionGroups)) {
            const center = regionGroupCenters[regionKey];
            if (!center) continue;

            let displayName = regionKey;
            if (displayName.endsWith('시') || displayName.endsWith('군') || displayName.endsWith('구')) {
                displayName = displayName.slice(0, -1);
            }

            const regionMarker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(center.lat, center.lng),
                map: map,
                visible: false,
                icon: {
                    content: `
                        <div style="cursor:pointer; min-width:64px; padding: 6px 10px; background:#1D0098; color:white; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.15); display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:-apple-system, sans-serif;">
                            <div style="font-size:11px; opacity:0.8; margin-bottom:2px; line-height:1;">${displayName}</div>
                            <div style="font-size:14px; font-weight:800; line-height:1;">${group.count} 곳</div>
                        </div>
                    `,
                    size: new window.naver.maps.Size(64, 40),
                    anchor: new window.naver.maps.Point(32, 20),
                },
                zIndex: 200,
            });

            window.naver.maps.Event.addListener(regionMarker, 'click', () => {
                map.setCenter(new window.naver.maps.LatLng(center.lat, center.lng));
                map.setZoom(12);
            });

            (regionMarker as any).__regionKey = regionKey;
            regionMarkersArrayRef.current.push(regionMarker);
        }

        // 시/도 레벨 고정 마커 생성
        for (const [provinceKey, group] of Object.entries(provinceGroups)) {
            let displayName = provinceKey;
            if (displayName.includes('특별자치')) displayName = displayName.replace('특별자치', '');
            else if (displayName.endsWith('특별시') || displayName.endsWith('광역시')) displayName = displayName.substring(0, 2);
            else if (displayName.endsWith('도')) displayName = displayName.slice(0, -1);

            const provinceMarker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(group.centerLat, group.centerLng),
                map: map,
                visible: false,
                icon: {
                    content: `
                        <div style="cursor:pointer; min-width:64px; padding: 6px 10px; background:#1D0098; color:white; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.15); display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:-apple-system, sans-serif;">
                            <div style="font-size:11px; opacity:0.8; margin-bottom:2px; line-height:1;">${displayName}</div>
                            <div style="font-size:14px; font-weight:800; line-height:1;">${group.count} 곳</div>
                        </div>
                    `,
                    size: new window.naver.maps.Size(64, 40),
                    anchor: new window.naver.maps.Point(32, 20),
                },
                zIndex: 200,
            });

            window.naver.maps.Event.addListener(provinceMarker, 'click', () => {
                map.setCenter(new window.naver.maps.LatLng(group.centerLat, group.centerLng));
                map.setZoom(10);
            });

            (provinceMarker as any).__provinceKey = provinceKey;
            provinceMarkersArrayRef.current.push(provinceMarker);
        }

        // 4. 현재 줌에 따라 마커 모드 설정 (setVisible = CSS 토글, 초고속)
        const zoomNow = map.getZoom();
        const initialMode = zoomNow <= 9 ? 'province' : zoomNow <= 11 ? 'region' : 'individual';
        prevZoomModeRef.current = initialMode;

        if (initialMode === 'province') {
            provinceMarkersArrayRef.current.forEach(m => m.setVisible(true));
        } else if (initialMode === 'region') {
            regionMarkersArrayRef.current.forEach(m => m.setVisible(true));
        } else {
            const bounds = map.getBounds();
            createdMarkers.forEach(m => {
                m.setVisible(bounds.hasPoint(m.getPosition()));
            });
        }

        // 🔒 초기화 완료 플래그
        isMarkersInitializedRef.current = true;

    }, [processedFacilities, regionGroups, provinceGroups, regionGroupCenters, onMarkerClick]);

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
                if (visible) count++;
            }

            if (count === 0) {
                regionMarker.setVisible(false);
            } else {
                // 카운트 업데이트
                const displayName = regionKey.endsWith('시') || regionKey.endsWith('군') || regionKey.endsWith('구')
                    ? regionKey.slice(0, -1) : regionKey;
                regionMarker.setIcon({
                    content: `
                        <div style="cursor:pointer; min-width:64px; padding: 6px 10px; background:#1D0098; color:white; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.15); display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:-apple-system, sans-serif;">
                            <div style="font-size:11px; opacity:0.8; margin-bottom:2px; line-height:1;">${displayName}</div>
                            <div style="font-size:14px; font-weight:800; line-height:1;">${count} 곳</div>
                        </div>
                    `,
                    size: new window.naver.maps.Size(64, 40),
                    anchor: new window.naver.maps.Point(32, 20),
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
            for (const fac of processedFacilities) {
                const facProv = (fac.address || '').split(' ')[0] || '기타';
                if (facProv !== provKey) continue;
                let visible = isAllCategory || selectedDbCategories.includes(fac.category);
                if (visible && institutionFilter !== 'all') {
                    if (institutionFilter === 'public') visible = fac.isPublic === true;
                    else if (institutionFilter === 'private') visible = fac.isPublic === false;
                }
                if (visible) count++;
            }

            if (count === 0) {
                provMarker.setVisible(false);
            } else {
                let displayName = provKey;
                if (displayName.includes('특별자치')) displayName = displayName.replace('특별자치', '');
                else if (displayName.endsWith('특별시') || displayName.endsWith('광역시')) displayName = displayName.substring(0, 2);
                else if (displayName.endsWith('도')) displayName = displayName.slice(0, -1);

                provMarker.setIcon({
                    content: `
                        <div style="cursor:pointer; min-width:64px; padding: 6px 10px; background:#1D0098; color:white; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.15); display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:-apple-system, sans-serif;">
                            <div style="font-size:11px; opacity:0.8; margin-bottom:2px; line-height:1;">${displayName}</div>
                            <div style="font-size:14px; font-weight:800; line-height:1;">${count} 곳</div>
                        </div>
                    `,
                    size: new window.naver.maps.Size(64, 40),
                    anchor: new window.naver.maps.Point(32, 20),
                });
                const isProvinceMode = currentZoom <= 9;
                provMarker.setVisible(isProvinceMode);
            }
        }
    }, [activeCategory, institutionFilter, processedFacilities, regionGroups, provinceGroups]);

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

            // 🔥 핵심: Idle(멈춤) 이벤트에서 마커 업데이트 호출
            window.naver.maps.Event.addListener(map, 'idle', () => {
                // 부모에게 bounds 알림
                const cb = propsRef.current.onBoundsChanged;
                if (cb) {
                    const bounds = map.getBounds();
                    const sw = bounds.getSW();
                    const ne = bounds.getNE();
                    cb({
                        south: sw.lat(), north: ne.lat(), west: sw.lng(), east: ne.lng(),
                    });
                }

                // 중심 주소 업데이트
                updateCenterAddress(map);

                // 🏷️ 줌 레벨에 따라 시설명 레이블 표시/숨김
                const currentZoom = map.getZoom();
                const SHOW_LABELS_ZOOM = 13; // 줌 13 이상이면 이름 표시

                if (currentZoom >= SHOW_LABELS_ZOOM) {
                    // 레이블 표시 (항상 새로 그림 - 지도 이동 시에도)
                    nameLabelsVisibleRef.current = true;

                    // 기존 레이블 제거
                    nameLabelMarkersRef.current.forEach(m => m.setMap(null));
                    nameLabelMarkersRef.current = [];

                    // 화면에 보이는 마커들만 레이블 생성
                    const bounds = map.getBounds();
                    markersRef.current.forEach((marker, idx) => {
                        const pos = marker.getPosition();
                        if (!bounds.hasPoint(pos)) return;

                        const fac = (marker as any).__facilityData;
                        if (!fac) return;
                        if (fac.isFull) return; // 만장 시설은 이름 라벨 표시 안 함

                        // 시설명 (최대 10자)
                        const name = fac.name?.length > 10 ? fac.name.slice(0, 10) + '...' : fac.name;

                        const labelMarker = new window.naver.maps.Marker({
                            position: pos,
                            map: map,
                            icon: {
                                content: `
                                    <div class="facility-label" style="
                                        display: flex;
                                        flex-direction: column;
                                        align-items: center;
                                        transform: translateX(-50%);
                                        animation: labelSlideUp 0.3s ease-out forwards;
                                    ">
                                        <div style="
                                            background: white;
                                            padding: 5px 10px;
                                            border-radius: 6px;
                                            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                            font-size: 12px;
                                            font-weight: 700;
                                            color: #333;
                                            white-space: nowrap;
                                            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                                        ">${name}</div>
                                    </div>
                                    <style>
                                        @keyframes labelSlideUp {
                                            from {
                                                opacity: 0;
                                                transform: translateX(-50%) translateY(10px);
                                            }
                                            to {
                                                opacity: 1;
                                                transform: translateX(-50%) translateY(0);
                                            }
                                        }
                                    </style>
                                `,
                                anchor: new window.naver.maps.Point(-30, 96),
                            },
                            zIndex: 200
                        });

                        // 레이블 클릭 시 마커 클릭과 동일하게 동작
                        window.naver.maps.Event.addListener(labelMarker, 'click', () => {
                            onMarkerClick(fac);
                        });

                        nameLabelMarkersRef.current.push(labelMarker);
                    });
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
                        provinceMarkersArrayRef.current.forEach(m => m.setVisible(true));
                    } else if (newMode === 'region') {
                        regionMarkersArrayRef.current.forEach(m => m.setVisible(true));
                    } else {
                        const bounds = map.getBounds();
                        const catMap: Record<string, string> = { 'charnel': 'CHARNEL_HOUSE', 'natural': 'NATURAL_BURIAL', 'park': 'FAMILY_GRAVE', 'crematorium': 'CREMATORIUM' };
                        const ac = activeCategoryRef.current;
                        const isAll = ac.includes('all');
                        const selCats = isAll ? [] : ac.filter(c => catMap[c]).map(c => catMap[c]);
                        const instF = institutionFilterRef.current;
                        markersRef.current.forEach(m => {
                            const fac = (m as any).__facilityData;
                            let catOk = isAll || selCats.includes(fac?.category);
                            if (catOk && instF !== 'all') {
                                catOk = instF === 'public' ? fac?.isPublic === true : fac?.isPublic === false;
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
                    markersRef.current.forEach(m => {
                        const fac = (m as any).__facilityData;
                        let catOk = isAll2 || selCats2.includes(fac?.category);
                        if (catOk && instF2 !== 'all') {
                            catOk = instF2 === 'public' ? fac?.isPublic === true : fac?.isPublic === false;
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
                    markersRef.current.forEach(m => {
                        const fac = (m as any).__facilityData;
                        let catOk = isAll3 || selCats3.includes(fac?.category);
                        if (catOk && instF3 !== 'all') {
                            catOk = instF3 === 'public' ? fac?.isPublic === true : fac?.isPublic === false;
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

            // 🎯 초기 로드 시에도 중심 주소 업데이트 (버튼 바로 표시)
            updateCenterAddress(map);

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


                {/* 커스텀 컨트롤 버튼 (우측 상단), UI 숨김 시 오른쪽으로 슬라이드 아웃 */}
                {isMapLoaded && (
                    <div style={{
                        position: 'absolute',
                        top: isMobile ? '130px' : '20px', // 모바일: 상단 헤더 아래로
                        right: '16px',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transform: uiHidden ? 'translateX(100px)' : 'translateX(0)',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}>
                        {/* 0. 내 정보 (PC만) */}
                        {onUserClick && (
                            <CustomControlBtn
                                icon={<span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#495057' }}>person_outline</span>}
                                onClick={onUserClick}
                            />
                        )}
                        {/* 1. 줌 컨트롤 그룹 */}
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            borderRadius: '8px', overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                            <CustomControlBtn
                                icon={<span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#495057' }}>add</span>}
                                onClick={handleZoomIn}
                                style={{ borderRadius: 0, borderBottom: '1px solid #f1f3f5' }}
                            />
                            <CustomControlBtn
                                icon={<span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#495057' }}>remove</span>}
                                onClick={handleZoomOut}
                                style={{ borderRadius: 0 }}
                            />
                        </div>

                        {/* 3. 내 위치 */}
                        <CustomControlBtn
                            icon={<span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#495057' }}>my_location</span>}
                            onClick={handleMyLocation}
                        />
                    </div>
                )}

                {/* 하단 주소 버튼 (호갱노노 스타일) - 가운데, UI 숨김 시 아래로 슬라이드 아웃 */}
                {isMapLoaded && centerAddress && (
                    <div style={{
                        position: 'absolute',
                        bottom: isMobile ? '70px' : '24px',
                        left: '50%',
                        transform: uiHidden
                            ? 'translateX(-50%) translateY(150%)'
                            : 'translateX(-50%) translateY(0)',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: 200,
                        pointerEvents: 'auto',
                    }}>
                        <div
                            onClick={() => {
                                if (onViewList) {
                                    onViewList(centerAddress, centerCoords?.lat ?? 37.5, centerCoords?.lng ?? 127);
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: '#1D0098',
                                color: 'white',
                                padding: isMobile ? '10px 14px' : '12px 20px',
                                borderRadius: '30px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                cursor: 'pointer',
                                fontSize: isMobile ? '12px' : '14px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                textDecoration: 'none',
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: isMobile ? '16px' : '20px' }}>menu</span>
                            <span>{centerAddress} 주변 시설 보기</span>
                        </div>
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
                width: '40px',
                height: '40px',
                backgroundColor: 'white',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'background-color 0.2s',
                ...style // 덮어쓰기 허용
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
            {icon}
        </div>
    );
}

export default NaverMap;
