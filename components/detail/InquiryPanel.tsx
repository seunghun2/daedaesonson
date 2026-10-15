'use client';

import { Drawer, Box, Text, Group, Button, Stack, TextInput, Textarea, Switch, Paper, Modal, ActionIcon, Checkbox, ScrollArea } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { ArrowLeft, PenLine, Lock, Unlock, X, MessageCircle, Info, UserCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Facility, FACILITY_CATEGORY_LABELS, FacilityCategory } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginModal from '@/components/auth/LoginModal';

interface Inquiry {
    id: string;
    facilityId: string;
    type?: string;
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

export interface InquiryPreset {
    type: string;
    title: string;
    content?: string;
}

interface InquiryPanelProps {
    facility: Facility;
    isOpen: boolean;
    onClose: () => void;
    allFacilities?: Facility[];
    initialPreset?: InquiryPreset | null;
    onPresetConsumed?: () => void;
}

const INQUIRY_CATEGORIES = [
    { value: 'price', label: '가격 문의' },
    { value: 'reservation', label: '예약/절차' },
    { value: 'facility', label: '시설 문의' },
    { value: 'other', label: '기타' },
];

export default function InquiryPanel({
    facility,
    isOpen,
    onClose,
    allFacilities = [],
    initialPreset = null,
    onPresetConsumed,
}: InquiryPanelProps) {
    // 모바일 감지 (기본값 true - SSR 대응)
    const isMobileQuery = useMediaQuery('(max-width: 800px)');
    const isMobile = isMobileQuery ?? true;
    const { user, profile } = useAuth();
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    // 시설 ID → 시설명 매핑
    const facilityNameMap = new Map(allFacilities.map(f => [f.id, f.name]));

    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 패널 내 문의 작성 모드
    const [writeOpened, { open: openWrite, close: closeWrite }] = useDisclosure(false);
    const [inquiryType, setInquiryType] = useState('price');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [phone, setPhone] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);
    const [privacyAgreed, setPrivacyAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [writeError, setWriteError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    // 비밀번호 확인 모달
    const [pinOpened, { open: openPin, close: closePin }] = useDisclosure(false);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [pinValue, setPinValue] = useState('');
    const [pinError, setPinError] = useState('');
    const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

    // 로그인된 유저의 연락처 자동 입력
    useEffect(() => {
        if (profile?.phone && !phone) {
            const raw = String(profile.phone).replace(/[^0-9]/g, '');
            if (raw.length >= 10) {
                const formatted = raw.length === 11
                    ? `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`
                    : `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
                setPhone(formatted);
            }
        }
    }, [profile?.phone, phone]);

    // 빠른 질문 칩(initialPreset)으로 열렸을 때 자동으로 작성 폼 오픈 및 프리필
    useEffect(() => {
        if (isOpen && initialPreset) {
            setInquiryType(initialPreset.type || 'price');
            setTitle(initialPreset.title || '');
            if (initialPreset.content) setContent(initialPreset.content);
            setWriteError('');
            openWrite();
            onPresetConsumed?.();
        }
    }, [isOpen, initialPreset, openWrite, onPresetConsumed]);

    // 문의 목록 로드
    useEffect(() => {
        if (isOpen && facility?.id) {
            loadInquiries();
        }
        if (!isOpen) {
            closeWrite();
            setWriteError('');
        }
    }, [isOpen, facility?.id]);

    const loadInquiries = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/facilities/${facility.id}/inquiries`);
            const data = await res.json();
            if (data.inquiries) {
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

    const phoneDigits = phone.replace(/\D/g, '');
    const isPhoneValid = /^01[016789]\d{7,8}$/.test(phoneDigits);
    const isFormValid = title.trim().length >= 2 && content.trim().length >= 5 && isPhoneValid && privacyAgreed;

    // 문의 등록
    const handleSubmit = async () => {
        if (!title.trim() || title.trim().length < 2) {
            setWriteError('제목을 2자 이상 입력해주세요.');
            return;
        }
        if (!content.trim() || content.trim().length < 5) {
            setWriteError('문의 내용을 5자 이상 입력해주세요.');
            return;
        }
        if (!isPhoneValid) {
            setWriteError('010으로 시작하는 올바른 연락처를 입력해주세요.');
            return;
        }
        if (!privacyAgreed) {
            setWriteError('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }

        setWriteError('');
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/facilities/${facility.id}/inquiries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: inquiryType,
                    title: title.trim(),
                    content: content.trim(),
                    phone,
                    isPrivate
                })
            });

            if (res.ok) {
                const data = await res.json();
                setInquiries(prev => [data.inquiry, ...prev]);
                if (data.inquiry?.id) {
                    setUnlockedIds(prev => new Set([...prev, data.inquiry.id]));
                }
                setTitle('');
                setContent('');
                setPhone('');
                setIsPrivate(true);
                setPrivacyAgreed(false);
                setWriteError('');
                closeWrite();
                setStatusMessage('문의가 정상적으로 등록되었습니다.');
                setTimeout(() => setStatusMessage(''), 3500);
            } else {
                const err = await res.json();
                setWriteError(err.error || '등록에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            setWriteError('등록 중 오류가 발생했습니다.');
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
                const data = await res.json();
                if (data.inquiry) {
                    setInquiries(prev => prev.map(item => item.id === selectedInquiry.id ? { ...item, ...data.inquiry } : item));
                }
                setUnlockedIds(prev => new Set([...prev, selectedInquiry.id]));
                closePin();
                document.body.style.overflow = '';
                document.body.style.position = '';
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

    // 전화번호 포맷팅
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 3) return digits;
        if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    };

    return (
        <>
            <Drawer
                opened={isOpen}
                onClose={onClose}
                position={isMobile ? 'bottom' : 'left'}
                size={isMobile ? '92%' : 400}
                zIndex={10010}
                transitionProps={{ duration: 0 }}
                styles={{
                    overlay: {
                        backgroundColor: isMobile ? 'rgba(0,0,0,0.5)' : 'transparent',
                        pointerEvents: isMobile ? 'auto' : 'none'
                    },
                    content: isMobile ? {
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20
                    } : {
                        marginLeft: '400px',
                        boxShadow: '4px 0 20px rgba(15, 23, 42, 0.12)'
                    },
                    header: { display: 'none' },
                    body: { padding: 0, backgroundColor: '#fff', height: '100%' }
                }}
                withCloseButton={false}
                lockScroll={false}
            >
                <Stack gap={0} h="100%">
                    {/* Header */}
                    <Box px="md" py={14} style={{ borderBottom: '1px solid #E5E8EB', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
                        <Group justify="space-between" align="center">
                            {writeOpened ? (
                                <Group gap={8}>
                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        size={32}
                                        radius="md"
                                        onClick={() => { closeWrite(); setWriteError(''); }}
                                        aria-label="목록으로 돌아가기"
                                    >
                                        <ArrowLeft size={18} color="#191F28" />
                                    </ActionIcon>
                                    <Text fw={700} size="md" c="#191F28">시설 문의 작성</Text>
                                </Group>
                            ) : (
                                <Group gap={6} align="baseline">
                                    <Text fw={700} size="lg" c="#191F28">시설 문의</Text>
                                    <Text fw={700} size="md" c="#2563EB">{inquiries.length}</Text>
                                </Group>
                            )}
                            <Group gap={8}>
                                {!writeOpened && (
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="brand"
                                        leftSection={<PenLine size={14} />}
                                        radius="xl"
                                        onClick={() => { setWriteError(''); openWrite(); }}
                                        styles={{ root: { fontWeight: 600 } }}
                                    >
                                        글쓰기
                                    </Button>
                                )}
                                <ActionIcon variant="subtle" color="dark" onClick={onClose} aria-label="닫기">
                                    <X size={20} />
                                </ActionIcon>
                            </Group>
                        </Group>
                    </Box>

                    {writeOpened ? (
                        /* ── 패널 내부 문의 작성 폼 (페이지 이탈 없이 즉시 작성) ── */
                        <>
                            <ScrollArea style={{ flex: 1, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }} bg="#F8FAFC" type="scroll">
                                <Stack gap={16} p="md">
                                    {/* 대상 시설 배너 */}
                                    <Paper p="sm" radius="md" bg="#EFF6FF" style={{ border: '1px solid #DBEAFE' }}>
                                        <Group justify="space-between" align="center" wrap="nowrap">
                                            <Box>
                                                <Text size="11px" c="#2563EB" fw={700}>문의 대상 시설</Text>
                                                <Text size="sm" c="#191F28" fw={700} mt={2}>{facility.name}</Text>
                                            </Box>
                                            <Box px={8} py={3} bg="#FFFFFF" style={{ borderRadius: 6, border: '1px solid #DBEAFE' }}>
                                                <Text size="11px" c="#1E40AF" fw={600}>
                                                    {FACILITY_CATEGORY_LABELS[facility.category as FacilityCategory] || facility.category}
                                                </Text>
                                            </Box>
                                        </Group>
                                    </Paper>

                                    {writeError && (
                                        <Paper p="xs" radius="md" bg="#FEF2F2" style={{ border: '1px solid #FECACA' }}>
                                            <Text size="xs" c="#DC2626" fw={600} ta="center">{writeError}</Text>
                                        </Paper>
                                    )}

                                    <Paper p="md" radius="lg" bg="#FFFFFF" style={{ border: '1px solid #E5E8EB' }}>
                                        <Stack gap={16}>
                                            {/* 문의 유형 1-Tap 칩 */}
                                            <Box>
                                                <Text size="xs" fw={700} c="#334155" mb={8}>
                                                    문의 유형 <Text span c="#EF4444">*</Text>
                                                </Text>
                                                <Group gap={6}>
                                                    {INQUIRY_CATEGORIES.map(cat => {
                                                        const active = inquiryType === cat.value;
                                                        return (
                                                            <Box
                                                                key={cat.value}
                                                                onClick={() => setInquiryType(cat.value)}
                                                                px={12}
                                                                py={7}
                                                                style={{
                                                                    borderRadius: 999,
                                                                    fontSize: 12.5,
                                                                    fontWeight: active ? 700 : 500,
                                                                    cursor: 'pointer',
                                                                    backgroundColor: active ? '#2563EB' : '#F8FAFC',
                                                                    color: active ? '#FFFFFF' : '#475569',
                                                                    border: active ? '1px solid #2563EB' : '1px solid #CBD5E1',
                                                                    transition: 'all 0.15s ease',
                                                                }}
                                                            >
                                                                {cat.label}
                                                            </Box>
                                                        );
                                                    })}
                                                </Group>
                                            </Box>

                                            {/* 제목 */}
                                            <Box>
                                                <Text size="xs" fw={700} c="#334155" mb={6}>
                                                    제목 <Text span c="#EF4444">*</Text>
                                                </Text>
                                                <TextInput
                                                    placeholder="예) 부부형 안치 비용과 절차가 궁금합니다"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.currentTarget.value)}
                                                    styles={{
                                                        input: {
                                                            height: 44,
                                                            borderRadius: 10,
                                                            backgroundColor: '#FFFFFF',
                                                            border: '1px solid #CBD5E1',
                                                            fontSize: 14,
                                                            color: '#191F28',
                                                        }
                                                    }}
                                                />
                                            </Box>

                                            {/* 문의 내용 */}
                                            <Box>
                                                <Text size="xs" fw={700} c="#334155" mb={6}>
                                                    문의 내용 <Text span c="#EF4444">*</Text>
                                                </Text>
                                                <Textarea
                                                    placeholder="궁금하신 내용(가격, 안치 가능 여부, 방문 예약 등)을 자세히 남겨주시면 담당자가 확인 후 답변드립니다."
                                                    value={content}
                                                    onChange={(e) => setContent(e.currentTarget.value)}
                                                    minRows={4}
                                                    maxRows={8}
                                                    autosize
                                                    styles={{
                                                        input: {
                                                            borderRadius: 10,
                                                            backgroundColor: '#FFFFFF',
                                                            border: '1px solid #CBD5E1',
                                                            fontSize: 14,
                                                            lineHeight: 1.6,
                                                            color: '#191F28',
                                                            padding: '10px 12px',
                                                        }
                                                    }}
                                                />
                                            </Box>

                                            {/* 연락처 */}
                                            <Box>
                                                <Text size="xs" fw={700} c="#334155" mb={4}>
                                                    연락처 (뒷자리 4자리가 비밀번호로 사용됩니다) <Text span c="#EF4444">*</Text>
                                                </Text>
                                                <TextInput
                                                    placeholder="010-0000-0000"
                                                    inputMode="numeric"
                                                    value={phone}
                                                    onChange={(e) => setPhone(formatPhone(e.currentTarget.value))}
                                                    error={phone.length > 0 && !isPhoneValid ? '010으로 시작하는 10~11자리 번호를 입력해주세요.' : false}
                                                    styles={{
                                                        input: {
                                                            height: 44,
                                                            borderRadius: 10,
                                                            backgroundColor: '#FFFFFF',
                                                            border: '1px solid #CBD5E1',
                                                            fontSize: 15,
                                                            fontWeight: 500,
                                                            color: '#191F28',
                                                        }
                                                    }}
                                                />
                                            </Box>

                                            {/* 비공개 설정 */}
                                            <Box pt={8} style={{ borderTop: '1px solid #F1F5F9' }}>
                                                <Group justify="space-between">
                                                    <Group gap={8}>
                                                        <Box
                                                            p={6}
                                                            style={{
                                                                borderRadius: 8,
                                                                backgroundColor: isPrivate ? '#EFF6FF' : '#F1F5F9',
                                                            }}
                                                        >
                                                            {isPrivate ? <Lock size={15} color="#2563EB" /> : <Unlock size={15} color="#64748B" />}
                                                        </Box>
                                                        <Box>
                                                            <Text size="xs" fw={700} c="#191F28">비공개 문의</Text>
                                                            <Text size="11px" c="#64748B">본인과 관리자만 내용을 확인할 수 있습니다</Text>
                                                        </Box>
                                                    </Group>
                                                    <Switch
                                                        checked={isPrivate}
                                                        onChange={(e) => setIsPrivate(e.currentTarget.checked)}
                                                        color="blue"
                                                    />
                                                </Group>
                                            </Box>

                                            {/* 개인정보 수집 동의 */}
                                            <Box pt={8} style={{ borderTop: '1px solid #F1F5F9' }}>
                                                <Checkbox
                                                    checked={privacyAgreed}
                                                    onChange={(e) => setPrivacyAgreed(e.currentTarget.checked)}
                                                    label={
                                                        <Text size="xs" c="#191F28" fw={600}>
                                                            <Text span fw={700} style={{ color: '#2563EB' }}>[필수] </Text>
                                                            개인정보 수집 및 이용 동의
                                                        </Text>
                                                    }
                                                    color="blue"
                                                    size="xs"
                                                />
                                                <Box mt={8} p={10} bg="#F8FAFC" style={{ borderRadius: 8, border: '1px solid #EEF1F5' }}>
                                                    <Text size="11px" c="#64748B" lh={1.5}>
                                                        · 수집 항목: 연락처, 문의 내용<br />
                                                        · 이용 목적: 시설 문의 답변 안내 및 본인 확인(비밀번호)<br />
                                                        · 보유 기간: 문의 처리 완료 후 1년 또는 파기 요청 시까지
                                                    </Text>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                </Stack>
                            </ScrollArea>

                            {/* 하단 고정 등록 버튼 */}
                            <Box
                                p="md"
                                style={{
                                    borderTop: '1px solid #E5E8EB',
                                    backgroundColor: '#FFFFFF',
                                    paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
                                    flexShrink: 0,
                                }}
                            >
                                <Button
                                    fullWidth
                                    size="md"
                                    radius="md"
                                    loading={isSubmitting}
                                    disabled={!isFormValid || isSubmitting}
                                    onClick={handleSubmit}
                                    styles={{
                                        root: {
                                            height: 48,
                                            backgroundColor: isFormValid ? '#2563EB' : '#E2E8F0',
                                            color: isFormValid ? '#FFFFFF' : '#94A3B8',
                                            fontWeight: 700,
                                            fontSize: 15,
                                        }
                                    }}
                                >
                                    문의 등록하기
                                </Button>
                            </Box>
                        </>
                    ) : (
                        /* ── 문의 목록 뷰 ── */
                        <>
                            <ScrollArea style={{ flex: 1, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }} bg="#F8FAFC" type="scroll">
                                <Stack gap="sm" p="md">
                                    {/* 안내 문구 */}
                                    <Paper p="sm" radius="md" bg="#EFF6FF" style={{ border: '1px solid #DBEAFE' }}>
                                        <Group gap={6} wrap="nowrap" align="center">
                                            <Info size={14} color="#2563EB" style={{ flexShrink: 0 }} />
                                            <Text size="xs" c="#1E40AF" fw={500}>
                                                시설에 대해 궁금한 점을 문의하세요. 비공개 설정 시 작성자만 열람할 수 있습니다.
                                            </Text>
                                        </Group>
                                    </Paper>

                                    {statusMessage && (
                                        <Paper p="xs" radius="md" bg="#F0FDF4" style={{ border: '1px solid #DCFCE7' }}>
                                            <Text size="xs" c="#16A34A" fw={600} ta="center">{statusMessage}</Text>
                                        </Paper>
                                    )}

                                    {/* 문의 목록 */}
                                    {isLoading ? (
                                        <Text c="dimmed" ta="center" py="xl" size="sm">불러오는 중...</Text>
                                    ) : inquiries.length === 0 ? (
                                        <Paper p="xl" radius="lg" bg="#FFFFFF" style={{ border: '1px solid #E5E8EB', textAlign: 'center' }}>
                                            <Text size="sm" fw={600} c="#334155" mb={4}>아직 등록된 문의가 없습니다</Text>
                                            <Text size="xs" c="#64748B" mb="md">가격, 안치 절차, 방문 예약 등 궁금한 점을 남겨보세요.</Text>
                                            <Button
                                                size="sm"
                                                radius="xl"
                                                color="brand"
                                                leftSection={<PenLine size={14} />}
                                                onClick={() => { setWriteError(''); openWrite(); }}
                                                style={{ backgroundColor: '#2563EB' }}
                                            >
                                                첫 문의 작성하기
                                            </Button>
                                        </Paper>
                                    ) : inquiries.map(inquiry => {
                                        const isUnlocked = unlockedIds.has(inquiry.id);
                                        const showContent = !inquiry.isPrivate || isUnlocked;

                                        return (
                                            <Paper
                                                key={inquiry.id}
                                                p="md"
                                                radius="md"
                                                bg="#FFFFFF"
                                                style={{
                                                    border: '1px solid #E5E8EB',
                                                    cursor: showContent ? 'default' : 'pointer'
                                                }}
                                                onClick={() => !showContent && handleUnlock(inquiry)}
                                            >
                                                {/* [시설명] 카테고리 + 날짜 */}
                                                <Group justify="space-between" mb={6}>
                                                    <Group gap={6}>
                                                        <Text size="xs" c="#64748B">[{inquiry.facilityId === 'general' ? '일반' : (facilityNameMap.get(inquiry.facilityId) || facility.name)}]</Text>
                                                        <Text size="xs" c="#2563EB" fw={600}>
                                                            {inquiry.type === 'price' ? '가격 문의' :
                                                                inquiry.type === 'reservation' ? '예약/절차' :
                                                                    inquiry.type === 'facility' ? '시설 문의' : '기타'}
                                                        </Text>
                                                    </Group>
                                                    <Text size="xs" c="#94A3B8">
                                                        {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' })}
                                                    </Text>
                                                </Group>

                                                {/* 자물쇠 + 제목 */}
                                                <Group gap={6} mb={4}>
                                                    {inquiry.isPrivate && (
                                                        <Lock size={14} color={isUnlocked ? '#16A34A' : '#94A3B8'} />
                                                    )}
                                                    <Text fw={600} c="#191F28" style={{ fontSize: 13.5 }}>{inquiry.title}</Text>
                                                    {inquiry.replies && inquiry.replies.length > 0 && (
                                                        <Box px={6} py={2} bg="#EFF6FF" style={{ borderRadius: 4 }}>
                                                            <Text size="11px" c="#2563EB" fw={700}>답변완료</Text>
                                                        </Box>
                                                    )}
                                                </Group>

                                                {/* 내용 (비공개면 안내 문구) */}
                                                {showContent ? (
                                                    <Text
                                                        c="#475569"
                                                        style={{
                                                            fontSize: 13,
                                                            whiteSpace: 'pre-wrap',
                                                            lineHeight: 1.55,
                                                        }}
                                                    >
                                                        {inquiry.content || '문의 내용'}
                                                    </Text>
                                                ) : (
                                                    <Text size="xs" c="#94A3B8">
                                                        비공개 문의입니다. 클릭하여 비밀번호(연락처 뒷 4자리)를 입력해주세요.
                                                    </Text>
                                                )}

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
                                                    <Box key={reply.id} bg="#F8FAFC" p="sm" mt="sm" style={{ borderRadius: 8, borderLeft: '3px solid #2563EB' }}>
                                                        <Group gap="xs" mb={4}>
                                                            <MessageCircle size={12} color="#2563EB" />
                                                            <Text size="xs" fw={700} c="#2563EB">{reply.author}</Text>
                                                            <Text size="xs" c="dimmed">{new Date(reply.createdAt).toLocaleDateString('ko-KR')}</Text>
                                                        </Group>
                                                        <Text size="xs" c="#191F28" lh={1.5}>{reply.content}</Text>
                                                    </Box>
                                                ))}
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            </ScrollArea>

                            {/* 하단 고정 문의 작성하기 CTA */}
                            <Box
                                p="md"
                                style={{
                                    borderTop: '1px solid #E5E8EB',
                                    backgroundColor: '#FFFFFF',
                                    paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
                                    flexShrink: 0,
                                }}
                            >
                                <Button
                                    fullWidth
                                    size="md"
                                    radius="md"
                                    leftSection={<PenLine size={16} />}
                                    onClick={() => { setWriteError(''); openWrite(); }}
                                    style={{
                                        height: 48,
                                        backgroundColor: '#2563EB',
                                        fontWeight: 700,
                                        fontSize: 15,
                                    }}
                                >
                                    이 시설에 문의 작성하기
                                </Button>
                            </Box>
                        </>
                    )}
                </Stack>
            </Drawer>
            {/* 비밀번호 입력 - 팝업 */}
            <Modal
                opened={pinOpened}
                onClose={() => { closePin(); document.body.style.overflow = ''; document.body.style.position = ''; }}
                centered
                size={320}
                radius="lg"
                withCloseButton={false}
                lockScroll={false}
                styles={{
                    root: { zIndex: 10020 },
                    content: { padding: 0 },
                    body: { padding: '28px 24px' }
                }}
            >
                <Stack gap="md" align="center">
                    {/* 자물쇠 아이콘 */}
                    <Box
                        p="md"
                        bg="#EFF6FF"
                        style={{ borderRadius: '50%' }}
                    >
                        <Lock size={24} color="#2563EB" />
                    </Box>

                    <Text size="md" fw={700} c="#191F28">비공개 문의입니다</Text>
                    <Text size="xs" c="dimmed" ta="center" lh={1.4}>
                        작성 시 입력한 연락처 뒷자리 4자리를 입력해주세요.
                    </Text>

                    <TextInput
                        inputMode="numeric"
                        value={pinValue}
                        onChange={(e) => {
                            const val = e.currentTarget.value.replace(/\D/g, '').slice(0, 4);
                            setPinValue(val);
                            if (pinError) setPinError('');
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
                                fontWeight: 600,
                                color: '#191F28',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                '&::placeholder': {
                                    letterSpacing: '12px'
                                }
                            }
                        }}
                        error={!!pinError}
                    />

                    {pinError && <Text size="xs" c="red" fw={500}>{pinError}</Text>}

                    <Button
                        fullWidth
                        size="md"
                        radius="xl"
                        color="brand"
                        onClick={handlePinSubmit}
                        disabled={pinValue.length !== 4}
                        style={{ backgroundColor: pinValue.length === 4 ? '#2563EB' : undefined }}
                    >
                        확인하기
                    </Button>
                </Stack>
            </Modal>
            <LoginModal
                isOpen={loginModalOpen}
                onClose={() => setLoginModalOpen(false)}
                reason={`로그인하시면 [${facility.name}]에 남기신 1:1 문의 내역과 답변 알림을 내 정보에서 언제든 확인하실 수 있습니다.`}
            />
        </>
    );
}

