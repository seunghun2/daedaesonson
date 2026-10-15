'use client';

import { Box, Text, Group, TextInput, Textarea, Stack, Button, ActionIcon, Paper, Checkbox } from '@mantine/core';
import { ArrowLeft, Send, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import BottomNav from '@/components/common/BottomNav';
import { useAuth } from '@/components/auth/AuthProvider';

const INQUIRY_TYPES = [
    { value: 'general', label: '일반 문의' },
    { value: 'price', label: '가격 문의' },
    { value: 'facility', label: '시설 정보' },
    { value: 'error', label: '오류 신고' },
    { value: 'partnership', label: '제휴/협력' },
    { value: 'other', label: '기타 문의' },
];

const QUICK_SUBJECTS: Record<string, string[]> = {
    general: ['장지 종류별 차이점이 궁금해요', '지역별 추모시설 추천 문의'],
    price: ['봉안당·수목장 평균 분양가 문의', '공설/사설 시설 비용 비교 문의'],
    facility: ['특정 시설 안치 자격·절차 문의', '시설 방문 답사 예약 방법 문의'],
    error: ['시설 분양가·관리비 정보 수정 제보', '전화번호·주소 오류 제보'],
    partnership: ['장지 시설 공식 파트너 등록 문의', '분양팀 상담 리드 제휴 문의'],
    other: ['서비스 이용 불편 사항 제보', '기타 건의사항'],
};

export default function ContactPage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [inquiryType, setInquiryType] = useState<string>('general');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [contact, setContact] = useState('');
    const [agreePrivacy, setAgreePrivacy] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!contact && (profile?.phone || user?.email)) {
            setContact(profile?.phone || user?.email || '');
        }
    }, [profile, user, contact]);

    const canSubmit = !!(inquiryType && title.trim() && content.trim() && contact.trim() && agreePrivacy);

    const handleSubmit = async () => {
        if (!title.trim()) {
            setErrorMsg('문의 제목을 입력해주세요.');
            return;
        }
        if (!content.trim()) {
            setErrorMsg('문의 내용을 입력해주세요.');
            return;
        }
        if (!contact.trim()) {
            setErrorMsg('답변 받으실 연락처 또는 이메일을 입력해주세요.');
            return;
        }
        if (!agreePrivacy) {
            setErrorMsg('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }

        setErrorMsg('');
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inquiry_type: inquiryType,
                    title: title.trim(),
                    content: content.trim(),
                    contact: contact.trim(),
                }),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                setErrorMsg('문의 접수에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            setErrorMsg('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputStyles = {
        input: {
            height: 48,
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            fontSize: 15,
            color: '#191F28',
            paddingLeft: 14,
            paddingRight: 14,
        },
    };

    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#F8FAFC', paddingBottom: 'calc(84px + env(safe-area-inset-bottom, 0px))' }}>
            {/* 헤더 */}
            <Box
                px="md"
                py={12}
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: 'white',
                    borderBottom: '1px solid #E5E8EB',
                }}
            >
                <Group justify="space-between" align="center" maw={600} mx="auto">
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size={36}
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
                        <ArrowLeft size={20} color="#191F28" />
                    </ActionIcon>
                    <Text size="md" fw={700} c="#191F28">1:1 문의하기</Text>
                    <Box style={{ width: 36 }} />
                </Group>
            </Box>

            {/* 본문 (PC 최대 너비 600px 중앙 정렬) */}
            <Box maw={600} mx="auto" p="md">
                {submitted ? (
                    <Paper p="xl" radius="lg" bg="white" style={{ border: '1px solid #E5E8EB', textAlign: 'center' }}>
                        <Box
                            mx="auto"
                            mb={18}
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
                            }}
                        >
                            <Check size={32} color="white" strokeWidth={2.5} />
                        </Box>
                        <Text size="lg" fw={800} c="#191F28" mb={6}>문의가 정상적으로 접수되었습니다</Text>
                        <Text size="sm" c="#64748B" mb="xl">
                            남겨주신 연락처로 영업일 기준 1~2일 내에 답변드리겠습니다.
                        </Text>
                        <Button
                            fullWidth
                            size="lg"
                            radius="md"
                            onClick={() => router.push('/menu')}
                            style={{ backgroundColor: '#2563EB', height: 50, borderRadius: 12, fontWeight: 700 }}
                        >
                            전체 메뉴로 돌아가기
                        </Button>
                    </Paper>
                ) : (
                    <Stack gap="md">
                        {errorMsg && (
                            <Paper p="sm" radius="md" bg="#FEF2F2" style={{ border: '1px solid #FECACA' }}>
                                <Group gap={8} wrap="nowrap">
                                    <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                                    <Text size="xs" fw={600} c="#DC2626">{errorMsg}</Text>
                                </Group>
                            </Paper>
                        )}

                        {/* 폼 카드 */}
                        <Paper bg="white" p="lg" radius="lg" style={{ border: '1px solid #E5E8EB' }}>
                            <Stack gap={18}>
                                {/* 문의 종류 - 모던 3x2 원탭 칩 그리드 */}
                                <Box>
                                    <Text size="xs" fw={700} c="#334155" mb={8}>
                                        문의 유형 <Text component="span" c="#EF4444" inherit>*</Text>
                                    </Text>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                        {INQUIRY_TYPES.map((type) => {
                                            const active = inquiryType === type.value;
                                            return (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => setInquiryType(type.value)}
                                                    style={{
                                                        height: 42,
                                                        borderRadius: 10,
                                                        border: active ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                                                        backgroundColor: active ? '#2563EB' : '#FFFFFF',
                                                        color: active ? '#FFFFFF' : '#475569',
                                                        fontSize: 13,
                                                        fontWeight: active ? 700 : 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease',
                                                    }}
                                                >
                                                    {type.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </Box>

                                {/* 제목 + 원탭 빠른 제목 */}
                                <Box>
                                    <Group justify="space-between" align="center" mb={6}>
                                        <Text size="xs" fw={700} c="#334155">
                                            제목 <Text component="span" c="#EF4444" inherit>*</Text>
                                        </Text>
                                        <Text size="11px" c="#2563EB" fw={600}>클릭 시 자동 입력</Text>
                                    </Group>
                                    <Group gap={6} mb={8} style={{ flexWrap: 'wrap' }}>
                                        {(QUICK_SUBJECTS[inquiryType] || QUICK_SUBJECTS.general).map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => {
                                                    setTitle(preset);
                                                    if (!content.trim()) {
                                                        setContent(`${preset} 관련하여 안내 부탁드립니다.`);
                                                    }
                                                }}
                                                style={{
                                                    padding: '5px 10px',
                                                    borderRadius: 999,
                                                    border: title === preset ? '1px solid #2563EB' : '1px solid #DBEAFE',
                                                    backgroundColor: title === preset ? '#EFF6FF' : '#F8FAFC',
                                                    color: '#1E40AF',
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                + {preset}
                                            </button>
                                        ))}
                                    </Group>
                                    <TextInput
                                        placeholder="문의 제목을 입력해주세요"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        styles={inputStyles}
                                    />
                                </Box>

                                {/* 내용 */}
                                <Box>
                                    <Text size="xs" fw={700} c="#334155" mb={6}>
                                        문의 내용 <Text component="span" c="#EF4444" inherit>*</Text>
                                    </Text>
                                    <Textarea
                                        placeholder="궁금한 점이나 요청하실 내용을 자세히 적어주세요."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        minRows={5}
                                        maxRows={10}
                                        autosize
                                        styles={{
                                            input: {
                                                borderRadius: 12,
                                                backgroundColor: '#FFFFFF',
                                                border: '1px solid #CBD5E1',
                                                fontSize: 14,
                                                lineHeight: 1.6,
                                                color: '#191F28',
                                                padding: '12px 14px',
                                            },
                                        }}
                                    />
                                </Box>

                                {/* 연락처 */}
                                <Box>
                                    <Text size="xs" fw={700} c="#334155" mb={6}>
                                        답변 받을 연락처 / 이메일 <Text component="span" c="#EF4444" inherit>*</Text>
                                    </Text>
                                    <TextInput
                                        placeholder="010-1234-5678 또는 이메일 주소"
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        styles={inputStyles}
                                    />
                                </Box>

                                {/* 개인정보 동의 */}
                                <Box
                                    p="sm"
                                    style={{
                                        borderRadius: 10,
                                        backgroundColor: '#F8FAFC',
                                        border: '1px solid #E2E8F0',
                                    }}
                                >
                                    <Checkbox
                                        checked={agreePrivacy}
                                        onChange={(e) => setAgreePrivacy(e.currentTarget.checked)}
                                        color="blue"
                                        size="xs"
                                        label={
                                            <Text size="xs" fw={600} c="#334155">
                                                <Text span c="#2563EB" fw={700}>[필수] </Text>
                                                문의 답변 안내를 위한 개인정보(연락처) 수집·이용 동의
                                            </Text>
                                        }
                                    />
                                </Box>

                                {/* 제출 버튼 */}
                                <Button
                                    fullWidth
                                    size="lg"
                                    radius="md"
                                    loading={isSubmitting}
                                    disabled={!canSubmit || isSubmitting}
                                    leftSection={<Send size={17} />}
                                    onClick={handleSubmit}
                                    mt={4}
                                    styles={{
                                        root: {
                                            height: 52,
                                            borderRadius: 12,
                                            backgroundColor: canSubmit ? '#2563EB' : '#E2E8F0',
                                            color: canSubmit ? '#FFFFFF' : '#94A3B8',
                                            fontSize: 15.5,
                                            fontWeight: 700,
                                        }
                                    }}
                                >
                                    1:1 문의 접수하기
                                </Button>

                                <Text size="xs" c="#64748B" ta="center">
                                    남겨주신 연락처로 영업일 기준 1~2일 내에 답변 드립니다
                                </Text>
                            </Stack>
                        </Paper>
                    </Stack>
                )}
            </Box>

            <BottomNav />
        </Box>
    );
}
