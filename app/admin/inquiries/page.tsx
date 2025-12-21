'use client';

import { useState, useEffect } from 'react';
import { Title, Table, Badge, ActionIcon, Paper, Text, Group, TextInput, Modal, Textarea, Button, Stack, LoadingOverlay, Box, Card } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Search, Trash, Eye, MessageCircle, Phone, Lock } from 'lucide-react';

interface Inquiry {
    id: string;
    facilityId: string;
    type: string;
    title: string;
    content: string;
    phone: string;
    passwordLast4: string;
    isPrivate: boolean;
    createdAt: string;
    replies: { id: string; author: string; content: string; createdAt: string }[];
}

const TYPE_LABELS: Record<string, string> = {
    'price': '가격 문의',
    'location': '위치/교통',
    'reservation': '예약/절차',
    'facility': '시설 이용',
    'other': '기타',
};

export default function InquiriesPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)', undefined, { getInitialValueInEffect: true });

    // Fetch all inquiries
    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/inquiries');
            if (res.ok) {
                const data = await res.json();
                setInquiries(data.inquiries || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, []);

    // Filter inquiries
    const filtered = inquiries.filter(inq =>
        inq.title.toLowerCase().includes(search.toLowerCase()) ||
        inq.content.toLowerCase().includes(search.toLowerCase()) ||
        inq.facilityId.toLowerCase().includes(search.toLowerCase())
    );

    // Delete inquiry
    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 문의를 삭제하시겠습니까?')) return;
        try {
            const res = await fetch('/api/admin/inquiries', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inquiryId: id })
            });
            if (res.ok) {
                setInquiries(prev => prev.filter(i => i.id !== id));
                alert('삭제되었습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    // View detail
    const handleView = (inquiry: Inquiry) => {
        setSelectedInquiry(inquiry);
        setReplyContent('');
        openDetail();
    };

    // Submit reply
    const handleReply = async () => {
        if (!selectedInquiry || !replyContent.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inquiryId: selectedInquiry.id,
                    content: replyContent
                })
            });
            if (res.ok) {
                const data = await res.json();
                // Update local state
                setInquiries(prev => prev.map(i =>
                    i.id === selectedInquiry.id
                        ? { ...i, replies: [...i.replies, data.reply] }
                        : i
                ));
                setSelectedInquiry(prev => prev ? { ...prev, replies: [...prev.replies, data.reply] } : null);
                setReplyContent('');
                alert('답변이 등록되었습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('답변 등록 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <Group justify="space-between" mb="lg" wrap="wrap">
                <Title order={isMobile ? 3 : 2}>문의 관리</Title>
                <Badge size="lg" variant="light" color="blue">
                    총 {inquiries.length}건
                </Badge>
            </Group>

            <Paper p="sm" radius="md" withBorder mb="md">
                <TextInput
                    placeholder="시설ID, 제목, 내용 검색..."
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
                        filtered.map((inq) => (
                            <Card key={inq.id} p="sm" radius="md" withBorder onClick={() => handleView(inq)} style={{ cursor: 'pointer' }}>
                                <Group justify="space-between" mb={4}>
                                    <Group gap={4}>
                                        <Badge size="xs" variant="light" color="brand">
                                            {TYPE_LABELS[inq.type] || '기타'}
                                        </Badge>
                                        {inq.isPrivate && <Lock size={12} color="#868e96" />}
                                    </Group>
                                    {inq.replies.length > 0 ? (
                                        <Badge color="green" variant="light" size="xs">답변완료</Badge>
                                    ) : (
                                        <Badge color="orange" variant="light" size="xs">대기중</Badge>
                                    )}
                                </Group>
                                <Text size="sm" fw={600} mb={4}>{inq.title}</Text>
                                <Text size="xs" c="dimmed" lineClamp={2} mb={4}>{inq.content}</Text>
                                <Group justify="space-between">
                                    <Text size="xs" c="dimmed">{inq.phone}</Text>
                                    <Text size="xs" c="dimmed">
                                        {new Date(inq.createdAt).toLocaleDateString('ko-KR')}
                                    </Text>
                                </Group>
                            </Card>
                        ))
                    ) : (
                        !loading && <Text c="dimmed" ta="center" py="xl">등록된 문의가 없습니다.</Text>
                    )}
                </Stack>
            ) : (
                /* PC: 테이블 뷰 */
                <Paper radius="md" withBorder style={{ overflow: 'hidden', position: 'relative' }}>
                    <LoadingOverlay visible={loading} />
                    <Table verticalSpacing="sm" striped highlightOnHover>
                        <Table.Thead bg="gray.1">
                            <Table.Tr>
                                <Table.Th>시설ID</Table.Th>
                                <Table.Th>제목</Table.Th>
                                <Table.Th>연락처</Table.Th>
                                <Table.Th>날짜</Table.Th>
                                <Table.Th>상태</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>관리</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.length > 0 ? (
                                filtered.map((inq) => (
                                    <Table.Tr key={inq.id}>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">{inq.facilityId}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                {inq.isPrivate && <Badge size="xs" variant="light" color="gray">비공개</Badge>}
                                                <Text size="sm" fw={500}>{inq.title}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{inq.phone}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">
                                                {new Date(inq.createdAt).toLocaleDateString('ko-KR')}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            {inq.replies.length > 0 ? (
                                                <Badge color="green" variant="light" size="sm">답변완료</Badge>
                                            ) : (
                                                <Badge color="orange" variant="light" size="sm">대기중</Badge>
                                            )}
                                        </Table.Td>
                                        <Table.Td align="right">
                                            <Group gap="xs" justify="flex-end">
                                                <ActionIcon variant="subtle" color="blue" onClick={() => handleView(inq)}>
                                                    <Eye size={16} />
                                                </ActionIcon>
                                                <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(inq.id)}>
                                                    <Trash size={16} />
                                                </ActionIcon>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))
                            ) : (
                                <Table.Tr>
                                    <Table.Td colSpan={6} align="center" py="xl">
                                        {!loading && <Text c="dimmed">등록된 문의가 없습니다.</Text>}
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
                title="문의 상세"
                size={isMobile ? 'full' : 'lg'}
                fullScreen={isMobile}
            >
                {selectedInquiry && (
                    <Stack>
                        <Group justify="space-between" wrap="wrap">
                            <Text size="lg" fw={700}>{selectedInquiry.title}</Text>
                            <Group gap={4}>
                                <Badge color="brand" size="sm">{TYPE_LABELS[selectedInquiry.type] || '기타'}</Badge>
                                {selectedInquiry.isPrivate && <Badge color="gray">비공개</Badge>}
                            </Group>
                        </Group>
                        <Group gap="xs">
                            <Phone size={14} />
                            <Text size="sm" fw={500}>{selectedInquiry.phone}</Text>
                            <Text size="xs" c="dimmed">(비밀번호: {selectedInquiry.passwordLast4})</Text>
                        </Group>
                        <Text size="xs" c="dimmed">시설: {selectedInquiry.facilityId}</Text>
                        <Paper p="md" bg="gray.0" radius="md">
                            <Text style={{ whiteSpace: 'pre-wrap' }}>{selectedInquiry.content}</Text>
                        </Paper>

                        {/* Existing replies */}
                        {selectedInquiry.replies.length > 0 && (
                            <Stack gap="sm">
                                <Text size="sm" fw={600}>답변 내역</Text>
                                {selectedInquiry.replies.map(reply => (
                                    <Paper key={reply.id} p="sm" bg="blue.0" radius="md">
                                        <Group justify="space-between" mb={4} wrap="wrap">
                                            <Text size="sm" fw={600} c="blue">{reply.author}</Text>
                                            <Text size="xs" c="dimmed">{new Date(reply.createdAt).toLocaleString('ko-KR')}</Text>
                                        </Group>
                                        <Text size="sm">{reply.content}</Text>
                                    </Paper>
                                ))}
                            </Stack>
                        )}

                        {/* Reply form */}
                        <Stack gap="sm">
                            <Text size="sm" fw={600}>답변 작성</Text>
                            <Textarea
                                placeholder="답변 내용을 입력하세요..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.currentTarget.value)}
                                minRows={3}
                                styles={{ input: { fontSize: '16px' } }}
                            />
                            <Group>
                                {isMobile && (
                                    <Button variant="light" color="gray" onClick={closeDetail} flex={1}>
                                        닫기
                                    </Button>
                                )}
                                <Button
                                    leftSection={<MessageCircle size={16} />}
                                    onClick={handleReply}
                                    loading={submitting}
                                    disabled={!replyContent.trim()}
                                    flex={1}
                                >
                                    답변 등록
                                </Button>
                            </Group>
                        </Stack>
                    </Stack>
                )}
            </Modal>
        </div>
    );
}
