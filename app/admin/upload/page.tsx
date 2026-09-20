'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import {
    Title, Text, Group, Button, Paper, TextInput, ActionIcon,
    Table, Badge, Select, ScrollArea,
    Tabs, SimpleGrid,
    Pagination, Box, Switch, Progress
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import {
    Search, Plus, Pencil, Trash,
    Building2, MessageSquare, TrendingUp, TrendingDown
} from 'lucide-react';
import { Facility, FACILITY_CATEGORY_LABELS } from '@/types';
import { formatKoreanCurrency } from '@/lib/format';
import dynamic from 'next/dynamic';

const FacilityEditModal = dynamic(() => import('./FacilityEditModal'), { ssr: false });


function formatRowPrice(item: Facility): string {
    const rp = item.representativePrice || 0;
    const mp = item.minPrice || 0;
    const price = rp > 0 ? rp : mp;
    if (!price) return '0원';
    const normalized = price < 10000 ? price * 10000 : price;
    return formatKoreanCurrency(normalized);
}

function getImageCount(images: any): number {
    if (!images) return 0;
    if (Array.isArray(images)) return images.length;
    if (typeof images === 'string') {
        try {
            const parsed = JSON.parse(images);
            return Array.isArray(parsed) ? parsed.length : 0;
        } catch {
            return 0;
        }
    }
    return 0;
}

function formatRowDate(updated: string | undefined): string {
    if (!updated) return '-';
    if (updated.includes('T')) {
        return updated.replace('T', ' ').substring(5, 16);
    }
    return updated;
}


