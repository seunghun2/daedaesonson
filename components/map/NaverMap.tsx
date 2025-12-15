'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import { Box, Text, Center, Button } from '@mantine/core';
import { MapPin } from 'lucide-react';
import Script from 'next/script';
import Link from 'next/link';
import { Facility, FACILITY_CATEGORY_LABELS, FacilityCategory } from '@/types';
import * as turf from '@turf/turf';

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
    isMobile?: boolean;
    onViewList?: () => void;
    onMapTap?: () => void; // 빈 지도 탭 시 호출 (UI 토글용)
    onMapDrag?: () => void; // 지도 드래그 시 호출 (검색창 닫기용)
    uiHidden?: boolean; // UI 숨김 상태 (호갱노노 스타일 애니메이션)
}

export interface NaverMapRef {
    panTo: (lat: number, lng: number, zoom?: number) => void;
    highlightRegion: (lat: number, lng: number, zoom: number, type?: 'gu' | 'dong', regionName?: string) => void;
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

const NaverMap = forwardRef<NaverMapRef, NaverMapProps>(({ facilities, onMarkerClick, onBoundsChanged, isMobile, onViewList, onMapTap, onMapDrag, uiHidden }, ref) => {
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

    // ♻️ 마커 풀링 (재사용)
    const markerPoolRef = useRef<any[]>([]);

    // 🔒 시설별 마커 캐시 (ID -> 마커 인스턴스) - 한 번 생성된 마커는 재사용
    const markerCacheRef = useRef<Map<string, any>>(new Map());

    // 🔒 시설별 고정 좌표 캐시 (한 번 계산되면 영구 고정)
    const fixedCoordsCache = useRef<Map<string, { lat: number; lng: number }>>(new Map());

    // props를 ref에 저장 (이벤트 리스너 내부에서 최신 값 참조 위함)
    const propsRef = useRef({ facilities, onMarkerClick, onBoundsChanged });

    useEffect(() => {
        propsRef.current = { facilities, onMarkerClick, onBoundsChanged };
    }, [facilities, onMarkerClick, onBoundsChanged]);

    // GeoJSON 로드 (동단위 경계)
    useEffect(() => {
        fetch('/data/skorea_dong.json')
            .then(res => res.json())
            .then(data => {
                geomRef.current = data;
                console.log('✅ 행정동 경계 데이터 로드 완료');
            })
            .catch(err => console.error('❌ 행정동 데이터 로드 실패:', err));

        fetch('/data/skorea_gu.json')
            .then(res => res.json())
            .then(data => {
                geomGuRef.current = data;
                console.log('✅ 시군구 경계 데이터 로드 완료');
            })
            .catch(err => console.error('❌ 시군구 데이터 로드 실패:', err));
    }, []);

    useImperativeHandle(ref, () => ({
        panTo: (lat: number, lng: number, zoom?: number) => {
            if (mapInstanceRef.current && window.naver) {
                const newCenter = new window.naver.maps.LatLng(lat, lng);
                if (zoom) {
                    mapInstanceRef.current.morph(newCenter, zoom);
                } else {
                    mapInstanceRef.current.panTo(newCenter);
                }
            }
        },

        highlightRegion: (lat: number, lng: number, zoom: number, type: 'gu' | 'dong' = 'dong', regionName?: string) => {
            if (mapInstanceRef.current && window.naver) {
                const map = mapInstanceRef.current;

                // 기존 하이라이트 제거
                highlightOverlaysRef.current.forEach(overlay => overlay.setMap(null));
                highlightOverlaysRef.current = [];

                const center = new window.naver.maps.LatLng(lat, lng);
                map.morph(center, zoom);

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
                        console.log(`✅ Gu Polygon Drawn: ${validFeatures.length} features for ${regionName}`);
                    }
                }

                // 2. 동 단위 폴리곤 처리 (Union 적용)
                if (!polygonDrawn && type === 'dong' && geomRef.current && regionName) {
                    let candidates: any[] = [];

                    // 매핑 확인
                    if (REGION_MAPPINGS[regionName]) {
                        const keywords = REGION_MAPPINGS[regionName];
                        candidates = geomRef.current.features.filter((f: any) => {
                            const fName = f.properties.name || '';
                            return keywords.some(k => fName.includes(k));
                        });
                    } else {
                        // 기본 퍼지 매칭
                        const targetBase = regionName.replace(/[0-9]/g, '');
                        candidates = geomRef.current.features.filter((f: any) => {
                            const fName = f.properties.name || '';
                            const fBase = fName.replace(/[0-9]/g, '');
                            return fName === regionName || fBase === targetBase;
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
                                const collection = turf.featureCollection(filteredCandidates);
                                mergedFeature = turf.union(collection as any);
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
                            console.log(`✅ Merged Polygon Drawn for ${regionName}`);
                        }
                    }
                }

                // 폴리곤 실패 시 원형 펄백
                if (!polygonDrawn) {
                    let radius = 1000;
                    if (isSi) radius = 5000;
                    else if (type === 'gu') radius = 3000;

                    const circle = new window.naver.maps.Circle({
                        map: map,
                        center: center,
                        radius: radius,
                        fillColor: '#FF0000',
                        fillOpacity: 0.05,
                        strokeColor: '#000000',
                        strokeOpacity: 0.7,
                        strokeWeight: 2,
                        clickable: false,
                        zIndex: 10
                    });
                    highlightOverlaysRef.current.push(circle);
                }
            }

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
                console.log('❌ searchRegion aborted: no keyword or naver obj');
                return null;
            }

            const normKeyword = keyword.normalize('NFC');
            console.log(`🔍 searchRegion called with: "${normKeyword}"`);

            // 1. 구 단위 검색 (geomGuRef)
            if (geomGuRef.current && geomGuRef.current.features) {
                const targetName = normKeyword.replace(/시|군|구/g, '');
                console.log(`   - Gu Search Target: "${targetName}"`);

                const match = geomGuRef.current.features.find((f: any) => {
                    const fName = (f.properties.name || '').normalize('NFC');
                    // "강남" matches "강남구"
                    return fName.includes(targetName) || normKeyword.includes(fName);
                });

                if (match) {
                    console.log(`   ✅ Gu Match Found: ${match.properties.name}`);
                    try {
                        const center = turf.centerOfMass(match);
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
                    console.log('   - No Gu match found');
                }
            } else {
                console.warn('   ⚠️ geomGuRef is missing or empty');
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
                    console.log(`   - Mapping Found for ${normKeyword}: ${targetFeatures.length} features`);
                }

                // 2-2. 매핑 없으면 일반 검색
                if (targetFeatures.length === 0) {
                    // "수유동" -> "수유"로 변환하여 "수유1동", "수유2동" 등 매칭 허용
                    const cleanKeyword = normKeyword.replace(/동$/, '');

                    // exact match, contains, or sub-dong match
                    targetFeatures = geomRef.current.features.filter((f: any) => {
                        const fName = (f.properties.name || '').normalize('NFC');
                        if (fName === normKeyword) return true;
                        if (normKeyword.endsWith('동') && fName.includes(normKeyword)) return true;
                        if (cleanKeyword.length > 0 && fName.includes(cleanKeyword)) return true;
                        return false;
                    });
                }

                if (targetFeatures.length > 0) {
                    // 여러 개가 검색되면(수유1동, 수유2동 등) 그 중 하나를 대표로 쓰거나 중심점 계산
                    // 여기선 첫 번째 매칭을 사용하되, highlightRegion에서 다시 병합하여 그림.
                    const representative = targetFeatures[0];
                    console.log(`   ✅ Dong Match Found: ${representative.properties.name} (+${targetFeatures.length - 1} others)`);

                    try {
                        // 단순 첫 번째 요소의 중심점보다는, 전체 Feature들의 중심점(bounds center)이 더 정확하겠으나,
                        // 여기서는 highlightRegion이 알아서 병합해주므로, 대표 좌표만 넘김.
                        // But for better centering, let's use turf on the collection if multiple.
                        let centerFeature = representative;
                        if (targetFeatures.length > 1) {
                            const fc = turf.featureCollection(targetFeatures);
                            // Center of mass for the whole collection
                            const center = turf.centerOfMass(fc as any);
                            const [lng, lat] = center.geometry.coordinates;
                            return {
                                lat, lng, zoom: 14, type: 'dong' as const, name: normKeyword // Use input keyword so highlightRegion uses mapping
                            };
                        }

                        const center = turf.centerOfMass(representative);
                        const [lng, lat] = center.geometry.coordinates;

                        return {
                            lat: lat,
                            lng: lng,
                            zoom: 14,
                            type: 'dong' as const,
                            name: representative.properties.name // Or keyword? If mapped, keyword is better key.
                        };
                    } catch (e) {
                        console.error('   ❌ Centroid calc failed', e);
                    }
                } else {
                    console.log('   - No Dong match found');
                }
            } else {
                console.warn('   ⚠️ geomRef is missing or empty');
            }

            console.log('❌ searchRegion: No match found anywhere.');
            return null;
        }
    }));

