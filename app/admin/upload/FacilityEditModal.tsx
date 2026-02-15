'use client';

import React, { useState, useEffect, memo, useRef, useCallback } from 'react';
import {
    Text, Group, Button, Paper, TextInput, ActionIcon,
    Modal, NumberInput, Select, ScrollArea,
    Stack, Tabs, SimpleGrid, Card, Image, FileButton,
    Box, Alert, ThemeIcon, Switch, SegmentedControl, Accordion, Badge,
    MultiSelect, Chip, Progress
} from '@mantine/core';
import {
    Plus, Trash, Save, X, Image as ImageIcon,
    DollarSign, Building2, CloudDownload, FileText, Wand2, Scissors,
    TrendingUp, TrendingDown, List, Star,
    ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react';
import { Facility, FACILITY_CATEGORY_LABELS, FacilityCategory, SERVICE_TYPE_LABELS, ServiceType } from '@/types';
import { cropImagesFromScreenshot } from '@/lib/imageCropper';
import { PRICE_TAB_CATEGORIES, OTHER_TAB_CATEGORY } from '@/lib/constants';
import { getSingleFacilityImageUrl } from '@/lib/supabaseImage';
import StandardPriceEditor from './StandardPriceEditor';

// ============================================================
// PriceEditor (memo) - 자체 priceTable 상태 관리
// ============================================================
const PriceEditor = memo(({ initialPriceTable, onChange }: {
    initialPriceTable: any;
    onChange: (newTable: any) => void;
}) => {
    const [priceTable, setPriceTable] = useState<any>(initialPriceTable || {});
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setPriceTable(initialPriceTable || {});
    }, [initialPriceTable]);

    const notifyParent = useCallback((newTable: any) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChange(newTable), 500);
    }, [onChange]);

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    const updateTable = useCallback((updater: (prev: any) => any) => {
        setPriceTable((prev: any) => {
            const next = updater(prev);
            notifyParent(next);
            return next;
        });
    }, [notifyParent]);

    const mainGroups: any[] = [];
    const installationGroups: any[] = [];
    const managementGroups: any[] = [];

    Object.entries(priceTable).forEach(([groupName, groupData]: [string, any]) => {
        if (groupName.includes('[별도]') || groupName.includes('시설') || groupName.includes('석물')) {
            installationGroups.push({ groupName, groupData });
        } else if (groupName.includes('[안내]') || groupName.includes('관리비') || groupName.includes('용역')) {
            managementGroups.push({ groupName, groupData });
        } else {
            mainGroups.push({ groupName, groupData });
        }
    });

    const renderGroup = (groups: { groupName: string; groupData: any }[], title: string, color: string) => {
        if (groups.length === 0) return null;
        return (
            <Paper withBorder p="md" radius="md" mb="md">
                <Text fw={700} mb="sm" c={color}>{title}</Text>
                {groups.map(({ groupName, groupData }) => (
                    <Paper key={groupName} withBorder p="sm" mb="sm" radius="sm">
                        <Group justify="space-between" mb="xs">
                            <TextInput
                                value={groupName}
                                size="sm"
                                styles={{ input: { fontWeight: 600 } }}
                                onChange={(e) => {
                                    const newName = e.target.value;
                                    updateTable(prev => {
                                        const next = { ...prev };
                                        next[newName] = next[groupName];
                                        delete next[groupName];
                                        return next;
                                    });
                                }}
                            />
                            <ActionIcon color="red" variant="light" size="sm" onClick={() => {
                                if (!confirm(`"${groupName}" 그룹을 삭제하시겠습니까?`)) return;
                                updateTable(prev => {
                                    const next = { ...prev };
                                    delete next[groupName];
                                    return next;
                                });
                            }}>
                                <Trash size={14} />
                            </ActionIcon>
                        </Group>
                        <Stack gap="xs">
                            {(groupData.rows || []).map((row: any, idx: number) => (
                                <Group key={idx} gap="xs" wrap="nowrap">
                                    <ActionIcon size="sm" variant="subtle" color={row.isRepresentative ? 'yellow' : 'gray'}
                                        onClick={() => {
                                            updateTable(prev => {
                                                const next = { ...prev };
                                                const rows = [...(next[groupName]?.rows || [])];
                                                rows.forEach((r, i) => { r.isRepresentative = i === idx ? !r.isRepresentative : false; });
                                                next[groupName] = { ...next[groupName], rows };
                                                return next;
                                            });
                                        }}>
                                        <Star size={14} fill={row.isRepresentative ? "currentColor" : "none"} />
                                    </ActionIcon>
                                    <TextInput placeholder="항목명" value={row.name || ''} style={{ flex: 2 }} size="sm"
                                        onChange={(e) => {
                                            updateTable(prev => {
                                                const next = { ...prev };
                                                const rows = [...(next[groupName]?.rows || [])];
                                                rows[idx] = { ...rows[idx], name: e.target.value };
                                                next[groupName] = { ...next[groupName], rows };
                                                return next;
                                            });
                                        }} />
                                    <TextInput placeholder="설명" value={row.grade || ''} style={{ flex: 1.5 }} size="sm"
                                        onChange={(e) => {
                                            updateTable(prev => {
                                                const next = { ...prev };
                                                const rows = [...(next[groupName]?.rows || [])];
                                                rows[idx] = { ...rows[idx], grade: e.target.value };
                                                next[groupName] = { ...next[groupName], rows };
                                                return next;
                                            });
                                        }} />
                                    <NumberInput value={row.price ?? 0} thousandSeparator="," suffix="원" style={{ flex: 1.5 }} size="sm"
                                        onChange={(val) => {
                                            updateTable(prev => {
                                                const next = { ...prev };
                                                const rows = [...(next[groupName]?.rows || [])];
                                                rows[idx] = { ...rows[idx], price: Number(val) || 0 };
                                                next[groupName] = { ...next[groupName], rows };
                                                return next;
                                            });
                                        }} />
                                    <ActionIcon color="red" variant="subtle" size="sm" onClick={() => {
                                        updateTable(prev => {
                                            const next = { ...prev };
                                            const rows = [...(next[groupName]?.rows || [])];
                                            rows.splice(idx, 1);
                                            next[groupName] = { ...next[groupName], rows };
                                            return next;
                                        });
                                    }}>
                                        <X size={14} />
                                    </ActionIcon>
                                </Group>
                            ))}
                            <Button variant="light" size="xs" leftSection={<Plus size={14} />} onClick={() => {
                                updateTable(prev => {
                                    const next = { ...prev };
                                    const rows = [...(next[groupName]?.rows || []), { name: '', grade: '', price: 0 }];
                                    next[groupName] = { ...next[groupName], rows };
                                    return next;
                                });
                            }}>
                                항목 추가
                            </Button>
                        </Stack>
                    </Paper>
                ))}
            </Paper>
        );
    };

    return (
        <Box>
            {renderGroup(mainGroups, '📋 기본 가격표', 'blue')}
            {renderGroup(installationGroups, '🔧 시설 설치 / 석물 비용', 'orange')}
            {renderGroup(managementGroups, '📌 관리비 / 용역비', 'green')}
            <Button variant="light" fullWidth mt="md" leftSection={<Plus size={16} />} onClick={() => {
                const newName = `새 그룹 ${Object.keys(priceTable).length + 1}`;
                updateTable(prev => ({ ...prev, [newName]: { unit: '원', rows: [{ name: '', price: 0 }] } }));
            }}>
                새 가격 그룹 추가
            </Button>
        </Box>
    );
});
PriceEditor.displayName = 'PriceEditor';


