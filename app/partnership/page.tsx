'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Text,
    TextInput,
    Textarea,
    Button,
    Group,
    Stack,
    Checkbox,
    Collapse,
    Paper,
} from '@mantine/core';
import {
    ArrowLeft,
    ChevronDown,
    Check,
    AlertCircle,
    Building2,
    ShieldCheck,
    TrendingUp,
    Sparkles,
    CheckCircle2,
    PhoneCall,
    Award,
} from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/common/BottomNav';
import ChatFloatingButton from '@/components/chatbot/ChatFloatingButton';
import VerifiedBadge, { VerifiedSealIcon } from '@/components/common/VerifiedBadge';

// 전화번호 자동 포맷 (010-1234-5678)
function formatPhoneNumber(value: string) {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

export default function PartnershipPage() {
    const [inquiryType, setInquiryType] = useState<string>('partnership');
    const [termsExpanded, setTermsExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [prefilledFacility, setPrefilledFacility] = useState<string>('');

    const [form, setForm] = useState({
        companyName: '',
        name: '',
        phone: '',
        email: '',
        emailDomain: '',
        content: '',
        agreeTerms: false,
    });

    // 상세페이지에서 ?facility=시설명 파라미터로 진입 시 업체명 및 기본 문구 자동 세팅
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const facName = params.get('facility');
        if (facName && facName.trim()) {
            const cleanName = facName.trim();
            setPrefilledFacility(cleanName);
            setForm((prev) => ({
                ...prev,
                companyName: prev.companyName || cleanName,
                content:
                    prev.content ||
                    `[${cleanName}] 공식 파트너 인증 배지 발급 및 분양가·사진 정보 업데이트, 유족 1:1 상담 연결에 대해 안내받고 싶습니다.`,
            }));
        }
    }, []);

    const emailDomainChips = ['naver.com', 'gmail.com', 'daum.net', 'kakao.com', 'hanmail.net'];

    const applyEmailDomain = (domain: string) => {
        const localPart = form.email.includes('@') ? form.email.split('@')[0] : form.email;
        setForm({
            ...form,
            email: `${localPart || 'partner'}@${domain}`,
            emailDomain: '',
        });
    };

    const getFullEmail = () => {
        return form.email.trim();
    };

    const handleSubmit = async () => {
        setErrorMsg(null);
        const fullEmail = getFullEmail();

        if (!form.companyName || !form.name || !form.phone || !fullEmail || !form.content) {
            setErrorMsg('필수 항목을 모두 입력해주세요.');
            return;
        }

        if (!fullEmail.includes('@') || !fullEmail.includes('.')) {
            setErrorMsg('올바른 이메일 주소를 입력해주세요.');
            return;
        }

        if (!form.agreeTerms) {
            setErrorMsg('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/partnership', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inquiryType,
                    companyName: form.companyName,
                    name: form.name,
                    phone: form.phone,
                    email: fullEmail,
                    content: form.content,
                }),
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                const data = await response.json().catch(() => ({}));
                setErrorMsg(data.error || '문의 접수 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error(error);
            setErrorMsg('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputStyles = {
        input: {
            height: 46,
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            fontSize: 14,
            color: '#191F28',
        },
    };

    const previewFacilityName = prefilledFacility || form.companyName.trim() || '광명메모리얼파크';

    if (submitted) {
        return (
            <Box style={{ minHeight: '100dvh', backgroundColor: '#F8FAFC', paddingBottom: 80 }}>
                <Box
                    px="md"
                    py="sm"
                    bg="white"
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        borderBottom: '1px solid #E5E8EB',
                    }}
                >
                    <Box maw={1040} mx="auto" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Group gap="sm">
                            <Link href="/" style={{ display: 'flex', alignItems: 'center', color: '#191F28' }}>
                                <ArrowLeft size={20} />
                            </Link>
                            <Text size="md" fw={800} c="#191F28">장지 시설 공식 인증 · 제휴 센터</Text>
                        </Group>
                    </Box>
                </Box>

                <Box maw={540} mx="auto" px="md" pt={64}>
                    <Paper p="xl" radius="lg" bg="white" style={{ border: '1px solid #E5E8EB', textAlign: 'center', wordBreak: 'keep-all' }}>
                        <Box
                            mb="lg"
                            mx="auto"
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: '#F2F4F6',
                                border: '1px solid #E5E8EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Check size={30} color="#191F28" strokeWidth={2.5} />
                        </Box>
                        <Group justify="center" mb={10}>
                            <VerifiedBadge variant="partner" size="md" label="공식 파트너 심사 접수" />
                        </Group>
                        <Text size="xl" fw={800} c="#191F28" mb="xs">제휴 및 인증 신청이 접수되었습니다</Text>
                        <Text size="sm" c="#64748B" mb="xl" lh={1.6}>
                            남겨주신 내용을 바탕으로 대대손손 파트너 전담팀에서<br />
                            영업일 기준 1일 이내 빠르게 연락드리겠습니다.
                        </Text>
                        <Button
                            component={Link}
                            href="/"
                            size="md"
                            radius="md"
                            fullWidth
                            style={{ backgroundColor: '#191F28', height: 48, fontWeight: 700 }}
                        >
                            대대손손 홈으로 돌아가기
                        </Button>
                    </Paper>
                </Box>
                <ChatFloatingButton />
                <Box hiddenFrom="sm">
                    <BottomNav />
                </Box>
            </Box>
        );
    }

    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#F8FAFC', paddingBottom: 64, wordBreak: 'keep-all' }}>
            {/* 상단 고정 헤더 */}
            <Box
                px="md"
                py={12}
                bg="white"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    borderBottom: '1px solid #E5E8EB',
                }}
            >
                <Box
                    maw={1080}
                    mx="auto"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Group gap={10}>
                        <Link
                            href="/"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                color: '#191F28',
                            }}
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <Box>
                            <Group gap={6} align="center">
                                <Text size="md" fw={800} c="#191F28" style={{ letterSpacing: '-0.3px' }}>
                                    장지 시설 공식 인증 · 제휴 센터
                                </Text>
                                <VerifiedBadge variant="pill" size="sm" label="B2B 공식" />
                            </Group>
                        </Box>
                    </Group>

                    <Link
                        href="/"
                        style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#191F28',
                            textDecoration: 'none',
                            padding: '6px 12px',
                            borderRadius: 8,
                            backgroundColor: '#F2F4F6',
                        }}
                    >
                        지도 홈으로
                    </Link>
                </Box>
            </Box>

            {/* 메인 컨텐츠 (PC: 좌측 히어로 & 인증배지 쇼케이스 + 우측 신청 폼 2단 구성 / 모바일: 1단 구성) */}
            <Box maw={1080} mx="auto" px="md" pt={{ base: 20, md: 36 }}>
                <style>{`
                    .partnership-grid {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 24px;
                        align-items: start;
                    }
                    @media (min-width: 900px) {
                        .partnership-grid {
                            grid-template-columns: 1.05fr 1fr;
                            gap: 32px;
                        }
                    }
                `}</style>

                <div className="partnership-grid">
                    {/* 좌측: B2B 가치 제안 + 공식 인증 배지 라이브 프리뷰 */}
                    <Stack gap={20}>
                        {/* 1. 메인 히어로 카드 */}
                        <Paper
                            p={{ base: 24, sm: 30 }}
                            radius="lg"
                            style={{
                                background: '#191F28',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                boxShadow: '0 16px 40px rgba(15, 23, 42, 0.14)',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <Group gap={8} mb={14}>
                                <VerifiedBadge variant="partner" size="lg" label="대대손손 공식 인증 파트너" />
                            </Group>

                            <Text
                                fw={800}
                                c="white"
                                lh={1.38}
                                style={{
                                    fontSize: '22px',
                                    letterSpacing: '-0.5px',
                                    wordBreak: 'keep-all',
                                }}
                            >
                                {prefilledFacility
                                    ? `${prefilledFacility}에 ‘공식 인증 배지’를 달고 유족 1:1 상담을 직통으로 받아보세요`
                                    : '우리 추모시설에 ‘공식 인증 배지’를 달고 매월 3만 유족과 직통 연결되세요'}
                            </Text>

                            <Text
                                c="#CBD5E1"
                                mt={10}
                                lh={1.6}
                                style={{
                                    fontSize: '14px',
                                    wordBreak: 'keep-all',
                                }}
                            >
                                봉안당·수목장·공원묘지를 찾는 가족들이 가장 신뢰하는 기준은 ‘정확한 분양가’와 ‘공식 인증 마크’입니다. 시설 공식 정보를 직접 관리하고 우선 상담 혜택을 누려보세요.
                            </Text>

                            {/* 핵심 지표 3열 */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 10,
                                    marginTop: 22,
                                }}
                            >
                                {[
                                    { stat: '1,400+', label: '전국 등록 장지' },
                                    { stat: '3.2배', label: '인증시설 상담 전환율' },
                                    { stat: '24시간', label: '유족 1:1 직통 연결' },
                                ].map((item) => (
                                    <Box
                                        key={item.label}
                                        p={12}
                                        style={{
                                            borderRadius: 12,
                                            backgroundColor: 'rgba(255, 255, 255, 0.07)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Text fw={900} c="#FFFFFF" style={{ fontSize: 19, letterSpacing: '-0.4px' }}>
                                            {item.stat}
                                        </Text>
                                        <Text size="11.5px" c="#CBD5E1" fw={600} mt={3}>
                                            {item.label}
                                        </Text>
                                    </Box>
                                ))}
                            </div>
                        </Paper>

                        {/* 2. 공식 인증 배지 실제 적용 미리보기 (Live Badge Showcase) */}
                        <Paper
                            p={{ base: 20, sm: 24 }}
                            radius="lg"
                            bg="white"
                            style={{
                                border: '1px solid #E5E8EB',
                                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
                            }}
                        >
                            <Group justify="space-between" align="center" mb={12}>
                                <Group gap={6}>
                                    <Award size={17} color="#191F28" />
                                    <Text size="sm" fw={800} c="#191F28" style={{ letterSpacing: '-0.3px' }}>
                                        제휴 승인 시 부여되는 ‘공식 인증 배지’ 미리보기
                                    </Text>
                                </Group>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: '#191F28',
                                        backgroundColor: '#F2F4F6',
                                        padding: '3px 8px',
                                        borderRadius: 999,
                                    }}
                                >
                                    실제 화면 예시
                                </span>
                            </Group>

                            {/* 실제 시설 상세/카드 목업 */}
                            <Box
                                p={16}
                                style={{
                                    borderRadius: 14,
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                }}
                            >
                                {/* 상단 배지 라인 */}
                                <Group justify="space-between" align="center" mb={8} wrap="wrap" gap={6}>
                                    <Group gap={6}>
                                        <span
                                            style={{
                                                backgroundColor: '#F2F4F6',
                                                color: '#333D4B',
                                                fontSize: 11.5,
                                                fontWeight: 700,
                                                padding: '3px 8px',
                                                borderRadius: 6,
                                            }}
                                        >
                                            추모시설
                                        </span>
                                        <VerifiedBadge variant="partner" size="sm" label="공식 인증 파트너" />
                                        <VerifiedBadge variant="pill" size="sm" label="공식 데이터 검증" />
                                    </Group>
                                    <Text size="11px" fw={700} c="#4E5968">
                                        우선 노출 적용됨
                                    </Text>
                                </Group>

                                {/* 시설명 + 인증 실 */}
                                <Group gap={6} align="center" mb={6}>
                                    <Text fw={800} c="#191F28" style={{ fontSize: 17, letterSpacing: '-0.4px' }}>
                                        {previewFacilityName}
                                    </Text>
                                    <VerifiedSealIcon size={18} color="#191F28" />
                                </Group>

                                <Text size="xs" c="#64748B" mb={12}>
                                    공식 분양가표 · 연간 관리비 안내 · 고화질 실사진 인증 완료
                                </Text>

                                {/* 인증 배지 3대 혜택 체크 */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: 8,
                                        paddingTop: 12,
                                        borderTop: '1px solid #E2E8F0',
                                    }}
                                >
                                    {[
                                        { label: '시설명 옆 인증마크', sub: '목록·상세 동시 노출' },
                                        { label: '공식 분양가 보증', sub: '유족 신뢰도 극대화' },
                                        { label: '1:1 상담 직통 연결', sub: '실시간 답사 예약' },
                                    ].map((b) => (
                                        <Box
                                            key={b.label}
                                            p={8}
                                            style={{
                                                backgroundColor: '#FFFFFF',
                                                borderRadius: 8,
                                                border: '1px solid #E2E8F0',
                                            }}
                                        >
                                            <Group gap={4} mb={2} wrap="nowrap">
                                                <CheckCircle2 size={12} color="#191F28" style={{ flexShrink: 0 }} />
                                                <Text size="11px" fw={700} c="#191F28" lineClamp={1}>
                                                    {b.label}
                                                </Text>
                                            </Group>
                                            <Text size="10.5px" c="#64748B" lineClamp={1}>
                                                {b.sub}
                                            </Text>
                                        </Box>
                                    ))}
                                </div>
                            </Box>
                        </Paper>

                        {/* 3. 파트너 3대 핵심 제공 혜택 */}
                        <Paper p={{ base: 20, sm: 24 }} radius="lg" bg="white" style={{ border: '1px solid #E5E8EB' }}>
                            <Text size="sm" fw={800} c="#191F28" mb={14} style={{ letterSpacing: '-0.3px' }}>
                                대대손손 공식 파트너 제휴 혜택
                            </Text>
                            <Stack gap={12}>
                                {[
                                    {
                                        icon: ShieldCheck,
                                        title: '공식 인증 배지 부여 & 상세 가격표 완벽 반영',
                                        desc: '개인·부부단 분양가, 단수별 요금, 연간 관리비, 고화질 시설 내·외부 사진을 공식 데이터로 인증하여 표시합니다.',
                                    },
                                    {
                                        icon: PhoneCall,
                                        title: '진성 유족 1:1 무료 상담 · 방문 답사 예약 직통 연결',
                                        desc: '해당 시설의 가격표를 확인한 유족이 상담 또는 주말 현장 답사를 신청하면 담당자님께 즉시 알림으로 연결됩니다.',
                                    },
                                    {
                                        icon: TrendingUp,
                                        title: '인근 권역 비교 추천 & 지도 상단 우선 안내',
                                        desc: '같은 지역 장지를 비교 중인 가족에게 공식 인증 시설로 우선 추천되어 실제 안치 계약 전환율을 높여드립니다.',
                                    },
                                ].map((item) => {
                                    const IconComp = item.icon;
                                    return (
                                        <Box
                                            key={item.title}
                                            p={14}
                                            style={{
                                                borderRadius: 12,
                                                backgroundColor: '#F8FAFC',
                                                border: '1px solid #EEF1F5',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 12,
                                            }}
                                        >
                                            <Box
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 10,
                                                    backgroundColor: '#F2F4F6',
                                                    border: '1px solid #E5E8EB',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <IconComp size={18} color="#191F28" />
                                            </Box>
                                            <Box style={{ flex: 1 }}>
                                                <Text size="sm" fw={700} c="#191F28" mb={3} style={{ wordBreak: 'keep-all' }}>
                                                    {item.title}
                                                </Text>
                                                <Text size="xs" c="#64748B" lh={1.55} style={{ wordBreak: 'keep-all' }}>
                                                    {item.desc}
                                                </Text>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Paper>
                    </Stack>

                    {/* 우측: 공식 파트너 인증 · 정보 관리 신청 폼 */}
                    <Paper
                        p={{ base: 22, sm: 28 }}
                        bg="white"
                        radius="lg"
                        style={{
                            border: '1px solid #E5E8EB',
                            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)',
                        }}
                    >
                        <Group justify="space-between" align="center" mb={6}>
                            <VerifiedBadge variant="pill" size="sm" label="1분 간편 접수" />
                            <Text size="11.5px" fw={600} c="#4E5968">
                                전담팀 영업일 1일 내 안내
                            </Text>
                        </Group>
                        <Text size="xl" fw={800} c="#191F28" mb={4} style={{ letterSpacing: '-0.4px' }}>
                            공식 파트너 인증 · 정보 업데이트 신청
                        </Text>
                        <Text size="xs" c="#64748B" mb={22} lh={1.5}>
                            시설 기본 정보와 담당자 연락처를 남겨주시면 인증 배지 부여 및 제휴 절차를 신속히 안내해 드립니다.
                        </Text>

                        {errorMsg && (
                            <Paper p="sm" mb="md" radius="md" bg="#FEF2F2" style={{ border: '1px solid #FECACA' }}>
                                <Group gap={8} wrap="nowrap">
                                    <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                                    <Text size="xs" fw={600} c="#DC2626">{errorMsg}</Text>
                                </Group>
                            </Paper>
                        )}

                        <Stack gap={16}>
                            {/* 문의 유형 - 모던 2-탭 선택기 */}
                            <Box>
                                <Text size="xs" fw={700} c="#334155" mb={8}>신청 유형 <Text span c="#EF4444">*</Text></Text>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {[
                                        { label: '공식 인증 · 파트너 제휴', value: 'partnership' },
                                        { label: '시설 등록 · 정보 수정', value: 'facility' },
                                    ].map((tab) => {
                                        const active = inquiryType === tab.value;
                                        return (
                                            <button
                                                key={tab.value}
                                                type="button"
                                                onClick={() => setInquiryType(tab.value)}
                                                style={{
                                                    height: 44,
                                                    borderRadius: 11,
                                                    border: active ? '1.5px solid #191F28' : '1px solid #CBD5E1',
                                                    backgroundColor: active ? '#191F28' : '#FFFFFF',
                                                    color: active ? '#FFFFFF' : '#475569',
                                                    fontSize: 13,
                                                    fontWeight: active ? 800 : 600,
                                                    whiteSpace: 'nowrap',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                }}
                                            >
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Box>

                            {/* 시설명 / 업체명 */}
                            <Box>
                                <Text size="xs" fw={700} c="#334155" mb={6}>시설명 / 운영법인명 <Text span c="#EF4444">*</Text></Text>
                                <TextInput
                                    placeholder="예) 광명메모리얼파크 / 용인 평온의숲"
                                    value={form.companyName}
                                    onChange={(e) => setForm({ ...form, companyName: e.currentTarget.value })}
                                    styles={inputStyles}
                                />
                            </Box>

                            {/* 담당자 성함 & 연락처 2열 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <Box>
                                    <Text size="xs" fw={700} c="#334155" mb={6}>담당자 성함/직함 <Text span c="#EF4444">*</Text></Text>
                                    <TextInput
                                        placeholder="예) 홍길동 팀장"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
                                        styles={inputStyles}
                                    />
                                </Box>
                                <Box>
                                    <Text size="xs" fw={700} c="#334155" mb={6}>연락처 <Text span c="#EF4444">*</Text></Text>
                                    <TextInput
                                        placeholder="010-1234-5678"
                                        inputMode="numeric"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: formatPhoneNumber(e.currentTarget.value) })}
                                        styles={inputStyles}
                                    />
                                </Box>
                            </div>

                            {/* 이메일 (단일 통합 인풋 + 원탭 도메인 칩) */}
                            <Box>
                                <Text size="xs" fw={700} c="#334155" mb={6}>이메일 주소 <Text span c="#EF4444">*</Text></Text>
                                <TextInput
                                    placeholder="partner@company.com"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.currentTarget.value, emailDomain: '' })}
                                    styles={inputStyles}
                                />
                                <Group gap={6} mt={8} style={{ flexWrap: 'wrap' }}>
                                    {emailDomainChips.map((domain) => {
                                        const isSelected = form.email.endsWith(`@${domain}`);
                                        return (
                                            <button
                                                key={domain}
                                                type="button"
                                                onClick={() => applyEmailDomain(domain)}
                                                style={{
                                                    height: 26,
                                                    padding: '0 10px',
                                                    borderRadius: 999,
                                                    border: isSelected ? '1px solid #191F28' : '1px solid #E2E8F0',
                                                    backgroundColor: isSelected ? '#F2F4F6' : '#F8FAFC',
                                                    color: isSelected ? '#191F28' : '#64748B',
                                                    fontSize: 11.5,
                                                    fontWeight: isSelected ? 700 : 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                @{domain}
                                            </button>
                                        );
                                    })}
                                </Group>
                            </Box>

                            {/* 문의 내용 + 원탭 빠른 주제 칩 */}
                            <Box>
                                <Group justify="space-between" align="center" mb={6}>
                                    <Text size="xs" fw={700} c="#334155">요청 사항 <Text span c="#EF4444">*</Text></Text>
                                    <Text size="11px" c="#64748B" fw={600}>클릭 시 자동 입력</Text>
                                </Group>
                                <Group gap={6} mb={8} style={{ flexWrap: 'wrap' }}>
                                    {[
                                        '공식 파트너 인증 배지 발급 신청',
                                        '안치단 분양가 · 실사진 업데이트 요청',
                                        '유족 1:1 상담 · 답사 예약 연결 문의',
                                        '지역 상단 추천 및 비교함 제휴 문의',
                                    ].map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => {
                                                const prefix = form.companyName ? `[${form.companyName}] ` : '';
                                                setForm({
                                                    ...form,
                                                    content: `${prefix}${preset} 관련하여 상세 안내 및 상담을 요청드립니다.`,
                                                });
                                            }}
                                            style={{
                                                padding: '5px 9px',
                                                borderRadius: 8,
                                                border: '1px solid #E2E8F0',
                                                backgroundColor: '#F8FAFC',
                                                color: '#333D4B',
                                                fontSize: 11.5,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            + {preset}
                                        </button>
                                    ))}
                                </Group>
                                <Textarea
                                    placeholder="시설 공식 인증 배지 발급, 분양가/사진 업데이트, 상담 연결 등 원하시는 내용을 남겨주세요."
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.currentTarget.value.slice(0, 1000) })}
                                    minRows={4}
                                    maxRows={8}
                                    autosize
                                    styles={{
                                        input: {
                                            borderRadius: 12,
                                            backgroundColor: '#FFFFFF',
                                            border: '1px solid #CBD5E1',
                                            fontSize: 13.5,
                                            lineHeight: 1.6,
                                            color: '#191F28',
                                            padding: '12px 14px',
                                        },
                                    }}
                                />
                                <Text size="xs" c="#94A3B8" ta="right" mt={4}>
                                    {form.content.length} / 1000자
                                </Text>
                            </Box>

                            {/* 약관 동의 - 드롭다운 */}
                            <Box style={{ border: '1px solid #CBD5E1', borderRadius: 12, overflow: 'hidden' }}>
                                <Box
                                    p="sm"
                                    px="md"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        background: 'white',
                                    }}
                                    onClick={() => setTermsExpanded(!termsExpanded)}
                                >
                                    <Group gap="xs">
                                        <Checkbox
                                            checked={form.agreeTerms}
                                            color="dark"
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                setForm({ ...form, agreeTerms: e.currentTarget.checked });
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <Text size="xs" fw={700} c="#191F28">
                                            <Text span c="#191F28">[필수] </Text>
                                            개인정보 수집 및 이용 동의
                                        </Text>
                                    </Group>
                                    <ChevronDown
                                        size={16}
                                        color="#64748B"
                                        style={{
                                            transform: termsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s',
                                        }}
                                    />
                                </Box>

                                <Collapse in={termsExpanded}>
                                    <Box p="md" bg="#F8FAFC" style={{ borderTop: '1px solid #E5E8EB' }}>
                                        <Text size="xs" c="#64748B" style={{ lineHeight: 1.6 }}>
                                            대대손손은 공식 파트너 제휴 및 시설 정보 등록 상담을 위하여 아래와 같이 개인정보를 수집 및 이용합니다.
                                            <br /><br />
                                            <b>1. 수집 항목:</b> 신청 유형, 시설/업체명, 담당자명, 연락처, 이메일, 요청 내용
                                            <br />
                                            <b>2. 이용 목적:</b> 공식 인증 배지 발급 심사 및 광고/제휴 문의 응대
                                            <br />
                                            <b>3. 보유 및 이용기간:</b> 상담 완료 후 6개월
                                        </Text>
                                    </Box>
                                </Collapse>
                            </Box>

                            {/* 제출 버튼 */}
                            <Button
                                size="lg"
                                radius="md"
                                fullWidth
                                loading={isSubmitting}
                                onClick={handleSubmit}
                                style={{
                                    height: 52,
                                    borderRadius: 12,
                                    backgroundColor: '#191F28',
                                    fontWeight: 800,
                                    fontSize: 15.5,
                                }}
                            >
                                공식 인증 · 제휴 상담 신청하기
                            </Button>
                        </Stack>
                    </Paper>
                </div>
            </Box>

            <ChatFloatingButton />

            {/* 모바일에서만 하단 탭바 노출 */}
            <Box hiddenFrom="sm">
                <BottomNav />
            </Box>
        </Box>
    );
}
