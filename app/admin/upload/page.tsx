'use client';

import React, { useState, useMemo, useEffect, memo, useCallback, useRef } from 'react';
import {
    Title, Text, Group, Button, Paper, TextInput, ActionIcon,
    Table, Badge, Modal, NumberInput, Select, ScrollArea,
    Stack, Tabs, SimpleGrid, Card, Image, FileButton,
    Pagination, Box, Alert, ThemeIcon, Switch, SegmentedControl, Accordion
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import {
    Search, Plus, Pencil, Trash, Save, X, Image as ImageIcon,
    DollarSign, Building2, CloudDownload, FileText, Wand2, Scissors,
    MessageSquare, TrendingUp, TrendingDown, List, Star
} from 'lucide-react';
import { Facility, FACILITY_CATEGORY_LABELS } from '@/types';
import { formatKoreanCurrency } from '@/lib/format';
import { cropImagesFromScreenshot } from '@/lib/imageCropper';
import { PRICE_TAB_CATEGORIES, OTHER_TAB_CATEGORY } from '@/lib/constants';
import { getSingleFacilityImageUrl } from '@/lib/supabaseImage';

// ... (existing imports)



// Sub-component for Group Editing to prevent focus loss
// 🚀 최적화: memo로 감싸서 불필요한 리렌더링 방지

// 🚀 PriceEditor: 완전 독립 컴포넌트 - 자체 priceTable 상태 관리
// 부모 컴포넌트의 리렌더를 차단하여 가격 편집 시 체감 속도 대폭 개선
const PriceEditor = memo(({ initialPriceTable, onChange }: {
    initialPriceTable: any;
    onChange: (newTable: any) => void;
}) => {
    const [priceTable, setPriceTable] = useState<any>(initialPriceTable || {});
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // 부모에서 초기 데이터 변경 시 동기화 (모달 열 때)
    useEffect(() => {
        setPriceTable(initialPriceTable || {});
    }, [initialPriceTable]);

    // 디바운스 부모 전달
    const commitToParent = useCallback((newTable: any) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onChange(newTable);
        }, 500);
    }, [onChange]);

    useEffect(() => {
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, []);

    const updateTable = useCallback((newTable: any) => {
        setPriceTable(newTable);
        commitToParent(newTable);
    }, [commitToParent]);

    // 데이터 분류
    const { mainGroups, installationGroups, managementGroups } = useMemo(() => {
        const main: any[] = [];
        const installation: any[] = [];
        const management: any[] = [];
        Object.entries(priceTable).forEach(([groupName, groupData]: [string, any]) => {
            if (groupName.includes('[별도]') || groupName.includes('시설') || groupName.includes('석물')) {
                installation.push({ groupName, groupData });
            } else if (groupName.includes('[안내]') || groupName.includes('관리비') || groupName.includes('용역')) {
                management.push({ groupName, groupData });
            } else {
                main.push({ groupName, groupData });
            }
        });
        return { mainGroups: main, installationGroups: installation, managementGroups: management };
    }, [priceTable]);

    // 탭 카테고리 로직
    const finalTabs = useMemo(() => {
        const tabCategories: Record<string, any[]> = {};
        const usedItems = new Set<any>();

        PRICE_TAB_CATEGORIES.forEach(cat => {
            const filtered = mainGroups.filter(g => {
                if (g.groupData.category === cat.key) { usedItems.add(g); return true; }
                if (!g.groupData.category && !usedItems.has(g)) {
                    const matches = cat.keywords.some((k: string) => g.groupName.includes(k));
                    if (matches) { usedItems.add(g); return true; }
                }
                return false;
            });
            tabCategories[cat.key] = filtered;
        });

        const others = mainGroups.filter(g => {
            if (g.groupData.category === OTHER_TAB_CATEGORY.key) return true;
            return !usedItems.has(g);
        });
        if (others.length > 0) tabCategories[OTHER_TAB_CATEGORY.key] = others;

        const tabs: [string, any[]][] = [];
        PRICE_TAB_CATEGORIES.forEach(cat => { tabs.push([cat.label, tabCategories[cat.key] || []]); });
        if (tabCategories[OTHER_TAB_CATEGORY.key]?.length > 0) {
            tabs.push([OTHER_TAB_CATEGORY.label, tabCategories[OTHER_TAB_CATEGORY.key]]);
        }
        return tabs;
    }, [mainGroups]);

    const handleRename = useCallback((oldName: string, newName: string) => {
        setPriceTable((prev: any) => {
            const newTable: any = {};
            Object.keys(prev).forEach(k => {
                if (k === oldName) {
                    const group = prev[oldName];
                    if (!group.category) {
                        let deducedCategory = OTHER_TAB_CATEGORY.key;
                        for (const cat of PRICE_TAB_CATEGORIES) {
                            if (cat.keywords.some((keyword: string) => oldName.includes(keyword))) {
                                deducedCategory = cat.key; break;
                            }
                        }
                        newTable[newName] = { ...group, category: deducedCategory };
                    } else {
                        newTable[newName] = group;
                    }
                } else {
                    newTable[k] = prev[k];
                }
            });
            commitToParent(newTable);
            return newTable;
        });
    }, [commitToParent]);

    const handleUpdateRows = useCallback((name: string, newRows: any[]) => {
        setPriceTable((prev: any) => {
            const newTable = { ...prev };
            if (newTable[name]) newTable[name] = { ...newTable[name], rows: newRows };
            commitToParent(newTable);
            return newTable;
        });
    }, [commitToParent]);

    const handleDeleteGroup = useCallback((targetGroupName: string) => {
        if (!confirm(`'${targetGroupName}' 그룹을 삭제하시겠습니까?`)) return;
        setPriceTable((prev: any) => {
            const newTable = { ...prev };
            delete newTable[targetGroupName];
            commitToParent(newTable);
            return newTable;
        });
    }, [commitToParent]);

    const handleAddGroupToTab = useCallback((tabLabel: string) => {
        const catKey = PRICE_TAB_CATEGORIES.find(c => c.label === tabLabel)?.key || OTHER_TAB_CATEGORY.key;
        const newGroupName = `${tabLabel} 새 그룹 ${Date.now().toString().slice(-4)}`;
        setPriceTable((prev: any) => {
            const newTable = { ...prev, [newGroupName]: { unit: '개', rows: [], category: catKey } };
            commitToParent(newTable);
            return newTable;
        });
    }, [commitToParent]);

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
                                <GroupEditorInner
                                    key={g.groupName}
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
                                <Button variant="light" size="xs" leftSection={<Plus size={14} />}
                                    onClick={() => handleAddGroupToTab(tabName)}>
                                    {tabName} 그룹 추가하기
                                </Button>
                            </Paper>
                        )}
                        {groups.length > 0 && (
                            <Button variant="subtle" size="xs" leftSection={<Plus size={14} />}
                                onClick={() => handleAddGroupToTab(tabName)}>
                                + {tabName} 그룹 추가하기
                            </Button>
                        )}
                    </Tabs.Panel>
                ))}
            </Tabs>

            {installationGroups.length > 0 && (
                <Box mt="md" p="xs" bg="gray.0" style={{ borderRadius: 8 }}>
                    <Text size="sm" fw={700} mb="xs">➕ 별도 시설 설치비용 편집</Text>
                    {installationGroups.map((g: any) => (
                        <GroupEditorInner key={g.groupName} groupName={g.groupName} groupData={g.groupData}
                            onRename={handleRename} onUpdateRows={handleUpdateRows} onDeleteGroup={handleDeleteGroup} />
                    ))}
                </Box>
            )}

            {managementGroups.length > 0 && (
                <Box mt="md" p="xs" bg="blue.0" style={{ borderRadius: 8 }}>
                    <Text size="sm" fw={700} mb="xs" c="blue.9">ℹ️ 관리비 및 안내사항 편집</Text>
                    {managementGroups.map((g: any) => (
                        <GroupEditorInner key={g.groupName} groupName={g.groupName} groupData={g.groupData}
                            onRename={handleRename} onUpdateRows={handleUpdateRows} onDeleteGroup={handleDeleteGroup} />
                    ))}
                </Box>
            )}

            <Button variant="outline" size="xs" onClick={() => {
                setPriceTable((prev: any) => {
                    const newTable = { ...prev, [`새 그룹 ${Date.now().toString().slice(-4)}`]: { unit: '개', rows: [], category: OTHER_TAB_CATEGORY.key } };
                    commitToParent(newTable);
                    return newTable;
                });
            }}>
                새 그룹 추가 (미분류)
            </Button>
        </Stack>
    );
});
PriceEditor.displayName = 'PriceEditor';
const GroupEditorInner = memo(({ groupName, groupData, onRename, onUpdateRows, onDeleteGroup }: {
    groupName: string;
    groupData: any;
    onRename: (oldName: string, newName: string) => void;
    onUpdateRows: (groupName: string, newRows: any[]) => void;
    onDeleteGroup: (groupName: string) => void;
}) => {
    const [localName, setLocalName] = useState(groupName);
    const [localRows, setLocalRows] = useState(groupData.rows || []);
    const commitTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync with parent when groupData changes (e.g. after save)
    useEffect(() => {
        setLocalRows(groupData.rows || []);
    }, [groupData.rows]);

    useEffect(() => {
        if (groupName !== localName) {
            setLocalName(groupName);
        }
    }, [groupName]);

    // 로컬 row 업데이트 (즉시 반영, 부모 업데이트 X)
    const updateLocalRow = (idx: number, field: string, value: any) => {
        const newRows = [...localRows];
        newRows[idx] = { ...newRows[idx], [field]: value };
        setLocalRows(newRows);
    };

    // blur 시에만 부모에 전달
    const commitRows = () => {
        onUpdateRows(groupName, localRows);
    };

    // 행 추가/삭제 시 디바운스로 부모에 전달 (즉시 리렌더 방지)
    const debouncedCommit = (newRows: any[]) => {
        if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
        commitTimerRef.current = setTimeout(() => {
            onUpdateRows(groupName, newRows);
        }, 300);
    };

    // cleanup
    useEffect(() => {
        return () => {
            if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
        };
    }, []);

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
                {localRows.map((row: any, idx: number) => (
                    <Group key={idx} grow align="flex-end">
                        <TextInput
                            label="상품명"
                            size="xs"
                            value={row.name}
                            onChange={(e) => updateLocalRow(idx, 'name', e.target.value)}
                            onBlur={commitRows}
                        />
                        <TextInput
                            label="설명"
                            size="xs"
                            value={row.grade || ''}
                            placeholder="예: 1평형/1년"
                            onChange={(e) => updateLocalRow(idx, 'grade', e.target.value)}
                            onBlur={commitRows}
                        />
                        <NumberInput
                            label="가격"
                            size="xs"
                            value={row.price}
                            onChange={(val) => updateLocalRow(idx, 'price', Number(val))}
                            onBlur={commitRows}
                        />
                        <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => {
                                const newRows = localRows.filter((_: any, i: number) => i !== idx);
                                setLocalRows(newRows);
                                debouncedCommit(newRows);
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
                        const newRows = [...localRows, { name: '새 상품', price: 0 }];
                        setLocalRows(newRows);
                        debouncedCommit(newRows);
                    }}
                >
                    상품 추가
                </Button>
            </Stack>
        </Paper>
    );
});

GroupEditorInner.displayName = 'GroupEditor';


export default function AdminPage() {
    // State
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch] = useDebouncedValue(searchQuery, 300); // 🚀 검색어 디바운스
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [activePage, setActivePage] = useState(1);

    // Modal State
    const [opened, { open, close }] = useDisclosure(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Facility>>({});
    const [activeMajorTab, setActiveMajorTab] = useState<string>('매장묘'); // New State for Major Grouping
    const [activeGroupTab, setActiveGroupTab] = useState<Record<string, string>>({}); // Track active group tab per category

    // UI Process States
    const [syncing, setSyncing] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [cropping, setCropping] = useState(false);
    const [useOcr] = useState(false); // Force OCR Checkbox -- MOVED HERE
    const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
        const now = new Date();
        return `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    }); // 마지막 저장 시간

    // 정렬 상태
    const [sortOrder, setSortOrder] = useState<'id-asc' | 'id-desc' | 'updated-desc'>('id-asc');

    const [itemsPerPage, setItemsPerPage] = useState(() => {
        if (typeof window !== 'undefined') {
            return Number(localStorage.getItem('adminItemsPerPage')) || 100;
        }
        return 100;
    });

    // localStorage에 저장
    useEffect(() => {
        localStorage.setItem('adminItemsPerPage', String(itemsPerPage));
    }, [itemsPerPage]);

    // 🚀 경량 API 사용 (id, name, address, category 등만 → pricing 제외!)
    useEffect(() => {
        // 1. 캐시에서 즉시 로드
        const cached = sessionStorage.getItem('admin_facilities_lite');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (Array.isArray(data) && data.length > 0) {
                    setFacilities(data);
                    setIsLoadingData(false);
                }
            } catch (e) { /* 캐시 파싱 실패 시 무시 */ }
        }

        // 2. 전체 데이터 가져오기 (Supabase 1000행 제한 우회 - 페이지네이션)
        const fetchAllFacilities = async () => {
            try {
                const PAGE_SIZE = 1000;
                // 첫 페이지 + 총 개수 확인
                const res1 = await fetch(`/api/admin/facilities?limit=${PAGE_SIZE}&page=1&sortBy=id&sortOrder=asc`);
                const json1 = await res1.json();
                let allData = json1.data || [];
                const total = json1.pagination?.total || allData.length;

                // 1000개 초과 시 나머지 페이지 병렬 요청
                if (total > PAGE_SIZE) {
                    const totalPages = Math.ceil(total / PAGE_SIZE);
                    const promises = [];
                    for (let p = 2; p <= totalPages; p++) {
                        promises.push(
                            fetch(`/api/admin/facilities?limit=${PAGE_SIZE}&page=${p}&sortBy=id&sortOrder=asc`)
                                .then(r => r.json())
                                .then(j => j.data || [])
                        );
                    }
                    const results = await Promise.all(promises);
                    results.forEach(pageData => { allData = allData.concat(pageData); });
                }

                setFacilities(allData);
                sessionStorage.setItem('admin_facilities_lite', JSON.stringify(allData));
                setIsLoadingData(false);
            } catch (e) {
                console.error('Data load failed:', e);
                if (!cached) {
                    alert('데이터를 불러오지 못했습니다.');
                }
                setIsLoadingData(false);
            }
        };

        fetchAllFacilities();
    }, []);

    // Save to Server Helper
    const saveToServer = async (payload: Facility | Facility[]) => {
        try {
            const res = await fetch('/api/facilities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt);
            }
            // 저장 성공 시 시간 기록
            const now = new Date();
            const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
            setLastSavedTime(timeStr);
        } catch (e) {
            console.error('Save failed:', e);
            alert('서버 저장에 실패했습니다: ' + String(e));
        }
    };

    // 마커 표시 토글 핸들러
    const handleToggleMarker = async (item: Facility) => {
        const newIsActive = item.isActive === false ? true : false;
        const updatedItem = { ...item, isActive: newIsActive };

        // 로컬 상태 업데이트
        setFacilities(prev => prev.map(f => f.id === item.id ? updatedItem : f));

        // 서버에 저장
        await saveToServer(updatedItem);
    };


    // Filter Logic
    const filteredData = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        let result = facilities.filter(item => {
            if (!query) return categoryFilter ? item.category === categoryFilter : true;
            const matchSearch = item.name.toLowerCase().includes(query) || item.address.toLowerCase().includes(query);
            const matchCategory = categoryFilter ? item.category === categoryFilter : true;
            return matchSearch && matchCategory;
        });

        // 정렬
        if (sortOrder === 'id-asc') {
            // ID 오름차순 (park-0001, park-0002, ...)
            result = result.sort((a, b) => {
                const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
                return numA - numB;
            });
        } else if (sortOrder === 'id-desc') {
            // ID 내림차순 (park-1498, park-1497, ...)
            result = result.sort((a, b) => {
                const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
                return numB - numA;
            });
        } else if (sortOrder === 'updated-desc') {
            // 수정일 최신순
            result = result.sort((a, b) => {
                const dateA = (a as any).updatedAt ? new Date((a as any).updatedAt).getTime() : 0;
                const dateB = (b as any).updatedAt ? new Date((b as any).updatedAt).getTime() : 0;
                return dateB - dateA;
            });
        }

        return result;
    }, [facilities, searchQuery, categoryFilter, sortOrder]);

    // Pagination Logic
    const paginatedData = useMemo(() => {
        const start = (activePage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, activePage]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Handlers
    const handleEdit = async (facility: Facility) => {
        setEditingId(facility.id);

        // Parse images if it's a JSON string
        const parsedFacility = { ...facility };
        if (typeof parsedFacility.images === 'string') {
            try {
                parsedFacility.images = JSON.parse(parsedFacility.images);
            } catch (e) {
                parsedFacility.images = [];
            }
        }
        if (!Array.isArray(parsedFacility.images)) {
            parsedFacility.images = [];
        }

        // Ensure imageGallery is populated for UI
        if (!parsedFacility.imageGallery || parsedFacility.imageGallery.length === 0) {
            if (parsedFacility.images && parsedFacility.images.length > 0) {
                parsedFacility.imageGallery = parsedFacility.images;
            }
        }

        // 🔥 모달 먼저 열고 기본 데이터 표시
        setEditForm(JSON.parse(JSON.stringify(parsedFacility)));
        open();

        // 🔥 백그라운드에서 상세 데이터 로딩
        try {
            const priceUrl = `/api/facilities/${parsedFacility.id}/prices`;
            const detailUrl = `/api/facilities/${parsedFacility.id}`;

            const [detailRes, priceRes] = await Promise.all([
                fetch(detailUrl, { cache: 'no-store' }),
                fetch(priceUrl, { cache: 'no-store' })
            ]);

            let mergedFacility = { ...parsedFacility };

            if (detailRes.ok) {
                const latestDetail = await detailRes.json();
                mergedFacility = {
                    ...mergedFacility,
                    ...latestDetail,
                    imageGallery: latestDetail.imageGallery || mergedFacility.imageGallery
                };
            }

            if (priceRes.ok) {
                const detailedData = await priceRes.json();
                mergedFacility = {
                    ...mergedFacility,
                    priceInfo: {
                        priceTable: detailedData.priceTable
                    },
                } as any;
                (mergedFacility as any)._detailedSource = 'prisma';
                (mergedFacility as any)._meta = detailedData._meta;
            }

            // 🔥 모달이 열려있을 때만 업데이트
            setEditForm((prev: any) => prev?.id === parsedFacility.id ? JSON.parse(JSON.stringify(mergedFacility)) : prev);

        } catch (e) {
            console.error('Fetch error in handleEdit:', e);
        }
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
            coordinates: { lat: 0, lng: 0 },
            priceRange: { min: 0, max: 0 },
            rating: 0,
            facilities: {},
            priceInfo: { priceTable: {}, additionalCosts: {} },
            tags: [],
            imageGallery: []
        });
        open();
    };

    const handleSave = async () => {
        // Image Compression Helper
        const compressAndResizeImage = (blob: Blob): Promise<Blob> => {
            return new Promise((resolve, reject) => {
                const img = new window.Image();
                const url = URL.createObjectURL(blob);
                img.src = url;
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Resize logic (Max 1920px)
                    const MAX_SIZE = 1920;
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(blob); // Fallback to original
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG 0.8
                    canvas.toBlob((newBlob) => {
                        if (newBlob) resolve(newBlob);
                        else resolve(blob); // Fallback
                    }, 'image/jpeg', 0.8);
                };
                img.onerror = () => resolve(blob); // Fallback
            });
        };

        // Image Upload Helper
        const uploadImage = async (url: string) => {
            try {
                const response = await fetch(url);
                const originalBlob = await response.blob();

                // Compress before uploading
                const compressedBlob = await compressAndResizeImage(originalBlob);
                console.log(`[Upload] Compressed: ${(originalBlob.size / 1024).toFixed(0)}KB -> ${(compressedBlob.size / 1024).toFixed(0)}KB`);

                const formData = new FormData();
                // Always save as jpg due to compression
                formData.append('file', compressedBlob, `image.jpg`);

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
            // Show loading
            const totalToUpload = processedGallery.filter(img => img.startsWith('blob:') || img.startsWith('data:')).length;
            if (!confirm(`${totalToUpload}장의 새 이미지를 업로드하고 저장하시겠습니까?`)) return;

            try {
                // Sequential Upload to avoid rate limits / race conditions
                const newGallery: string[] = [];
                let uploadCount = 0;

                for (const img of processedGallery) {
                    if (img.startsWith('blob:') || img.startsWith('data:')) {
                        console.log(`Uploading image ${uploadCount + 1}/${totalToUpload}...`);
                        const newUrl = await uploadImage(img);
                        if (!newUrl) {
                            throw new Error('이미지 업로드에 실패했습니다. (서버 응답 없음)');
                        }
                        newGallery.push(newUrl);
                        uploadCount++;
                    } else {
                        newGallery.push(img);
                    }
                }
                processedGallery = newGallery;
            } catch (e) {
                console.error('Image processing failed', e);
                alert('이미지 업로드 중 오류가 발생했습니다. 저장이 취소되었습니다.');
                return;
            }
        }

        // 가격 범위(Min/Max) 자동 재계산
        let calculatedPriceRange = editForm.priceRange;
        if (editForm.priceInfo?.priceTable) {
            let min = Infinity;
            let max = -Infinity;
            let hasPrice = false;
            let representativePrice: number | null = null;

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
                        // ⭐ 대표 가격 체크 (우선순위 최상위)
                        if (row.isRepresentative && representativePrice === null) {
                            representativePrice = price;
                        }

                        if (price < min) min = price;
                        if (price > max) max = price;
                        hasPrice = true;
                    }
                });
            });

            if (hasPrice) {
                // AI결과(원) -> 저장(만원)
                // ⭐ 대표 가격이 있으면 그걸 min으로 사용
                const effectiveMin = representativePrice !== null ? representativePrice : min;
                const finalMin = effectiveMin >= 10000 ? Math.round(effectiveMin / 10000) : effectiveMin;
                const finalMax = max >= 10000 ? Math.round(max / 10000) : max;

                calculatedPriceRange = { min: finalMin, max: finalMax };
            }
        }

        const finalForm = {
            ...editForm,
            imageGallery: processedGallery,
            // Sync legacy 'images' with 'imageGallery' to prevent stale data resurrection
            images: processedGallery,
            priceRange: calculatedPriceRange,
            lastUpdated: new Date().toISOString() // 저장 시간 기록
        };

        let newFacilities;
        let singlePayload = finalForm;

        if (editingId) {
            newFacilities = facilities.map(f => f.id === editingId ? { ...f, ...finalForm } as Facility : f);
        } else {
            // New ID if empty
            const newId = finalForm.id || `new-${Date.now()}`;
            // IMPORTANT: Set ID on the payload object for the server!
            singlePayload = { ...finalForm, id: newId };
            newFacilities = [singlePayload as Facility, ...facilities];
        }
        setFacilities(newFacilities);

        // Optimize: Send Single Object
        await saveToServer(singlePayload as Facility);
        close();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/facilities?id=${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                setFacilities(prev => prev.filter(f => f.id !== id));
                alert('삭제되었습니다.');
            } else {
                alert('삭제 실패: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('삭제 중 오류가 발생했습니다.');
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
    // 🚀 PriceEditor는 파일 상단에 독립 컴포넌트로 분리됨

    // 🔧 Hydration 에러 방지: 클라이언트 마운트 확인
    if (isLoadingData) {
        return (
            <Box p="lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <Text c="dimmed">데이터 로딩 중...</Text>
            </Box>
        );
    }

    return (
        <Box p="lg">
            <Group justify="space-between" mb="lg">
                <Group>
                    <Title order={2}>시설 데이터 관리 (Admin)</Title>
                    {lastSavedTime && (
                        <Badge color="green" variant="light">
                            최종수정: {lastSavedTime}
                        </Badge>
                    )}
                </Group>
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
                                    const max = Math.max(...valid.map(f => f.priceRange?.min ?? 0));
                                    const f = valid.find(f => f.priceRange?.min === max);
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
                                    const min = Math.min(...valid.map(f => f.priceRange?.min ?? Infinity));
                                    const f = valid.find(f => f.priceRange?.min === min);
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
                <Select
                    placeholder="표시 개수"
                    data={[
                        { value: '10', label: '10개' },
                        { value: '50', label: '50개' },
                        { value: '100', label: '100개' },
                    ]}
                    value={String(itemsPerPage)}
                    onChange={(val) => { setItemsPerPage(Number(val) || 100); setActivePage(1); }}
                    style={{ width: 100 }}
                />
                <Select
                    placeholder="정렬"
                    data={[
                        { value: 'id-asc', label: 'ID 오름차순 ↑' },
                        { value: 'id-desc', label: 'ID 내림차순 ↓' },
                        { value: 'updated-desc', label: '수정일 최신순' },
                    ]}
                    value={sortOrder}
                    onChange={(val) => { setSortOrder((val as any) || 'id-asc'); setActivePage(1); }}
                    style={{ width: 140 }}
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
                                    <Table.Th style={{ width: 50 }}>No.</Table.Th>
                                    <Table.Th style={{ width: 100 }}>ID</Table.Th>
                                    <Table.Th style={{ width: 60 }}>구분</Table.Th>
                                    <Table.Th>시설명</Table.Th>
                                    <Table.Th>카테고리</Table.Th>
                                    <Table.Th>주소</Table.Th>
                                    <Table.Th>대표가격</Table.Th>
                                    <Table.Th>상세 상태</Table.Th>
                                    <Table.Th>최종수정</Table.Th>
                                    <Table.Th>마커표시</Table.Th>
                                    <Table.Th>관리</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {isLoadingData ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={8} align="center">데이터 로딩 중...</Table.Td>
                                    </Table.Tr>
                                ) : paginatedData.map((item, index) => (
                                    <Table.Tr key={item.id}>
                                        <Table.Td>
                                            <Text c="dimmed" size="sm">
                                                {(activePage - 1) * itemsPerPage + index + 1}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed" ff="monospace">{item.id}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge size="xs" color={item.isPublic ? 'blue' : 'pink'} variant="light">
                                                {item.isPublic ? '공설' : '사설'}
                                            </Badge>
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
                                                            item.category === 'FAMILY_GRAVE' ? 'orange' :
                                                                item.category === 'CREMATORIUM' ? 'grape' : 'gray'
                                                }
                                            >
                                                {FACILITY_CATEGORY_LABELS[item.category]}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td style={{ maxWidth: 200 }}><Text truncate>{item.address}</Text></Table.Td>
                                        <Table.Td>{(item as any).representativePrice ? formatKoreanCurrency((item as any).representativePrice) : (item as any).minPrice ? formatKoreanCurrency((item as any).minPrice) : '0원'}</Table.Td>
                                        <Table.Td>
                                            {(() => {
                                                const imgs = typeof item.images === 'string' ? (() => { try { return JSON.parse(item.images as string); } catch { return []; } })() : (item.images || []);
                                                return Array.isArray(imgs) && imgs.length > 0 ? (
                                                    <Badge size="sm" variant="dot" color="teal">이미지 {imgs.length}</Badge>
                                                ) : (
                                                    <Badge size="sm" variant="dot" color="gray">이미지 없음</Badge>
                                                );
                                            })()}
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">
                                                {(() => {
                                                    const updated = item.lastUpdated;
                                                    if (!updated) return '-';
                                                    // ISO 형식이면 날짜+시간으로 표시
                                                    if (updated.includes('T')) {
                                                        return new Date(updated).toLocaleString('ko-KR', {
                                                            timeZone: 'Asia/Seoul',
                                                            month: 'numeric',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        });
                                                    }
                                                    // 기존 YYYY-MM-DD 형식은 그대로
                                                    return updated;
                                                })()}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Switch
                                                size="sm"
                                                checked={item.isActive !== false}
                                                onChange={() => handleToggleMarker(item)}
                                                color={item.isActive !== false ? 'green' : 'gray'}
                                                onLabel="ON"
                                                offLabel="OFF"
                                            />
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

            {/* Edit Modal - 열려있을 때만 렌더링 */}
            {opened && (
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
                                {/* 마커 표시 On/Off */}
                                <Paper withBorder p="sm" radius="md" bg={editForm.isActive === false ? 'red.0' : 'green.0'}>
                                    <Group justify="space-between">
                                        <div>
                                            <Text fw={600} size="sm">마커 표시</Text>
                                            <Text size="xs" c="dimmed">지도에 이 시설의 마커를 표시합니다.</Text>
                                        </div>
                                        <Switch
                                            size="lg"
                                            checked={editForm.isActive !== false}
                                            onChange={(event) => setEditForm(prev => ({ ...prev, isActive: event.target.checked }))}
                                            onLabel="ON"
                                            offLabel="OFF"
                                            color={editForm.isActive === false ? 'red' : 'green'}
                                        />
                                    </Group>
                                </Paper>

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

                                {/* 사설/공설 구분 */}
                                <Box>
                                    <Text size="sm" fw={500} mb={3}>운영 형태</Text>
                                    <SegmentedControl
                                        fullWidth
                                        size="xs"
                                        value={editForm.isPublic ? 'public' : 'private'}
                                        onChange={(val) => setEditForm(prev => ({ ...prev, isPublic: val === 'public' }))}
                                        data={[
                                            { label: '🏢 사설', value: 'private' },
                                            { label: '🏛️ 공설', value: 'public' },
                                        ]}
                                        color={editForm.isPublic ? 'blue' : 'green'}
                                    />
                                </Box>

                                <Select
                                    label="카테고리"
                                    data={Object.entries(FACILITY_CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                                    value={editForm.category}
                                    onChange={(val) => setEditForm(prev => ({ ...prev, category: val as any }))}
                                />

                                <NumberInput
                                    label="총매장능력 (단위: 기)"
                                    description="전체 안치 가능한 기수(숫자만 입력)"
                                    value={editForm.capacity}
                                    onChange={(val) => setEditForm(prev => ({ ...prev, capacity: typeof val === 'number' ? val : undefined }))}
                                    thousandSeparator=","
                                    min={0}
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


                                {/* 시설 정보 추가 (팩스, 총매장능력, 업데이트) */}
                                <Group grow>
                                    <TextInput
                                        label="전화번호"
                                        value={editForm.phone || ''}
                                        placeholder="예: 055-123-4567"
                                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                    <TextInput
                                        label="총매장능력"
                                        value={editForm.capacity || ''}
                                        placeholder="예: 10,000기"
                                        onChange={(e) => setEditForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                                    />
                                    <TextInput
                                        label="데이터 업데이트"
                                        value={editForm.lastUpdated || ''}
                                        placeholder="YYYY-MM-DD"
                                        onChange={(e) => setEditForm(prev => ({ ...prev, lastUpdated: e.target.value }))}
                                    />
                                </Group>
                                <TextInput
                                    label="홈페이지 URL"
                                    placeholder="https://example.com"
                                    value={editForm.websiteUrl || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, websiteUrl: e.target.value }))}
                                />
                                <TextInput
                                    label="설명"
                                    value={editForm.description || ''}
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

                                    <SegmentedControl
                                        fullWidth
                                        value={activeMajorTab}
                                        onChange={setActiveMajorTab}
                                        data={[
                                            { label: '매장묘 (Burial)', value: '매장묘' },
                                            { label: '봉안(납골) (Charnel)', value: '봉안' },
                                            { label: '수목장(자연장) (Natural)', value: '수목장' },
                                            { label: '기타/공통', value: '기타' },
                                            { label: '제외됨', value: '제외됨' },
                                        ]}
                                        mb="md"
                                    />

                                    {/* 2뎁스 유형 선택 버튼 */}
                                    {activeMajorTab === '봉안' && (
                                        <Group gap="xs" mb="md">
                                            <Text size="xs" c="dimmed" mr="xs">유형:</Text>
                                            {['봉안당', '봉안담', '봉안묘'].map(type => (
                                                <Button
                                                    key={type}
                                                    size="xs"
                                                    variant="light"
                                                    color="gray"
                                                    radius="xl"
                                                    onClick={() => {
                                                        const priceTable = editForm.priceInfo?.priceTable || {};
                                                        if (priceTable[type]) {
                                                            alert(`'${type}' 카테고리가 이미 있습니다.`);
                                                            return;
                                                        }
                                                        setEditForm({
                                                            ...editForm,
                                                            priceInfo: {
                                                                ...editForm.priceInfo,
                                                                priceTable: {
                                                                    ...priceTable,
                                                                    [type]: { rows: [], unit: '' }
                                                                }
                                                            }
                                                        });
                                                    }}
                                                >
                                                    + {type}
                                                </Button>
                                            ))}
                                        </Group>
                                    )}
                                    {activeMajorTab === '수목장' && (
                                        <Group gap="xs" mb="md">
                                            <Text size="xs" c="dimmed" mr="xs">유형:</Text>
                                            {['수목형', '잔디형', '화초형', '암석형'].map(type => (
                                                <Button
                                                    key={type}
                                                    size="xs"
                                                    variant="light"
                                                    color="gray"
                                                    radius="xl"
                                                    onClick={() => {
                                                        const priceTable = editForm.priceInfo?.priceTable || {};
                                                        if (priceTable[type]) {
                                                            alert(`'${type}' 카테고리가 이미 있습니다.`);
                                                            return;
                                                        }
                                                        setEditForm({
                                                            ...editForm,
                                                            priceInfo: {
                                                                ...editForm.priceInfo,
                                                                priceTable: {
                                                                    ...priceTable,
                                                                    [type]: { rows: [], unit: '' }
                                                                }
                                                            }
                                                        });
                                                    }}
                                                >
                                                    + {type}
                                                </Button>
                                            ))}
                                        </Group>
                                    )}
                                    {activeMajorTab === '매장묘' && (
                                        <Group gap="xs" mb="md">
                                            <Text size="xs" c="dimmed" mr="xs">유형:</Text>
                                            {['단장형', '합장형', '쌍분형', '복합묘', '평장묘'].map(type => (
                                                <Button
                                                    key={type}
                                                    size="xs"
                                                    variant="light"
                                                    color="gray"
                                                    radius="xl"
                                                    onClick={() => {
                                                        const priceTable = editForm.priceInfo?.priceTable || {};
                                                        if (priceTable[type]) {
                                                            alert(`'${type}' 카테고리가 이미 있습니다.`);
                                                            return;
                                                        }
                                                        setEditForm({
                                                            ...editForm,
                                                            priceInfo: {
                                                                ...editForm.priceInfo,
                                                                priceTable: {
                                                                    ...priceTable,
                                                                    [type]: { rows: [], unit: '' }
                                                                }
                                                            }
                                                        });
                                                    }}
                                                >
                                                    + {type}
                                                </Button>
                                            ))}
                                        </Group>
                                    )}

                                    {(() => {
                                        // 기본 카테고리 정의
                                        const defaultCategories: Record<string, string[]> = {
                                            '매장묘': ['단장형', '합장형', '쌍분형', '복합묘', '평장묘'],
                                            '봉안': ['봉안당', '봉안담', '봉안묘'],
                                            '수목장': ['수목형', '잔디형', '화초형', '암석형'],
                                            '기타': [],
                                            '제외됨': []
                                        };

                                        const priceTable = editForm.priceInfo?.priceTable || {};

                                        // 현재 탭에 해당하는 기존 카테고리
                                        const existingCats = Object.keys(priceTable).filter(catName => {
                                            let group = '기타';
                                            if (catName === '제외됨') group = '제외됨';
                                            else if (/매장|묘지|석물|작업|봉분|둘레석|단장|합장|쌍분|복합묘|평장/.test(catName)) group = '매장묘';
                                            else if (/기본비용/.test(catName)) group = '매장묘';
                                            else if (/봉안|납골|유골/.test(catName)) group = '봉안';
                                            else if (/수목|자연|잔디|화초|암석/.test(catName)) group = '수목장';
                                            return group === activeMajorTab;
                                        });

                                        // 기본 카테고리 + 기존 카테고리 병합 (중복 제거)
                                        const defaults = defaultCategories[activeMajorTab] || [];
                                        const allCats = [...new Set([...defaults, ...existingCats])];

                                        return (
                                            <Accordion
                                                key={activeMajorTab}
                                                variant="separated"
                                                multiple
                                                defaultValue={allCats}
                                            >
                                                {allCats.map(catName => {
                                                    const catData = priceTable[catName] || { rows: [], unit: '' };
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
                                                        <Accordion.Item key={catName} value={catName}>
                                                            <Accordion.Control icon={<List size={16} />}>
                                                                <Group justify="space-between">
                                                                    <Text fw={700}>{catName}</Text>
                                                                    <Badge color="gray" variant="light">{catData.rows?.length || 0} 항목</Badge>
                                                                </Group>
                                                            </Accordion.Control>
                                                            <Accordion.Panel>
                                                                <Tabs
                                                                    value={activeGroupTab[catName] || groupNames[0] || '미분류'}
                                                                    onChange={(val) => setActiveGroupTab(prev => ({ ...prev, [catName]: val || '' }))}
                                                                >
                                                                    {/* Tab List - 탭 헤더 */}
                                                                    <Tabs.List mb="md">
                                                                        {groupNames.map((groupName, idx) => (
                                                                            <Tabs.Tab
                                                                                key={idx}
                                                                                value={groupName}
                                                                                rightSection={<Badge size="xs" variant="light">{itemsByGroup[groupName].length}</Badge>}
                                                                            >
                                                                                {groupName}
                                                                            </Tabs.Tab>
                                                                        ))}
                                                                        {/* 새 그룹 추가 버튼을 탭처럼 표시 */}
                                                                        <Button
                                                                            variant="subtle"
                                                                            size="xs"
                                                                            leftSection={<Plus size={14} />}
                                                                            ml="xs"
                                                                            onClick={() => {
                                                                                const newGroupName = `새 그룹 ${groupNames.length + 1}`;
                                                                                const newRow = { name: '', price: 0, groupType: newGroupName };
                                                                                const currentPriceTable = editForm.priceInfo?.priceTable || {};
                                                                                const currentCatData = currentPriceTable[catName] || { rows: [], unit: '' };
                                                                                setEditForm({
                                                                                    ...editForm,
                                                                                    priceInfo: {
                                                                                        ...editForm.priceInfo,
                                                                                        priceTable: {
                                                                                            ...currentPriceTable,
                                                                                            [catName]: { ...currentCatData, rows: [...(currentCatData.rows || []), newRow] }
                                                                                        }
                                                                                    }
                                                                                });
                                                                            }}
                                                                        >
                                                                            새 그룹
                                                                        </Button>
                                                                    </Tabs.List>

                                                                    {/* Tab Panels */}
                                                                    {groupNames.map((groupName, groupIdx) => {
                                                                        const rows = itemsByGroup[groupName];

                                                                        return (
                                                                            <Tabs.Panel key={groupIdx} value={groupName}>
                                                                                <Paper p="md" withBorder>
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
                                                                                                    // Update activeGroupTab to the new name
                                                                                                    setActiveGroupTab(prev => ({ ...prev, [catName]: newName }));
                                                                                                    setEditForm({
                                                                                                        ...editForm,
                                                                                                        priceInfo: {
                                                                                                            ...editForm.priceInfo,
                                                                                                            priceTable: {
                                                                                                                ...(editForm.priceInfo?.priceTable || {}),
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
                                                                                                {/* 대표 가격 설정 버튼 (별) */}
                                                                                                <Stack gap={2} mr="xs">
                                                                                                    <ActionIcon
                                                                                                        size="sm"
                                                                                                        variant="subtle"
                                                                                                        color={row.isRepresentative ? 'yellow' : 'gray'}
                                                                                                        onClick={() => {
                                                                                                            // [Fixed Logic] Radio Button per Category
                                                                                                            const newPriceTable = { ...editForm.priceInfo?.priceTable };
                                                                                                            const currentCat = newPriceTable[catName];

                                                                                                            if (currentCat && currentCat.rows) {
                                                                                                                let updatedRows = [...currentCat.rows];

                                                                                                                // Find the actual index in the full array
                                                                                                                const targetRow = rows[itemIdx];
                                                                                                                const actualIndex = updatedRows.findIndex((r: any) => r === targetRow);

                                                                                                                if (actualIndex === -1) return;

                                                                                                                const wasActive = updatedRows[actualIndex].isRepresentative;

                                                                                                                if (wasActive) {
                                                                                                                    // Toggle Off
                                                                                                                    updatedRows[actualIndex] = { ...updatedRows[actualIndex], isRepresentative: false };
                                                                                                                } else {
                                                                                                                    // Toggle On (Radio Style in this category)
                                                                                                                    updatedRows = updatedRows.map((r, i) => ({
                                                                                                                        ...r,
                                                                                                                        isRepresentative: i === actualIndex
                                                                                                                    }));
                                                                                                                }

                                                                                                                newPriceTable[catName] = { ...currentCat, rows: updatedRows };

                                                                                                                setEditForm({
                                                                                                                    ...editForm,
                                                                                                                    priceInfo: {
                                                                                                                        ...editForm.priceInfo!,
                                                                                                                        priceTable: newPriceTable
                                                                                                                    }
                                                                                                                });
                                                                                                            }
                                                                                                        }}
                                                                                                        style={{ marginTop: itemIdx === 0 ? 30 : 6 }}
                                                                                                    >
                                                                                                        <Star size={16} fill={row.isRepresentative ? "currentColor" : "none"} />
                                                                                                    </ActionIcon>
                                                                                                </Stack>

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
                                                                                                    placeholder="상품명 (예: 개인단)"
                                                                                                    value={row.name || ''}
                                                                                                    onChange={(e) => {
                                                                                                        // Update specific item in catData.rows (preserve all groups)
                                                                                                        const targetRow = rows[itemIdx];
                                                                                                        const fullRows = catData.rows || [];
                                                                                                        const targetIndex = fullRows.findIndex((r: any) => r === targetRow);
                                                                                                        if (targetIndex === -1) return;
                                                                                                        const newRows = [...fullRows];
                                                                                                        newRows[targetIndex] = { ...newRows[targetIndex], name: e.target.value };
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
                                                                                                    placeholder="설명 (선택)"
                                                                                                    value={row.grade || ''}
                                                                                                    onChange={(e) => {
                                                                                                        const targetRow = rows[itemIdx];
                                                                                                        const fullRows = catData.rows || [];
                                                                                                        const targetIndex = fullRows.findIndex((r: any) => r === targetRow);
                                                                                                        if (targetIndex === -1) return;
                                                                                                        const newRows = [...fullRows];
                                                                                                        newRows[targetIndex] = { ...newRows[targetIndex], grade: e.target.value };
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
                                                                                                    value={row.price ?? 0}
                                                                                                    onChange={(val) => {
                                                                                                        const targetRow = rows[itemIdx];
                                                                                                        const fullRows = catData.rows || [];
                                                                                                        const targetIndex = fullRows.findIndex((r: any) => r === targetRow);
                                                                                                        if (targetIndex === -1) return;
                                                                                                        const newRows = [...fullRows];
                                                                                                        newRows[targetIndex] = { ...newRows[targetIndex], price: Number(val) || 0 };
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
                                                                                                            const targetRow = rows[itemIdx];
                                                                                                            const fullRows = catData.rows || [];
                                                                                                            const targetIndex = fullRows.findIndex((r: any) => r === targetRow);
                                                                                                            if (targetIndex === -1) return;
                                                                                                            const newRows = [...fullRows];
                                                                                                            newRows[targetIndex] = { ...newRows[targetIndex], size: e.target.value };
                                                                                                            setEditForm({
                                                                                                                ...editForm,
                                                                                                                priceInfo: {
                                                                                                                    ...editForm.priceInfo,
                                                                                                                    priceTable: {
                                                                                                                        ...(editForm.priceInfo?.priceTable || {}),
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
                                                                                                            ...(editForm.priceInfo?.priceTable || {}),
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
                                                                                                const newRow = { name: '', grade: '', price: 0, groupType: groupName };
                                                                                                setEditForm({
                                                                                                    ...editForm,
                                                                                                    priceInfo: {
                                                                                                        ...editForm.priceInfo,
                                                                                                        priceTable: {
                                                                                                            ...(editForm.priceInfo?.priceTable || {}),
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
                                                                            </Tabs.Panel>
                                                                        );
                                                                    })}
                                                                </Tabs>
                                                            </Accordion.Panel>
                                                        </Accordion.Item>
                                                    );
                                                })}
                                            </Accordion>
                                        );
                                    })()}
                                </Box>
                            ) : (
                                <PriceEditor
                                    initialPriceTable={editForm.priceInfo?.priceTable}
                                    onChange={(newTable) => setEditForm(prev => ({
                                        ...prev,
                                        priceInfo: { ...prev.priceInfo!, priceTable: newTable }
                                    }))}
                                />
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
                                <FileButton onChange={(files) => {
                                    if (files) {
                                        // Handle multiple files
                                        const newUrls = files.map(file => URL.createObjectURL(file));
                                        setEditForm(prev => ({ ...prev, imageGallery: [...(prev.imageGallery || []), ...newUrls] }));
                                    }
                                }} accept="image/png,image/jpeg" multiple>
                                    {(props) => (
                                        <Button {...props} variant="outline" h={50} color="gray" leftSection={<ImageIcon size={20} />}>
                                            이미지 추가 (여러장 가능)
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
            )}
        </Box>
    );
}
