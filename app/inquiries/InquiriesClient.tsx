'use client';

import { Box, Text, Group, Stack, Button, ScrollArea, Modal, TextInput, Drawer, Select, Textarea, Switch, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ChevronLeft, Lock, Unlock, Pencil, X, ChevronDown, Check, Camera } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/common/BottomNav';

// 문의 유형
const INQUIRY_TYPES = [
    { value: 'price', label: '가격 문의' },
    { value: 'reservation', label: '예약/절차' },
    { value: 'facility', label: '시설' },
    { value: 'other', label: '기타' },
];

interface Inquiry {
    id: string;
    facilityId: string;
    facilityName?: string;
    title: string;
    content: string;
    isPrivate: boolean;
    phone: string;
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
    const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);

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

    // 📊 GA4: 문의 페이지뷰
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'page_view', {
                page_title: '문의 목록',
                page_location: window.location.href,
                page_path: '/inquiries'
            });
        }
    }, []);

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
                closePw();
            } else {
                setPinError(true);
            }
        } catch (e) {
            setPinError(true);
        }
    };

    // 문의 등록
    const submitInquiry = async () => {
        if (!inquiryForm.title.trim() || !inquiryForm.content.trim() || !inquiryForm.phone.trim()) {
            alert('필수 항목을 입력해주세요.');
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
                alert('문의가 등록되었습니다!');
            } else {
                alert('등록에 실패했습니다.');
            }
        } catch (e) {
            alert('오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box h="100vh" bg="white">
            {/* 헤더 - 심플 */}
            <Box
                p="md"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: 'white',
                    borderBottom: '1px solid #f1f3f5',
                }}
            >
                <Text fw={700} size="lg">문의</Text>
            </Box>

            {/* 안내 메시지 */}
            <Box p="md" bg="gray.0">
                <Text size="xs" c="dimmed">
                    💡 시설에 대해 궁금한 점을 문의하세요. 비공개 설정 시 제목만 공개됩니다.
                </Text>
            </Box>

            {/* 문의 목록 */}
            <ScrollArea h="calc(100vh - 130px - 56px)">
                {inquiries.length === 0 ? (
                    <Box p="xl" ta="center">
                        <Text c="dimmed">등록된 문의가 없습니다.</Text>
                    </Box>
                ) : (
                    <Stack gap={0} p="md">
                        {inquiries.map(inquiry => {
                            const isUnlocked = unlockedIds.has(inquiry.id);
                            const showBlur = inquiry.isPrivate && !isUnlocked;

                            return (
                                <Box
                                    key={inquiry.id}
                                    py="md"
                                    style={{
                                        borderBottom: '1px solid #f1f3f5',
                                        cursor: inquiry.isPrivate && !isUnlocked ? 'pointer' : 'default'
                                    }}
                                    onClick={() => handleInquiryClick(inquiry)}
                                >
                                    {/* [시설명] 카테고리 + 날짜 */}
                                    <Group justify="space-between" mb={4}>
                                        <Group gap={4}>
                                            <Text size="xs" c="dimmed">[{inquiry.facilityName || '시설'}]</Text>
                                            <Text size="xs" c="brand" fw={500}>
                                                {inquiry.type === 'price' ? '가격 문의' :
                                                    inquiry.type === 'reservation' ? '예약/절차' :
                                                        inquiry.type === 'facility' ? '시설' : '기타'}
                                            </Text>
                                        </Group>
                                        <Text size="xs" c="dimmed">
                                            {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' })}
                                        </Text>
                                    </Group>

                                    {/* 자물쇠 + 제목 */}
                                    <Group gap={6} mb={4}>
                                        {inquiry.isPrivate && (
                                            isUnlocked ?
                                                <Unlock size={14} color="#22c55e" /> :
                                                <Lock size={14} color="#adb5bd" />
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
                                            ...(showBlur ? {
                                                filter: 'blur(4px)',
                                                userSelect: 'none'
                                            } : {})
                                        }}
                                    >
                                        {inquiry.content || '문의 내용'}
                                    </Text>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </ScrollArea>

            {/* 글쓰기 플로팅 버튼 */}
            <Box
                onClick={openWrite}
                style={{
                    position: 'fixed',
                    bottom: 80,
                    right: 20,
                    backgroundColor: '#1D0098',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: 30,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    zIndex: 1000,
                }}
            >
                <Pencil size={16} />
                <Text size="sm" fw={600}>글쓰기</Text>
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
                    <Box p="md" bg="gray.1" style={{ borderRadius: '50%' }}>
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
                            }
                        }}
                        error={pinError}
                    />
                    {pinError && <Text size="xs" c="red">비밀번호가 일치하지 않습니다.</Text>}
                    <Button
                        fullWidth
                        size="md"
                        radius="xl"
                        color="brand"
                        onClick={verifyPassword}
                        disabled={pinValue.length !== 4}
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
                <Box p="md" style={{ borderBottom: '1px solid #f1f3f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ActionIcon variant="subtle" color="gray" onClick={closeWrite}>
                        <X size={20} />
                    </ActionIcon>
                    <Text fw={700}>문의하기</Text>
                    <Button
                        size="xs"
                        radius="xl"
                        color="brand"
                        disabled={!inquiryForm.title.trim() || !inquiryForm.content.trim() || !inquiryForm.phone.trim() || isSubmitting}
                        onClick={submitInquiry}
                        loading={isSubmitting}
                    >
                        등록
                    </Button>
                </Box>

                {/* 안내 */}
                <Box p="md" bg="gray.0">
                    <Text size="xs" c="dimmed">다른 사람을 비방하거나 부적절한 표현은 삼가해주세요.</Text>
                </Box>

                {/* 폼 */}
                <Box p="md">
                    <Stack gap="md">
                        {/* 문의 종류 */}
                        <Box>
                            <Group justify="space-between" py="sm" style={{ borderBottom: '1px solid #f1f3f5' }}>
                                <Text size="sm" fw={500}>문의 종류</Text>
                                <Select
                                    data={INQUIRY_TYPES}
                                    value={inquiryForm.type}
                                    onChange={(value) => setInquiryForm({ ...inquiryForm, type: value || '' })}
                                    placeholder="선택해주세요"
                                    variant="unstyled"
                                    rightSection={<ChevronDown size={14} />}
                                    styles={{
                                        input: { textAlign: 'right', color: inquiryForm.type ? '#495057' : '#adb5bd' },
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
                                style={{ borderBottom: '1px solid #f1f3f5', cursor: 'pointer' }}
                                onClick={() => setFacilitySelectOpened(!facilitySelectOpened)}
                            >
                                <Text size="sm" fw={500}>시설</Text>
                                <Group gap={4}>
                                    <Text size="sm" c={inquiryForm.facilityName ? 'dark' : 'dimmed'}>
                                        {inquiryForm.facilityName || '선택안함'}
                                    </Text>
                                    <ChevronDown size={14} />
                                </Group>
                            </Group>
                            {facilitySelectOpened && (
                                <ScrollArea h={200} mt="xs">
                                    <Stack gap={0}>
                                        {/* 선택안함 옵션 */}
                                        <Box
                                            p="sm"
                                            style={{
                                                backgroundColor: !inquiryForm.facilityId ? '#e7f5ff' : 'transparent',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => {
                                                setInquiryForm({ ...inquiryForm, facilityId: '', facilityName: '' });
                                                setFacilitySelectOpened(false);
                                            }}
                                        >
                                            <Group justify="space-between">
                                                <Text size="sm" fw={!inquiryForm.facilityId ? 600 : 500} c="dimmed">선택안함 (일반 문의)</Text>
                                                {!inquiryForm.facilityId && <Check size={16} color="#1D0098" />}
                                            </Group>
                                        </Box>
                                        {facilities.map(f => (
                                            <Box
                                                key={f.id}
                                                p="sm"
                                                style={{
                                                    backgroundColor: inquiryForm.facilityId === f.id ? '#e7f5ff' : 'transparent',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => {
                                                    setInquiryForm({ ...inquiryForm, facilityId: f.id, facilityName: f.name });
                                                    setFacilitySelectOpened(false);
                                                }}
                                            >
                                                <Group justify="space-between">
                                                    <Text size="sm" fw={inquiryForm.facilityId === f.id ? 600 : 500}>{f.name}</Text>
                                                    {inquiryForm.facilityId === f.id && <Check size={16} color="#1D0098" />}
                                                </Group>
                                            </Box>
                                        ))}
                                    </Stack>
                                </ScrollArea>
                            )}
                        </Box>

                        {/* 제목 */}
                        <Box>
                            <Text size="sm" fw={500} mb={4}>제목 <Text span c="red">*</Text></Text>
                            <TextInput
                                placeholder="ex) 봉안당 가격이 궁금합니다"
                                value={inquiryForm.title}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, title: e.currentTarget.value })}
                                variant="unstyled"
                                styles={{ input: { borderBottom: '1px solid #f1f3f5', borderRadius: 0 } }}
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
                        <Box py="md" style={{ borderTop: '1px solid #f1f3f5' }}>
                            <Group justify="space-between">
                                <Group gap="xs">
                                    <Box
                                        p={6}
                                        style={{
                                            borderRadius: 8,
                                            backgroundColor: inquiryForm.isPrivate ? '#e7f5ff' : '#f1f3f5',
                                        }}
                                    >
                                        {inquiryForm.isPrivate ? <Lock size={16} color="#1D0098" /> : <Unlock size={16} color="#adb5bd" />}
                                    </Box>
                                    <Text size="sm" fw={500}>비공개</Text>
                                </Group>
                                <Switch
                                    checked={inquiryForm.isPrivate}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, isPrivate: e.currentTarget.checked })}
                                    color="brand"
                                />
                            </Group>
                        </Box>

                        {/* 연락처 */}
                        <Box py="md" style={{ borderTop: '1px solid #f1f3f5' }}>
                            <Text size="sm" fw={500} mb={8}>연락처 (비밀번호로 사용) <Text span c="red">*</Text></Text>
                            <TextInput
                                placeholder="010-0000-0000"
                                value={inquiryForm.phone}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, phone: formatPhoneNumber(e.currentTarget.value) })}
                                variant="filled"
                                radius="md"
                            />
                        </Box>
                    </Stack>
                </Box>
            </Drawer>

            {/* 하단 탭바 */}
            <BottomNav />
        </Box>
    );
}
