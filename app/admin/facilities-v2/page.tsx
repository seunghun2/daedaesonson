'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Title, Text, Group, Button, Paper, TextInput, ActionIcon,
    Table, Badge, Modal, NumberInput, Select, ScrollArea,
    Stack, Tabs, SimpleGrid, Card, Image, FileButton,
    Pagination, Box, Alert, ThemeIcon, Switch, SegmentedControl
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    Search, Plus, Pencil, Trash, Save, X, Image as ImageIcon,
    DollarSign, Building2, CloudDownload, FileText, Wand2, Scissors,
    MessageSquare, TrendingUp, TrendingDown
} from 'lucide-react';
import { Facility, FACILITY_CATEGORY_LABELS } from '@/types';
import { cropImagesFromScreenshot } from '@/lib/imageCropper';
import { PRICE_TAB_CATEGORIES, OTHER_TAB_CATEGORY } from '@/lib/constants';
import { getSingleFacilityImageUrl } from '@/lib/supabaseImage';

// ... (existing imports)



// Sub-component for Group Editing to prevent focus loss
const GroupEditor = ({ groupName, groupData, onRename, onUpdateRows, onDeleteGroup }: {
    groupName: string;
    groupData: any;
    onRename: (oldName: string, newName: string) => void;
    onUpdateRows: (groupName: string, newRows: any[]) => void;
    onDeleteGroup: (groupName: string) => void;
}) => {
    const [localName, setLocalName] = useState(groupName);

    // Sync local name if prop changes (e.g. from parent re-render due to other changes)
    // But don't override if user is typing (focus) - simplified by checking equality
    useEffect(() => {
        if (groupName !== localName) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLocalName(groupName);
        }
    }, [groupName]);

    return (
        <Paper withBorder p="sm" radius="md" mb="sm">
            <Group justify="space-between" mb="xs">
                <Group>
                    <TextInput
                        size="xs"
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        onBlur={() => {
                            if (localName !== groupName) {
                                onRename(groupName, localName);
                            }
                        }}
                        fw={700}
                        w={300}
                    />
                    <Badge variant="outline">{groupData.unit}</Badge>
                </Group>
                <ActionIcon color="red" variant="subtle" onClick={() => onDeleteGroup(groupName)}>
                    <Trash size={16} />
                </ActionIcon>
            </Group>
            <Stack gap="xs">
                {groupData.rows.map((row: any, idx: number) => (
                    <Group key={idx} grow align="flex-end">
                        <TextInput
                            label="상품명"
                            size="xs"
                            value={row.name}
                            onChange={(e) => {
                                const newRows = [...groupData.rows];
                                newRows[idx].name = e.target.value;
                                onUpdateRows(groupName, newRows);
                            }}
                        />
                        <TextInput
                            label="설명"
                            size="xs"
                            value={row.grade || ''}
                            placeholder="예: 1평형/1년"
                            onChange={(e) => {
                                const newRows = [...groupData.rows];
                                newRows[idx].grade = e.target.value;
                                onUpdateRows(groupName, newRows);
                            }}
                        />
                        <NumberInput
                            label="가격"
                            size="xs"
                            value={row.price}
                            onChange={(val) => {
                                const newRows = [...groupData.rows];
                                newRows[idx].price = Number(val);
                                onUpdateRows(groupName, newRows);
                            }}
                        />
                        <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => {
                                const newRows = groupData.rows.filter((_: any, i: number) => i !== idx);
                                onUpdateRows(groupName, newRows);
                            }}
                        >
                            <Trash size={16} />
                        </ActionIcon>
                    </Group>
                ))}
                <Button
                    size="xs"
                    variant="light"
                    leftSection={<Plus size={14} />}
                    onClick={() => {
                        const newRows = [...groupData.rows, { name: '새 상품', price: 0 }];
                        onUpdateRows(groupName, newRows);
                    }}
                >
                    상품 추가
                </Button>
            </Stack>
        </Paper>
    );
};