export default function AdminPage() {
    // State
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch] = useDebouncedValue(searchQuery, 300); // 🚀 검색어 디바운스
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [priceVerifyFilter, setPriceVerifyFilter] = useState<string | null>(null);
    const [activePage, setActivePage] = useState(1);

    // Modal State - 🚀 모달은 FacilityEditModal로 완전 독립
    const [opened, { open, close }] = useDisclosure(false);
    const [facilityToEdit, setFacilityToEdit] = useState<Facility | null>(null);
    const [editIndex, setEditIndex] = useState<number>(-1);
    const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
        const now = new Date();
        return `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    });

    // 정렬 상태
    const [sortOrder, setSortOrder] = useState<'id-asc' | 'id-desc' | 'updated-desc'>('id-asc');

    const [itemsPerPage, setItemsPerPage] = useState(() => {
        if (typeof window !== 'undefined') {
            return Number(localStorage.getItem('adminItemsPerPage')) || 25;
        }
        return 25;
    });

    // localStorage에 저장
    useEffect(() => {
        localStorage.setItem('adminItemsPerPage', String(itemsPerPage));
    }, [itemsPerPage]);

    // 전체 통계 상태 (경량 /api/admin/stats 활용)
    const [dashboardStats, setDashboardStats] = useState({
        totalCount: 0,
        totalReviews: 0,
        categoryCounts: {} as Record<string, number>,
    });

    // 1. 대시보드 통계 로드 (마운트 시 1회)
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const json = await res.json();
                    if (json.stats) {
                        setDashboardStats({
                            totalCount: json.stats.totalFacilities || 0,
                            totalReviews: json.stats.reviewsCount || 0,
                            categoryCounts: json.categoryCounts || {},
                        });
                    }
                }
            } catch (e) {
                console.error('Stats load error:', e);
            }
        };
        fetchStats();
    }, []);

    // 2. 서버 사이드 데이터 로드 (페이지, 필터, 정렬 변경 시 실시간 요청)
    const loadFacilities = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const params = new URLSearchParams({
                page: String(activePage),
                limit: String(itemsPerPage),
                sortBy: sortOrder === 'updated-desc' ? 'lastUpdated' : 'id',
                sortOrder: sortOrder.endsWith('desc') ? 'desc' : 'asc',
            });
            if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
            if (categoryFilter) params.set('category', categoryFilter);
            if (priceVerifyFilter) params.set('priceVerified', priceVerifyFilter);

            const res = await fetch(`/api/admin/facilities?${params.toString()}`);
            if (!res.ok) throw new Error(await res.text());
            const json = await res.json();
            setFacilities(json.data || []);
            setTotalCount(json.pagination?.total || 0);
            setTotalPages(json.pagination?.totalPages || 1);
        } catch (e) {
            console.error('Data load failed:', e);
            notifications.show({ color: 'red', title: '로드 실패', message: '데이터를 불러오지 못했습니다.' });
        } finally {
            setIsLoadingData(false);
        }
    }, [activePage, itemsPerPage, debouncedSearch, categoryFilter, priceVerifyFilter, sortOrder]);

    useEffect(() => {
        loadFacilities();
    }, [loadFacilities]);

    // 검색어/필터/정렬 변경 시 1페이지로 리셋
    useEffect(() => {
        setActivePage(1);
    }, [debouncedSearch, categoryFilter, priceVerifyFilter, sortOrder, itemsPerPage]);

    // 마커 표시 토글 핸들러 - isActive만 직접 업데이트 (전체 upsert 방지)
    const handleToggleMarker = async (item: Facility) => {
        const newIsActive = item.isActive === false ? true : false;
        const updatedItem = { ...item, isActive: newIsActive };

        // 로컬 상태 업데이트
        setFacilities(prev => prev.map(f => f.id === item.id ? updatedItem : f));

        // 서버에 isActive만 직접 PATCH (lat/lng 등 누락 방지)
        try {
            const res = await fetch(`/api/facilities/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newIsActive })
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt);
            }
            const now = new Date();
            setLastSavedTime(`${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
        } catch (e) {
            console.error('Toggle failed:', e);
            notifications.show({ color: 'red', title: '저장 실패', message: '서버 저장에 실패했습니다: ' + String(e) });
            // 실패 시 롤백
            setFacilities(prev => prev.map(f => f.id === item.id ? item : f));
        }
    };

    // Handlers
    const handleEdit = useCallback((facility: Facility) => {
        const idx = facilities.findIndex(f => f.id === facility.id);
        setEditIndex(idx);
        setFacilityToEdit(facility);
        open();
    }, [open, facilities]);

    const handleCreate = useCallback(() => {
        setFacilityToEdit(null); // null = 새 시설
        open();
    }, [open]);

    // 모달에서 저장 완료 시 콜백
    const handleModalSaved = useCallback((savedFacility: Facility, isNew: boolean) => {
        if (isNew) {
            setFacilities(prev => [savedFacility, ...prev]);
            setTotalCount(prev => prev + 1);
        } else {
            setFacilities(prev => prev.map(f => f.id === savedFacility.id ? { ...f, ...savedFacility } : f));
        }
        const now = new Date();
        setLastSavedTime(`${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
    }, []);

    // 모달 네비게이션 (이전/다음 시설)
    const handleNavigate = useCallback((direction: 'prev' | 'next') => {
        const newIndex = direction === 'next' ? editIndex + 1 : editIndex - 1;
        if (newIndex >= 0 && newIndex < facilities.length) {
            setEditIndex(newIndex);
            setFacilityToEdit(facilities[newIndex]);
        }
    }, [editIndex, facilities]);

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/facilities?id=${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                setFacilities(prev => prev.filter(f => f.id !== id));
                notifications.show({ color: 'green', title: '삭제 완료', message: '시설이 삭제되었습니다.' });
            } else {
                notifications.show({ color: 'red', title: '삭제 실패', message: data.error || 'Unknown error' });
            }
        } catch (err) {
            console.error('Delete error:', err);
            notifications.show({ color: 'red', title: '삭제 오류', message: '삭제 중 오류가 발생했습니다.' });
        }
    };


    // 검토 통계 (대시보드)
    const categoryCountSummary = useMemo(() => {
        return Object.entries(dashboardStats.categoryCounts || {}).length;
    }, [dashboardStats.categoryCounts]);

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
                            <Text c="dimmed" size="xs">현재 조건 시설 수</Text>
                            <Text fw={700} size="xl">{totalCount.toLocaleString()}개</Text>
                        </div>
                        <Building2 size={24} color="#339af0" />
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group justify="space-between">
                        <div>
                            <Text c="dimmed" size="xs">전체 DB 시설 수</Text>
                            <Text fw={700} size="xl">{dashboardStats.totalCount.toLocaleString()}개</Text>
                        </div>
                        <Building2 size={24} color="#adb5bd" />
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group justify="space-between">
                        <div>
                            <Text c="dimmed" size="xs">총 리뷰 수</Text>
                            <Text fw={700} size="xl">{dashboardStats.totalReviews.toLocaleString()}개</Text>
                        </div>
                        <MessageSquare size={24} color="#adb5bd" />
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group justify="space-between">
                        <div>
                            <Text c="dimmed" size="xs">운영 카테고리 수</Text>
                            <Text fw={700} size="xl">{categoryCountSummary}개 분야</Text>
                        </div>
                        <TrendingUp size={24} color="#40c057" />
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
                    placeholder="가격 검토"
                    data={[
                        { value: 'verified', label: '✅ 검토완료' },
                        { value: 'unverified', label: '⚠️ 미검토' },
                    ]}
                    clearable
                    value={priceVerifyFilter}
                    onChange={setPriceVerifyFilter}
                    style={{ width: 130 }}
                />
                <Select
                    placeholder="표시 개수"
                    data={[
                        { value: '10', label: '10개' },
                        { value: '25', label: '25개' },
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
                    <Tabs.Tab value="reviews" leftSection={<MessageSquare size={14} />}>전체 리뷰 관리 ({dashboardStats.totalReviews})</Tabs.Tab>
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
                                    <Table.Th style={{ width: 60 }}>가격검토</Table.Th>
                                    <Table.Th>관리</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {isLoadingData ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={12} align="center" py="xl">
                                            <Text c="dimmed">데이터를 불러오는 중입니다...</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ) : facilities.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={12} align="center" py="xl">
                                            <Text c="dimmed">조건에 일치하는 시설이 없습니다.</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ) : facilities.map((item, index) => (
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
                                                {item._hasDetailedPrices && (
                                                    <Badge size="xs" color="cyan" variant="light">DB</Badge>
                                                )}
                                                {item.isFull && (
                                                    <Badge size="xs" color="dark" variant="filled">만장</Badge>
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
                                        <Table.Td>{formatRowPrice(item)}</Table.Td>
                                        <Table.Td>
                                            {(() => {
                                                const imgCount = getImageCount(item.images);
                                                return imgCount > 0 ? (
                                                    <Badge size="sm" variant="dot" color="teal">이미지 {imgCount}</Badge>
                                                ) : (
                                                    <Badge size="sm" variant="dot" color="gray">이미지 없음</Badge>
                                                );
                                            })()}
                                        </Table.Td>

                                        <Table.Td>
                                            <Text size="xs" c="dimmed">
                                                {formatRowDate(item.lastUpdated)}
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
                                        <Table.Td ta="center">
                                            {item.priceInfo?.priceVerified ? (
                                                <Badge size="xs" color="green" variant="filled">✅</Badge>
                                            ) : (
                                                <Badge size="xs" color="orange" variant="light">⚠️</Badge>
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
                    <Group justify="space-between" mt="md">
                        <Text size="sm" c="dimmed">
                            총 {totalCount.toLocaleString()}개 시설 중 {totalCount > 0 ? (activePage - 1) * itemsPerPage + 1 : 0} - {Math.min(activePage * itemsPerPage, totalCount)}번째 표시
                        </Text>
                        <Pagination total={totalPages} value={activePage} onChange={setActivePage} />
                    </Group>
                </Tabs.Panel>

                <Tabs.Panel value="reviews">
                    <Paper shadow="sm" radius="md" withBorder p="md">
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>등록된 사용자 리뷰</Text>
                            <Button component="a" href="/admin/reviews" variant="light" size="xs">
                                리뷰 전용 관리 페이지 열기 →
                            </Button>
                        </Group>
                    </Paper>
                </Tabs.Panel>
            </Tabs>

            {/* 🚀 Edit Modal - 완전 독립 컴포넌트 */}
            <FacilityEditModal
                facilityToEdit={facilityToEdit}
                opened={opened}
                onClose={close}
                onSaved={handleModalSaved}
                onNavigate={handleNavigate}
                currentIndex={editIndex >= 0 ? (activePage - 1) * itemsPerPage + editIndex : undefined}
                totalCount={totalCount}
            />
        </Box >
    );
}
