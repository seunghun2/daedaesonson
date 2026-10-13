'use client';

import { Box, Text, Group, Stack, Button, ScrollArea, Modal, TextInput, Drawer, Select, Textarea, Switch, ActionIcon, Checkbox } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ChevronLeft, Lock, Unlock, Pencil, X, ChevronDown, Check, Search, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BottomNav from '@/components/common/BottomNav';

// 문의 유형 (작성 폼용)
const INQUIRY_TYPES = [
    { value: 'price', label: '가격문의' },
    { value: 'reservation', label: '예약/절차' },
    { value: 'facility', label: '시설문의' },
    { value: 'other', label: '기타' },
];

// 상단 필터 칩
const FILTER_CHIPS = [
    { value: 'all', label: '전체' },
    { value: 'price', label: '가격문의' },
    { value: 'reservation', label: '예약/절차' },
    { value: 'facility', label: '시설문의' },
    { value: 'other', label: '기타' },
];

interface Inquiry {
    id: string;
    facilityId: string;
    facilityName?: string;
    author?: string;
    title: string;
    content: string;
    isPrivate: boolean;
    phone: string | null;
    type?: string;
    createdAt: string;
    replies?: { id: string; content: string; author: string; createdAt: string }[];
}

interface FacilityOption {
    id: string;
    name: string;
}

interface InquiriesClientProps {
    initialInquiries: Inquiry[];
    facilities?: FacilityOption[];
}

// 전화번호 포맷
const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
};

