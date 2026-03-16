'use client';

import { useState, useEffect } from 'react';
import { Title, Table, Badge, ActionIcon, Paper, Text, Group, TextInput, Modal, Button, Stack, LoadingOverlay, Card, Box } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Search, Trash, Eye, Phone, MapPin, Wallet, MessageSquare } from 'lucide-react';

interface RecommendationRequest {
    id: number;
    region: string;
    facility_type: string;
    budget: string | null;
    phone: string;
    message: string | null;
    status: string;
    created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    'pending': { label: '대기중', color: 'orange' },
    'contacted': { label: '연락완료', color: 'blue' },
    'completed': { label: '추천완료', color: 'green' },
};

export default function RecommendationsPage() {
    const [requests, setRequests] = useState<RecommendationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<RecommendationRequest | null>(null);
    const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
    const isMobile = useMediaQuery('(max-width: 768px)', undefined, { getInitialValueInEffect: true });

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/recommendations');
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const filtered = requests.filter(r =>
        r.phone.includes(search) ||
        r.region.includes(search) ||
        r.facility_type.includes(search)
    );

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            const res = await fetch('/api/admin/recommendations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (res.ok) {
                setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
                if (selected?.id === id) {
                    setSelected(prev => prev ? { ...prev, status } : null);
                }
            }
        } catch (e) {
            console.error(e);
            alert('상태 변경 중 오류가 발생했습니다.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            const res = await fetch('/api/admin/recommendations', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                setRequests(prev => prev.filter(r => r.id !== id));
                closeDetail();
                alert('삭제되었습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    const handleView = (r: RecommendationRequest) => {
        setSelected(r);
        openDetail();
    };

    const formatPhone = (p: string) => {
        if (p.length === 11) return `${p.slice(0, 3)}-${p.slice(3, 7)}-${p.slice(7)}`;
        if (p.length === 10) return `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`;
        return p;
    };

    return (
        <div>
            <Group justify="space-between" mb="lg" wrap="wrap">
                <Title order={isMobile ? 3 : 2}>맞춤 추천 관리</Title>
                <Badge size="lg" variant="light" color="brand">
                    총 {requests.length}건
                </Badge>
            </Group>

            <Paper p="sm" radius="md" withBorder mb="md">
                <TextInput
                    placeholder="연락처, 지역, 시설유형 검색..."
                    leftSection={<Search size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    styles={{ input: { fontSize: '16px' } }}
                />
            </Paper>

            {/* 모바일: 카드 뷰 */}
            {isMobile ? (
                <Stack gap="sm" pos="relative">
                    <LoadingOverlay visible={loading} />
                    {filtered.length > 0 ? (
                        filtered.map((r) => (
                            <Card key={r.id} p="sm" radius="md" withBorder onClick={() => handleView(r)} style={{ cursor: 'pointer' }}>
                                <Group justify="space-between" mb={4}>
                                    <Text size="sm" fw={600}>{formatPhone(r.phone)}</Text>
                                    <Badge color={STATUS_LABELS[r.status]?.color || 'gray'} variant="light" size="xs">
                                        {STATUS_LABELS[r.status]?.label || r.status}
                                    </Badge>
                                </Group>
                                <Text size="xs" c="dimmed" mb={4}>{r.region} · {r.facility_type}</Text>
                                <Group justify="space-between">
                                    <Text size="xs">{r.budget || '예산 미입력'}</Text>
                                    <Text size="xs" c="dimmed">
                                        {new Date(r.created_at).toLocaleDateString('ko-KR')}
                                    </Text>
                                </Group>
                            </Card>
                        ))
                    ) : (
                        !loading && <Text c="dimmed" ta="center" py="xl">등록된 추천 요청이 없습니다.</Text>
                    )}
                </Stack>
            ) : (
                /* PC: 테이블 뷰 */
                <Paper radius="md" withBorder style={{ overflow: 'hidden', position: 'relative' }}>
                    <LoadingOverlay visible={loading} />
                    <Table verticalSpacing="sm" striped highlightOnHover>
                        <Table.Thead bg="gray.1">
                            <Table.Tr>
                                <Table.Th>연락처</Table.Th>
                                <Table.Th>지역</Table.Th>
                                <Table.Th>시설 유형</Table.Th>
                                <Table.Th>예산</Table.Th>
                                <Table.Th>신청일</Table.Th>
                                <Table.Th>상태</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>관리</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.length > 0 ? (
                                filtered.map((r) => (
                                    <Table.Tr key={r.id}>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{formatPhone(r.phone)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{r.region}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge size="xs" variant="light" color="brand">{r.facility_type}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c={r.budget ? undefined : 'dimmed'}>{r.budget || '-'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">
                                                {new Date(r.created_at).toLocaleDateString('ko-KR')}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={STATUS_LABELS[r.status]?.color || 'gray'} variant="light" size="sm">
                                                {STATUS_LABELS[r.status]?.label || r.status}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td align="right">
                                            <Group gap="xs" justify="flex-end">
                                                <ActionIcon variant="subtle" color="blue" onClick={() => handleView(r)}>
                                                    <Eye size={16} />
                                                </ActionIcon>
                                                <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(r.id)}>
                                                    <Trash size={16} />
                                                </ActionIcon>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))
                            ) : (
                                <Table.Tr>
                                    <Table.Td colSpan={7} align="center" py="xl">
                                        {!loading && <Text c="dimmed">등록된 추천 요청이 없습니다.</Text>}
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Paper>
            )}

            {/* Detail Modal */}
            <Modal
                opened={detailOpened}
                onClose={closeDetail}
                title="맞춤 추천 요청 상세"
                size={isMobile ? 'full' : 'lg'}
                fullScreen={isMobile}
            >
                {selected && (
                    <Stack>
                        <Paper p="md" bg="gray.0" radius="md">
                            <Stack gap={12}>
                                <Group justify="space-between">
                                    <Group gap={4}><Phone size={14} /><Text size="sm" c="dimmed">연락처</Text></Group>
                                    <Text size="sm" fw={600}>{formatPhone(selected.phone)}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Group gap={4}><MapPin size={14} /><Text size="sm" c="dimmed">희망 지역</Text></Group>
                                    <Text size="sm" fw={600}>{selected.region}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">시설 유형</Text>
                                    <Badge variant="light" color="brand">{selected.facility_type}</Badge>
                                </Group>
                                <Group justify="space-between">
                                    <Group gap={4}><Wallet size={14} /><Text size="sm" c="dimmed">예산 범위</Text></Group>
                                    <Text size="sm" fw={600}>{selected.budget || '미입력'}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">신청일</Text>
                                    <Text size="sm">{new Date(selected.created_at).toLocaleString('ko-KR')}</Text>
                                </Group>
                            </Stack>
                        </Paper>

                        {selected.message && (
                            <Paper p="md" bg="gray.0" radius="md">
                                <Group gap="xs" mb={8}>
                                    <MessageSquare size={16} />
                                    <Text size="sm" fw={600}>추가 요청사항</Text>
                                </Group>
                                <Text style={{ whiteSpace: 'pre-wrap' }}>{selected.message}</Text>
                            </Paper>
                        )}

                        <Box>
                            <Text size="sm" fw={600} mb="sm">상태 변경</Text>
                            <Group gap="sm">
                                <Button
                                    variant={selected.status === 'pending' ? 'filled' : 'light'}
                                    color="orange" size="sm"
                                    onClick={() => handleUpdateStatus(selected.id, 'pending')}
                                >대기중</Button>
                                <Button
                                    variant={selected.status === 'contacted' ? 'filled' : 'light'}
                                    color="blue" size="sm"
                                    onClick={() => handleUpdateStatus(selected.id, 'contacted')}
                                >연락완료</Button>
                                <Button
                                    variant={selected.status === 'completed' ? 'filled' : 'light'}
                                    color="green" size="sm"
                                    onClick={() => handleUpdateStatus(selected.id, 'completed')}
                                >추천완료</Button>
                            </Group>
                        </Box>

                        <Group mt="md">
                            {isMobile && (
                                <Button variant="light" color="gray" onClick={closeDetail} flex={1}>닫기</Button>
                            )}
                            <Button variant="light" color="red" onClick={() => handleDelete(selected.id)} flex={1}>
                                삭제
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </div>
    );
}