export default function AdminPage() {
    // State
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [activePage, setActivePage] = useState(1);

    // Modal State
    const [opened, { open, close }] = useDisclosure(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Facility>>({});

    // UI Process States
    const [syncing, setSyncing] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [cropping, setCropping] = useState(false);
    const [useOcr] = useState(false); // Force OCR Checkbox -- MOVED HERE

    const ITEMS_PER_PAGE = 10;

    // Load Data from API (V2)
    useEffect(() => {
        fetch('/api/facilities-v2', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setFacilities(data);
                }
                setIsLoadingData(false);
            })
            .catch(e => {
                console.error('Data load failed:', e);
                alert('데이터를 불러오지 못했습니다. (V2)');
                setIsLoadingData(false);
            });
    }, []);

    // Save to Server Helper
    const saveToServer = async (newFacilities: Facility[]) => {
        try {
            // Use V2 API (Syncs to DB directly)
            const res = await fetch('/api/facilities-v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFacilities)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Server save failed');
            }

            // Reload to reflect changes (optional, but good for sync verify)
            const refreshRes = await fetch('/api/facilities-v2', { cache: 'no-store' });
            const refreshData = await refreshRes.json();
            if (Array.isArray(refreshData)) {
                setFacilities(refreshData);
            }

            alert('저장되었습니다. (V2)');
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            alert('서버 저장 실패: ' + String(e));
            return false;
        }
    };
    // Filter Logic
    const filteredData = useMemo(() => {
        return facilities.filter(item => {
            const matchSearch = item.name.includes(searchQuery) || item.address.includes(searchQuery);
            const matchCategory = categoryFilter ? item.category === categoryFilter : true;
            return matchSearch && matchCategory;
        });
    }, [facilities, searchQuery, categoryFilter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (activePage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, activePage]);

    // Handlers
    const handleEdit = async (facility: Facility) => {
        setEditingId(facility.id);
        const parsedFacility = JSON.parse(JSON.stringify(facility)); // Deep copy

        // If facility has an ID, try to fetch detailed prices from DB
        if (parsedFacility.id) {
            try {
                // Fetch detailed prices from new API
                const response = await fetch(`/api/facilities/${parsedFacility.id}/prices`);
                if (response.ok) {
                    const detailedData = await response.json();

                    // Merge detailed price data
                    const mergedFacility = {
                        ...parsedFacility,
                        priceInfo: {
                            priceTable: detailedData.priceTable
                        },
                        _detailedSource: 'prisma', // Mark as from DB
                        _meta: detailedData._meta
                    };

                    setEditForm(JSON.parse(JSON.stringify(mergedFacility)));
                    console.log('✅ Loaded detailed prices from DB:', detailedData._meta);
                } else {
                    // Fallback to JSON data
                    setEditForm(JSON.parse(JSON.stringify(parsedFacility)));
                }
            } catch (error) {
                console.error('Failed to fetch detailed prices:', error);
                // Check if facility has detailed prices in DB
                if ((parsedFacility as any)._hasDetailedPrices) {
                    try {
                        // Fetch detailed prices from new API
                        const response = await fetch(`/api/facilities/${parsedFacility.id}/prices`);
                        if (response.ok) {
                            const priceData = await response.json();
                            parsedFacility.priceInfo = priceData;
                        }
                    } catch (e) {
                        console.error('Failed to load detailed prices:', e);
                    }
                }
                setEditForm(parsedFacility);
            }
        } else {
            // Use JSON data as-is
            setEditForm(JSON.parse(JSON.stringify(parsedFacility)));
        }
        open();
    };

    const handleCreate = () => {
        setEditingId(null);
        setEditForm({
            id: `new-${Date.now()}`,
            name: '',
            category: 'OTHER',
            address: '',
            phone: '',
            description: '',
            operator: { name: '', contact: '' },
            coordinates: { lat: 37.5665, lng: 126.9780 },
            priceRange: { min: 0, max: 0 },
            images: [] as any, // Cast to any to avoid type mismatch if legacy definition exists
            rating: 0,
            tags: [],
            imageGallery: []
        });
        open();
    };

    const handleSave = async () => {
        // Image Upload Helper
        const uploadImage = async (url: string) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const formData = new FormData();
                // Determine extension
                let ext = 'jpg';
                if (blob.type === 'image/png') ext = 'png';
                else if (blob.type === 'image/webp') ext = 'webp';

                formData.append('file', blob, `image.${ext}`);

                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!res.ok) {
                    const errDetail = await res.text();
                    console.error('Upload failed with status:', res.status, errDetail);
                    throw new Error(`Upload failed: ${res.status} ${errDetail}`);
                }
                const data = await res.json();
                return data.url;
            } catch (e) {
                console.error('Upload Error:', e);
                return null;
            }
        };

        // 0. Pre-process Images (Upload blobs)
        let processedGallery = [...(editForm.imageGallery || [])];
        if (processedGallery.some(img => img.startsWith('blob:') || img.startsWith('data:'))) {
            try {
                processedGallery = await Promise.all(processedGallery.map(async (img) => {
                    if (img.startsWith('blob:') || img.startsWith('data:')) {
                        const newUrl = await uploadImage(img);
                        return newUrl || img; // Fallback if fail
                    }
                    return img;
                }));
            } catch (e) {
                console.error('Image processing failed', e);
                alert('이미지 업로드 중 오류가 발생했습니다.');
                return;
            }
        }

        // 가격 범위(Min/Max) 자동 재계산
        let calculatedPriceRange = editForm.priceRange;
        if (editForm.priceInfo?.priceTable) {
            let min = Infinity;
            let max = -Infinity;
            let hasPrice = false;

            Object.entries(editForm.priceInfo.priceTable).forEach(([groupName, groupData]: [string, any]) => {

                // 관리비, 유지비, 별도 시설비 등은 예상 가격(분양가) 범위 산정에서 제외
                if (groupName.includes('관리비') || groupName.includes('유지') || groupName.includes('추가') || groupName.includes('별도') || groupName.includes('안내') || groupName.includes('설치') || groupName.includes('조경') || groupName.includes('용품')) {
                    return;
                }
                groupData.rows.forEach((row: any) => {
                    const rowName = row.name || '';
                    if (rowName.includes('관리비') || rowName.includes('연회비') || rowName.includes('부대비용') ||
                        rowName.includes('작업비') || rowName.includes('석물') || rowName.includes('개장') || rowName.includes('봉분') ||
                        rowName.includes('상석') || rowName.includes('비석') || rowName.includes('걸방석') || rowName.includes('와비') ||
                        rowName.includes('표석') || rowName.includes('석화분') || rowName.includes('식재') || rowName.includes('제거') ||
                        rowName.includes('전지') || rowName.includes('대여') || rowName.includes('각자') || rowName.includes('판석') ||
                        rowName.includes('석등') || rowName.includes('석곽') || rowName.includes('구판') || rowName.includes('갓') ||
                        rowName.includes('추가') || rowName.includes('유골함')) {
                        return;
                    }

                    const price = Number(row.price);
                    if (!isNaN(price) && price > 0) {
                        if (price < min) min = price;
                        if (price > max) max = price;
                        hasPrice = true;
                    }
                });
            });

            if (hasPrice) {
                // AI결과(원) -> 저장(만원)
                const finalMin = min >= 10000 ? Math.round(min / 10000) : min;
                const finalMax = max >= 10000 ? Math.round(max / 10000) : max;

                calculatedPriceRange = { min: finalMin, max: finalMax };
            }
        }

        const finalForm = { ...editForm, imageGallery: processedGallery, priceRange: calculatedPriceRange };

        let newFacilities;
        if (editingId) {
            newFacilities = facilities.map(f => f.id === editingId ? { ...f, ...finalForm } as Facility : f);
        } else {
            // New ID if empty
            const newId = finalForm.id || `new-${Date.now()}`;
            newFacilities = [{ ...finalForm, id: newId } as Facility, ...facilities];
        }
        setFacilities(newFacilities);
        await saveToServer(newFacilities); // Persist
        close();
    };

    const handleDelete = (id: string) => {
        if (confirm('정말 삭제하시겠습니까?')) {
            const newFacilities = facilities.filter(f => f.id !== id);
            setFacilities(newFacilities);
            saveToServer(newFacilities);
        }
    };

    const handleDeleteReview = (facilityId: string, reviewId: string) => {
        if (!confirm('해당 리뷰를 정말 삭제하시겠습니까?')) return;
        const newFacilities = facilities.map(f => {
            if (f.id === facilityId) {
                return {
                    ...f,
                    reviews: f.reviews?.filter(r => r.id !== reviewId)
                };
            }
            return f;
        });
        setFacilities(newFacilities);
        saveToServer(newFacilities);
    };


    const allReviews = useMemo(() => {
        return facilities.flatMap(f => (f.reviews || []).map(r => ({ ...r, facilityName: f.name, facilityId: f.id })))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [facilities]);

    // e-Haneul Sync Handler
    const handleSync = async () => {
        if (!editingId?.startsWith('esky-')) {
            alert('e하늘 데이터(esky-ID)만 동기화할 수 있습니다.');
            return;
        }
        setSyncing(true);
        try {
            const res = await fetch('/api/crawl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ facilityId: editingId })
            });
            const json = await res.json();

            if (json.success) {
                setEditForm(prev => ({
                    ...prev,
                    name: json.data.name || prev.name,
                    address: json.data.address || prev.address,
                    phone: json.data.phone || prev.phone,
                    priceInfo: (json.data.priceInfo && json.data.priceInfo.priceTable && Object.keys(json.data.priceInfo.priceTable).length > 0)
                        ? json.data.priceInfo
                        : prev.priceInfo,
                    imageGallery: Array.from(new Set([...(prev.imageGallery || []), ...json.data.imageGallery]))
                }));
                alert('최신 데이터로 업데이트되었습니다!');
            } else {
                alert('동기화 실패: ' + (json.error || '알 수 없는 오류'));
            }
        } catch (e) {
            console.error(e);
            alert('네트워크 오류가 발생했습니다.');
        } finally {
            setSyncing(false);
        }
    };

    // PDF 업로드 핸들러 (Gemini API 사용)
    const handlePdfUpload = async (file: File | null) => {
        if (!file) return;
        setPdfLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/analyze-pdf', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || '분석 실패');
            }

            const parsedData = await response.json();

            // 2차 필터링 & 재분류 함수 (하이브리드 로직)
            const classifyRow = (row: any, _originalGroup: string) => {
                const name = row.name || '';
                const price = Number(row.price);
                if (isNaN(price) || price <= 0) return null; // 0원 제거
                if (name.includes('반환') || name.includes('환불') || name.includes('계산') || name.includes('규정')) return null; // 노이즈 제거

                // 강제 재분류
                // 기본비용으로 분류할 항목들 (사용자가 요청한 묘지 사용료, 관리비 등)
                // '관리비'가 기본 관리비인 경우 기본비용 그룹으로 통합 (User Request: "사용료와 관리비는 세트")
                if (name === '관리비' || name === '연관리비' || name.replace(/\s/g, '') === '1년관리비') {
                    return 'BASIC_COST';
                }

                if ((name.includes('사용료') && name.includes('묘지'))) {
                    return 'BASIC_COST';
                }

                if (name.includes('관리비') || name.includes('벌초') || name.includes('용역') || name.includes('제사')) {
                    return 'MANAGEMENT';
                }
                if (name.includes('석물') || name.includes('비석') || name.includes('작업') || name.includes('둘레석') || name.includes('상석') || name.includes('안치료') || name.includes('부대비용')) {
                    return 'INSTALLATION';
                }
                return 'PRODUCT';
            };

            const finalPriceTable: any = {};
            // 초기 그룹 생성 (관리비/시설비/기본비용)
            finalPriceTable['기본비용'] = { unit: '원', rows: [] };
            finalPriceTable['[별도] 시설설치 및 석물비용'] = { unit: '원', rows: [] };
            finalPriceTable['[안내] 관리비 및 용역비'] = { unit: '원', rows: [] };

            // 데이터 순회 및 재분배
            const processGroup = (groupName: string, rows: any[]) => {
                rows.forEach(row => {
                    const type = classifyRow(row, groupName);
                    // 이름 포맷팅 (사용자 요청: 관리비/1년단위 등)
                    if (row.name.includes('관리비')) {
                        if (!row.name.includes('/')) {
                            row.name = '관리비/1년단위'; // Default format if just '관리비'
                        }
                    } else if (type === 'BASIC_COST' && row.name.includes('사용료')) {
                        // Keep or standardize? User image showed '시설사용료'. Let's keep parsed name but ensure it's clean.
                    }

                    if (type === 'BASIC_COST') {
                        finalPriceTable['기본비용'].category = 'base_cost'; // Pin to Base Cost
                        finalPriceTable['기본비용'].rows.push(row);
                    } else if (type === 'MANAGEMENT') {
                        finalPriceTable['[안내] 관리비 및 용역비'].rows.push(row);
                    } else if (type === 'INSTALLATION') {
                        finalPriceTable['[별도] 시설설치 및 석물비용'].rows.push(row);
                    } else if (type === 'PRODUCT') {
                        if (!finalPriceTable[groupName]) {
                            // Find matching tab key for pinning
                            let catKey = OTHER_TAB_CATEGORY.key;
                            for (const cat of PRICE_TAB_CATEGORIES) {
                                if (cat.keywords.some(k => groupName.includes(k))) {
                                    catKey = cat.key;
                                    break;
                                }
                            }
                            finalPriceTable[groupName] = { unit: '원', rows: [], category: catKey };
                        }
                        finalPriceTable[groupName].rows.push(row);
                    }
                });
            };

            // ... (Processing calls) ...

            // 1. AI가 분류한 Products 처리
            if (parsedData.products) {
                Object.entries(parsedData.products).forEach(([groupName, groupData]: [string, any]) => {
                    processGroup(groupName, groupData.rows || []);
                });
            }
            // ... (Processing calls continued in original file, relying on minimal diff) ...

            // *** Final Sorting for Basic Cost ***
            if (finalPriceTable['기본비용'] && finalPriceTable['기본비용'].rows.length > 0) {
                finalPriceTable['기본비용'].rows.sort((a: any, b: any) => {
                    const nameA = a.name || '';
                    const nameB = b.name || '';
                    // 사용료가 먼저 오게 (Usage Fee first)
                    if (nameA.includes('사용료') && !nameB.includes('사용료')) return -1;
                    if (!nameA.includes('사용료') && nameB.includes('사용료')) return 1;
                    return 0; // maintain relative order otherwise
                });
            }

            // 2. AI가 분류한 Installation 처리
            if (parsedData.installationCosts) {
                processGroup('시설설치비 (AI추출)', parsedData.installationCosts.rows || []);
            }

            // 3. AI가 분류한 Management 처리
            if (parsedData.managementCosts) {
                processGroup('관리비 (AI추출)', parsedData.managementCosts.rows || []);
            }

            // 기존 하위 호환
            if (parsedData.priceTable) {
                Object.entries(parsedData.priceTable).forEach(([groupName, groupData]: [string, any]) => {
                    processGroup(groupName, groupData.rows || []);
                });
            }

            // 빈 그룹 정리
            Object.keys(finalPriceTable).forEach(k => {
                if (finalPriceTable[k].rows.length === 0) delete finalPriceTable[k];
            });

            // 관리비/시설비 중복 제거 (단순 이름 매칭)
            ['[별도] 시설설치 및 석물비용', '[안내] 관리비 및 용역비'].forEach(k => {
                if (finalPriceTable[k]) {
                    const seen = new Set();
                    finalPriceTable[k].rows = finalPriceTable[k].rows.filter((r: any) => {
                        const key = r.name + r.price;
                        const duplicate = seen.has(key);
                        seen.add(key);
                        return !duplicate;
                    });
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
            console.error(error);
            alert(`분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setPdfLoading(false);
        }
    };

    // Smart Crop Handler
    const handleSmartCrop = async (file: File | null) => {
        if (!file) return;
        setCropping(true);
        try {
            const croppedImages = await cropImagesFromScreenshot(file);
            console.log('Cropped count:', croppedImages.length);
            if (croppedImages.length > 0) {
                setEditForm(prev => ({
                    ...prev,
                    imageGallery: [...(prev.imageGallery || []), ...croppedImages]
                }));
                alert(`성공적으로 ${croppedImages.length}개의 사진을 잘라냈습니다!`);
            } else {
                alert('사진을 분리하지 못했습니다. 배경이 흰색인지 확인해주세요.');
            }
        } catch (e: any) {
            console.error(e);
            alert('이미지 처리 중 오류가 발생했습니다: ' + e);
        } finally {
            setCropping(false);
        }
    };

    // --- Sub-components (Editor) ---

    const renderPriceEditor = () => {
        // priceTable이 없으면 빈 객체로 초기화
        const priceTable = editForm.priceInfo?.priceTable || {};
        const mainGroups: any[] = [];
        const installationGroups: any[] = [];
        const managementGroups: any[] = [];

        // 데이터 분류
        Object.entries(priceTable).forEach(([groupName, groupData]: [string, any]) => {
            if (groupName.includes('[별도]') || groupName.includes('시설') || groupName.includes('석물')) {
                installationGroups.push({ groupName, groupData });
            } else if (groupName.includes('[안내]') || groupName.includes('관리비') || groupName.includes('용역')) {
                managementGroups.push({ groupName, groupData });
            } else {
                mainGroups.push({ groupName, groupData });
            }
        });

        // 탭 카테고리 로직 (상수 기반 + Sticky Category)
        const tabCategories: Record<string, any[]> = {};
        const usedItems = new Set<any>();

        // 1. 고정 카테고리
        PRICE_TAB_CATEGORIES.forEach(cat => {
            const filtered = mainGroups.filter(g => {
                // 1. Explicit Category Match (Sticky)
                if (g.groupData.category === cat.key) {
                    usedItems.add(g);
                    return true;
                }

                // 2. Fallback: Keyword Match (if no category set and not used yet)
                if (!g.groupData.category && !usedItems.has(g)) {
                    const matches = cat.keywords.some(k => g.groupName.includes(k));
                    if (matches) {
                        usedItems.add(g);
                        return true;
                    }
                }
                return false;
            });
            tabCategories[cat.key] = filtered;
        });

        // 2. 기타 (나머지 전부)
        // Explicitly 'other' or simply not caught by above
        const others = mainGroups.filter(g => {
            if (g.groupData.category === OTHER_TAB_CATEGORY.key) return true;
            return !usedItems.has(g);
        });

        if (others.length > 0) {
            tabCategories[OTHER_TAB_CATEGORY.key] = others;
        }

        // 활성 탭 (데이터가 없어도 고정 카테고리는 무조건 노출)
        const finalTabs: [string, any[]][] = [];
        PRICE_TAB_CATEGORIES.forEach(cat => {
            finalTabs.push([cat.label, tabCategories[cat.key] || []]);
        });

        if (tabCategories[OTHER_TAB_CATEGORY.key] && tabCategories[OTHER_TAB_CATEGORY.key].length > 0) {
            finalTabs.push([OTHER_TAB_CATEGORY.label, tabCategories[OTHER_TAB_CATEGORY.key]]);
        }

        // Helper to update table
        const updateTable = (newTable: any) => {
            setEditForm({ ...editForm, priceInfo: { ...editForm.priceInfo!, priceTable: newTable } });
        };

        const handleRename = (oldName: string, newName: string) => {
            const table = editForm.priceInfo?.priceTable || {};
            const newTable: any = {};
            Object.keys(table).forEach(k => {
                if (k === oldName) {
                    const group = table[oldName];
                    // *** Sticky Logic for Legacy Data ***
                    // If category is missing, deduce it from oldName using the same logic as render loop
                    if (!group.category) {
                        let deducedCategory = OTHER_TAB_CATEGORY.key;
                        // Check Price Tab Categories
                        for (const cat of PRICE_TAB_CATEGORIES) {
                            if (cat.keywords.some(keyword => oldName.includes(keyword))) {
                                deducedCategory = cat.key;
                                break;
                            }
                        }
                        newTable[newName] = { ...group, category: deducedCategory };
                    } else {
                        newTable[newName] = group;
                    }
                } else {
                    newTable[k] = table[k];
                }
            });
            updateTable(newTable);
        };

        const handleUpdateRows = (name: string, newRows: any[]) => {
            const table = editForm.priceInfo?.priceTable || {};
            const newTable = { ...table };
            if (newTable[name]) {
                newTable[name].rows = newRows;
            }
            updateTable(newTable);
        };

        const handleDeleteGroup = (targetGroupName: string) => {
            if (!confirm(`'${targetGroupName}' 그룹을 삭제하시겠습니까?`)) return;
            const table = editForm.priceInfo?.priceTable || {};
            const newTable = { ...table };
            delete newTable[targetGroupName];
            updateTable(newTable);
        };

        const handleAddGroupToTab = (tabLabel: string) => {
            // Find category key from label
            const catKey = PRICE_TAB_CATEGORIES.find(c => c.label === tabLabel)?.key || OTHER_TAB_CATEGORY.key;
            const newGroupName = `${tabLabel} 새 그룹 ${Date.now().toString().slice(-4)}`;

            const newTable = {
                ...editForm.priceInfo!.priceTable,
                [newGroupName]: {
                    unit: '개',
                    rows: [],
                    category: catKey // *** 핵심: 생성 시 카테고리 고정 ***
                }
            };
            updateTable(newTable);
        };

        return (
            <Stack gap="md">
                <Tabs defaultValue={finalTabs[0] ? finalTabs[0][0] as string : '전체'}>
                    <Tabs.List mb="md">
                        {finalTabs.map(([tabName]: [string, any]) => (
                            <Tabs.Tab key={tabName} value={tabName}>{tabName}</Tabs.Tab>
                        ))}
                    </Tabs.List>
                    {finalTabs.map(([tabName, groups]: [string, any]) => (
                        <Tabs.Panel key={tabName} value={tabName}>
                            {groups.length > 0 ? (
                                groups.map((g: any, idx: number) => (
                                    <GroupEditor
                                        key={idx}
                                        groupName={g.groupName}
                                        groupData={g.groupData}
                                        onRename={handleRename}
                                        onUpdateRows={handleUpdateRows}
                                        onDeleteGroup={handleDeleteGroup}
                                    />
                                ))
                            ) : (
                                <Paper p="md" withBorder style={{ borderStyle: 'dashed', textAlign: 'center' }}>
                                    <Text c="dimmed" mb="sm">이 카테고리에 등록된 가격 정보가 없습니다.</Text>
                                    <Button
                                        variant="light"
                                        size="xs"
                                        leftSection={<Plus size={14} />}
                                        onClick={() => handleAddGroupToTab(tabName)}
                                    >
                                        {tabName} 그룹 추가하기
                                    </Button>
                                </Paper>
                            )}
                            {groups.length > 0 && (
                                <Button
                                    variant="subtle"
                                    size="xs"
                                    leftSection={<Plus size={14} />}
                                    mt="sm"
                                    onClick={() => handleAddGroupToTab(tabName)}
                                >
                                    {tabName} 그룹 추가
                                </Button>
                            )}
                        </Tabs.Panel>
                    ))}
                </Tabs>

                {/* 설치비용 섹션 */}
                {installationGroups.length > 0 && (
                    <Box mt="md" p="xs" bg="gray.0" style={{ borderRadius: 8 }}>
                        <Text size="sm" fw={700} mb="xs">➕ 별도 시설 설치비용 편집</Text>
                        {installationGroups.map((g, idx: number) => (
                            <GroupEditor
                                key={idx}
                                groupName={g.groupName}
                                groupData={g.groupData}
                                onRename={handleRename}
                                onUpdateRows={handleUpdateRows}
                                onDeleteGroup={handleDeleteGroup}
                            />
                        ))}
                    </Box>
                )}

                {/* 관리비 섹션 */}
                {managementGroups.length > 0 && (
                    <Box mt="md" p="xs" bg="blue.0" style={{ borderRadius: 8 }}>
                        <Text size="sm" fw={700} mb="xs" c="blue.9">ℹ️ 관리비 및 안내사항 편집</Text>
                        {managementGroups.map((g, idx: number) => (
                            <GroupEditor
                                key={idx}
                                groupName={g.groupName}
                                groupData={g.groupData}
                                onRename={handleRename}
                                onUpdateRows={handleUpdateRows}
                                onDeleteGroup={handleDeleteGroup}
                            />
                        ))}
                    </Box>
                )}

                <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                        const newTable = {
                            ...editForm.priceInfo!.priceTable,
                            [`새 그룹 ${Date.now().toString().slice(-4)}`]: {
                                unit: '개',
                                rows: [],
                                category: OTHER_TAB_CATEGORY.key
                            }
                        };
                        updateTable(newTable);
                    }}
                >
                    새 그룹 추가 (미분류)
                </Button>
            </Stack >
        );
    };

    return (
        <Box p="lg">
            <Group justify="space-between" mb="lg">
                <Title order={2}>시설 데이터 관리 (Admin)</Title>
                <Button leftSection={<Plus size={16} />} onClick={handleCreate}>새 시설 등록</Button>
            </Group>

            {/* Dashboard Stats */}
            <SimpleGrid cols={4} mb="xl">
                <Paper withBorder p="md" radius="md">
                    <Group justify="space-between">
                        <div>
                            <Text c="dimmed" size="xs">총 시설 수</Text>
                            <Text fw={700} size="xl">{facilities.length}개</Text>
                        </div>
                        <Building2 size={24} color="#adb5bd" />
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group justify="space-between">
                        <div>
                            <Text c="dimmed" size="xs">총 리뷰 수</Text>
                            <Text fw={700} size="xl">
                                {facilities.reduce((acc, f) => acc + (f.reviews?.length || 0), 0)}개
                            </Text>
                        </div>
                        <MessageSquare size={24} color="#adb5bd" />
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group justify="space-between">
                        <div>
                            <Text c="dimmed" size="xs">최고가 시설 (Min기준)</Text>
                            <Text fw={700} size="lg" truncate>
                                {(() => {
                                    const valid = facilities.filter(f => f.priceRange?.min != null);
                                    if (valid.length === 0) return '-';
                                    const max = Math.max(...valid.map(f => f.priceRange.min));
                                    const f = valid.find(f => f.priceRange.min === max);
                                    return f ? `${f.name} (${max.toLocaleString()}만)` : '-';
                                })()}
                            </Text>
                        </div>
                        <TrendingUp size={24} color="#fa5252" />
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group justify="space-between">
                        <div>
                            <Text c="dimmed" size="xs">최저가 시설 (0원 제외)</Text>
                            <Text fw={700} size="lg" truncate>
                                {(() => {
                                    const valid = facilities.filter(f => f.priceRange?.min != null && f.priceRange.min > 0);
                                    if (valid.length === 0) return '-';
                                    const min = Math.min(...valid.map(f => f.priceRange.min));
                                    const f = valid.find(f => f.priceRange.min === min);
                                    return f ? `${f.name} (${min.toLocaleString()}만)` : '-';
                                })()}
                            </Text>
                        </div>
                        <TrendingDown size={24} color="#40c057" />
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Filters */}
            <Group mb="md">
                <TextInput
                    placeholder="시설명 또는 주소 검색"
                    leftSection={<Search size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1 }}
                />
                <Select
                    placeholder="카테고리 필터"
                    data={Object.entries(FACILITY_CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                    clearable
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                />
            </Group>

            <Tabs defaultValue="facilities" mb="xl">
                <Tabs.List mb="md">
                    <Tabs.Tab value="facilities" leftSection={<Building2 size={14} />}>시설 목록</Tabs.Tab>
                    <Tabs.Tab value="reviews" leftSection={<MessageSquare size={14} />}>전체 리뷰 관리 ({allReviews.length})</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="facilities">
                    <Paper shadow="sm" radius="md" withBorder>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th style={{ width: 60 }}>No.</Table.Th>
                                    <Table.Th>시설명</Table.Th>
                                    <Table.Th>카테고리</Table.Th>
                                    <Table.Th>주소</Table.Th>
                                    <Table.Th>가격대 (Min)</Table.Th>
                                    <Table.Th>상세 상태</Table.Th>
                                    <Table.Th>관리</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {isLoadingData ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={7} align="center">데이터 로딩 중...</Table.Td>
                                    </Table.Tr>
                                ) : paginatedData.map((item, index) => (
                                    <Table.Tr key={item.id}>
                                        <Table.Td>
                                            <Text c="dimmed" size="sm">
                                                {(activePage - 1) * ITEMS_PER_PAGE + index + 1}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td fw={500}>
                                            <Group gap="xs">
                                                {item.name}
                                                {(item as any)._hasDetailedPrices && (
                                                    <Badge size="xs" color="cyan" variant="light">DB</Badge>
                                                )}
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={
                                                    item.category === 'CHARNEL_HOUSE' ? 'blue' :
                                                        item.category === 'NATURAL_BURIAL' ? 'green' :
                                                            item.category === 'FAMILY_GRAVE' ? 'orange' : 'gray'
                                                }
                                            >
                                                {FACILITY_CATEGORY_LABELS[item.category]}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td style={{ maxWidth: 200 }}><Text truncate>{item.address}</Text></Table.Td>
                                        <Table.Td>{item.priceRange?.min ? item.priceRange.min.toLocaleString() + '만원' : '-'}</Table.Td>
                                        <Table.Td>
                                            {item.imageGallery && item.imageGallery.length > 0 ? (
                                                <Badge size="sm" variant="dot" color="teal">이미지 {item.imageGallery.length}</Badge>
                                            ) : (
                                                <Badge size="sm" variant="dot" color="gray">이미지 없음</Badge>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                <ActionIcon variant="light" color="blue" onClick={() => handleEdit(item)}>
                                                    <Pencil size={16} />
                                                </ActionIcon>
                                                <ActionIcon variant="light" color="red" onClick={() => handleDelete(item.id)}>
                                                    <Trash size={16} />
                                                </ActionIcon>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Paper>
                    <Group justify="center" mt="md">
                        <Pagination total={totalPages} value={activePage} onChange={setActivePage} />
                    </Group>
                </Tabs.Panel>

                <Tabs.Panel value="reviews">
                    <Paper shadow="sm" radius="md" withBorder>
                        <ScrollArea h={600}>
                            <Table striped highlightOnHover stickyHeader>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>시설명</Table.Th>
                                        <Table.Th>작성자</Table.Th>
                                        <Table.Th>평점</Table.Th>
                                        <Table.Th>내용</Table.Th>
                                        <Table.Th>날짜</Table.Th>
                                        <Table.Th>관리</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {allReviews.length === 0 ? (
                                        <Table.Tr>
                                            <Table.Td colSpan={6} align="center" py="xl">
                                                <Text c="dimmed">등록된 리뷰가 없습니다.</Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    ) : allReviews.map((review) => (
                                        <Table.Tr key={`${review.facilityId}-${review.id}`}>
                                            <Table.Td fw={500}>{review.facilityName}</Table.Td>
                                            <Table.Td>{review.author}</Table.Td>
                                            <Table.Td><Badge color="yellow" variant="light">★ {review.rating}</Badge></Table.Td>
                                            <Table.Td style={{ maxWidth: 300 }}><Text truncate>{review.content}</Text></Table.Td>
                                            <Table.Td>{review.date}</Table.Td>
                                            <Table.Td>
                                                <ActionIcon color="red" variant="subtle" onClick={() => handleDeleteReview(review.facilityId, review.id)}>
                                                    <Trash size={16} />
                                                </ActionIcon>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </Paper>
                </Tabs.Panel>
            </Tabs>

            {/* Edit Modal */}
            <Modal
                opened={opened}
                onClose={close}
                title={editingId ? '시설 정보 수정' : '새 시설 등록'}
                size="lg"
                scrollAreaComponent={ScrollArea.Autosize}
            >
                <Group justify="flex-end" mb="md">
                    <Button
                        variant="subtle"
                        color="green"
                        leftSection={<CloudDownload size={16} />}
                        onClick={handleSync}
                        loading={syncing}
                        disabled={!editingId?.startsWith('esky-')}
                        size="xs"
                    >
                        e하늘 실시간 동기화
                    </Button>
                </Group>

                {/* PDF Parsing Section */}
                <Paper withBorder p="md" radius="md" mb="xl" bg="blue.0" style={{ borderStyle: 'dashed', borderColor: '#339af0' }}>
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Group>
                                <ThemeIcon size="lg" color="red" variant="light" radius="md">
                                    <FileText size={20} />
                                </ThemeIcon>
                                <div>
                                    <Text fw={700} size="sm">PDF 파일을 업로드하면 AI가 내용을 분석합니다.</Text>
                                    <Text size="xs" c="dimmed">가격표, 시설 소개 등이 포함된 PDF를 올려주세요.</Text>
                                </div>
                            </Group>
                            <FileButton onChange={handlePdfUpload} accept="application/pdf">
                                {(props) => (
                                    <Button {...props} variant="white" color="blue" leftSection={<Wand2 size={16} />} loading={pdfLoading}>
                                        자동 파싱 {useOcr ? '(OCR)' : ''}
                                    </Button>
                                )}
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
                            <TextInput
                                label="시설명 (원본 - 고정값/폴더매칭용)"
                                value={editForm.originalName || ''}
                                readOnly
                                variant="filled"
                                description="아카이브 폴더와 매칭되는 이름입니다. 변경할 수 없습니다."
                            />
                            <TextInput
                                label="시설명 (표시용)"
                                description="실제 앱 화면에 표시될 이름입니다."
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            />

                            <Box>
                                <Text size="sm" fw={500} mb={3}>운영 법인 형태</Text>
                                <SegmentedControl
                                    fullWidth
                                    size="xs"
                                    value={editForm.operatorType || 'OTHER'}
                                    onChange={(val) => setEditForm(prev => ({ ...prev, operatorType: val }))}
                                    data={[
                                        { label: '재단법인', value: 'FOUNDATION' },
                                        { label: '사단법인', value: 'ASSOCIATION' },
                                        { label: '종교법인', value: 'RELIGIOUS' },
                                        { label: '주식회사', value: 'CORPORATION' },
                                        { label: '기타/공설', value: 'OTHER' },
                                    ]}
                                />
                            </Box>
                            <Select
                                label="카테고리"
                                data={Object.entries(FACILITY_CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                                value={editForm.category}
                                onChange={(val) => setEditForm(prev => ({ ...prev, category: val as any }))}
                            />
                            <Group align="flex-end" grow>
                                <TextInput
                                    label="주소"
                                    value={editForm.address}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    variant="light"
                                    onClick={async () => {
                                        if (!editForm.address) {
                                            alert('주소를 먼저 입력해주세요.');
                                            return;
                                        }
                                        try {
                                            const response = await fetch(
                                                `/api/geocode?address=${encodeURIComponent(editForm.address)}`
                                            );
                                            const data = await response.json();
                                            if (data.addresses && data.addresses.length > 0) {
                                                const { x, y } = data.addresses[0];
                                                setEditForm(prev => ({
                                                    ...prev,
                                                    location: { lat: parseFloat(y), lng: parseFloat(x) }
                                                }));
                                                alert(`좌표를 찾았습니다!\n위도: ${y}, 경도: ${x}`);
                                            } else {
                                                alert('주소를 찾을 수 없습니다. 주소를 확인해주세요.');
                                            }
                                        } catch (error) {
                                            console.error('Geocoding error:', error);
                                            alert('좌표 변환 중 오류가 발생했습니다.');
                                        }
                                    }}
                                >
                                    📍 좌표 찾기
                                </Button>
                            </Group>
                            <TextInput
                                label="전화번호"
                                value={editForm.phone || ''} // contact -> phone 체크
                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            />
                            <TextInput
                                label="홈페이지 URL"
                                placeholder="https://example.com"
                                value={editForm.websiteUrl || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, websiteUrl: e.target.value }))}
                            />
                            <TextInput
                                label="설명"
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            />

                            <Paper withBorder p="md" mt="md" radius="md">
                                <Text size="sm" fw={700} mb="sm">편의시설 정보 (On/Off)</Text>
                                <SimpleGrid cols={2}>
                                    <Switch
                                        label="주차장 (Parking)"
                                        size="md"
                                        checked={!!editForm.hasParking}
                                        onChange={(event) => setEditForm(prev => ({ ...prev, hasParking: event.target.checked }))}
                                        onLabel="보유" offLabel="미보유"
                                    />
                                    <Switch
                                        label="식당 (Restaurant)"
                                        size="md"
                                        checked={!!editForm.hasRestaurant}
                                        onChange={(event) => setEditForm(prev => ({ ...prev, hasRestaurant: event.target.checked }))}
                                        onLabel="보유" offLabel="미보유"
                                    />
                                    <Switch
                                        label="매점 (Store)"
                                        size="md"
                                        checked={!!editForm.hasStore}
                                        onChange={(event) => setEditForm(prev => ({ ...prev, hasStore: event.target.checked }))}
                                        onLabel="보유" offLabel="미보유"
                                    />
                                    <Switch
                                        label="편의시설/장애인편의 (Accessibility)"
                                        size="md"
                                        checked={!!editForm.hasAccessibility}
                                        onChange={(event) => setEditForm(prev => ({ ...prev, hasAccessibility: event.target.checked }))}
                                        onLabel="보유" offLabel="미보유"
                                    />
                                </SimpleGrid>
                            </Paper>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="price" pt="md">
                        {(editForm as any)._detailedSource === 'prisma' ? (
                            // 새로운 DB 데이터 렌더링 (카테고리 탭 + 완전 편집)
                            <Box>
                                {(editForm as any)._meta && (
                                    <Alert color="cyan" mb="md" icon={<DollarSign size={16} />}>
                                        DB에서 로드됨: {(editForm as any)._meta.categoryCount}개 카테고리, {(editForm as any)._meta.itemCount}개 항목
                                    </Alert>
                                )}

                                <Tabs defaultValue={Object.keys(editForm.priceInfo?.priceTable || {})[0]}>
                                    <Tabs.List>
                                        {Object.keys(editForm.priceInfo?.priceTable || {}).map(catName => (
                                            <Tabs.Tab key={catName} value={catName}>
                                                {catName}
                                            </Tabs.Tab>
                                        ))}
                                    </Tabs.List>

                                    {Object.entries(editForm.priceInfo?.priceTable || {}).map(([catName, catData]: [string, any]) => {
                                        // 그룹별로 묶기
                                        const itemsByGroup: Record<string, any[]> = {};
                                        (catData.rows || []).forEach((row: any) => {
                                            const group = row.groupType || '미분류';
                                            if (!itemsByGroup[group]) itemsByGroup[group] = [];
                                            itemsByGroup[group].push(row);
                                        });

                                        const groupNames = Object.keys(itemsByGroup);

                                        // 핸들러 함수들
                                        const moveGroup = (fromIdx: number, toIdx: number) => {
                                            const newNames = [...groupNames];
                                            const [moved] = newNames.splice(fromIdx, 1);
                                            newNames.splice(toIdx, 0, moved);
                                            const newRows: any[] = [];
                                            newNames.forEach(gName => newRows.push(...itemsByGroup[gName]));
                                            setEditForm({
                                                ...editForm,
                                                priceInfo: {
                                                    ...editForm.priceInfo,
                                                    priceTable: {
                                                        ...editForm.priceInfo?.priceTable,
                                                        [catName]: { ...catData, rows: newRows }
                                                    }
                                                }
                                            });
                                        };

                                        const deleteGroup = (groupName: string) => {
                                            const newRows = (catData.rows || []).filter((r: any) => (r.groupType || '미분류') !== groupName);
                                            setEditForm({
                                                ...editForm,
                                                priceInfo: {
                                                    ...editForm.priceInfo,
                                                    priceTable: {
                                                        ...editForm.priceInfo?.priceTable,
                                                        [catName]: { ...catData, rows: newRows }
                                                    }
                                                }
                                            });
                                        };

                                        const moveItem = (groupName: string, fromIdx: number, toIdx: number) => {
                                            const groupRows = [...itemsByGroup[groupName]];
                                            const [moved] = groupRows.splice(fromIdx, 1);
                                            groupRows.splice(toIdx, 0, moved);
                                            const newRows: any[] = [];
                                            groupNames.forEach(gName => {
                                                newRows.push(...(gName === groupName ? groupRows : itemsByGroup[gName]));
                                            });
                                            setEditForm({
                                                ...editForm,
                                                priceInfo: {
                                                    ...editForm.priceInfo,
                                                    priceTable: {
                                                        ...editForm.priceInfo?.priceTable,
                                                        [catName]: { ...catData, rows: newRows }
                                                    }
                                                }
                                            });
                                        };

                                        const deleteItem = (groupName: string, itemIdx: number) => {
                                            const groupRows = itemsByGroup[groupName].filter((_, idx) => idx !== itemIdx);
                                            const newRows: any[] = [];
                                            groupNames.forEach(gName => {
                                                newRows.push(...(gName === groupName ? groupRows : itemsByGroup[gName]));
                                            });
                                            setEditForm({
                                                ...editForm,
                                                priceInfo: {
                                                    ...editForm.priceInfo,
                                                    priceTable: {
                                                        ...editForm.priceInfo?.priceTable,
                                                        [catName]: { ...catData, rows: newRows }
                                                    }
                                                }
                                            });
                                        };

                                        return (
                                            <Tabs.Panel key={catName} value={catName} pt="md">
                                                <Stack gap="lg">
                                                    {groupNames.map((groupName, groupIdx) => {
                                                        const rows = itemsByGroup[groupName];

                                                        return (
                                                            <Paper key={groupName} p="md" withBorder>
                                                                {/* 그룹 헤더 - 편집 가능 */}
                                                                <Group justify="space-between" mb="md">
                                                                    <Group gap="xs">
                                                                        <TextInput
                                                                            value={groupName}
                                                                            size="sm"
                                                                            fw={600}
                                                                            styles={{ input: { fontWeight: 600 } }}
                                                                            placeholder="그룹명"
                                                                            onChange={(e) => {
                                                                                const newName = e.target.value;
                                                                                const newRows = (catData.rows || []).map((r: any) => ({
                                                                                    ...r,
                                                                                    groupType: (r.groupType || '미분류') === groupName ? newName : r.groupType
                                                                                }));
                                                                                setEditForm({
                                                                                    ...editForm,
                                                                                    priceInfo: {
                                                                                        ...editForm.priceInfo!,
                                                                                        priceTable: {
                                                                                            ...editForm.priceInfo?.priceTable,
                                                                                            [catName]: { ...catData, rows: newRows }
                                                                                        }
                                                                                    }
                                                                                });
                                                                            }}
                                                                        />
                                                                        <Badge size="sm" variant="light">{rows.length}개</Badge>
                                                                    </Group>

                                                                    <Group gap="xs">
                                                                        {/* 그룹 순서 변경 */}
                                                                        <ActionIcon
                                                                            variant="light"
                                                                            size="sm"
                                                                            disabled={groupIdx === 0}
                                                                            onClick={() => moveGroup(groupIdx, groupIdx - 1)}
                                                                        >
                                                                            <TrendingUp size={14} />
                                                                        </ActionIcon>
                                                                        <ActionIcon
                                                                            variant="light"
                                                                            size="sm"
                                                                            disabled={groupIdx === groupNames.length - 1}
                                                                            onClick={() => moveGroup(groupIdx, groupIdx + 1)}
                                                                        >
                                                                            <TrendingDown size={14} />
                                                                        </ActionIcon>

                                                                        {/* 그룹 전체 삭제 */}
                                                                        <ActionIcon
                                                                            color="red"
                                                                            variant="light"
                                                                            size="sm"
                                                                            onClick={() => confirm(`"${groupName}" 삭제?`) && deleteGroup(groupName)}
                                                                        >
                                                                            <Trash size={14} />
                                                                        </ActionIcon>
                                                                    </Group>
                                                                </Group>

                                                                {/* 항목 리스트 */}
                                                                <Stack gap="xs">
                                                                    {rows.map((row: any, itemIdx: number) => (
                                                                        <Group key={itemIdx} align="flex-start" gap="xs" wrap="nowrap">
                                                                            {/* 항목 순서 변경 */}
                                                                            <Stack gap={2}>
                                                                                <ActionIcon
                                                                                    size="xs"
                                                                                    variant="subtle"
                                                                                    disabled={itemIdx === 0}
                                                                                    onClick={() => moveItem(groupName, itemIdx, itemIdx - 1)}
                                                                                    style={{ marginTop: itemIdx === 0 ? 24 : 0 }}
                                                                                >
                                                                                    <TrendingUp size={12} />
                                                                                </ActionIcon>
                                                                                <ActionIcon
                                                                                    size="xs"
                                                                                    variant="subtle"
                                                                                    disabled={itemIdx === rows.length - 1}
                                                                                    onClick={() => moveItem(groupName, itemIdx, itemIdx + 1)}
                                                                                >
                                                                                    <TrendingDown size={12} />
                                                                                </ActionIcon>
                                                                            </Stack>

                                                                            {/* 입력 필드들 - onChange 연결 */}
                                                                            <TextInput
                                                                                label={itemIdx === 0 ? "상품명" : undefined}
                                                                                value={row.name} // defaultValue -> value
                                                                                onChange={(e) => {
                                                                                    const newRows = [...rows];
                                                                                    newRows[itemIdx] = { ...newRows[itemIdx], name: e.target.value };
                                                                                    setEditForm({
                                                                                        ...editForm,
                                                                                        priceInfo: {
                                                                                            ...editForm.priceInfo!,
                                                                                            priceTable: {
                                                                                                ...editForm.priceInfo?.priceTable,
                                                                                                [catName]: { ...catData, rows: newRows }
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                }}
                                                                                style={{ flex: 2 }}
                                                                                size="sm"
                                                                            />
                                                                            <TextInput
                                                                                label={itemIdx === 0 ? "세부정보" : undefined}
                                                                                value={row.grade} // defaultValue -> value
                                                                                onChange={(e) => {
                                                                                    const newRows = [...rows];
                                                                                    newRows[itemIdx] = { ...newRows[itemIdx], grade: e.target.value };
                                                                                    setEditForm({
                                                                                        ...editForm,
                                                                                        priceInfo: {
                                                                                            ...editForm.priceInfo!,
                                                                                            priceTable: {
                                                                                                ...editForm.priceInfo?.priceTable,
                                                                                                [catName]: { ...catData, rows: newRows }
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                }}
                                                                                style={{ flex: 2 }}
                                                                                size="sm"
                                                                            />
                                                                            <NumberInput
                                                                                label={itemIdx === 0 ? "가격" : undefined}
                                                                                value={row.price} // defaultValue -> value
                                                                                onChange={(val) => {
                                                                                    const newRows = [...rows];
                                                                                    newRows[itemIdx] = { ...newRows[itemIdx], price: val };
                                                                                    setEditForm({
                                                                                        ...editForm,
                                                                                        priceInfo: {
                                                                                            ...editForm.priceInfo!,
                                                                                            priceTable: {
                                                                                                ...editForm.priceInfo?.priceTable,
                                                                                                [catName]: { ...catData, rows: newRows }
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                }}
                                                                                thousandSeparator=","
                                                                                suffix="원"
                                                                                style={{ flex: 1.5 }}
                                                                                size="sm"
                                                                            />
                                                                            {row.size !== undefined && ( // Check undefined to allow empty string
                                                                                <TextInput
                                                                                    label={itemIdx === 0 ? "규격" : undefined}
                                                                                    value={row.size || ''}
                                                                                    onChange={(e) => {
                                                                                        const newRows = [...rows];
                                                                                        newRows[itemIdx] = { ...newRows[itemIdx], size: e.target.value };
                                                                                        setEditForm({
                                                                                            ...editForm,
                                                                                            priceInfo: {
                                                                                                ...editForm.priceInfo!,
                                                                                                priceTable: {
                                                                                                    ...editForm.priceInfo?.priceTable,
                                                                                                    [catName]: { ...catData, rows: newRows }
                                                                                                }
                                                                                            }
                                                                                        });
                                                                                    }}
                                                                                    style={{ flex: 0.8 }}
                                                                                    size="sm"
                                                                                />
                                                                            )}

                                                                            {/* 항목 삭제 */}
                                                                            <ActionIcon
                                                                                color="red"
                                                                                variant="subtle"
                                                                                size="sm"
                                                                                onClick={() => deleteItem(groupName, itemIdx)}
                                                                                style={{ marginTop: itemIdx === 0 ? 28 : 0 }}
                                                                            >
                                                                                <X size={16} />
                                                                            </ActionIcon>
                                                                        </Group>
                                                                    ))}

                                                                    {/* 항목 추가 버튼 - 기능 연결됨 */}
                                                                    <Button
                                                                        variant="light"
                                                                        size="xs"
                                                                        leftSection={<Plus size={14} />}
                                                                        mt="xs"
                                                                        onClick={() => {
                                                                            const newRows = [...rows, { name: '', grade: '', price: 0 }];
                                                                            setEditForm({
                                                                                ...editForm,
                                                                                priceInfo: {
                                                                                    ...editForm.priceInfo,
                                                                                    priceTable: {
                                                                                        ...editForm.priceInfo?.priceTable,
                                                                                        [catName]: {
                                                                                            ...catData,
                                                                                            rows: (catData.rows || []).map((r: any) =>
                                                                                                (r.groupType || '미분류') === groupName ? r : r
                                                                                            ).concat({ name: '', grade: '', price: 0, groupType: groupName })
                                                                                        }

                                                                                    }
                                                                                }
                                                                            });
                                                                            // Wait, the structure is flattened rows in catData? 
                                                                            // But we are iterating itemsByGroup.
                                                                            // We need to add to catData.rows, with correct groupType.
                                                                            const currentRows = catData.rows || [];
                                                                            const newRow = { name: '새 항목', grade: '', price: 0, groupType: groupName };
                                                                            setEditForm({
                                                                                ...editForm,
                                                                                priceInfo: {
                                                                                    ...editForm.priceInfo!,
                                                                                    priceTable: {
                                                                                        ...editForm.priceInfo?.priceTable,
                                                                                        [catName]: { ...catData, rows: [...currentRows, newRow] }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }}
                                                                    >
                                                                        항목 추가
                                                                    </Button>
                                                                </Stack>
                                                            </Paper>
                                                        );
                                                    })}

                                                    {/* 그룹 추가 버튼 - 기능 연결됨 */}
                                                    <Button
                                                        variant="outline"
                                                        leftSection={<Plus size={16} />}
                                                        onClick={() => {
                                                            const newGroupName = `새 그룹 ${groupNames.length + 1}`;
                                                            // To add a group, we just add a row with that groupType? 
                                                            // Or creates an empty group? 
                                                            // Our logic relies on rows having groupType.
                                                            // So we add a dummy row? Or just handle empty groups?
                                                            // If we add a dummy row, it shows up.
                                                            // Let's add with a placeholder item.
                                                            const newRow = { name: '새 항목', price: 0, groupType: newGroupName };
                                                            setEditForm({
                                                                ...editForm,
                                                                priceInfo: {
                                                                    ...editForm.priceInfo!,
                                                                    priceTable: {
                                                                        ...editForm.priceInfo?.priceTable,
                                                                        [catName]: { ...catData, rows: [...(catData.rows || []), newRow] }
                                                                    }
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        새 그룹 추가
                                                    </Button>
                                                </Stack>
                                            </Tabs.Panel>
                                        );
                                    })}
                                </Tabs>
                            </Box>
                        ) : (
                            // 기존 JSON 데이터 렌더링
                            renderPriceEditor()
                        )}
                        <Alert title="알림" color="blue" mt="md">
                            DB 데이터는 실시간 편집이 가능합니다. 변경사항은 저장 버튼을 눌러주세요.
                        </Alert>
                    </Tabs.Panel>

                    <Tabs.Panel value="images" pt="md">
                        <Text size="sm" mb="md">등록된 이미지 ({editForm.imageGallery?.length || 0})</Text>
                        <SimpleGrid cols={3}>
                            {editForm.imageGallery?.map((img, idx) => (
                                <Card key={idx} padding="0" radius="sm" withBorder>
                                    <Box pos="relative" h={100}>
                                        <Image
                                            src={getSingleFacilityImageUrl(img)}
                                            h={100}
                                            w="100%"
                                            fit="cover"
                                            fallbackSrc="https://placehold.co/400x300?text=No+Image"
                                            onError={(e) => console.error('Image load failed:', img)}
                                        />
                                        <ActionIcon
                                            pos="absolute" top={4} right={4} color="red" variant="filled" size="xs"
                                            onClick={() => {
                                                const newImgs = editForm.imageGallery!.filter((_, i) => i !== idx);
                                                setEditForm({ ...editForm, imageGallery: newImgs });
                                            }}
                                        >
                                            <X size={12} />
                                        </ActionIcon>
                                    </Box>
                                </Card>
                            ))}
                        </SimpleGrid>

                        <Group mt="xl" grow>
                            <FileButton onChange={(file) => {
                                if (file) {
                                    const url = URL.createObjectURL(file);
                                    setEditForm(prev => ({ ...prev, imageGallery: [...(prev.imageGallery || []), url] }));
                                }
                            }} accept="image/png,image/jpeg">
                                {(props) => (
                                    <Button {...props} variant="outline" h={50} color="gray" leftSection={<ImageIcon size={20} />}>
                                        이미지 1장 추가
                                    </Button>
                                )}
                            </FileButton>

                            <FileButton onChange={handleSmartCrop} accept="image/png,image/jpeg">
                                {(props) => (
                                    <Button {...props} variant="filled" h={50} color="grape" leftSection={<Scissors size={20} />} loading={cropping}>
                                        갤러리 스크린샷 자동 자르기
                                    </Button>
                                )}
                            </FileButton>
                        </Group>
                        <Text size="xs" c="dimmed" mt="xs" ta="center">
                            * &apos;자동 자르기&apos;는 여러 사진이 모여있는 스크린샷(흰 배경)을 올리면 자동으로 분리해줍니다.
                        </Text>
                    </Tabs.Panel>
                </Tabs>

                <Group justify="flex-end" mt="xl">
                    <Button variant="default" onClick={close}>취소</Button>
                    <Button onClick={handleSave} leftSection={<Save size={16} />}>저장</Button>
                </Group>
            </Modal>
        </Box >
    );
}