    const handleMyInfo = () => {
        // 아직 업데이트 안 됨
        alert('내 정보 기능은 준비 중입니다.');
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
                console.warn('Reverse Geocoding Failed:', status);
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

        console.log(`📍 구/군별 그룹화 완료: ${Object.keys(groups).length}개 지역`);
        return groups;
    }, [processedFacilities]);

    // 🔒 구/군 마커 캐시 (한 번 생성되면 재사용)
    const regionMarkersRef = useRef<Map<string, any>>(new Map());

    // 🔒 마커/클러스터 초기 생성 여부 (한 번만 생성)
    const isMarkersInitializedRef = useRef(false);

    // 🔒 이전 facilities 개수 저장 (필터 변경 감지용)
    const prevFacilitiesCountRef = useRef(0);

    const updateVisibleMarkers = useCallback(() => {
        const map = mapInstanceRef.current;
        if (!map || !window.naver || !window.naver.maps) return;

        const currentZoom = map.getZoom();
        console.log(`NaverMap - 줌 레벨: ${currentZoom}`);

        // 🔄 필터 변경 감지 (facilities 개수가 바뀌면 마커 재생성)
        if (isMarkersInitializedRef.current && prevFacilitiesCountRef.current !== processedFacilities.length) {
            console.log(`🔄 필터 변경 감지: ${prevFacilitiesCountRef.current} → ${processedFacilities.length}개`);
            isMarkersInitializedRef.current = false; // 재초기화 허용
        }
        prevFacilitiesCountRef.current = processedFacilities.length;

        // 🔒 이미 마커가 초기화되었으면 재생성하지 않음 (위치 고정)
        if (isMarkersInitializedRef.current) {
            console.log('🔒 마커 이미 초기화됨 - 재생성 스킵');
            return;
        }

        // 🔒 데이터가 없으면 초기화하지 않음
        if (processedFacilities.length === 0) {
            console.log('⏳ 데이터 로딩 중...');
            return;
        }

        console.log('🚀 마커 초기 생성...');

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

            // [Price Logic] Check for Representative Price first
            let priceText = '문의';
            let formattedPrice = 0;
            let isRep = false;

            if (fac.pricing) {
                for (const catKey of Object.keys(fac.pricing)) {
                    const category = fac.pricing[catKey];
                    if (category && Array.isArray(category.rows)) {
                        const repItem = category.rows.find((r: any) => r.isRepresentative);
                        if (repItem && repItem.price > 0) {
                            formattedPrice = repItem.price;
                            isRep = true;
                            break;
                        }
                    }
                }
            }

            if (!isRep && fac.priceRange?.min) {
                formattedPrice = fac.priceRange.min;
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
            const markerColor = categoryColors[fac.category as FacilityCategory] || '#0097a7';

            const contentWidth = 58;
            const contentHeight = 44;

            const svgContent = `
            <svg width="${contentWidth}" height="${contentHeight + 8}" viewBox="0 0 ${contentWidth} ${contentHeight + 8}" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="${contentWidth}" height="${contentHeight}" rx="6" fill="${markerColor}"/>
                <path d="M${contentWidth / 2 - 6} ${contentHeight - 1} L${contentWidth / 2} ${contentHeight + 7} L${contentWidth / 2 + 6} ${contentHeight - 1} Z" fill="${markerColor}"/>
                <text x="${contentWidth / 2}" y="16" font-family="-apple-system, sans-serif" font-size="10" fill="white" fill-opacity="0.9" text-anchor="middle">${categoryLabel}</text>
                <text x="${contentWidth / 2}" y="33" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="white" text-anchor="middle">${priceText}</text>
            </svg>
            `;

            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(lat, lng),
                title: fac.name,
                icon: {
                    content: svgContent,
                    anchor: new window.naver.maps.Point(contentWidth / 2, contentHeight + 7),
                }
            });

            (marker as any).__facilityData = fac;
            (marker as any).__facilityId = fac.id;
            (marker as any).__regionKey = (fac.address || '').split(' ')[1] || '기타';

            window.naver.maps.Event.addListener(marker, 'click', () => {
                onMarkerClick(fac);
            });

            createdMarkers.push(marker);
        }

        markersRef.current = createdMarkers;

        // 3. 클러스터링 적용 (전체 데이터 기준 카운트)
        const ClusteringClass = window.MarkerClustering || (window.naver.maps && window.naver.maps.MarkerClustering);
        if (ClusteringClass) {
            clustererRef.current = new ClusteringClass({
                minClusterSize: 1,
                maxZoom: 11, // 줌 12 이상에서 개별 마커
                map: map,
                markers: createdMarkers,
                disableClickZoom: false,
                gridSize: 500,
                averageCenter: false, // 🔒 첫 번째 마커 기준으로 위치 고정
                icons: [{
                    content: `
                         <div style="cursor:pointer; min-width:64px; padding: 6px 10px; background:#35469C; color:white; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.15); display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:-apple-system, sans-serif;">
                             <div class="cluster-region" style="font-size:11px; opacity:0.8; margin-bottom:2px; line-height:1;"></div>
                             <div class="cluster-count" style="font-size:14px; font-weight:800; line-height:1;"></div>
                         </div>
                     `,
                    size: new window.naver.maps.Size(64, 40),
                    anchor: new window.naver.maps.Point(32, 20),
                }],
                indexGenerator: [10, 50, 100, 500, 1000],
                stylingFunction: (clusterMarker: any, count: number, members: any[]) => {
                    const divRegion = clusterMarker.getElement().querySelector('.cluster-region');
                    const divCount = clusterMarker.getElement().querySelector('.cluster-count');

                    // 🔒 전체 데이터 기준 카운트 사용
                    if (members.length > 0) {
                        const regionKey = (members[0] as any).__regionKey;
                        const totalCount = regionGroups[regionKey]?.count || count;
                        if (divCount) divCount.innerText = `${totalCount} 곳`;
                    } else {
                        if (divCount) divCount.innerText = `${count} 곳`;
                    }

                    if (divRegion && members.length > 0) {
                        const fac = (members[0] as any).__facilityData;
                        if (fac) {
                            const addr = fac.address || '';
                            const tokens = addr.split(' ');
                            const currentZoom = map.getZoom();

                            let name = '';
                            if (currentZoom <= 9) {
                                name = tokens[0] || '';
                                if (name.includes('특별자치')) name = name.replace('특별자치', '');
                                else if (name.endsWith('특별시') || name.endsWith('광역시')) name = name.substring(0, 2);
                            } else if (currentZoom <= 11) {
                                name = tokens[1] || tokens[0] || '';
                                if (name.endsWith('시') || name.endsWith('군') || name.endsWith('구')) name = name.slice(0, -1);
                            } else {
                                name = tokens[2] || tokens[1] || '';
                                if (name.endsWith('구')) name = name.slice(0, -1);
                            }
                            divRegion.innerText = name || '지역';
                        }
                    }
                }
            });
        } else {
            createdMarkers.forEach(m => m.setMap(map));
        }

        // 🔒 초기화 완료 플래그
        isMarkersInitializedRef.current = true;
        console.log(`✅ ${createdMarkers.length}개 마커 생성 완료 (위치 고정됨)`);

    }, [processedFacilities, regionGroups, onMarkerClick]);

    // 🚀 Effect: 데이터 변경 시 업데이트
    useEffect(() => {
        if (isMapLoaded) {
            // 1. 즉시 업데이트
            updateVisibleMarkers();

            // 2. 빠른 재시도 (50ms)
            const timer1 = setTimeout(() => {
                updateVisibleMarkers();
            }, 50);

            // 3. 안전장치 (150ms)
            const timer2 = setTimeout(() => {
                updateVisibleMarkers();
            }, 150);

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        }
    }, [facilities, isMapLoaded, updateVisibleMarkers]);

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
            // 사용자 요청: 사당/관악(서울 남부) 인근을 중심으로 시작
            const location = new window.naver.maps.LatLng(37.4760, 126.9810);
            const map = new window.naver.maps.Map(mapRef.current, {
                center: location,
                zoom: 12, // 11~12 정도가 적당
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

                // ❌ 마커 재생성 제거 - 위치 고정을 위해 지도 이동 시 마커 업데이트 안 함
                // updateVisibleMarkers();
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
                        console.log('📜 메인 지도 스크립트 로드 완료 via ncpKeyId');
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
                        console.log('📜 클러스터링 스크립트 로드 완료 (Local), 지도 초기화');
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
                        {/* 1. 내 정보 */}
                        <CustomControlBtn
                            icon={<span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#495057' }}>person</span>}
                            onClick={handleMyInfo}
                        />

                        {/* 2. 줌 컨트롤 그룹 */}
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
                        bottom: isMobile ? '30px' : '24px',
                        left: '50%',
                        transform: uiHidden
                            ? 'translateX(-50%) translateY(150%)'
                            : 'translateX(-50%) translateY(0)',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: 200,
                        pointerEvents: 'auto',
                    }}>
                        <Link
                            href={`/list?region=${encodeURIComponent(centerAddress)}&lat=${centerCoords?.lat ?? ''}&lng=${centerCoords?.lng ?? ''}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: '#35469C', // Brand Color
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
                        </Link>
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
