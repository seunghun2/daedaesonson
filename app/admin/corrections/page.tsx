'use client';

import { useState, useEffect } from 'react';
import { Box, Text, Group, Stack, Badge, Paper, Table, Select, Button, TextInput, Textarea, ActionIcon, Tooltip, Modal, Loader, Image } from '@mantine/core';
import { Search, RefreshCw, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Correction {
    id: string;
    facility_id: string;
    facility_name: string;
    correction_type: string;
    content: string;
    contact: string | null;
    name: string | null;
    photos: string[] | null;
    status: string;
    admin_note: string | null;
    created_at: string;
    updated_at: string;
}

const TYPE_LABELS: Record<string, string> = {
    price: '가격 정보',
    facility_info: '시설 정보',
    photo: '사진/이미지',
    business_status: '영업 상태',
    location: '위치 정보',
    other: '기타',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: '대기중', color: 'yellow' },
    in_progress: { label: '처리중', color: 'blue' },
    resolved: { label: '완료', color: 'green' },
    rejected: { label: '반려', color: 'red' },
};

export default function AdminCorrectionsPage() {
    const [corrections, setCorrections] = useState<Correction[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [selectedCorrection, setSelectedCorrection] = useState<Correction | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [detailOpen, setDetailOpen] = useState(false);

    const fetchCorrections = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/corrections?status=${statusFilter}`);
            const data = await res.json();
            setCorrections(data.data || []);
        } catch (err) {
            console.error('Failed to fetch corrections:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCorrections();
    }, [statusFilter]);

    const updateStatus = async (id: string, status: string) => {
        try {
            await fetch('/api/corrections', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, admin_note: adminNote || null }),
            });
            fetchCorrections();
            setDetailOpen(false);
            setSelectedCorrection(null);
            setAdminNote('');
        } catch (err) {
            console.error('Failed to update:', err);
        }
    };

    const filteredCorrections = corrections.filter(c =>
        !searchText ||
        c.facility_name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.content.toLowerCase().includes(searchText.toLowerCase()) ||
        (c.name || '').toLowerCase().includes(searchText.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return (
        <Box>
            <Group justify="space-between" mb="lg">
                <Text size="xl" fw={700}>정보 수정 요청 관리</Text>
                <Button leftSection={<RefreshCw size={16} />} variant="light" onClick={fetchCorrections} loading={loading}>
                    새로고침
                </Button>
            </Group>

            {/* 필터 */}
            <Paper p="md" mb="lg" withBorder radius="md">
                <Group gap="md">
                    <Select
                        placeholder="상태"
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v || 'all')}
                        data={[
                            { value: 'all', label: '전체' },
                            { value: 'pending', label: '대기중' },
                            { value: 'in_progress', label: '처리중' },
                            { value: 'resolved', label: '완료' },
                            { value: 'rejected', label: '반려' },
                        ]}
                        w={150}
                    />
                    <TextInput
                        placeholder="시설명, 내용, 성함 검색"
                        leftSection={<Search size={16} />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.currentTarget.value)}
                        style={{ flex: 1 }}
                    />
                </Group>
            </Paper>

            {/* 통계 */}
            <Group mb="lg" gap="sm">
                {['pending', 'in_progress', 'resolved', 'rejected'].map(status => {
                    const count = corrections.filter(c => c.status === status).length;
                    const info = STATUS_LABELS[status];
                    return (
                        <Paper key={status} p="sm" withBorder radius="md" style={{ flex: 1, cursor: 'pointer' }} onClick={() => setStatusFilter(status)}>
                            <Text size="xs" c="dimmed">{info.label}</Text>
                            <Text size="xl" fw={700}>{count}</Text>
                        </Paper>
                    );
                })}
            </Group>

            {/* 목록 */}
            {loading ? (
                <Group justify="center" py={60}>
                    <Loader />
                </Group>
            ) : filteredCorrections.length === 0 ? (
                <Paper p={60} withBorder radius="md">
                    <Text ta="center" c="dimmed">수정 요청이 없습니다.</Text>
                </Paper>
            ) : (
                <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                    <Table.ScrollContainer minWidth={700}>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>상태</Table.Th>
                                    <Table.Th>유형</Table.Th>
                                    <Table.Th>시설명</Table.Th>
                                    <Table.Th>성함</Table.Th>
                                    <Table.Th>내용</Table.Th>
                                    <Table.Th>연락처</Table.Th>
                                    <Table.Th>사진</Table.Th>
                                    <Table.Th>접수일시</Table.Th>
                                    <Table.Th>관리</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filteredCorrections.map(c => {
                                    const statusInfo = STATUS_LABELS[c.status] || STATUS_LABELS.pending;
                                    return (
                                        <Table.Tr key={c.id}>
                                            <Table.Td>
                                                <Badge color={statusInfo.color} variant="light" size="sm">{statusInfo.label}</Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{TYPE_LABELS[c.correction_type] || c.correction_type}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" fw={500} style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {c.facility_name}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{c.name || '-'}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" lineClamp={2} style={{ maxWidth: 200 }}>{c.content}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="xs" c="dimmed">{c.contact || '-'}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="xs" c="dimmed">{c.photos && c.photos.length > 0 ? `${c.photos.length}장` : '-'}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="xs" c="dimmed">{formatDate(c.created_at)}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Tooltip label="상세보기">
                                                    <ActionIcon variant="light" onClick={() => {
                                                        setSelectedCorrection(c);
                                                        setAdminNote(c.admin_note || '');
                                                        setDetailOpen(true);
                                                    }}>
                                                        <Eye size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                </Paper>
            )}

            {/* 상세 모달 */}
            <Modal
                opened={detailOpen}
                onClose={() => setDetailOpen(false)}
                title="수정 요청 상세"
                size="lg"
            >
                {selectedCorrection && (
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Badge color={STATUS_LABELS[selectedCorrection.status]?.color || 'gray'} variant="light" size="lg">
                                {STATUS_LABELS[selectedCorrection.status]?.label || selectedCorrection.status}
                            </Badge>
                            <Text size="xs" c="dimmed">{formatDate(selectedCorrection.created_at)}</Text>
                        </Group>

                        <Paper p="md" bg="gray.0" radius="md">
                            <Stack gap="xs">
                                <Group>
                                    <Text size="sm" c="dimmed" w={80}>시설명</Text>
                                    <Text size="sm" fw={500}>{selectedCorrection.facility_name}</Text>
                                </Group>
                                <Group>
                                    <Text size="sm" c="dimmed" w={80}>시설 ID</Text>
                                    <Text size="xs" ff="monospace">{selectedCorrection.facility_id}</Text>
                                </Group>
                                <Group>
                                    <Text size="sm" c="dimmed" w={80}>유형</Text>
                                    <Text size="sm">{TYPE_LABELS[selectedCorrection.correction_type] || selectedCorrection.correction_type}</Text>
                                </Group>
                                <Group>
                                    <Text size="sm" c="dimmed" w={80}>성함</Text>
                                    <Text size="sm">{selectedCorrection.name || '미입력'}</Text>
                                </Group>
                                <Group>
                                    <Text size="sm" c="dimmed" w={80}>연락처</Text>
                                    <Text size="sm">{selectedCorrection.contact || '미입력'}</Text>
                                </Group>
                            </Stack>
                        </Paper>

                        <Box>
                            <Text size="sm" fw={600} mb={6}>수정 요청 내용</Text>
                            <Paper p="md" withBorder radius="md">
                                <Text size="sm" lh={1.6} style={{ whiteSpace: 'pre-wrap' }}>{selectedCorrection.content}</Text>
                            </Paper>
                        </Box>

                        {/* 첨부 사진 */}
                        {selectedCorrection.photos && selectedCorrection.photos.length > 0 && (
                            <Box>
                                <Text size="sm" fw={600} mb={6}>첨부 사진 ({selectedCorrection.photos.length}장)</Text>
                                <Group gap="xs" style={{ flexWrap: 'wrap' }}>
                                    {selectedCorrection.photos.map((photo, idx) => (
                                        <Image
                                            key={idx}
                                            src={photo}
                                            w={120}
                                            h={120}
                                            radius="md"
                                            style={{ objectFit: 'cover', border: '1px solid #dee2e6', cursor: 'pointer' }}
                                            onClick={() => window.open(photo, '_blank')}
                                        />
                                    ))}
                                </Group>
                            </Box>
                        )}

                        <Box>
                            <Text size="sm" fw={600} mb={6}>관리자 메모</Text>
                            <Textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.currentTarget.value)}
                                placeholder="처리 내용이나 메모를 입력하세요"
                                minRows={3}
                            />
                        </Box>

                        <Group justify="flex-end" gap="sm">
                            <Button
                                leftSection={<XCircle size={16} />}
                                color="red"
                                variant="light"
                                onClick={() => updateStatus(selectedCorrection.id, 'rejected')}
                            >
                                반려
                            </Button>
                            <Button
                                leftSection={<Clock size={16} />}
                                color="blue"
                                variant="light"
                                onClick={() => updateStatus(selectedCorrection.id, 'in_progress')}
                            >
                                처리중
                            </Button>
                            <Button
                                leftSection={<CheckCircle size={16} />}
                                color="green"
                                onClick={() => updateStatus(selectedCorrection.id, 'resolved')}
                            >
                                완료
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Box>
    );
}
