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
    allFacilities?: Facility[];
}

export default function InquiryPanel({ facility, isOpen, onClose, allFacilities = [] }: InquiryPanelProps) {
    // 시설 ID → 시설명 매핑
    const facilityNameMap = new Map(allFacilities.map(f => [f.id, f.name]));

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

    // 문의 목록 로드 (전체 문의 - 풍성하게!)
    useEffect(() => {
        if (isOpen) {
            loadInquiries();
        }
    }, [isOpen]);

    const loadInquiries = async () => {
        setIsLoading(true);
        try {
            // 전체 문의 로드 (어드민 API 활용)
            const res = await fetch('/api/admin/inquiries');
            const data = await res.json();
            if (data.inquiries) {
                // 최신순 정렬
                const sorted = data.inquiries.sort((a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setInquiries(sorted);
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
                        marginLeft: 'min(400px, 100vw)',
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
                                    <Box
                                        key={inquiry.id}
                                        py="sm"
                                        style={{
                                            borderBottom: '1px solid #f1f3f5',
                                            cursor: showContent ? 'default' : 'pointer'
                                        }}
                                        onClick={() => !showContent && handleUnlock(inquiry)}
                                    >
                                        {/* [시설명] 카테고리 + 날짜 */}
                                        <Group justify="space-between" mb={4}>
                                            <Group gap={4}>
                                                <Text size="xs" c="dimmed">[{facilityNameMap.get(inquiry.facilityId) || '시설'}]</Text>
                                                <Text size="xs" c="brand" fw={500}>
                                                    {(inquiry as any).type === 'price' ? '가격 문의' :
                                                        (inquiry as any).type === 'reservation' ? '예약/절차' :
                                                            (inquiry as any).type === 'facility' ? '시설' : '기타'}
                                                </Text>
                                            </Group>
                                            <Text size="xs" c="dimmed">
                                                {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' })}
                                            </Text>
                                        </Group>

                                        {/* 자물쇠 + 제목 */}
                                        <Group gap={6} mb={4}>
                                            {inquiry.isPrivate && (
                                                <Lock size={14} color={isUnlocked ? '#40c057' : '#adb5bd'} />
                                            )}
                                            <Text size="sm" fw={500} c="dark">{inquiry.title}</Text>
                                            {inquiry.replies && inquiry.replies.length > 0 && (
                                                <Box px={6} py={2} bg="brand.0" style={{ borderRadius: 4 }}>
                                                    <Text size="xs" c="brand" fw={500}>답변완료</Text>
                                                </Box>
                                            )}
                                        </Group>

                                        {/* 내용 (비공개면 블러) */}
                                        <Text
                                            size="xs"
                                            c="dimmed"
                                            lineClamp={3}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                ...(inquiry.isPrivate && !isUnlocked ? {
                                                    filter: 'blur(4px)',
                                                    userSelect: 'none'
                                                } : {})
                                            }}
                                        >
                                            {inquiry.content || '문의 내용'}
                                        </Text>

                                        {/* 잠금 해제 시 삭제 버튼 */}
                                        {isUnlocked && (
                                            <Group gap="xs" mt="sm">
                                                <Button size="xs" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); handleDelete(inquiry); }}>
                                                    삭제
                                                </Button>
                                            </Group>
                                        )}

                                        {/* 관리자 답변 */}
                                        {showContent && inquiry.replies?.map(reply => (
                                            <Box key={reply.id} bg="gray.1" p="sm" mt="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                                                <Group gap="xs" mb={4}>
                                                    <MessageCircle size={12} />
                                                    <Text size="xs" fw={600}>{reply.author}</Text>
                                                    <Text size="xs" c="dimmed">{new Date(reply.createdAt).toLocaleDateString('ko-KR')}</Text>
                                                </Group>
                                                <Text size="sm">{reply.content}</Text>
                                            </Box>
                                        ))}
                                    </Box>
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

                    <TextInput
                        value={pinValue}
                        onChange={(e) => {
                            const val = e.currentTarget.value.replace(/\D/g, '').slice(0, 4);
                            setPinValue(val);
                        }}
                        placeholder="0 0 0 0"
                        maxLength={4}
                        size="lg"
                        radius="xl"
                        w="100%"
                        styles={{
                            input: {
                                textAlign: 'center',
                                letterSpacing: '12px',
                                fontSize: '20px',
                                fontWeight: 500,
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e9ecef',
                                '&::placeholder': {
                                    letterSpacing: '12px'
                                }
                            }
                        }}
                        error={!!pinError}
                    />

                    {pinError && <Text size="xs" c="red">{pinError}</Text>}

                    <Button
                        fullWidth
                        size="md"
                        radius="xl"
                        color="brand"
                        onClick={handlePinSubmit}
                        disabled={pinValue.length !== 4}
                    >
                        확인하기
                    </Button>
                </Stack>
            </Modal>
        </>
    );
}
