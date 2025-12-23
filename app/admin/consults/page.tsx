'use client';

import { useState, useEffect } from 'react';
import { Title, Table, Badge, ActionIcon, Paper, Text, Group, TextInput, Modal, Button, Stack, LoadingOverlay, Card, Box, Textarea } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Search, Trash, Eye, Phone, Clock, MessageSquare, Building, Lock, Save } from 'lucide-react';

interface Consult {
    id: string;
    facilityId: string;
    facilityName: string;
    name: string;
    phone: string;
    preferredTime: string;
    question: string;
    message: string;
    status: 'pending' | 'contacted' | 'completed';
    adminNote?: string;
    createdAt: string;
    updatedAt: string;
}

const QUESTION_LABELS: Record<string, string> = {
    'price': '가격 문의',
    'location': '위치/교통',
    'grave': '장지 유형',
    'other': '기타',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    'pending': { label: '대기중', color: 'orange' },
    'contacted': { label: '연락완료', color: 'blue' },
    'completed': { label: '상담완료', color: 'green' },
};

export default function ConsultsPage() {
    const [consults, setConsults] = useState<Consult[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedConsult, setSelectedConsult] = useState<Consult | null>(null);
    const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
    const [adminNote, setAdminNote] = useState('');
    const [noteSaving, setNoteSaving] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)', undefined, { getInitialValueInEffect: true });

    // Fetch all consults
    const fetchConsults = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/consult');
            if (res.ok) {
                const data = await res.json();
                setConsults(data.consults || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsults();
    }, []);

    // Filter consults
    const filtered = consults.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.facilityName?.toLowerCase().includes(search.toLowerCase()) ||
        c.facilityId.toLowerCase().includes(search.toLowerCase())
    );

    // Update status
    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch('/api/admin/consults', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consultId: id, status })
            });
            if (res.ok) {
                setConsults(prev => prev.map(c => c.id === id ? { ...c, status: status as Consult['status'] } : c));
                if (selectedConsult?.id === id) {
                    setSelectedConsult(prev => prev ? { ...prev, status: status as Consult['status'] } : null);
                }
            }
        } catch (e) {
            console.error(e);
            alert('상태 변경 중 오류가 발생했습니다.');
        }
    };

    // Delete consult
    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 상담 신청을 삭제하시겠습니까?')) return;
        try {
            const res = await fetch('/api/admin/consults', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consultId: id })
            });
            if (res.ok) {
                setConsults(prev => prev.filter(c => c.id !== id));
                closeDetail();
                alert('삭제되었습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    // View detail
    const handleView = (consult: Consult) => {
        setSelectedConsult(consult);
        setAdminNote(consult.adminNote || '');
        openDetail();
    };

    // Save admin note
    const handleSaveNote = async () => {
        if (!selectedConsult) return;
        setNoteSaving(true);
        try {
            const res = await fetch('/api/admin/consults', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consultId: selectedConsult.id, adminNote })
            });
            if (res.ok) {
                setConsults(prev => prev.map(c => c.id === selectedConsult.id ? { ...c, adminNote } : c));
                setSelectedConsult(prev => prev ? { ...prev, adminNote } : null);
                alert('메모가 저장되었습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('메모 저장 중 오류가 발생했습니다.');
        } finally {
            setNoteSaving(false);
        }
    };

    return (
        <div>
            <Group justify="space-between" mb="lg" wrap="wrap">
                <Title order={isMobile ? 3 : 2}>상담 신청 관리</Title>
                <Badge size="lg" variant="light" color="brand">
                    총 {consults.length}건
                </Badge>
            </Group>

            <Paper p="sm" radius="md" withBorder mb="md">
                <TextInput
                    placeholder="이름, 연락처, 시설명 검색..."
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
                        filtered.map((c) => (
                            <Card key={c.id} p="sm" radius="md" withBorder onClick={() => handleView(c)} style={{ cursor: 'pointer' }}>
                                <Group justify="space-between" mb={4}>
                                    <Text size="sm" fw={600}>{c.name}</Text>
                                    <Badge color={STATUS_LABELS[c.status]?.color || 'gray'} variant="light" size="xs">
                                        {STATUS_LABELS[c.status]?.label || c.status}
                                    </Badge>
                                </Group>
                                <Text size="xs" c="dimmed" mb={4}>{c.facilityName || c.facilityId}</Text>
                                <Group justify="space-between">
                                    <Text size="xs">{c.phone}</Text>
                                    <Text size="xs" c="dimmed">
                                        {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                                    </Text>
                                </Group>
                            </Card>
                        ))
                    ) : (
                        !loading && <Text c="dimmed" ta="center" py="xl">등록된 상담 신청이 없습니다.</Text>
                    )}
                </Stack>
            ) : (
                /* PC: 테이블 뷰 */
                <Paper radius="md" withBorder style={{ overflow: 'hidden', position: 'relative' }}>
                    <LoadingOverlay visible={loading} />
                    <Table verticalSpacing="sm" striped highlightOnHover>
                        <Table.Thead bg="gray.1">
                            <Table.Tr>
                                <Table.Th>시설명</Table.Th>
                                <Table.Th>신청자</Table.Th>
                                <Table.Th>연락처</Table.Th>
                                <Table.Th>궁금한 점</Table.Th>
                                <Table.Th>신청일</Table.Th>
                                <Table.Th>상태</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>관리</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.length > 0 ? (
                                filtered.map((c) => (
                                    <Table.Tr key={c.id}>
                                        <Table.Td>
                                            <Text size="sm" lineClamp={1}>{c.facilityName || c.facilityId}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{c.name}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{c.phone}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge size="xs" variant="light" color="brand">
                                                {QUESTION_LABELS[c.question] || '기타'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">
                                                {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={STATUS_LABELS[c.status]?.color || 'gray'} variant="light" size="sm">
                                                {STATUS_LABELS[c.status]?.label || c.status}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td align="right">
                                            <Group gap="xs" justify="flex-end">
                                                <ActionIcon variant="subtle" color="blue" onClick={() => handleView(c)}>
                                                    <Eye size={16} />
                                                </ActionIcon>
                                                <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(c.id)}>
                                                    <Trash size={16} />
                                                </ActionIcon>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))
                            ) : (
                                <Table.Tr>
                                    <Table.Td colSpan={7} align="center" py="xl">
                                        {!loading && <Text c="dimmed">등록된 상담 신청이 없습니다.</Text>}
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
                title="상담 신청 상세"
                size={isMobile ? 'full' : 'lg'}
                fullScreen={isMobile}
            >
                {selectedConsult && (
                    <Stack>
                        {/* 시설 정보 */}
                        <Paper p="md" bg="gray.0" radius="md">
                            <Group gap="xs" mb={8}>
                                <Building size={16} />
                                <Text size="sm" fw={600}>시설 정보</Text>
                            </Group>
                            <Text size="lg" fw={700}>{selectedConsult.facilityName || selectedConsult.facilityId}</Text>
                            <Text size="xs" c="dimmed">ID: {selectedConsult.facilityId}</Text>
                        </Paper>

                        {/* 신청자 정보 */}
                        <Paper p="md" bg="gray.0" radius="md">
                            <Stack gap={12}>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">신청자</Text>
                                    <Text size="sm" fw={600}>{selectedConsult.name}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">연락처</Text>
                                    <Group gap={4}>
                                        <Phone size={14} />
                                        <Text size="sm" fw={600}>{selectedConsult.phone}</Text>
                                    </Group>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">희망 연락시간</Text>
                                    <Group gap={4}>
                                        <Clock size={14} />
                                        <Text size="sm" fw={600}>{selectedConsult.preferredTime || '시간 무관'}</Text>
                                    </Group>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">궁금한 점</Text>
                                    <Badge variant="light" color="brand">
                                        {QUESTION_LABELS[selectedConsult.question] || '기타'}
                                    </Badge>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">신청일</Text>
                                    <Text size="sm">{new Date(selectedConsult.createdAt).toLocaleString('ko-KR')}</Text>
                                </Group>
                            </Stack>
                        </Paper>

                        {/* 추가 요청사항 */}
                        {selectedConsult.message && (
                            <Paper p="md" bg="gray.0" radius="md">
                                <Group gap="xs" mb={8}>
                                    <MessageSquare size={16} />
                                    <Text size="sm" fw={600}>추가 요청사항</Text>
                                </Group>
                                <Text style={{ whiteSpace: 'pre-wrap' }}>{selectedConsult.message}</Text>
                            </Paper>
                        )}

                        {/* 비밀 메모 - 어드민 전용 */}
                        <Paper p="md" radius="md" style={{ background: '#fff9db', border: '1px solid #ffe066' }}>
                            <Group gap="xs" mb={8}>
                                <Lock size={16} color="#f59f00" />
                                <Text size="sm" fw={600} c="yellow.8">비밀 메모 (어드민 전용)</Text>
                            </Group>
                            <Textarea
                                placeholder="고객 상담 내용, 특이사항 등을 메모하세요..."
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.currentTarget.value)}
                                minRows={3}
                                styles={{ input: { fontSize: '14px' } }}
                            />
                            <Group justify="flex-end" mt="sm">
                                <Button
                                    leftSection={<Save size={16} />}
                                    size="sm"
                                    color="yellow"
                                    variant="filled"
                                    loading={noteSaving}
                                    onClick={handleSaveNote}
                                >
                                    메모 저장
                                </Button>
                            </Group>
                        </Paper>

                        {/* 상태 변경 */}
                        <Box>
                            <Text size="sm" fw={600} mb="sm">상태 변경</Text>
                            <Group gap="sm">
                                <Button
                                    variant={selectedConsult.status === 'pending' ? 'filled' : 'light'}
                                    color="orange"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(selectedConsult.id, 'pending')}
                                >
                                    대기중
                                </Button>
                                <Button
                                    variant={selectedConsult.status === 'contacted' ? 'filled' : 'light'}
                                    color="blue"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(selectedConsult.id, 'contacted')}
                                >
                                    연락완료
                                </Button>
                                <Button
                                    variant={selectedConsult.status === 'completed' ? 'filled' : 'light'}
                                    color="green"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(selectedConsult.id, 'completed')}
                                >
                                    상담완료
                                </Button>
                            </Group>
                        </Box>

                        {/* 삭제 버튼 */}
                        <Group mt="md">
                            {isMobile && (
                                <Button variant="light" color="gray" onClick={closeDetail} flex={1}>
                                    닫기
                                </Button>
                            )}
                            <Button
                                variant="light"
                                color="red"
                                onClick={() => handleDelete(selectedConsult.id)}
                                flex={1}
                            >
                                삭제
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </div>
    );
}