export default function InquiriesClient({ initialInquiries, facilities = [] }: InquiriesClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);

    // 검색 및 카테고리 필터 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    // 토스트 알림 및 폼 인라인 에러 상태
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => {
            setToastMessage(prev => (prev?.text === text ? null : prev));
        }, 3000);
    };

    // 비밀번호 모달
    const [pwOpened, { open: openPw, close: closePw }] = useDisclosure(false);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [pinValue, setPinValue] = useState('');
    const [pinError, setPinError] = useState(false);
    const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

    // 글쓰기 Drawer
    const [writeOpened, { open: openWrite, close: closeWrite }] = useDisclosure(false);
    const [facilitySelectOpened, setFacilitySelectOpened] = useState(false);
    const [inquiryForm, setInquiryForm] = useState({
        type: '',
        facilityId: '',
        facilityName: '',
        title: '',
        content: '',
        phone: '',
        isPrivate: true,
        privacyAgreed: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 유효성 검사 (010 등 정상 휴대전화 10~11자리 + 필수 필드 + 개인정보 동의)
    const phoneDigits = inquiryForm.phone.replace(/\D/g, '');
    const isPhoneValid = /^01[016789]\d{7,8}$/.test(phoneDigits);
    const isFormValid =
        inquiryForm.title.trim().length > 0 &&
        inquiryForm.content.trim().length > 0 &&
        isPhoneValid &&
        inquiryForm.privacyAgreed;

    // URL 파라미터로 글쓰기 자동 열기 (시설 상세에서 넘어온 경우)
    useEffect(() => {
        const shouldWrite = searchParams.get('write');
        const facilityId = searchParams.get('facilityId');
        const facilityName = searchParams.get('facilityName');

        if (shouldWrite === 'true') {
            if (facilityId && facilityName) {
                setInquiryForm(prev => ({
                    ...prev,
                    facilityId,
                    facilityName: decodeURIComponent(facilityName),
                }));
            }
            setTimeout(() => {
                openWrite();
            }, 300);
        }
    }, [searchParams]);

    // GA4: 문의 페이지뷰
    useEffect(() => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', '문의_페이지_조회', {
                page_title: '문의 목록',
                page_location: window.location.href,
                page_path: '/inquiries'
            });
        }
    }, []);

    // 검색어 + 카테고리 필터링
    const filteredInquiries = useMemo(() => {
        const q = searchQuery.trim().toLowerCase().normalize('NFC');
        return inquiries.filter((inq) => {
            const inqType = inq.type || 'other';
            if (activeCategory !== 'all' && inqType !== activeCategory) {
                return false;
            }
            if (!q) return true;
            const title = (inq.title || '').toLowerCase().normalize('NFC');
            const facName = (!inq.facilityName || inq.facilityName === 'general' || inq.facilityId === 'general' ? '일반' : inq.facilityName).toLowerCase().normalize('NFC');
            const author = (inq.author || '').toLowerCase().normalize('NFC');
            return title.includes(q) || facName.includes(q) || author.includes(q);
        });
    }, [inquiries, searchQuery, activeCategory]);

    const handleInquiryClick = (inquiry: Inquiry) => {
        if (inquiry.isPrivate && !unlockedIds.has(inquiry.id)) {
            setSelectedInquiry(inquiry);
            setPinValue('');
            setPinError(false);
            openPw();
        }
    };

    const verifyPassword = async () => {
        if (!selectedInquiry || pinValue.length !== 4) return;

        try {
            const res = await fetch(`/api/facilities/${selectedInquiry.facilityId}/inquiries/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inquiryId: selectedInquiry.id, pin: pinValue })
            });
            const data = await res.json();

            if (data.success) {
                setUnlockedIds(prev => new Set(prev).add(selectedInquiry.id));
                if (data.inquiry) {
                    setInquiries(prev => prev.map(inq => inq.id === selectedInquiry.id ? {
                        ...inq,
                        title: data.inquiry.title,
                        content: data.inquiry.content,
                        replies: data.inquiry.replies || [],
                    } : inq));
                }
                closePw();
            } else {
                setPinError(true);
            }
        } catch {
            setPinError(true);
        }
    };

    // 문의 등록
    const submitInquiry = async () => {
        setFormError(null);

        if (!inquiryForm.title.trim() || !inquiryForm.content.trim()) {
            setFormError('제목과 문의 내용을 모두 입력해주세요.');
            return;
        }

        const digits = inquiryForm.phone.replace(/\D/g, '');
        if (!/^01[016789]\d{7,8}$/.test(digits)) {
            setFormError('올바른 휴대전화 번호(010 등 10~11자리)를 입력해주세요.');
            return;
        }

        if (!inquiryForm.privacyAgreed) {
            setFormError('개인정보 수집 및 이용 동의가 필요합니다.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facilityId: inquiryForm.facilityId || 'general',
                    type: inquiryForm.type || 'other',
                    title: inquiryForm.title,
                    content: inquiryForm.content,
                    phone: inquiryForm.phone,
                    isPrivate: inquiryForm.isPrivate,
                })
            });

            if (res.ok) {
                const newInquiry = await res.json();
                setInquiries(prev => [{
                    ...newInquiry,
                    facilityName: inquiryForm.facilityName || '일반'
                }, ...prev]);
                closeWrite();
                setInquiryForm({
                    type: '',
                    facilityId: '',
                    facilityName: '',
                    title: '',
                    content: '',
                    phone: '',
                    isPrivate: true,
                    privacyAgreed: true,
                });
                showToast('문의가 정상적으로 등록되었습니다.', 'success');
            } else {
                setFormError('문의 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
        } catch {
            setFormError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTypeLabel = (type?: string) => {
        if (type === 'price') return '가격문의';
        if (type === 'reservation') return '예약/절차';
        if (type === 'facility') return '시설문의';
        return '기타';
    };

    return (
        <Box h="100dvh" bg="white" style={{ display: 'flex', flexDirection: 'column', maxWidth: 640, margin: '0 auto' }}>
            {/* 상단 고정 영역: 헤더 + 검색창 + 카테고리 필터 칩 */}
            <Box
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: 'white',
                    borderBottom: '1px solid #E5E8EB',
                    flexShrink: 0,
                }}
            >
                {/* 헤더 */}
                <Box px="md" py={10}>
                    <Group gap="xs" align="center">
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size={38}
                            radius="md"
                            onClick={() => {
                                if (typeof window !== 'undefined' && window.history.length <= 1) {
                                    router.push('/menu');
                                } else {
                                    router.back();
                                }
                            }}
                            aria-label="뒤로가기"
                        >
                            <ChevronLeft size={22} color="#191F28" />
                        </ActionIcon>
                        <Text fw={700} size="lg" c="#191F28" style={{ letterSpacing: '-0.3px' }}>
                            문의
                        </Text>
                    </Group>
                </Box>

                {/* 문의 검색창 */}
                <Box px="md" pb={10}>
                    <Box
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#F2F4F6',
                            borderRadius: 10,
                            padding: '0 12px',
                            height: 40,
                        }}
                    >
                        <Search size={16} color="#8B95A1" style={{ flexShrink: 0 }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="제목, 작성자, 시설명 검색"
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: '14px',
                                padding: '0 8px',
                                color: '#191F28',
                            }}
                        />
                        {searchQuery && (
                            <ActionIcon
                                variant="transparent"
                                size="xs"
                                onClick={() => setSearchQuery('')}
                                aria-label="검색어 지우기"
                                style={{ color: '#8B95A1' }}
                            >
                                <X size={15} />
                            </ActionIcon>
                        )}
                    </Box>
                </Box>

                {/* 카테고리 필터 칩 */}
                <Box
                    px="md"
                    pb={12}
                    style={{
                        display: 'flex',
                        gap: 6,
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                    }}
                >
                    {FILTER_CHIPS.map((chip) => {
                        const active = activeCategory === chip.value;
                        return (
                            <button
                                key={chip.value}
                                type="button"
                                onClick={() => setActiveCategory(chip.value)}
                                style={{
                                    padding: '6px 13px',
                                    borderRadius: 999,
                                    fontSize: '12.5px',
                                    fontWeight: active ? 700 : 600,
                                    backgroundColor: active ? '#191F28' : '#F2F4F6',
                                    color: active ? '#FFFFFF' : '#4E5968',
                                    border: 'none',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.15s',
                                    flexShrink: 0,
                                }}
                            >
                                {chip.label}
                            </button>
                        );
                    })}
                </Box>
            </Box>

            {/* 안내 메시지 (이모지 제거, SVG 아이콘 적용) */}
            <Box px="md" py={10} bg="#F8FAFC" style={{ borderBottom: '1px solid #F2F4F6', flexShrink: 0 }}>
                <Group gap={8} wrap="nowrap">
                    <Info size={15} color="#2563EB" style={{ flexShrink: 0 }} />
                    <Text size="xs" c="#4E5968" lh={1.45} fw={500}>
                        시설에 대해 궁금한 점을 문의하세요. 비공개 설정 시 제목만 공개됩니다.
                    </Text>
                </Group>
            </Box>

            {/* 토스트 알림 배너 */}
            {toastMessage && (
                <Box
                    mx="md"
                    mt="sm"
                    p="sm"
                    style={{
                        borderRadius: 10,
                        backgroundColor: toastMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                        border: `1px solid ${toastMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                    }}
                >
                    <Group gap={8} wrap="nowrap">
                        {toastMessage.type === 'success' ? (
                            <CheckCircle2 size={16} color="#047857" />
                        ) : (
                            <AlertCircle size={16} color="#DC2626" />
                        )}
                        <Text size="xs" fw={600} c={toastMessage.type === 'success' ? '#047857' : '#DC2626'}>
                            {toastMessage.text}
                        </Text>
                    </Group>
                </Box>
            )}

            {/* 문의 목록 */}
            <ScrollArea style={{ flex: 1 }}>
                {filteredInquiries.length === 0 ? (
                    <Box p="xl" py={60} ta="center">
                        <Text c="#8B95A1" size="sm" fw={500}>
                            {searchQuery.trim() || activeCategory !== 'all'
                                ? '조건에 맞는 문의 내역이 없습니다.'
                                : '등록된 문의가 없습니다.'}
                        </Text>
                    </Box>
                ) : (
                    <Stack gap={0} px="md" py="xs" pb={100}>
                        {filteredInquiries.map(inquiry => {
                            const isUnlocked = unlockedIds.has(inquiry.id);
                            const showBlur = inquiry.isPrivate && !isUnlocked;

                            return (
                                <Box
                                    key={inquiry.id}
                                    py="md"
                                    style={{
                                        borderBottom: '1px solid #F2F4F6',
                                        cursor: inquiry.isPrivate && !isUnlocked ? 'pointer' : 'default'
                                    }}
                                    onClick={() => handleInquiryClick(inquiry)}
                                >
                                    {/* [시설명] 카테고리 + 날짜 */}
                                    <Group justify="space-between" mb={6}>
                                        <Group gap={6}>
                                            <Text size="xs" c="#6B7684" fw={600}>
                                                [{(!inquiry.facilityName || inquiry.facilityName === 'general' || inquiry.facilityId === 'general') ? '일반' : inquiry.facilityName}]
                                            </Text>
                                            <Text size="xs" fw={700} style={{ color: '#2563EB' }}>
                                                {getTypeLabel(inquiry.type)}
                                            </Text>
                                        </Group>
                                        <Text size="xs" c="#8B95A1">
                                            {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' })}
                                        </Text>
                                    </Group>

                                    {/* 자물쇠 + 제목 */}
                                    <Group gap={8} mb={6} wrap="nowrap">
                                        {inquiry.isPrivate && (
                                            isUnlocked ?
                                                <Unlock size={15} color="#22c55e" style={{ flexShrink: 0 }} /> :
                                                <Lock size={15} color="#8B95A1" style={{ flexShrink: 0 }} />
                                        )}
                                        <Text fw={600} c="#191F28" style={{ fontSize: 15, flex: 1 }} lineClamp={1}>
                                            {inquiry.title}
                                        </Text>
                                        {inquiry.replies && inquiry.replies.length > 0 && (
                                            <Box px={8} py={2} style={{ borderRadius: 6, backgroundColor: '#EFF6FF', flexShrink: 0 }}>
                                                <Text size="xs" fw={700} style={{ color: '#2563EB', fontSize: '11px' }}>답변완료</Text>
                                            </Box>
                                        )}
                                    </Group>

                                    {/* 내용 (비공개면 블러) */}
                                    <Text
                                        c="#4E5968"
                                        lineClamp={6}
                                        lh={1.6}
                                        style={{
                                            fontSize: 13,
                                            whiteSpace: 'pre-wrap',
                                            ...(showBlur ? {
                                                filter: 'blur(4px)',
                                                userSelect: 'none'
                                            } : {})
                                        }}
                                    >
                                        {inquiry.content || '문의 내용'}
                                    </Text>

                                    {/* 관리자 답변 내용 */}
                                    {!showBlur && inquiry.replies && inquiry.replies.length > 0 && (
                                        <Box mt="sm" p="sm" style={{ borderRadius: 10, backgroundColor: '#EFF6FF' }}>
                                            {inquiry.replies.map((reply) => (
                                                <Box key={reply.id} mb="xs">
                                                    <Group gap="xs" mb={4}>
                                                        <Text size="xs" fw={700} style={{ color: '#2563EB' }}>
                                                            관리자 답변
                                                        </Text>
                                                        <Text size="xs" c="#8B95A1">
                                                            {new Date(reply.createdAt).toLocaleDateString('ko-KR')}
                                                        </Text>
                                                    </Group>
                                                    <Text size="sm" c="#191F28" style={{ whiteSpace: 'pre-wrap' }}>
                                                        {reply.content}
                                                    </Text>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </ScrollArea>

            {/* 글쓰기 플로팅 버튼 */}
            <Box
                onClick={() => { setFormError(null); openWrite(); }}
                style={{
                    position: 'fixed',
                    bottom: 80,
                    right: 20,
                    backgroundColor: '#2563EB',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: 30,
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    zIndex: 1000,
                }}
            >
                <Pencil size={16} />
                <Text size="sm" fw={700}>글쓰기</Text>
            </Box>

            {/* 비밀번호 입력 모달 */}
            <Modal
                opened={pwOpened}
                onClose={closePw}
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
                    <Box p="md" bg="#F2F4F6" style={{ borderRadius: '50%' }}>
                        <Lock size={24} color="#4E5968" />
                    </Box>
                    <Text size="md" fw={700} c="#191F28">비공개 문의입니다</Text>
                    <Text size="xs" c="#6B7684" ta="center" lh={1.4}>
                        작성 시 입력한 연락처 뒷자리 4자리를 입력해주세요.
                    </Text>
                    <TextInput
                        value={pinValue}
                        onChange={(e) => {
                            const val = e.currentTarget.value.replace(/\D/g, '').slice(0, 4);
                            setPinValue(val);
                            if (pinError) setPinError(false);
                        }}
                        inputMode="numeric"
                        pattern="[0-9]*"
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
                                backgroundColor: '#F2F4F6',
                                border: '1px solid #E5E8EB',
                            }
                        }}
                        error={pinError}
                    />
                    {pinError && <Text size="xs" c="red" fw={500}>비밀번호가 일치하지 않습니다.</Text>}
                    <Button
                        fullWidth
                        size="md"
                        radius="xl"
                        onClick={verifyPassword}
                        disabled={pinValue.length !== 4}
                        styles={{
                            root: {
                                backgroundColor: pinValue.length === 4 ? '#2563EB' : '#E5E8EB',
                                color: pinValue.length === 4 ? '#FFFFFF' : '#8B95A1',
                            }
                        }}
                    >
                        확인하기
                    </Button>
                </Stack>
            </Modal>

            {/* 글쓰기 Drawer */}
            <Drawer
                opened={writeOpened}
                onClose={closeWrite}
                position="right"
                size="100%"
                withCloseButton={false}
                zIndex={10000}
                padding={0}
            >
                {/* 헤더 */}
                <Box p="md" style={{ borderBottom: '1px solid #E5E8EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ActionIcon variant="subtle" color="gray" size={38} radius="md" onClick={closeWrite} aria-label="닫기">
                        <X size={20} color="#191F28" />
                    </ActionIcon>
                    <Text fw={700} c="#191F28">문의하기</Text>
                    <Button
                        size="xs"
                        radius="xl"
                        disabled={!isFormValid || isSubmitting}
                        onClick={submitInquiry}
                        loading={isSubmitting}
                        styles={{
                            root: {
                                backgroundColor: isFormValid ? '#2563EB' : '#E5E8EB',
                                color: isFormValid ? '#FFFFFF' : '#8B95A1',
                            }
                        }}
                    >
                        등록
                    </Button>
                </Box>

                {/* 안내 */}
                <Box p="md" bg="#F8FAFC">
                    <Text size="xs" c="#6B7684">다른 사람을 비방하거나 부적절한 표현은 삼가해주세요.</Text>
                </Box>

                {/* 인라인 에러 메시지 */}
                {formError && (
                    <Box mx="md" mt="md" p="sm" style={{ borderRadius: 10, backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                        <Group gap={8} wrap="nowrap">
                            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                            <Text size="xs" fw={600} c="#DC2626">{formError}</Text>
                        </Group>
                    </Box>
                )}

                {/* 폼 */}
                <Box p="md">
                    <Stack gap="md">
                        {/* 문의 종류 */}
                        <Box>
                            <Group justify="space-between" py="sm" style={{ borderBottom: '1px solid #F2F4F6' }}>
                                <Text size="sm" fw={600} c="#191F28">문의 종류</Text>
                                <Select
                                    data={INQUIRY_TYPES}
                                    value={inquiryForm.type}
                                    onChange={(value) => setInquiryForm({ ...inquiryForm, type: value || '' })}
                                    placeholder="선택해주세요"
                                    variant="unstyled"
                                    rightSection={<ChevronDown size={14} />}
                                    styles={{
                                        input: { textAlign: 'right', color: inquiryForm.type ? '#191F28' : '#8B95A1', fontWeight: 500 },
                                    }}
                                    comboboxProps={{ withinPortal: true, zIndex: 10001 }}
                                />
                            </Group>
                        </Box>

                        {/* 시설 선택 */}
                        <Box>
                            <Group
                                justify="space-between"
                                py="sm"
                                style={{ borderBottom: '1px solid #F2F4F6', cursor: 'pointer' }}
                                onClick={() => setFacilitySelectOpened(!facilitySelectOpened)}
                            >
                                <Text size="sm" fw={600} c="#191F28">시설</Text>
                                <Group gap={4}>
                                    <Text size="sm" c={inquiryForm.facilityName ? '#191F28' : '#8B95A1'} fw={500}>
                                        {inquiryForm.facilityName || '선택안함'}
                                    </Text>
                                    <ChevronDown size={14} color="#8B95A1" />
                                </Group>
                            </Group>
                            {facilitySelectOpened && (
                                <ScrollArea h={200} mt="xs">
                                    <Stack gap={0}>
                                        {/* 선택안함 옵션 */}
                                        <Box
                                            p="sm"
                                            style={{
                                                backgroundColor: !inquiryForm.facilityId ? '#EFF6FF' : 'transparent',
                                                cursor: 'pointer',
                                                borderRadius: 8,
                                            }}
                                            onClick={() => {
                                                setInquiryForm({ ...inquiryForm, facilityId: '', facilityName: '' });
                                                setFacilitySelectOpened(false);
                                            }}
                                        >
                                            <Group justify="space-between">
                                                <Text size="sm" fw={!inquiryForm.facilityId ? 700 : 500} c={!inquiryForm.facilityId ? '#2563EB' : '#6B7684'}>
                                                    선택안함 (일반 문의)
                                                </Text>
                                                {!inquiryForm.facilityId && <Check size={16} color="#2563EB" />}
                                            </Group>
                                        </Box>
                                        {facilities.map(f => (
                                            <Box
                                                key={f.id}
                                                p="sm"
                                                style={{
                                                    backgroundColor: inquiryForm.facilityId === f.id ? '#EFF6FF' : 'transparent',
                                                    cursor: 'pointer',
                                                    borderRadius: 8,
                                                }}
                                                onClick={() => {
                                                    setInquiryForm({ ...inquiryForm, facilityId: f.id, facilityName: f.name });
                                                    setFacilitySelectOpened(false);
                                                }}
                                            >
                                                <Group justify="space-between">
                                                    <Text size="sm" fw={inquiryForm.facilityId === f.id ? 700 : 500} c={inquiryForm.facilityId === f.id ? '#2563EB' : '#191F28'}>
                                                        {f.name}
                                                    </Text>
                                                    {inquiryForm.facilityId === f.id && <Check size={16} color="#2563EB" />}
                                                </Group>
                                            </Box>
                                        ))}
                                    </Stack>
                                </ScrollArea>
                            )}
                        </Box>

                        {/* 제목 */}
                        <Box>
                            <Text size="sm" fw={600} c="#191F28" mb={4}>제목 <Text span c="red">*</Text></Text>
                            <TextInput
                                placeholder="예) 봉안당 가격이 궁금합니다"
                                value={inquiryForm.title}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, title: e.currentTarget.value })}
                                variant="unstyled"
                                styles={{ input: { borderBottom: '1px solid #F2F4F6', borderRadius: 0 } }}
                            />
                        </Box>

                        {/* 내용 */}
                        <Box>
                            <Textarea
                                placeholder="궁금한 점을 자세히 적어주세요."
                                value={inquiryForm.content}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, content: e.target.value })}
                                minRows={6}
                                variant="unstyled"
                            />
                        </Box>

                        {/* 비공개 토글 */}
                        <Box py="md" style={{ borderTop: '1px solid #F2F4F6' }}>
                            <Group justify="space-between">
                                <Group gap="xs">
                                    <Box
                                        p={6}
                                        style={{
                                            borderRadius: 8,
                                            backgroundColor: inquiryForm.isPrivate ? '#EFF6FF' : '#F2F4F6',
                                        }}
                                    >
                                        {inquiryForm.isPrivate ? <Lock size={16} color="#2563EB" /> : <Unlock size={16} color="#8B95A1" />}
                                    </Box>
                                    <Text size="sm" fw={600} c="#191F28">비공개</Text>
                                </Group>
                                <Switch
                                    checked={inquiryForm.isPrivate}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, isPrivate: e.currentTarget.checked })}
                                    color="blue"
                                />
                            </Group>
                        </Box>

                        {/* 연락처 */}
                        <Box py="md" style={{ borderTop: '1px solid #F2F4F6' }}>
                            <Text size="sm" fw={600} c="#191F28" mb={8}>연락처 (비밀번호로 사용) <Text span c="red">*</Text></Text>
                            <TextInput
                                placeholder="010-0000-0000"
                                inputMode="numeric"
                                value={inquiryForm.phone}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, phone: formatPhoneNumber(e.currentTarget.value) })}
                                variant="filled"
                                radius="md"
                                error={inquiryForm.phone.length > 0 && !isPhoneValid ? '010으로 시작하는 10~11자리 번호를 입력해주세요.' : false}
                            />
                        </Box>

                        {/* 개인정보 수집 및 이용 동의 */}
                        <Box py="md" style={{ borderTop: '1px solid #F2F4F6' }}>
                            <Checkbox
                                checked={inquiryForm.privacyAgreed}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, privacyAgreed: e.currentTarget.checked })}
                                label={
                                    <Text size="xs" c="#191F28" fw={600}>
                                        <Text span fw={700} style={{ color: '#2563EB' }}>[필수] </Text>
                                        개인정보 수집 및 이용 동의
                                    </Text>
                                }
                                color="blue"
                                size="xs"
                            />
                            <Box mt={8} p={10} bg="#F8FAFC" style={{ borderRadius: 8 }}>
                                <Text size="11px" c="#6B7684" lh={1.5}>
                                    - 수집 항목: 연락처, 문의 내용<br />
                                    - 이용 목적: 문의 접수 및 답변 안내, 본인 확인(비밀번호 대용)<br />
                                    - 보유 및 이용 기간: 문의 처리 완료 후 1년 또는 파기 요청 시까지
                                </Text>
                            </Box>
                        </Box>
                    </Stack>
                </Box>
            </Drawer>

            {/* 하단 탭바 */}
            <BottomNav />
        </Box>
    );
}
