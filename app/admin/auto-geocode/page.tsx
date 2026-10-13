'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { MapPin, Play } from 'lucide-react';

export default function AutoGeocodePage() {
    const [facilities, setFacilities] = useState<any[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState('지도 로딩 대기중...');
    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, fail: 0 });
    const [isRunning, setIsRunning] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);

    const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '';

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 200));
    };

    const loadFacilities = async () => {
        try {
            const res = await fetch('/api/facilities', { cache: 'no-store' });
            const data = await res.json();
            setFacilities(data);
            setProgress(p => ({ ...p, total: data.length }));
            addLog(`Loaded ${data.length} facilities.`);
        } catch (e) {
            addLog(`Error loading data: ${e}`);
        }
    };

    useEffect(() => {
        loadFacilities();
    }, []);

    const runGeocode = async () => {
        // 네이버 객체 확인
        if (typeof window === 'undefined' || !window.naver || !window.naver.maps) {
            addLog('[ERROR] window.naver.maps is undefined. 지도가 로드되지 않았습니다.');
            alert('네이버 지도가 로드되지 않았습니다. 새로고침 해주세요.');
            return;
        }

        if (!window.naver.maps.Service) {
            addLog('[ERROR] Geocoder submodule not loaded. (Service 객체 없음)');
            // 서브모듈 로드 시도
            return;
        }

        setIsRunning(true);
        addLog('[START] Starting geocoding... (v2.1 fixed)');

        let updatedCount = 0;
        let successCount = 0;
        let failCount = 0;

        const newFacilities = JSON.parse(JSON.stringify(facilities));

        for (let i = 0; i < newFacilities.length; i++) {
            const f = newFacilities[i];
            setProgress({ current: i + 1, total: newFacilities.length, success: successCount, fail: failCount });

            if (f.name.includes('청계공원') || f.name.includes('동산공원묘원') || f.name.includes('서울공원묘원') || f.name.includes('영종공설')) {
                continue;
            }

            if (!f.address) {
                failCount++;
                continue;
            }

            // Promise for sync
            await new Promise<void>((resolve) => {
                window.naver.maps.Service.geocode({
                    query: f.address
                }, (status: any, response: any) => {
                    if (status === window.naver.maps.Service.Status.OK) {
                        if (response.v2.addresses.length > 0) {
                            const item = response.v2.addresses[0];
                            const lat = parseFloat(item.y);
                            const lng = parseFloat(item.x);

                            newFacilities[i].coordinates = { lat, lng };
                            newFacilities[i].location = { lat, lng };

                            addLog(`[OK] [${i + 1}] Fixed (Naver): ${f.name}`);
                            updatedCount++;
                            successCount++;
                            resolve();
                        } else {
                            // 네이버 결과 없음 -> OSM 시도
                            tryOSM(f, i, newFacilities).then((success) => {
                                if (success) {
                                    updatedCount++;
                                    successCount++;
                                } else {
                                    failCount++;
                                }
                                resolve();
                            });
                        }
                    } else {
                        // 네이버 에러 (500, 401 등) -> OSM 시도
                        tryOSM(f, i, newFacilities).then((success) => {
                            if (success) {
                                updatedCount++;
                                successCount++;
                            } else {
                                failCount++;
                            }
                            resolve();
                        });
                    }
                });
            });

            // 1초 딜레이 (OSM 정책 준수 및 부하 방지)
            await new Promise(r => setTimeout(r, 1000));

            // 10개마다 저장
            if (updatedCount > 0 && updatedCount % 10 === 0) {
                await saveToServer(newFacilities);
            }
        }

        if (updatedCount > 0) await saveToServer(newFacilities);

        setIsRunning(false);
        addLog(`[DONE] Updated ${updatedCount} items using Hybrid (Naver + OSM).`);
        alert('완료되었습니다! 메인 페이지를 확인해보세요.');
    };

    // OpenStreetMap (Nominatim) Fallback Function with Retry Strategy
    const tryOSM = async (f: any, index: number, facilitiesArray: any[], retryLevel = 0): Promise<boolean> => {
        try {
            let query = f.address.split('(')[0].trim();

            // Retry 전략: 실패하면 점점 범위를 넓혀서 검색
            if (retryLevel === 1) {
                // 레벨 1: '산' 또는 번지수 제거하고 '동/읍/면' 까지만 검색
                query = query.replace(/산?\s*\d+([-]\d+)?.*$/, '').trim();
            } else if (retryLevel === 2) {
                // 레벨 2: 시/군/구 까지만 검색
                const parts = query.split(' ');
                if (parts.length > 3) {
                    query = parts.slice(0, 3).join(' ');
                }
            }

            if (!query) return false;

            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);

                facilitiesArray[index].coordinates = { lat, lng };
                facilitiesArray[index].location = { lat, lng };

                const method = retryLevel === 0 ? 'Exact' : (retryLevel === 1 ? 'Dong' : 'City');
                addLog(`[OK] [${index + 1}] Fixed (OSM-${method}): ${f.name}`);
                return true;
            } else {
                // 실패 시 다음 레벨 시도 (최대 레벨 2까지)
                if (retryLevel < 2) {
                    await new Promise(r => setTimeout(r, 500));
                    return tryOSM(f, index, facilitiesArray, retryLevel + 1);
                }
            }
        } catch (e) {
            addLog(`[WARN] OSM Error: ${e}`);
        }

        // 마지막까지 실패했을 때만 로그 출력
        if (retryLevel === 2) {
            addLog(`[FAIL] Failed (All): ${f.name}`);
        }
        return false;
    };

    const saveToServer = async (data: any[]) => {
        try {
            await fetch('/api/facilities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            addLog('[SAVE] Saved batch to server.');
        } catch (e) {
            addLog(`[SAVE ERROR] Save failed: ${e}`);
        }
    };

    return (
        <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
            <Script
                strategy="lazyOnload"
                src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${CLIENT_ID}&submodules=geocoder`}
                onLoad={() => {
                    setMapLoaded(true);
                    setStatus('지도 로드 완료. 준비됨.');
                    addLog('System: Naver Map Script Loaded.');
                }}
                onError={() => {
                    setStatus('지도 로드 실패!');
                    addLog('System: Script Load Error');
                }}
            />

            <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={26} color="#2563EB" />
                좌표 자동 보정 v2
            </h1>
            <p>Naver Map Client ID: {CLIENT_ID ? '환경변수 설정됨' : '미설정 (NEXT_PUBLIC_NAVER_MAP_CLIENT_ID)'}</p>
            <h3>상태: {status}</h3>

            <div style={{ margin: '20px 0', padding: 20, background: '#f1f3f5', borderRadius: 8 }}>
                <div style={{ marginBottom: 10 }}>
                    <span style={{ marginRight: 20 }}>전체: {progress.total}</span>
                    <span style={{ marginRight: 20, color: 'blue' }}>진행: {progress.current}</span>
                    <span style={{ marginRight: 20, color: 'green' }}>성공: {progress.success}</span>
                    <span style={{ color: 'red' }}>실패: {progress.fail}</span>
                </div>

                <button
                    onClick={runGeocode}
                    disabled={isRunning || !mapLoaded}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 24px',
                        fontSize: 18,
                        fontWeight: 'bold',
                        background: isRunning ? '#adb5bd' : (mapLoaded ? '#2563EB' : '#868e96'),
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: isRunning || !mapLoaded ? 'not-allowed' : 'pointer'
                    }}
                >
                    <Play size={18} />
                    {isRunning ? '진행 중...' : (mapLoaded ? '좌표 변환 시작' : '로딩 중...')}
                </button>
            </div>

            <div style={{
                height: 500,
                overflowY: 'auto',
                background: '#0F172A',
                color: '#E2E8F0',
                padding: 15,
                borderRadius: 8,
                fontSize: 14,
                lineHeight: 1.5,
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
            }}>
                {logs.length === 0 && <div style={{ color: '#868e96' }}>로그 대기 중...</div>}
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
}

