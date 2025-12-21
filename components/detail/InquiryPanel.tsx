'use client';

import { Drawer, Box, Text, Group, Button, Stack, TextInput, Textarea, Switch, Paper, Modal, ActionIcon, PinInput, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ChevronRight, PenLine, Lock, Unlock, X, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Facility } from '@/types';

interface Inquiry {
    id: string;
    facilityId: string;
    title: string;
    content: string;
    phone: string;          // 전체 번호 (010-1234-5678)
    passwordLast4: string;  // 뒷자리 4자리 (5678)
    isPrivate: boolean;     // 비공개 여부
    createdAt: string;
    replies?: InquiryReply[];
}

interface InquiryReply {
    id: string;
    author: string;
    content: string;
    createdAt: string;
}

interface InquiryPanelProps {
    facility: Facility;
    isOpen: boolean;
    onClose: () => void;
}

export default function InquiryPanel({ facility, isOpen, onClose }: InquiryPanelProps) {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 문의 등록 모달
    const [writeOpened, { open: openWrite, close: closeWrite }] = useDisclosure(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [phone, setPhone] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 비밀번호 확인 모달
    const [pinOpened, { open: openPin, close: closePin }] = useDisclosure(false);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [pinValue, setPinValue] = useState('');
    const [pinError, setPinError] = useState('');
    const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

    // 문의 목록 로드
    useEffect(() => {
        if (isOpen && facility.id) {
            console.log('[InquiryPanel] Loading inquiries for:', facility.id, facility.name);
            loadInquiries();
        }
    }, [isOpen, facility.id]);

    const loadInquiries = async () => {
        setIsLoading(true);
        try {
            console.log('[InquiryPanel] Fetching:', `/api/facilities/${facility.id}/inquiries`);
            const res = await fetch(`/api/facilities/${facility.id}/inquiries`);
            const data = await res.json();
            console.log('[InquiryPanel] Response:', data);
            if (data.inquiries) {
                setInquiries(data.inquiries);
            }
        } catch (e) {
            console.error('Failed to load inquiries:', e);
        } finally {
            setIsLoading(false);
        }
    };

    // 문의 등록
    const handleSubmit = async () => {
        if (!title.trim() || !content.trim() || !phone.trim()) {
            alert('모든 항목을 입력해주세요.');
            return;
        }

        // 전화번호 형식 검증
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            alert('올바른 전화번호를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/facilities/${facility.id}/inquiries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    phone,
                    isPrivate
                })
            });

            if (res.ok) {
                const data = await res.json();
                setInquiries(prev => [data.inquiry, ...prev]);
                setTitle('');
                setContent('');
                setPhone('');
                setIsPrivate(true);
                closeWrite();
                alert('문의가 등록되었습니다!');
            } else {
                const err = await res.json();
                alert(err.error || '등록 실패');
            }
        } catch (e) {
            console.error(e);
            alert('등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 비밀번호 확인
    const handleUnlock = (inquiry: Inquiry) => {
        setSelectedInquiry(inquiry);
        setPinValue('');
        setPinError('');
        openPin();
    };

    const handlePinSubmit = async () => {
        if (!selectedInquiry || pinValue.length !== 4) return;

        try {
            const res = await fetch(`/api/facilities/${facility.id}/inquiries/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inquiryId: selectedInquiry.id,
                    pin: pinValue
                })
            });

            if (res.ok) {
                setUnlockedIds(prev => new Set([...prev, selectedInquiry.id]));
                closePin();
                setPinError('');
            } else {
                setPinError('비밀번호가 일치하지 않습니다.');
            }
        } catch (e) {
            setPinError('확인 중 오류가 발생했습니다.');
        }
    };

    // 문의 삭제
    const handleDelete = async (inquiry: Inquiry) => {
        if (!confirm('문의를 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/facilities/${facility.id}/inquiries`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inquiryId: inquiry.id })
            });

            if (res.ok) {
                setInquiries(prev => prev.filter(i => i.id !== inquiry.id));
                setUnlockedIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(inquiry.id);
                    return newSet;
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    // 전화번호 뒷자리 4자리 추출
    const getLast4Digits = (phoneNumber: string) => {
        const digits = phoneNumber.replace(/\D/g, '');
        return digits.slice(-4);
    };

    // 전화번호 포맷팅
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 3) return digits;
        if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    };

    return (
        <>
            <Drawer
                opened={isOpen}
                onClose={onClose}
                position="left"
                size="100%"
                styles={{
                    root: { zIndex: 2050 },
                    overlay: { backgroundColor: 'transparent', pointerEvents: 'none' },
                    content: {
                        width: '100%',
                        maxWidth: '400px',
                        marginLeft: 'min(400px, 100vw)', // 시설 상세 패널 옆에 위치
                        boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
                    },
                    header: { display: 'none' },
                    body: { padding: 0, backgroundColor: '#fff', height: '100%' }
                }}
                withCloseButton={false}
                lockScroll={false}
            >
                <Stack gap={0} h="100%">
                    {/* Header */}
                    <Box p="md" style={{ borderBottom: '1px solid #f1f3f5' }}>
                        <Group justify="space-between">
                            <Text fw={700} size="lg">문의 ({inquiries.length})</Text>
                            <ActionIcon variant="subtle" color="dark" onClick={onClose}>
                                <X size={20} />
                            </ActionIcon>
                        </Group>
                    </Box>

                    <ScrollArea style={{ flex: 1 }} bg="gray.0">
                        <Stack gap="md" p="md">
                            {/* 안내 문구 */}
                            <Paper p="sm" radius="md" bg="gray.0" style={{ border: '1px solid #f1f3f5' }}>
                                <Text size="xs" c="dimmed">
                                    💡 시설에 대해 궁금한 점을 문의하세요. 비공개 설정 시 제목만 공개됩니다.
                                </Text>
                            </Paper>

                            {/* 문의 목록 */}
                            {isLoading ? (
                                <Text c="dimmed" ta="center" py="xl">불러오는 중...</Text>
                            ) : inquiries.length === 0 ? (
                                <Text c="dimmed" ta="center" py="xl">등록된 문의가 없습니다.</Text>
                            ) : inquiries.map(inquiry => {
                                const isUnlocked = unlockedIds.has(inquiry.id);
                                const showContent = !inquiry.isPrivate || isUnlocked;

                                return (
                                    <Paper key={inquiry.id} p="md" radius="md" bg="white" withBorder style={{ borderColor: '#f1f3f5' }}>
                                        {/* 제목 + 상태 */}
                                        <Group justify="space-between" mb="xs">
                                            <Group gap="xs">
                                                {inquiry.isPrivate && !isUnlocked ? (
                                                    <Lock size={14} color="#868e96" />
                                                ) : inquiry.isPrivate ? (
                                                    <Unlock size={14} color="#40c057" />
                                                ) : null}
                                                <Text fw={600}>{inquiry.title}</Text>
                                            </Group>
                                            <Text size="xs" c="dimmed">
                                                {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                                            </Text>
                                        </Group>

                                        {/* 내용 */}
                                        {showContent ? (
                                            <>
                                                <Text size="sm" mb="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                                    {inquiry.content}
                                                </Text>

                                                {/* 잠금 해제된 경우 수정/삭제 버튼 */}
                                                {isUnlocked && (
                                                    <Group gap="xs" mt="sm">
                                                        <Button size="xs" variant="subtle" color="red" onClick={() => handleDelete(inquiry)}>
                                                            삭제
                                                        </Button>
                                                    </Group>
                                                )}

                                                {/* 관리자 답변 */}
                                                {inquiry.replies?.map(reply => (
                                                    <Box key={reply.id} bg="gray.1" p="sm" mt="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                                                        <Group gap="xs" mb={4}>
                                                            <MessageCircle size={12} />
                                                            <Text size="xs" fw={600}>{reply.author}</Text>
                                                            <Text size="xs" c="dimmed">{new Date(reply.createdAt).toLocaleDateString('ko-KR')}</Text>
                                                        </Group>
                                                        <Text size="sm">{reply.content}</Text>
                                                    </Box>
                                                ))}
                                            </>
                                        ) : (
                                            <Group
                                                gap="xs"
                                                c="dimmed"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleUnlock(inquiry)}
                                            >
                                                <Lock size={14} />
                                                <Text size="sm">비공개 내용입니다.</Text>
                                            </Group>
                                        )}
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </ScrollArea>
                </Stack>
            </Drawer >
            {/* 비밀번호 입력 - 예쁜 팝업 */}
            <Modal
                opened={pinOpened}
                onClose={closePin}
                centered
                size={320}
                radius="lg"
                withCloseButton={false}
                styles={{
                    root: { zIndex: 9999 },
                    content: { padding: 0 },
                    body: { padding: '28px 24px' }
                }}
            >
                <Stack gap="md" align="center">
                    {/* 자물쇠 아이콘 */}
                    <Box
                        p="md"
                        bg="gray.1"
                        style={{ borderRadius: '50%' }}
                    >
                        <Lock size={24} color="#868e96" />
                    </Box>

                    <Text size="md" fw={600}>비공개 문의입니다</Text>
                    <Text size="xs" c="dimmed" ta="center" lh={1.4}>
                        작성 시 입력한 연락처 뒷자리 4자리를 입력해주세요.
                    </Text>

                    <PinInput
                        length={4}
                        type="number"
                        value={pinValue}
                        onChange={setPinValue}
                        error={!!pinError}
                        size="xl"
                        radius="xl"
                        styles={{
                            input: {
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e9ecef',
                                fontWeight: 500
                            }
                        }}
                    />

                    {pinError && <Text size="xs" c="red">{pinError}</Text>}

                    <Button
                        fullWidth
                        size="md"
                        radius="xl"
                        color="brand"
                        onClick={handlePinSubmit}
                        disabled={pinValue.length !== 4}
                        styles={{
                            root: {
                                '&:disabled': {
                                    backgroundColor: '#e9ecef',
                                    color: '#adb5bd'
                                }
                            }
                        }}
                    >
                        확인하기
                    </Button>
                </Stack>
            </Modal>
        </>
    );
}
