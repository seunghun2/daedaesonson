'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import FacilityEditModal from './FacilityEditModal';



// 🚀 모달은 FacilityEditModal.tsx로 완전 분리됨


export default function AdminPage() {
    // State
    const [facilities, setFacilities] = useState<Facility[]>([]);
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
            const matchSearch = !query || item.name.toLowerCase().includes(query) || item.address.toLowerCase().includes(query);
            const matchCategory = categoryFilter ? item.category === categoryFilter : true;
            const matchVerify = priceVerifyFilter === 'verified'
                ? item.priceInfo?.priceVerified === true
                : priceVerifyFilter === 'unverified'
                    ? !item.priceInfo?.priceVerified
                    : true;
            return matchSearch && matchCategory && matchVerify;
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
    }, [facilities, searchQuery, categoryFilter, priceVerifyFilter, sortOrder]);

    // Pagination Logic
    const paginatedData = useMemo(() => {
        const start = (activePage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, activePage]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Handlers
    // 🚀 handleEdit/handleCreate는 이제 단순히 모달을 열기만 함
    const handleEdit = useCallback((facility: Facility) => {
        const idx = filteredData.findIndex(f => f.id === facility.id);
        setEditIndex(idx);
        setFacilityToEdit(facility);
        open();
    }, [open, filteredData]);

    const handleCreate = useCallback(() => {
        setFacilityToEdit(null); // null = 새 시설
        open();
    }, [open]);

    // 모달에서 저장 완료 시 콜백
    const handleModalSaved = useCallback((savedFacility: Facility, isNew: boolean) => {
        if (isNew) {
            setFacilities(prev => [savedFacility, ...prev]);
        } else {
            setFacilities(prev => prev.map(f => f.id === savedFacility.id ? { ...f, ...savedFacility } : f));
        }
        // 캐시 업데이트
        const now = new Date();
        setLastSavedTime(`${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
    }, []);

    // 모달 네비게이션 (이전/다음 시설)
    const handleNavigate = useCallback((direction: 'prev' | 'next') => {
        const newIndex = direction === 'next' ? editIndex + 1 : editIndex - 1;
        if (newIndex >= 0 && newIndex < filteredData.length) {
            setEditIndex(newIndex);
            setFacilityToEdit(filteredData[newIndex]);
        }
    }, [editIndex, filteredData]);

    // 검토 진행률 계산
    const reviewStats = useMemo(() => {
        const total = facilities.length;
        const reviewed = facilities.filter(f => f.priceInfo?.priceVerified === true).length;
        return { total, reviewed, percent: total > 0 ? Math.round(reviewed / total * 100 * 10) / 10 : 0 };
    }, [facilities]);

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

            {/* 검토 진행률 */}
            <Paper withBorder p="md" radius="md" mb="xl" bg="blue.0" style={{ borderColor: '#339af0', borderStyle: 'solid' }}>
                <Group justify="space-between" mb="xs">
                    <Text fw={700} size="sm">📊 가격 검토 진행률</Text>
                    <Text size="sm" fw={600} c="blue">
                        {reviewStats.reviewed} / {reviewStats.total}개 검토완료 ({reviewStats.percent}%)
                    </Text>
                </Group>
                <Progress value={reviewStats.percent} size="lg" radius="xl" color="blue" />
            </Paper>

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
                                    <Table.Th style={{ width: 60 }}>가격검토</Table.Th>
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

            {/* 🚀 Edit Modal - 완전 독립 컴포넌트 */}
            <FacilityEditModal
                facilityToEdit={facilityToEdit}
                opened={opened}
                onClose={close}
                onSaved={handleModalSaved}
                onNavigate={handleNavigate}
                currentIndex={editIndex}
                totalCount={filteredData.length}
            />
        </Box >
    );
}