// ============================================================
// FacilityEditModal - 완전 독립 모달 컴포넌트
// ============================================================
interface FacilityEditModalProps {
    facilityToEdit: Facility | null; // null = 새 시설 등록
    opened: boolean;
    onClose: () => void;
    onSaved: (facility: Facility, isNew: boolean) => void;
    onNavigate?: (direction: 'prev' | 'next') => void;
    currentIndex?: number;
    totalCount?: number;
}

function FacilityEditModal({ facilityToEdit, opened, onClose, onSaved, onNavigate, currentIndex, totalCount }: FacilityEditModalProps) {
    // 모든 모달 내부 상태
    const [editForm, setEditForm] = useState<Partial<Facility>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [cropping, setCropping] = useState(false);
    const [useOcr] = useState(false);
    const [activeMajorTab, setActiveMajorTab] = useState<string>('매장묘');
    const [activeGroupTab, setActiveGroupTab] = useState<Record<string, string>>({});
    const userModified = useRef(false); // 유저가 수정했는지 추적 (백그라운드 덮어쓰기 방지)

    // opened + 시설 ID 변경 시에만 내부 상태 초기화 (facilityToEdit 객체 참조 변경은 무시)
    const facilityId = facilityToEdit?.id;
    useEffect(() => {
        if (!opened) return;
        userModified.current = false; // 새 시설 열 때 리셋

        if (facilityToEdit) {
            // 수정 모드
            const parsed = { ...facilityToEdit };
            if (typeof parsed.images === 'string') {
                try { parsed.images = JSON.parse(parsed.images); } catch { parsed.images = []; }
            }
            if (!Array.isArray(parsed.images)) parsed.images = [];
            if (!parsed.imageGallery || parsed.imageGallery.length === 0) {
                if (parsed.images && parsed.images.length > 0) parsed.imageGallery = parsed.images;
            }
            setEditingId(parsed.id);
            setEditForm(JSON.parse(JSON.stringify(parsed)));

            // 백그라운드 상세 데이터 로딩
            const fetchId = parsed.id; // 클로저에서 ID 캡처
            (async () => {
                try {
                    const [detailRes, priceRes] = await Promise.all([
                        fetch(`/api/facilities/${parsed.id}`, { cache: 'no-store' }),
                        fetch(`/api/facilities/${parsed.id}/prices`, { cache: 'no-store' })
                    ]);
                    let merged = { ...parsed };
                    if (detailRes.ok) {
                        const latest = await detailRes.json();
                        // 🔑 기본 필드는 리스트에서 이미 최신 → 덮어쓰지 않음 (ISR 캐시 stale 데이터 방지)
                        const { name: _n, address: _a, phone: _p, description: _d, category: _c,
                            isPublic: _ip, isActive: _ia, operatorType: _ot, capacity: _cap,
                            websiteUrl: _wu, lastUpdated: _lu, fax: _fx,
                            hasParking: _hp, hasRestaurant: _hr, hasStore: _hs, hasAccessibility: _ha,
                            imageGallery: _ig2, images: _im2, thumbnail: _th,
                            ...detailOnly } = latest;
                        merged = { ...merged, ...detailOnly };
                    }
                    if (priceRes.ok) {
                        const detailed = await priceRes.json();
                        merged = { ...merged, priceInfo: { priceTable: detailed.priceTable, standardizedPrices: detailed.standardizedPrices } } as any;
                        (merged as any)._detailedSource = 'prisma';
                        (merged as any)._meta = detailed._meta;
                    }
                    // 🔑 유저가 이미 수정했으면 이미지를 덮어쓰지 않음
                    setEditForm(prev => {
                        if ((prev as any)?.id !== fetchId) return prev;
                        if (userModified.current) {
                            // 유저가 수정한 이미지는 보존, 나머지만 업데이트
                            const { imageGallery: _ig, images: _im, ...rest } = merged;
                            return JSON.parse(JSON.stringify({ ...prev, ...rest }));
                        }
                        return JSON.parse(JSON.stringify(merged));
                    });
                } catch (e) { console.error('Detail fetch error:', e); }
            })();
        } else {
            // 새 시설 등록 모드
            setEditingId(null);
            setEditForm({
                id: `new-${Date.now()}`, name: '', category: 'OTHER', address: '', phone: '',
                description: '', operator: { name: '', contact: '' }, coordinates: { lat: 0, lng: 0 },
                priceRange: { min: 0, max: 0 }, rating: 0, facilities: {},
                priceInfo: { priceTable: {}, additionalCosts: {} }, tags: [], imageGallery: []
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, facilityId]);

    // === e하늘 동기화 ===
    const handleSync = async () => {
        if (!editingId?.startsWith('esky-')) { alert('e하늘 데이터만 동기화 가능'); return; }
        setSyncing(true);
        try {
            const res = await fetch('/api/crawl', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ facilityId: editingId })
            });
            const json = await res.json();
            if (json.success) {
                setEditForm(prev => ({
                    ...prev,
                    name: json.data.name || prev.name,
                    address: json.data.address || prev.address,
                    phone: json.data.phone || prev.phone,
                    priceInfo: (json.data.priceInfo?.priceTable && Object.keys(json.data.priceInfo.priceTable).length > 0)
                        ? json.data.priceInfo : prev.priceInfo,
                    imageGallery: Array.from(new Set([...(prev.imageGallery || []), ...json.data.imageGallery]))
                }));
                alert('최신 데이터로 업데이트되었습니다!');
            } else { alert('동기화 실패: ' + (json.error || '')); }
        } catch { alert('네트워크 오류'); } finally { setSyncing(false); }
    };

    // === PDF 업로드 ===
    const handlePdfUpload = async (file: File | null) => {
        if (!file) return;
        setPdfLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/analyze-pdf', { method: 'POST', body: formData });
            if (!response.ok) { const err = await response.json(); throw new Error(err.error || '분석 실패'); }
            const parsedData = await response.json();

            const classifyRow = (row: any, _og: string) => {
                const name = row.name || '';
                const price = Number(row.price);
                if (isNaN(price) || price <= 0) return null;
                if (name.includes('반환') || name.includes('환불') || name.includes('계산') || name.includes('규정')) return null;
                if (name === '관리비' || name === '연관리비' || name.replace(/\s/g, '') === '1년관리비') return 'BASIC_COST';
                if (name.includes('사용료') && name.includes('묘지')) return 'BASIC_COST';
                if (name.includes('관리비') || name.includes('벌초') || name.includes('용역') || name.includes('제사')) return 'MANAGEMENT';
                if (name.includes('석물') || name.includes('비석') || name.includes('작업') || name.includes('둘레석') || name.includes('상석') || name.includes('안치료') || name.includes('부대비용')) return 'INSTALLATION';
                return 'PRODUCT';
            };

            const finalPriceTable: any = {};
            finalPriceTable['기본비용'] = { unit: '원', rows: [] };
            finalPriceTable['[별도] 시설설치 및 석물비용'] = { unit: '원', rows: [] };
            finalPriceTable['[안내] 관리비 및 용역비'] = { unit: '원', rows: [] };

            const processGroup = (groupName: string, rows: any[]) => {
                rows.forEach(row => {
                    const type = classifyRow(row, groupName);
                    if (row.name?.includes('관리비') && !row.name.includes('/')) row.name = '관리비/1년단위';
                    if (type === 'BASIC_COST') { finalPriceTable['기본비용'].category = 'base_cost'; finalPriceTable['기본비용'].rows.push(row); }
                    else if (type === 'MANAGEMENT') { finalPriceTable['[안내] 관리비 및 용역비'].rows.push(row); }
                    else if (type === 'INSTALLATION') { finalPriceTable['[별도] 시설설치 및 석물비용'].rows.push(row); }
                    else if (type === 'PRODUCT') {
                        if (!finalPriceTable[groupName]) {
                            let catKey = OTHER_TAB_CATEGORY.key;
                            for (const cat of PRICE_TAB_CATEGORIES) {
                                if (cat.keywords.some((k: string) => groupName.includes(k))) { catKey = cat.key; break; }
                            }
                            finalPriceTable[groupName] = { unit: '원', rows: [], category: catKey };
                        }
                        finalPriceTable[groupName].rows.push(row);
                    }
                });
            };

            if (parsedData.products) Object.entries(parsedData.products).forEach(([g, d]: [string, any]) => processGroup(g, d.rows || []));
            if (finalPriceTable['기본비용']?.rows.length > 0) {
                finalPriceTable['기본비용'].rows.sort((a: any, b: any) => {
                    if ((a.name || '').includes('사용료') && !(b.name || '').includes('사용료')) return -1;
                    if (!(a.name || '').includes('사용료') && (b.name || '').includes('사용료')) return 1;
                    return 0;
                });
            }
            if (parsedData.installationCosts) processGroup('시설설치비 (AI추출)', parsedData.installationCosts.rows || []);
            if (parsedData.managementCosts) processGroup('관리비 (AI추출)', parsedData.managementCosts.rows || []);
            if (parsedData.priceTable) Object.entries(parsedData.priceTable).forEach(([g, d]: [string, any]) => processGroup(g, d.rows || []));

            Object.keys(finalPriceTable).forEach(k => { if (finalPriceTable[k].rows.length === 0) delete finalPriceTable[k]; });
            ['[별도] 시설설치 및 석물비용', '[안내] 관리비 및 용역비'].forEach(k => {
                if (finalPriceTable[k]) {
                    const seen = new Set();
                    finalPriceTable[k].rows = finalPriceTable[k].rows.filter((r: any) => { const key = r.name + r.price; const dup = seen.has(key); seen.add(key); return !dup; });
                }
            });

            setEditForm(prev => ({
                ...prev,
                name: parsedData.facilityName || prev.name,
                phone: parsedData.phone || prev.phone,
                address: parsedData.address || prev.address,
                category: parsedData.category || prev.category,
                description: parsedData.description || prev.description,
                priceInfo: Object.keys(finalPriceTable).length > 0 ? { priceTable: finalPriceTable } : prev.priceInfo
            }));
            alert('AI 분석이 완료되었습니다!');
        } catch (error) {
            alert(`분석 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally { setPdfLoading(false); }
    };

    // === 스크린샷 자르기 ===
    const handleSmartCrop = async (file: File | null) => {
        if (!file) return;
        setCropping(true);
        try {
            const croppedImages = await cropImagesFromScreenshot(file);
            if (croppedImages.length > 0) {
                userModified.current = true;
                setEditForm(prev => ({ ...prev, imageGallery: [...(prev.imageGallery || []), ...croppedImages] }));
                alert(`${croppedImages.length}개의 사진을 잘라냈습니다!`);
            } else { alert('사진을 분리하지 못했습니다.'); }
        } catch (e: any) { alert('오류: ' + e); } finally { setCropping(false); }
    };

    // === 저장 ===
    const handleSave = async () => {
        const compressAndResizeImage = (blob: Blob): Promise<Blob> => new Promise((resolve) => {
            const img = new window.Image();
            const url = URL.createObjectURL(blob);
            img.src = url;
            img.onload = () => {
                URL.revokeObjectURL(url);
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                const MAX = 1920;
                if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(blob); return; }
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(nb => resolve(nb || blob), 'image/jpeg', 0.8);
            };
            img.onerror = () => resolve(blob);
        });

        const uploadImage = async (url: string, idx: number) => {
            try {
                const response = await fetch(url);
                const original = await response.blob();
                const compressed = await compressAndResizeImage(original);
                console.log(`[Upload ${idx + 1}] 원본: ${(original.size / 1024).toFixed(0)}KB → 압축: ${(compressed.size / 1024).toFixed(0)}KB`);
                const fd = new FormData(); fd.append('file', compressed, 'image.jpg');
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                if (!res.ok) {
                    const errText = await res.text();
                    console.error(`[Upload ${idx + 1}] 실패:`, res.status, errText);
                    throw new Error(`업로드 실패 (${res.status}): ${errText}`);
                }
                const result = await res.json();
                console.log(`[Upload ${idx + 1}] 성공:`, result.url);
                return result.url;
            } catch (e) {
                console.error(`[Upload ${idx + 1}] 에러:`, e);
                return null;
            }
        };

        let processedGallery = [...(editForm.imageGallery || [])];
        if (processedGallery.some(img => img.startsWith('blob:') || img.startsWith('data:'))) {
            const total = processedGallery.filter(i => i.startsWith('blob:') || i.startsWith('data:')).length;
            if (!confirm(`${total}장의 새 이미지를 업로드하고 저장하시겠습니까?`)) return;
            try {
                const newGallery: string[] = [];
                let uploadIdx = 0;
                for (const img of processedGallery) {
                    if (img.startsWith('blob:') || img.startsWith('data:')) {
                        const newUrl = await uploadImage(img, uploadIdx);
                        if (!newUrl) throw new Error(`${uploadIdx + 1}번째 이미지 업로드 실패`);
                        newGallery.push(newUrl);
                        uploadIdx++;
                    } else { newGallery.push(img); }
                }
                processedGallery = newGallery;
            } catch (e: any) { alert(`이미지 업로드 중 오류: ${e?.message || e}`); return; }
        }

        // 가격 범위 재계산
        let calculatedPriceRange = editForm.priceRange;
        if (editForm.priceInfo?.priceTable) {
            let min = Infinity, max = -Infinity, hasPrice = false;
            let representativePrice: number | null = null;
            Object.entries(editForm.priceInfo.priceTable).forEach(([gn, gd]: [string, any]) => {
                if (gn.includes('관리비') || gn.includes('유지') || gn.includes('추가') || gn.includes('별도') || gn.includes('안내') || gn.includes('설치') || gn.includes('조경') || gn.includes('용품')) return;
                gd.rows.forEach((row: any) => {
                    const rn = row.name || '';
                    if (rn.includes('관리비') || rn.includes('연회비') || rn.includes('부대비용') || rn.includes('작업비') || rn.includes('석물') || rn.includes('개장') || rn.includes('봉분') || rn.includes('상석') || rn.includes('비석') || rn.includes('걸방석') || rn.includes('와비') || rn.includes('표석') || rn.includes('석화분') || rn.includes('식재') || rn.includes('제거') || rn.includes('전지') || rn.includes('대여') || rn.includes('각자') || rn.includes('판석') || rn.includes('석등') || rn.includes('석곽') || rn.includes('구판') || rn.includes('갓') || rn.includes('추가') || rn.includes('유골함')) return;
                    const p = Number(row.price);
                    if (!isNaN(p) && p > 0) {
                        if (row.isRepresentative && representativePrice === null) representativePrice = p;
                        if (p < min) min = p;
                        if (p > max) max = p;
                        hasPrice = true;
                    }
                });
            });
            if (hasPrice) {
                const eMin = representativePrice !== null ? representativePrice : min;
                calculatedPriceRange = {
                    min: eMin >= 10000 ? Math.round(eMin / 10000) : eMin,
                    max: max >= 10000 ? Math.round(max / 10000) : max
                };
            }
        }

        const finalForm = {
            ...editForm, imageGallery: processedGallery, images: processedGallery,
            priceRange: calculatedPriceRange, lastUpdated: new Date().toISOString()
        };

        // 불필요한 메타 필드 제거 (서버 전송 사이즈 줄이기)
        delete (finalForm as any)._detailedSource;
        delete (finalForm as any)._meta;

        const isNew = !editingId;
        if (!editingId) { (finalForm as any).id = finalForm.id || `new-${Date.now()}`; }

        // 서버 저장
        try {
            const bodyStr = JSON.stringify(finalForm);
            console.log(`[Save] 전송 크기: ${(bodyStr.length / 1024).toFixed(0)}KB`);
            const res = await fetch('/api/facilities', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: bodyStr
            });
            if (!res.ok) {
                const errText = await res.text();
                console.error('[Save] 서버 응답:', res.status, errText);
                throw new Error(errText);
            }
        } catch (e) {
            console.error('[Save] 에러:', e);
            alert('저장 실패: ' + String(e));
            return;
        }

        onSaved(finalForm as Facility, isNew);
        onClose();
    };

    // === 검토완료 마킹 + 다음 시설 이동 ===
    const handleMarkReviewed = async () => {
        // priceVerified를 true로 설정
        setEditForm(prev => ({
            ...prev,
            priceInfo: { ...prev.priceInfo, priceVerified: true }
        }));
        // 저장 로직 간소화 - pricing JSON만 업데이트
        try {
            const currentPriceInfo = { ...editForm.priceInfo, priceVerified: true };
            const saveData = { ...editForm, priceInfo: currentPriceInfo, lastUpdated: new Date().toISOString() };
            const res = await fetch('/api/facilities', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saveData)
            });
            if (!res.ok) throw new Error(await res.text());
            onSaved(saveData as Facility, false);
            // 다음 시설로 이동
            if (onNavigate) onNavigate('next');
        } catch (e) { alert('저장 실패: ' + String(e)); }
    };

    // === Prisma DB 가격표 렌더 (기존 _detailedSource === 'prisma' 경로) ===
    const renderPrismaPrice = () => {
        const defaultCategories: Record<string, string[]> = {
            '매장묘': ['단장형', '합장형', '쌍분형', '복합묘', '평장묘'],
            '봉안': ['봉안당', '봉안담', '봉안묘'],
            '수목장': ['수목형', '잔디형', '화초형', '암석형'],
            '기타': [], '제외됨': []
        };
        const priceTable = editForm.priceInfo?.priceTable || {};
        const existingCats = Object.keys(priceTable).filter(catName => {
            let group = '기타';
            if (catName === '제외됨') group = '제외됨';
            else if (/매장|묘지|석물|작업|봉분|둘레석|단장|합장|쌍분|복합묘|평장/.test(catName)) group = '매장묘';
            else if (/기본비용/.test(catName)) group = '매장묘';
            else if (/봉안|납골|유골/.test(catName)) group = '봉안';
            else if (/수목|자연|잔디|화초|암석/.test(catName)) group = '수목장';
            return group === activeMajorTab;
        });
        const defaults = defaultCategories[activeMajorTab] || [];
        const allCats = [...new Set([...defaults, ...existingCats])];

        const addCategoryType = (type: string) => {
            if (priceTable[type]) { alert(`'${type}' 이미 있습니다.`); return; }
            setEditForm({ ...editForm, priceInfo: { ...editForm.priceInfo, priceTable: { ...priceTable, [type]: { rows: [], unit: '' } } } });
        };

        const getTypesForTab = () => {
            if (activeMajorTab === '봉안') return ['봉안당', '봉안담', '봉안묘'];
            if (activeMajorTab === '수목장') return ['수목형', '잔디형', '화초형', '암석형'];
            if (activeMajorTab === '매장묘') return ['단장형', '합장형', '쌍분형', '복합묘', '평장묘'];
            return [];
        };

        return (
            <Box>
                {(editForm as any)._meta && (
                    <Alert color="cyan" mb="md" icon={<DollarSign size={16} />}>
                        DB에서 로드됨: {(editForm as any)._meta.categoryCount}개 카테고리, {(editForm as any)._meta.itemCount}개 항목
                    </Alert>
                )}
                <SegmentedControl fullWidth value={activeMajorTab} onChange={setActiveMajorTab}
                    data={[
                        { label: '매장묘 (Burial)', value: '매장묘' },
                        { label: '봉안(납골) (Charnel)', value: '봉안' },
                        { label: '수목장(자연장) (Natural)', value: '수목장' },
                        { label: '기타/공통', value: '기타' },
                        { label: '제외됨', value: '제외됨' },
                    ]} mb="md" />

                {getTypesForTab().length > 0 && (
                    <Group gap="xs" mb="md">
                        <Text size="xs" c="dimmed" mr="xs">유형:</Text>
                        {getTypesForTab().map(type => (
                            <Button key={type} size="xs" variant="light" color="gray" radius="xl" onClick={() => addCategoryType(type)}>+ {type}</Button>
                        ))}
                    </Group>
                )}

                <Accordion key={activeMajorTab} variant="separated" multiple defaultValue={allCats}>
                    {allCats.map(catName => {
                        const catData = priceTable[catName] || { rows: [], unit: '' };
                        const itemsByGroup: Record<string, any[]> = {};
                        (catData.rows || []).forEach((row: any) => {
                            const g = row.groupType || '미분류';
                            if (!itemsByGroup[g]) itemsByGroup[g] = [];
                            itemsByGroup[g].push(row);
                        });
                        const groupNames = Object.keys(itemsByGroup);

                        const updateCatRows = (newRows: any[]) => {
                            setEditForm({ ...editForm, priceInfo: { ...editForm.priceInfo, priceTable: { ...priceTable, [catName]: { ...catData, rows: newRows } } } });
                        };

                        return (
                            <Accordion.Item key={catName} value={catName}>
                                <Accordion.Control icon={<List size={16} />}>
                                    <Group justify="space-between">
                                        <Text fw={700}>{catName}</Text>
                                        <Badge color="gray" variant="light">{catData.rows?.length || 0} 항목</Badge>
                                    </Group>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Tabs value={activeGroupTab[catName] || groupNames[0] || '미분류'}
                                        onChange={(val) => setActiveGroupTab(prev => ({ ...prev, [catName]: val || '' }))}>
                                        <Tabs.List mb="md">
                                            {groupNames.map((gn, idx) => (
                                                <Tabs.Tab key={idx} value={gn} rightSection={<Badge size="xs" variant="light">{itemsByGroup[gn].length}</Badge>}>{gn}</Tabs.Tab>
                                            ))}
                                            <Button variant="subtle" size="xs" leftSection={<Plus size={14} />} ml="xs"
                                                onClick={() => {
                                                    const newGroupName = `새 그룹 ${groupNames.length + 1}`;
                                                    updateCatRows([...(catData.rows || []), { name: '', price: 0, groupType: newGroupName }]);
                                                }}>새 그룹</Button>
                                        </Tabs.List>
                                        {groupNames.map((groupName, groupIdx) => {
                                            const rows = itemsByGroup[groupName];
                                            return (
                                                <Tabs.Panel key={groupIdx} value={groupName}>
                                                    <Paper p="md" withBorder>
                                                        <Group justify="space-between" mb="md">
                                                            <Group gap="xs">
                                                                <TextInput value={groupName} size="sm" styles={{ input: { fontWeight: 600 } }} placeholder="그룹명"
                                                                    onChange={(e) => {
                                                                        const newName = e.target.value;
                                                                        const newRows = (catData.rows || []).map((r: any) => ({
                                                                            ...r, groupType: (r.groupType || '미분류') === groupName ? newName : r.groupType
                                                                        }));
                                                                        setActiveGroupTab(prev => ({ ...prev, [catName]: newName }));
                                                                        updateCatRows(newRows);
                                                                    }} />
                                                                <Badge size="sm" variant="light">{rows.length}개</Badge>
                                                            </Group>
                                                            <Group gap="xs">
                                                                <ActionIcon variant="light" size="sm" disabled={groupIdx === 0}
                                                                    onClick={() => { const n = [...groupNames]; const [m] = n.splice(groupIdx, 1); n.splice(groupIdx - 1, 0, m); const nr: any[] = []; n.forEach(g => nr.push(...itemsByGroup[g])); updateCatRows(nr); }}>
                                                                    <TrendingUp size={14} />
                                                                </ActionIcon>
                                                                <ActionIcon variant="light" size="sm" disabled={groupIdx === groupNames.length - 1}
                                                                    onClick={() => { const n = [...groupNames]; const [m] = n.splice(groupIdx, 1); n.splice(groupIdx + 1, 0, m); const nr: any[] = []; n.forEach(g => nr.push(...itemsByGroup[g])); updateCatRows(nr); }}>
                                                                    <TrendingDown size={14} />
                                                                </ActionIcon>
                                                                <ActionIcon color="red" variant="light" size="sm"
                                                                    onClick={() => { if (confirm(`"${groupName}" 삭제?`)) updateCatRows((catData.rows || []).filter((r: any) => (r.groupType || '미분류') !== groupName)); }}>
                                                                    <Trash size={14} />
                                                                </ActionIcon>
                                                            </Group>
                                                        </Group>
                                                        <Stack gap="xs">
                                                            {rows.map((row: any, itemIdx: number) => {
                                                                const fullRows = catData.rows || [];
                                                                const targetIndex = fullRows.indexOf(row);
                                                                const updateRow = (field: string, value: any) => {
                                                                    if (targetIndex === -1) return;
                                                                    const nr = [...fullRows]; nr[targetIndex] = { ...nr[targetIndex], [field]: value };
                                                                    updateCatRows(nr);
                                                                };
                                                                return (
                                                                    <Group key={itemIdx} align="flex-start" gap="xs" wrap="nowrap">
                                                                        <Stack gap={2} mr="xs">
                                                                            <ActionIcon size="sm" variant="subtle" color={row.isRepresentative ? 'yellow' : 'gray'}
                                                                                onClick={() => {
                                                                                    if (targetIndex === -1) return;
                                                                                    let nr = [...fullRows];
                                                                                    if (row.isRepresentative) { nr[targetIndex] = { ...nr[targetIndex], isRepresentative: false }; }
                                                                                    else { nr = nr.map((r, i) => ({ ...r, isRepresentative: i === targetIndex })); }
                                                                                    updateCatRows(nr);
                                                                                }}
                                                                                style={{ marginTop: itemIdx === 0 ? 30 : 6 }}>
                                                                                <Star size={16} fill={row.isRepresentative ? "currentColor" : "none"} />
                                                                            </ActionIcon>
                                                                        </Stack>
                                                                        <Stack gap={2}>
                                                                            <ActionIcon size="xs" variant="subtle" disabled={itemIdx === 0}
                                                                                onClick={() => { const gr = [...rows]; const [m] = gr.splice(itemIdx, 1); gr.splice(itemIdx - 1, 0, m); const nr: any[] = []; groupNames.forEach(g => nr.push(...(g === groupName ? gr : itemsByGroup[g]))); updateCatRows(nr); }}
                                                                                style={{ marginTop: itemIdx === 0 ? 24 : 0 }}>
                                                                                <TrendingUp size={12} />
                                                                            </ActionIcon>
                                                                            <ActionIcon size="xs" variant="subtle" disabled={itemIdx === rows.length - 1}
                                                                                onClick={() => { const gr = [...rows]; const [m] = gr.splice(itemIdx, 1); gr.splice(itemIdx + 1, 0, m); const nr: any[] = []; groupNames.forEach(g => nr.push(...(g === groupName ? gr : itemsByGroup[g]))); updateCatRows(nr); }}>
                                                                                <TrendingDown size={12} />
                                                                            </ActionIcon>
                                                                        </Stack>
                                                                        <TextInput label={itemIdx === 0 ? "상품명" : undefined} placeholder="상품명" value={row.name || ''} onChange={(e) => updateRow('name', e.target.value)} style={{ flex: 2 }} size="sm" />
                                                                        <TextInput label={itemIdx === 0 ? "세부정보" : undefined} placeholder="설명" value={row.grade || ''} onChange={(e) => updateRow('grade', e.target.value)} style={{ flex: 2 }} size="sm" />
                                                                        <NumberInput label={itemIdx === 0 ? "가격" : undefined} value={row.price ?? 0} onChange={(val) => updateRow('price', Number(val) || 0)} thousandSeparator="," suffix="원" style={{ flex: 1.5 }} size="sm" />
                                                                        {row.size !== undefined && (
                                                                            <TextInput label={itemIdx === 0 ? "규격" : undefined} value={row.size || ''} onChange={(e) => updateRow('size', e.target.value)} style={{ flex: 0.8 }} size="sm" />
                                                                        )}
                                                                        <ActionIcon color="red" variant="subtle" size="sm"
                                                                            onClick={() => { const nr: any[] = []; groupNames.forEach(g => nr.push(...(g === groupName ? itemsByGroup[g].filter((_, i) => i !== itemIdx) : itemsByGroup[g]))); updateCatRows(nr); }}
                                                                            style={{ marginTop: itemIdx === 0 ? 28 : 0 }}>
                                                                            <X size={16} />
                                                                        </ActionIcon>
                                                                    </Group>
                                                                );
                                                            })}
                                                            <Button variant="light" size="xs" leftSection={<Plus size={14} />} mt="xs"
                                                                onClick={() => updateCatRows([...(catData.rows || []), { name: '', grade: '', price: 0, groupType: groupName }])}>
                                                                항목 추가
                                                            </Button>
                                                        </Stack>
                                                    </Paper>
                                                </Tabs.Panel>
                                            );
                                        })}
                                    </Tabs>
                                </Accordion.Panel>
                            </Accordion.Item>
                        );
                    })}
                </Accordion>
            </Box>
        );
    };

    if (!opened) return null;

    return (
        <Modal opened={opened} onClose={onClose} title={
            <Group gap="xs">
                <Text fw={600}>{editingId ? '시설 정보 수정' : '새 시설 등록'}</Text>
                {currentIndex != null && totalCount != null && (
                    <Badge color="blue" variant="light" size="sm">{currentIndex + 1} / {totalCount}</Badge>
                )}
                {editForm.priceInfo?.priceVerified && (
                    <Badge color="green" variant="filled" size="sm">✅ 검토완료</Badge>
                )}
            </Group>
        } size="lg" scrollAreaComponent={ScrollArea.Autosize}>
            <Group justify="flex-end" mb="md">
                <Button variant="subtle" color="green" leftSection={<CloudDownload size={16} />} onClick={handleSync} loading={syncing} disabled={!editingId?.startsWith('esky-')} size="xs">
                    e하늘 실시간 동기화
                </Button>
            </Group>

            <Paper withBorder p="md" radius="md" mb="xl" bg="blue.0" style={{ borderStyle: 'dashed', borderColor: '#339af0' }}>
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Group>
                            <ThemeIcon size="lg" color="red" variant="light" radius="md"><FileText size={20} /></ThemeIcon>
                            <div>
                                <Text fw={700} size="sm">PDF 파일을 업로드하면 AI가 내용을 분석합니다.</Text>
                                <Text size="xs" c="dimmed">가격표, 시설 소개 등이 포함된 PDF를 올려주세요.</Text>
                            </div>
                        </Group>
                        <FileButton onChange={handlePdfUpload} accept="application/pdf">
                            {(props) => <Button {...props} variant="white" color="blue" leftSection={<Wand2 size={16} />} loading={pdfLoading}>자동 파싱 {useOcr ? '(OCR)' : ''}</Button>}
                        </FileButton>
                    </Group>
                </Stack>
            </Paper>

            <Tabs defaultValue="basic">
                <Tabs.List>
                    <Tabs.Tab value="basic" leftSection={<Building2 size={16} />}>기본 정보</Tabs.Tab>
                    <Tabs.Tab value="price" leftSection={<DollarSign size={16} />}>가격표 관리</Tabs.Tab>
                    <Tabs.Tab value="images" leftSection={<ImageIcon size={16} />}>이미지 관리</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="basic" pt="md">
                    <Stack>
                        <Paper withBorder p="sm" radius="md" bg={editForm.isActive === false ? 'red.0' : 'green.0'}>
                            <Group justify="space-between">
                                <div><Text fw={600} size="sm">마커 표시</Text><Text size="xs" c="dimmed">지도에 이 시설의 마커를 표시합니다.</Text></div>
                                <Switch size="lg" checked={editForm.isActive !== false} onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))} onLabel="ON" offLabel="OFF" color={editForm.isActive === false ? 'red' : 'green'} />
                            </Group>
                        </Paper>
                        <TextInput label="시설명 (원본 - 고정값)" value={editForm.originalName || ''} readOnly variant="filled" description="아카이브 폴더와 매칭되는 이름입니다." />
                        <TextInput label="시설명 (표시용)" description="실제 앱 화면에 표시될 이름입니다." value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
                        <Box><Text size="sm" fw={500} mb={3}>운영 법인 형태</Text>
                            <SegmentedControl fullWidth size="xs" value={editForm.operatorType || 'OTHER'} onChange={(val) => setEditForm(prev => ({ ...prev, operatorType: val }))}
                                data={[{ label: '재단법인', value: 'FOUNDATION' }, { label: '사단법인', value: 'ASSOCIATION' }, { label: '종교법인', value: 'RELIGIOUS' }, { label: '주식회사', value: 'CORPORATION' }, { label: '기타/공설', value: 'OTHER' }]} />
                        </Box>
                        <Box><Text size="sm" fw={500} mb={3}>운영 형태</Text>
                            <SegmentedControl fullWidth size="xs" value={editForm.isPublic ? 'public' : 'private'} onChange={(val) => setEditForm(prev => ({ ...prev, isPublic: val === 'public' }))}
                                data={[{ label: '🏢 사설', value: 'private' }, { label: '🏛️ 공설', value: 'public' }]} color={editForm.isPublic ? 'blue' : 'green'} />
                        </Box>
                        <Select label="주 카테고리" data={Object.entries(FACILITY_CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))} value={editForm.category} onChange={(val) => setEditForm(prev => ({ ...prev, category: val as any }))} />
                        <MultiSelect
                            label="추가 카테고리 (복수 서비스 제공 시)"
                            description="이 시설이 봉안당+수목장 등 여러 서비스를 함께 제공하면 선택하세요."
                            data={Object.entries(FACILITY_CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                            value={editForm.categories || (editForm.category ? [editForm.category] : [])}
                            onChange={(val) => setEditForm(prev => ({ ...prev, categories: val as FacilityCategory[] }))}
                        />
                        <Box>
                            <Text size="sm" fw={500} mb={3}>제공 서비스</Text>
                            <Text size="xs" c="dimmed" mb="xs">이 시설에서 제공하는 장법을 선택하세요. 가격표 편집에 반영됩니다.</Text>
                            <Chip.Group multiple value={editForm.services || []} onChange={(val) => setEditForm(prev => ({ ...prev, services: val as ServiceType[] }))}>
                                <Group gap="xs">
                                    {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
                                        <Chip key={k} value={k} variant="outline" size="sm">{v}</Chip>
                                    ))}
                                </Group>
                            </Chip.Group>
                        </Box>
                        <NumberInput label="총매장능력 (단위: 기)" value={editForm.capacity} onChange={(val) => setEditForm(prev => ({ ...prev, capacity: typeof val === 'number' ? val : undefined }))} thousandSeparator="," min={0} />
                        <Group align="flex-end" grow>
                            <TextInput label="주소" value={editForm.address} onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))} style={{ flex: 1 }} />
                            <Button variant="light" onClick={async () => {
                                if (!editForm.address) { alert('주소를 먼저 입력해주세요.'); return; }
                                try {
                                    const r = await fetch(`/api/geocode?address=${encodeURIComponent(editForm.address)}`);
                                    const d = await r.json();
                                    if (d.addresses?.length > 0) {
                                        const { x, y } = d.addresses[0];
                                        setEditForm(prev => ({ ...prev, location: { lat: parseFloat(y), lng: parseFloat(x) } }));
                                        alert(`좌표: 위도 ${y}, 경도 ${x}`);
                                    } else { alert('주소를 찾을 수 없습니다.'); }
                                } catch { alert('좌표 변환 오류'); }
                            }}>📍 좌표 찾기</Button>
                        </Group>
                        <Group grow>
                            <TextInput label="전화번호" value={editForm.phone || ''} placeholder="예: 055-123-4567" onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} />
                            <TextInput label="총매장능력" value={editForm.capacity || ''} placeholder="예: 10,000기" onChange={(e) => setEditForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))} />
                            <TextInput label="데이터 업데이트" value={editForm.lastUpdated || ''} placeholder="YYYY-MM-DD" onChange={(e) => setEditForm(prev => ({ ...prev, lastUpdated: e.target.value }))} />
                        </Group>
                        <TextInput label="홈페이지 URL" placeholder="https://example.com" value={editForm.websiteUrl || ''} onChange={(e) => setEditForm(prev => ({ ...prev, websiteUrl: e.target.value }))} />
                        <TextInput label="설명" value={editForm.description || ''} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} />
                        <Paper withBorder p="md" mt="md" radius="md">
                            <Text size="sm" fw={700} mb="sm">편의시설 정보 (On/Off)</Text>
                            <SimpleGrid cols={2}>
                                <Switch label="주차장" size="md" checked={!!editForm.hasParking} onChange={(e) => setEditForm(prev => ({ ...prev, hasParking: e.target.checked }))} onLabel="보유" offLabel="미보유" />
                                <Switch label="식당" size="md" checked={!!editForm.hasRestaurant} onChange={(e) => setEditForm(prev => ({ ...prev, hasRestaurant: e.target.checked }))} onLabel="보유" offLabel="미보유" />
                                <Switch label="매점" size="md" checked={!!editForm.hasStore} onChange={(e) => setEditForm(prev => ({ ...prev, hasStore: e.target.checked }))} onLabel="보유" offLabel="미보유" />
                                <Switch label="편의시설/장애인편의" size="md" checked={!!editForm.hasAccessibility} onChange={(e) => setEditForm(prev => ({ ...prev, hasAccessibility: e.target.checked }))} onLabel="보유" offLabel="미보유" />
                            </SimpleGrid>
                        </Paper>
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="price" pt="md">
                    <StandardPriceEditor
                        priceInfo={editForm.priceInfo || { priceTable: {} }}
                        onChange={(newPriceInfo) => setEditForm(prev => ({ ...prev, priceInfo: newPriceInfo }))}
                    />

                    <Accordion variant="separated" mt="xl">
                        <Accordion.Item value="legacy">
                            <Accordion.Control icon={<List size={16} />}>
                                <Group gap="xs">
                                    <Text size="sm" fw={600}>📋 기존 가격 데이터 (참고/편집)</Text>
                                    <Badge size="xs" color="gray" variant="light">레거시</Badge>
                                </Group>
                            </Accordion.Control>
                            <Accordion.Panel>
                                {renderPrismaPrice()}
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                    <Alert title="알림" color="blue" mt="md">표준화 편집기에서 가격을 세팅하세요. 기존 데이터는 참고용으로 아래에 접혀 있습니다.</Alert>
                </Tabs.Panel>

                <Tabs.Panel value="images" pt="md">
                    <Text size="sm" mb="md">등록된 이미지 ({editForm.imageGallery?.length || 0})</Text>
                    <SimpleGrid cols={3}>
                        {editForm.imageGallery?.map((img, idx) => (
                            <Card key={idx} padding="0" radius="sm" withBorder>
                                <Box pos="relative" h={100}>
                                    <Image src={getSingleFacilityImageUrl(img)} h={100} w="100%" fit="cover" fallbackSrc="https://placehold.co/400x300?text=No+Image" />
                                    <ActionIcon pos="absolute" top={4} right={4} color="red" variant="filled" size="xs"
                                        onClick={() => { userModified.current = true; setEditForm(prev => ({ ...prev, imageGallery: prev.imageGallery!.filter((_, i) => i !== idx) })); }}>
                                        <X size={12} />
                                    </ActionIcon>
                                </Box>
                            </Card>
                        ))}
                    </SimpleGrid>
                    <Group mt="xl" grow>
                        <FileButton onChange={(files) => { if (files) { userModified.current = true; const urls = files.map(f => URL.createObjectURL(f)); setEditForm(prev => ({ ...prev, imageGallery: [...(prev.imageGallery || []), ...urls] })); } }} accept="image/png,image/jpeg" multiple>
                            {(props) => <Button {...props} variant="outline" h={50} color="gray" leftSection={<ImageIcon size={20} />}>이미지 추가 (여러장 가능)</Button>}
                        </FileButton>
                        <FileButton onChange={handleSmartCrop} accept="image/png,image/jpeg">
                            {(props) => <Button {...props} variant="filled" h={50} color="grape" leftSection={<Scissors size={20} />} loading={cropping}>갤러리 스크린샷 자동 자르기</Button>}
                        </FileButton>
                    </Group>
                    <Text size="xs" c="dimmed" mt="xs" ta="center">* &apos;자동 자르기&apos;는 여러 사진이 모여있는 스크린샷(흰 배경)을 올리면 자동으로 분리해줍니다.</Text>
                </Tabs.Panel>
            </Tabs>

            {/* 네비게이션 바 */}
            {onNavigate && currentIndex != null && totalCount != null && (
                <Paper withBorder p="sm" radius="md" mt="lg" bg="gray.0">
                    <Group justify="space-between">
                        <Button
                            variant="subtle" size="sm"
                            leftSection={<ChevronLeft size={16} />}
                            disabled={currentIndex <= 0}
                            onClick={() => onNavigate('prev')}
                        >
                            이전 시설
                        </Button>
                        <Group gap="xs">
                            <Text size="sm" fw={600} c="dimmed">
                                {currentIndex + 1} / {totalCount}
                            </Text>
                            <Progress value={(currentIndex + 1) / totalCount * 100} size="sm" w={100} radius="xl" />
                        </Group>
                        <Button
                            variant="subtle" size="sm"
                            rightSection={<ChevronRight size={16} />}
                            disabled={currentIndex >= totalCount - 1}
                            onClick={() => onNavigate('next')}
                        >
                            다음 시설
                        </Button>
                    </Group>
                </Paper>
            )}

            <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={onClose}>취소</Button>
                {onNavigate && (
                    <Button
                        color="green"
                        leftSection={<CheckCircle2 size={16} />}
                        onClick={handleMarkReviewed}
                    >
                        검토완료 ✅ → 다음
                    </Button>
                )}
                <Button onClick={handleSave} leftSection={<Save size={16} />}>저장</Button>
            </Group>
        </Modal>
    );
}

export default memo(FacilityEditModal);
