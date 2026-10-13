'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, TextInput, Group, Button, Table, Badge, ActionIcon,
    Paper, Pagination, Text, LoadingOverlay, ScrollArea, Tooltip
} from '@mantine/core';
import { Search, Edit, Trash, Plus, ExternalLink } from 'lucide-react';
import { FACILITY_CATEGORY_LABELS, Facility } from '@/types';
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const FacilityEditModal = dynamic(() => import('../upload/FacilityEditModal'), { ssr: false });

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function FacilitiesPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [searchTarget, setSearchTarget] = useState<string>('all');
    const [page, setPage] = useState(1);
    const itemsPerPage = 15;

    const [data, setData] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 15, total: 0, totalPages: 0 });

    const [sortBy, setSortBy] = useState<string>('id');
    const [sortOrder, setSortOrder] = useState<string>('asc');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    // 모달 상태 (시설 추가 / 수정)
    const [opened, { open, close }] = useDisclosure(false);
    const [facilityToEdit, setFacilityToEdit] = useState<Facility | null>(null);
    const [editIndex, setEditIndex] = useState<number>(-1);

    // 서버 사이드 데이터 불러오기
    const fetchFacilities = useCallback(async (searchTerm?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(itemsPerPage),
                search: searchTerm ?? search,
                searchTarget,
                category: filterCategory,
                sortBy,
                sortOrder
            });

            const res = await fetch(`/api/admin/facilities?${params}`);
            if (res.ok) {
                const json = await res.json();
                setData(json.data || []);
                setPagination(json.pagination || { page: 1, limit: 15, total: 0, totalPages: 0 });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, search, searchTarget, filterCategory, sortBy, sortOrder, itemsPerPage]);

    // 검색 디바운스
    const debouncedSearch = useDebouncedCallback((value: string) => {
        setPage(1); // 검색 시 첫 페이지로
        fetchFacilities(value);
    }, 300);

    // 필터/정렬/페이지 변경 시 데이터 로드
    useEffect(() => {
        fetchFacilities();
    }, [page, filterCategory, sortBy, sortOrder, fetchFacilities]);

    // 검색어 변경 시
    const handleSearchChange = (value: string) => {
        setSearch(value);
        debouncedSearch(value);
    };

    // 시설 추가 모달 열기
    const handleCreate = useCallback(() => {
        setEditIndex(-1);
        setFacilityToEdit(null);
        open();
    }, [open]);

    // 시설 수정 모달 열기
    const handleEdit = useCallback((facility: Facility, idx: number) => {
        setEditIndex(idx);
        setFacilityToEdit(facility);
        open();
    }, [open]);

    // 모달 저장 완료 콜백
    const handleModalSaved = useCallback((savedFacility: Facility, isNew: boolean) => {
        if (isNew) {
            setData(prev => [savedFacility, ...prev]);
            setPagination(prev => ({ ...prev, total: prev.total + 1 }));
        } else {
            setData(prev => prev.map(item => item.id === savedFacility.id ? { ...item, ...savedFacility } : item));
        }
    }, []);

    // 모달 이전/다음 시설 네비게이션
    const handleNavigate = useCallback((direction: 'prev' | 'next') => {
        const nextIdx = direction === 'next' ? editIndex + 1 : editIndex - 1;
        if (nextIdx >= 0 && nextIdx < data.length) {
            setEditIndex(nextIdx);
            setFacilityToEdit(data[nextIdx]);
        }
    }, [editIndex, data]);

    // 시설 삭제 핸들러
    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 시설을 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/facilities/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('삭제되었습니다.');
                // UI에서 즉시 제거
                setData(prev => prev.filter(item => item.id !== id));
                setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
            } else {
                alert('삭제 실패');
            }
        } catch (e) {
            console.error(e);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    return (
        <div>
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2} c="#0F172A">시설 빠른 목록</Title>
                    <Text size="sm" c="dimmed">빠른 조회 및 시설 정보 즉시 수정</Text>
                </div>
                <Group gap="xs">
                    <Button
                        variant="light"
                        color="gray"
                        leftSection={<ExternalLink size={16} />}
                        onClick={() => router.push('/admin/upload')}
                    >
                        통합관리 뷰 열기
                    </Button>
                    <Button
                        leftSection={<Plus size={16} />}
                        style={{ backgroundColor: '#2563EB' }}
                        onClick={handleCreate}
                    >
                        시설 추가
                    </Button>
                </Group>
            </Group>

            <Paper p="md" radius="md" withBorder mb="lg" bg="white">
                <Group align="flex-end" mb="md">
                    {/* 검색 영역 */}
                    <div style={{ flex: 1 }}>
                        <Text size="xs" fw={500} mb={4}>검색</Text>
                        <Group gap="xs">
                            <select
                                style={{
                                    height: 36,
                                    borderRadius: 4,
                                    borderColor: '#ced4da',
                                    padding: '0 8px'
                                }}
                                value={searchTarget}
                                onChange={(e) => {
                                    setSearchTarget(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="all">전체</option>
                                <option value="id">No. (ID)</option>
                                <option value="name">시설명</option>
                                <option value="address">주소</option>
                            </select>
                            <TextInput
                                placeholder="검색어 입력 (서버 검색)"
                                leftSection={<Search size={16} />}
                                value={search}
                                onChange={(e) => handleSearchChange(e.currentTarget.value)}
                                style={{ flex: 1 }}
                            />
                        </Group>
                    </div>

                    {/* 필터 영역 */}
                    <div>
                        <Text size="xs" fw={500} mb={4}>카테고리</Text>
                        <select
                            style={{ height: 36, borderRadius: 4, borderColor: '#ced4da', padding: '0 8px', width: 120 }}
                            value={filterCategory}
                            onChange={(e) => {
                                setFilterCategory(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="all">모든 카테고리</option>
                            {Object.entries(FACILITY_CATEGORY_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </Group>

                <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                        총 <Text span fw={700} c="dark">{pagination.total.toLocaleString()}</Text>개 중 {data.length}개 표시
                    </Text>

                    {/* 정렬 영역 */}
                    <Group gap="xs">
                        <Text size="xs" c="dimmed">정렬:</Text>
                        <select
                            style={{ height: 30, borderRadius: 4, borderColor: '#dee2e6' }}
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="id">ID순</option>
                            <option value="name">이름순</option>
                            <option value="capacity">총매장능력순</option>
                            <option value="updatedAt">최신순</option>
                        </select>
                        <select
                            style={{ height: 30, borderRadius: 4, borderColor: '#dee2e6' }}
                            value={sortOrder}
                            onChange={(e) => {
                                setSortOrder(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="asc">오름차순</option>
                            <option value="desc">내림차순</option>
                        </select>
                    </Group>
                </Group>
            </Paper>

            <Paper radius="md" withBorder bg="white" style={{ overflow: 'hidden', position: 'relative' }}>
                <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                <ScrollArea>
                    <Table verticalSpacing="sm" striped highlightOnHover style={{ minWidth: 800 }}>
                        <Table.Thead bg="#F8FAFC">
                            <Table.Tr>
                                <Table.Th style={{ width: 90 }}>ID</Table.Th>
                                <Table.Th>시설명</Table.Th>
                                <Table.Th style={{ width: 120 }}>카테고리</Table.Th>
                                <Table.Th style={{ width: 80 }}>구분</Table.Th>
                                <Table.Th style={{ width: 120 }}>총매장능력</Table.Th>
                                <Table.Th>주소</Table.Th>
                                <Table.Th style={{ width: 110, textAlign: 'right' }}>관리</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {data.length > 0 ? (
                                data.map((item, index) => (
                                    <Table.Tr key={`${item.id}-${index}`}>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed" ff="monospace">#{item.id}</Text>
                                        </Table.Td>
                                        <Table.Td fw={600} style={{ cursor: 'pointer' }} onClick={() => handleEdit(item, index)}>
                                            {item.name}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light" color="blue">
                                                {FACILITY_CATEGORY_LABELS[item.category] || item.category}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                variant="dot"
                                                color={item.isPublic ? 'teal' : 'gray'}
                                                size="sm"
                                            >
                                                {item.isPublic ? '공설' : '사설'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            {item.capacity ? (
                                                <Text size="sm">{item.capacity.toLocaleString()}구</Text>
                                            ) : (
                                                <Badge color="red" variant="light" size="xs">미기입</Badge>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" lineClamp={1} maw={260}>
                                                {item.address}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td align="right">
                                            <Group gap="xs" justify="flex-end" wrap="nowrap">
                                                <Tooltip label="상세 정보 및 가격표 수정">
                                                    <ActionIcon variant="light" color="blue" onClick={() => handleEdit(item, index)}>
                                                        <Edit size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="시설 삭제">
                                                    <ActionIcon variant="light" color="red" onClick={() => handleDelete(item.id)}>
                                                        <Trash size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))
                            ) : (
                                <Table.Tr>
                                    <Table.Td colSpan={7} align="center" py="xl">
                                        {!loading && <Text c="dimmed">데이터가 없습니다.</Text>}
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>

                {/* 페이지네이션 */}
                {pagination.totalPages > 1 && (
                    <Group justify="center" p="md" style={{ borderTop: '1px solid #dee2e6' }}>
                        <Pagination
                            total={pagination.totalPages}
                            value={page}
                            onChange={setPage}
                        />
                    </Group>
                )}
            </Paper>

            <FacilityEditModal
                facilityToEdit={facilityToEdit}
                opened={opened}
                onClose={close}
                onSaved={handleModalSaved}
                onNavigate={handleNavigate}
                currentIndex={editIndex >= 0 ? (page - 1) * itemsPerPage + editIndex : undefined}
                totalCount={pagination.total}
            />
        </div>
    );
}

