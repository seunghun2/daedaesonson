'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function AutoGeocodePage() {
    const [facilities, setFacilities] = useState<any[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState('지도 로딩 대기중...');
    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, fail: 0 });
    const [isRunning, setIsRunning] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);

    const CLIENT_ID = '9ynkl22koz'; // 직접 입력

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
            addLog('❌ Error: window.naver.maps is undefined. 지도가 로드되지 않았습니다.');
            alert('네이버 지도가 로드되지 않았습니다. 새로고침 해주세요.');
            return;
        }

        if (!window.naver.maps.Service) {
            addLog('❌ Error: Geocoder submodule not loaded. (Service 객체 없음)');
            // 서브모듈 로드 시도
            return;
        }

        setIsRunning(true);
        addLog('🚀 Starting geocoding... (v2.1 fixed)');

        let updatedCount = 0;
        let successCount = 0;
        let failCount = 0;

        const newFacilities = JSON.parse(JSON.stringify(facilities));

        for (let i = 0; i < newFacilities.length; i++) {
            // if (!isRunning) break; // <--- This was the bug! Removed.

            const f = newFacilities[i];
            setProgress({ current: i + 1, total: newFacilities.length, success: successCount, fail: failCount });

            // 좌표가 이미 있고(랜덤X), 주소 기반으로 확인된 건 스킵 (여기선 단순 확인)
            // 하지만 지금 대부분이 랜덤이므로 일단 다 돌림 (단, protected 제외)
            if (f.name.includes('청계공원') || f.name.includes('동산공원묘원') || f.name.includes('서울공원묘원') || f.name.includes('영종공설')) {
                // addLog(`Pass (Protected): ${f.name}`);
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

                            addLog(`✅ [${i + 1}] Fixed (Naver): ${f.name}`);
                            updatedCount++;
                            successCount++;
                            resolve(); // 성공 시 resolve
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
        addLog(`🏁 Done! Updated ${updatedCount} items using Hybrid (Naver + OSM).`);
        alert('완료되었습니다! 메인 페이지를 확인해보세요.');
    };

    // OpenStreetMap (Nominatim) Fallback Function with Retry Strategy
    const tryOSM = async (f: any, index: number, facilitiesArray: any[], retryLevel = 0): Promise<boolean> => {
        try {
            let query = f.address.split('(')[0].trim();

            // Retry 전략: 실패하면 점점 범위를 넓혀서 검색
            if (retryLevel === 1) {
                // 레벨 1: '산' 또는 번지수 제거하고 '동/읍/면' 까지만 검색
                // 예: "경기도 용인시 처인구 모현읍 능원리 산 12-3" -> "경기도 용인시 처인구 모현읍 능원리"
                // 정규식: 숫자 나 '산' 이후의 문자열 제거
                query = query.replace(/산?\s*\d+([-]\d+)?.*$/, '').trim();
            } else if (retryLevel === 2) {
                // 레벨 2: 시/군/구 까지만 검색
                // 공백으로 잘라서 앞 3어절만 사용 (보통 '도 시 구' or '시 구 동')
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
                addLog(`✅ [${index + 1}] Fixed (OSM-${method}): ${f.name}`);
                return true;
            } else {
                // 실패 시 다음 레벨 시도 (최대 레벨 2까지)
                if (retryLevel < 2) {
                    // 0.5초 대기 후 재시도
                    await new Promise(r => setTimeout(r, 500));
                    return tryOSM(f, index, facilitiesArray, retryLevel + 1);
                }
            }
        } catch (e) {
            addLog(`⚠️ OSM Error: ${e}`);
        }

        // 마지막까지 실패했을 때만 로그 출력
        if (retryLevel === 2) {
            addLog(`❌ Failed (All): ${f.name}`);
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
            addLog('💾 Helper: Saved batch to server.');
        } catch (e) {
            addLog(`💾 Save failed: ${e}`);
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
                onError={(e) => {
                    setStatus('지도 로드 실패!');
                    addLog(`System: Script Load Error`);
                }}
            />

            <h1>📍 좌표 자동 보정 v2</h1>
            <p>ID: {CLIENT_ID} (Hardcoded)</p>
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
                        padding: '12px 24px',
                        fontSize: 18,
                        fontWeight: 'bold',
                        background: isRunning ? '#adb5bd' : (mapLoaded ? '#228be6' : '#868e96'),
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: isRunning || !mapLoaded ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isRunning ? '진행 중...' : (mapLoaded ? '🚀 좌표 변환 시작' : '로딩 중...')}
                </button>
            </div>

            <div style={{
                height: 500,
                overflowY: 'auto',
                background: '#212529',
                color: '#e9ecef',
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
