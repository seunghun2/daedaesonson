'use client';

import { useState, useEffect } from 'react';
import { Box, Title, Table, Badge, Text, Group, Paper, Select, LoadingOverlay, Button, Modal, Stack, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';

interface PartnershipInquiry {
    id: string;
    type: string;
    company_name: string;
    email: string;
    contact_name: string;
    phone: string;
    content: string;
    status: string;
    created_at: string;
    admin_note?: string;
}

export default function AdminPartnershipPage() {
    const [inquiries, setInquiries] = useState<PartnershipInquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState<PartnershipInquiry | null>(null);
    const [editStatus, setEditStatus] = useState<string>('');
    const [editNote, setEditNote] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)');

    useEffect(() => {
        fetchInquiries();
    }, []);

    useEffect(() => {
        if (selectedInquiry) {
            setEditStatus(selectedInquiry.status || 'pending');
            setEditNote(selectedInquiry.admin_note || '');
        }
    }, [selectedInquiry]);

    const fetchInquiries = async () => {
        try {
            const res = await fetch('/api/partnership');
            const data = await res.json();
            setInquiries(data.inquiries || []);
        } catch (error) {
            console.error('Failed to fetch partnership inquiries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedInquiry) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/partnership', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedInquiry.id, status: editStatus, admin_note: editNote }),
            });
            if (res.ok) {
                fetchInquiries();
                setSelectedInquiry(null);
                notifications.show({ color: 'green', message: '제휴 문의 정보가 업데이트되었습니다.' });
            } else {
                notifications.show({ color: 'red', message: '요청을 처리할 수 없습니다.' });
            }
        } catch (error) {
            notifications.show({ color: 'red', message: '처리 중 오류가 발생했습니다.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedInquiry) return;
        if (!confirm('정말 삭제하시겠습니까?')) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/partnership', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedInquiry.id }),
            });
            if (res.ok) {
                fetchInquiries();
                setSelectedInquiry(null);
                notifications.show({ color: 'green', message: '제휴 문의가 삭제되었습니다.' });
            } else {
                notifications.show({ color: 'red', message: '요청을 처리할 수 없습니다.' });
            }
        } catch (error) {
            notifications.show({ color: 'red', message: '삭제 중 오류가 발생했습니다.' });
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge color="yellow" variant="light">대기중</Badge>;
            case 'in_progress':
                return <Badge color="blue" variant="light">처리중</Badge>;
            case 'completed':
                return <Badge color="green" variant="light">완료</Badge>;
            case 'rejected':
                return <Badge color="red" variant="light">거절</Badge>;
            default:
                return <Badge color="gray" variant="light">{status}</Badge>;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'facility':
                return <Badge color="teal" variant="light">시설등록</Badge>;
            case 'partnership':
                return <Badge color="violet" variant="light">광고/제휴</Badge>;
            default:
                return <Badge color="gray" variant="light">{type}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Box p={isMobile ? 'xs' : 'md'}>
            <LoadingOverlay visible={isLoading} />

            <Group justify="space-between" mb="lg">
                <Title order={isMobile ? 3 : 2}>제휴문의관리</Title>
                <Badge size="lg" variant="light" color="blue">
                    총 {inquiries.length}건
                </Badge>
            </Group>

            {inquiries.length === 0 && !isLoading ? (
                <Paper p="xl" ta="center">
                    <Text c="dimmed">아직 제휴 문의가 없습니다.</Text>
                </Paper>
            ) : (
                <Paper shadow="xs" withBorder style={{ overflow: 'auto' }}>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>유형</Table.Th>
                                <Table.Th>업체명</Table.Th>
                                <Table.Th>담당자</Table.Th>
                                <Table.Th>연락처</Table.Th>
                                <Table.Th>신청일</Table.Th>
                                <Table.Th>상태</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {inquiries.map((inquiry) => (
                                <Table.Tr key={inquiry.id}>
                                    <Table.Td>{getTypeBadge(inquiry.type)}</Table.Td>
                                    <Table.Td fw={600}>{inquiry.company_name}</Table.Td>
                                    <Table.Td>{inquiry.contact_name}</Table.Td>
                                    <Table.Td>{inquiry.phone}</Table.Td>
                                    <Table.Td>{formatDate(inquiry.created_at)}</Table.Td>
                                    <Table.Td>{getStatusBadge(inquiry.status)}</Table.Td>
                                    <Table.Td>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            onClick={() => setSelectedInquiry(inquiry)}
                                        >
                                            상세
                                        </Button>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Paper>
            )}

            {/* 상세 보기 모달 */}
            <Modal
                opened={!!selectedInquiry}
                onClose={() => setSelectedInquiry(null)}
                title={<Text fw={700}>제휴 문의 상세</Text>}
                size="lg"
            >
                {selectedInquiry && (
                    <Stack gap="md">
                        <Group>
                            {getTypeBadge(selectedInquiry.type)}
                            {getStatusBadge(selectedInquiry.status)}
                        </Group>

                        <Box>
                            <Text size="xs" c="dimmed">업체명</Text>
                            <Text fw={600}>{selectedInquiry.company_name}</Text>
                        </Box>

                        <Group grow>
                            <Box>
                                <Text size="xs" c="dimmed">담당자</Text>
                                <Text>{selectedInquiry.contact_name}</Text>
                            </Box>
                            <Box>
                                <Text size="xs" c="dimmed">연락처</Text>
                                <Text>{selectedInquiry.phone}</Text>
                            </Box>
                        </Group>

                        <Box>
                            <Text size="xs" c="dimmed">이메일</Text>
                            <Text>{selectedInquiry.email}</Text>
                        </Box>

                        <Box>
                            <Text size="xs" c="dimmed">문의 내용</Text>
                            <Paper p="sm" bg="gray.0" style={{ whiteSpace: 'pre-wrap' }}>
                                {selectedInquiry.content}
                            </Paper>
                        </Box>

                        <Box>
                            <Text size="xs" c="dimmed">신청일시</Text>
                            <Text>{formatDate(selectedInquiry.created_at)}</Text>
                        </Box>

                        <Select
                            label="상태"
                            data={[
                                { value: 'pending', label: '대기중' },
                                { value: 'in_progress', label: '처리중' },
                                { value: 'completed', label: '완료' },
                                { value: 'rejected', label: '거절' },
                            ]}
                            value={editStatus}
                            onChange={(val) => setEditStatus(val || 'pending')}
                        />

                        <Textarea
                            label="관리자 메모"
                            placeholder="메모를 입력하세요..."
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            minRows={3}
                        />

                        <Group justify="space-between" mt="md">
                            <Button color="red" variant="subtle" onClick={handleDelete} loading={isSaving}>
                                삭제
                            </Button>
                            <Group>
                                <Button variant="light" color="gray" onClick={() => setSelectedInquiry(null)}>
                                    닫기
                                </Button>
                                <Button color="brand" onClick={handleUpdate} loading={isSaving}>
                                    저장
                                </Button>
                            </Group>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Box>
    );
}
