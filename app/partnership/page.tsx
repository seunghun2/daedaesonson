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
    CheckCircle2,
    PhoneCall,
    Award,
    ArrowRight,
    FileCheck2,
    Users,
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
                    `[${cleanName}] 공식 파트너 제휴 및 분양가·사진 정보 직접 관리, 유족 1:1 상담 연결에 대해 안내받고 싶습니다.`,
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

    const scrollToSection = (id: string) => {
        if (typeof document === 'undefined') return;
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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

    const previewFacilityName = prefilledFacility || form.companyName.trim() || '분당추모공원 휴';

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
                    <Box maw={1120} mx="auto" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Group gap="sm">
                            <Link href="/" style={{ display: 'flex', alignItems: 'center', color: '#191F28' }}>
                                <ArrowLeft size={20} />
                            </Link>
                            <Text size="md" fw={800} c="#191F28">대대손손 공식 파트너 · 제휴 센터</Text>
                        </Group>
                    </Box>
                </Box>

                <Box maw={540} mx="auto" px="md" pt={64}>
                    <Paper p="xl" radius="lg" bg="white" style={{ border: '1px solid #DBEAFE', textAlign: 'center', wordBreak: 'keep-all', boxShadow: '0 12px 32px rgba(37, 99, 235, 0.08)' }}>
                        <Box
                            mb="lg"
                            mx="auto"
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Check size={30} color="#2563EB" strokeWidth={2.5} />
                        </Box>
                        <Group justify="center" mb={10}>
                            <VerifiedBadge variant="partner" size="md" label="공식 파트너 심사 접수" />
                        </Group>
                        <Text size="xl" fw={800} c="#191F28" mb="xs">제휴 및 정보 관리 신청이 접수되었습니다</Text>
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
                            style={{ backgroundColor: '#2563EB', height: 48, fontWeight: 700 }}
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
        <Box style={{ minHeight: '100dvh', backgroundColor: '#F8FAFC', paddingBottom: 80, wordBreak: 'keep-all' }}>
            <style>{`
                .landing-hero-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 28px;
                    align-items: center;
                }
                .landing-benefits-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 18px;
                }
                .landing-steps-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 14px;
                }
                .landing-form-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 28px;
                    align-items: start;
                }
                @media (min-width: 900px) {
                    .landing-hero-grid {
                        grid-template-columns: 1.15fr 0.95fr;
                        gap: 44px;
                    }
                    .landing-benefits-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 22px;
                    }
                    .landing-steps-grid {
                        grid-template-columns: repeat(4, 1fr);
                        gap: 16px;
                    }
                    .landing-form-grid {
                        grid-template-columns: 0.85fr 1.15fr;
                        gap: 36px;
                    }
                }
            `}</style>

            {/* ── 상단 고정 내비게이션 ── */}
            <Box
                px="md"
                py={12}
                bg="white"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    borderBottom: '1px solid #E5E8EB',
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <Box
                    maw={1120}
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
                        <Group gap={8} align="center">
                            <Text size="md" fw={800} c="#191F28" style={{ letterSpacing: '-0.3px' }}>
                                대대손손 공식 파트너 센터
                            </Text>
                            <VerifiedBadge variant="pill" size="sm" label="B2B 제휴" />
                        </Group>
                    </Group>

                    <Group gap={8}>
                        <button
                            type="button"
                            onClick={() => scrollToSection('apply-form')}
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#FFFFFF',
                                padding: '7px 14px',
                                borderRadius: 8,
                                backgroundColor: '#2563EB',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.24)',
                            }}
                        >
                            제휴 신청하기
                        </button>
                        <Link
                            href="/"
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#334155',
                                textDecoration: 'none',
                                padding: '7px 12px',
                                borderRadius: 8,
                                backgroundColor: '#F1F5F9',
                            }}
                        >
                            지도 홈으로
                        </Link>
                    </Group>
                </Box>
            </Box>

            {/* ── SECTION 1: 풀와이드 B2B 랜딩 히어로 ── */}
            <Box
                style={{
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #1E3A8A 100%)',
                    color: '#FFFFFF',
                    position: 'relative',
                    overflow: 'hidden',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
            >
                {/* 은은한 로얄블루 글로우 */}
                <div
                    style={{
                        position: 'absolute',
                        top: -120,
                        right: '8%',
                        width: 420,
                        height: 420,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, rgba(37, 99, 235, 0) 70%)',
                        pointerEvents: 'none',
                    }}
                />

                <Box maw={1120} mx="auto" px="md" py={{ base: 40, md: 64 }} style={{ position: 'relative', zIndex: 1 }}>
                    <div className="landing-hero-grid">
                        {/* 히어로 좌측: 메인 카피 + CTA + 핵심 지표 */}
                        <Box>
                            <Group gap={8} mb={16}>
                                <VerifiedBadge variant="partner" size="lg" label="대대손손 공식 파트너십" />
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: '#93C5FD',
                                        backgroundColor: 'rgba(37, 99, 235, 0.22)',
                                        border: '1px solid rgba(147, 197, 253, 0.3)',
                                        padding: '4px 10px',
                                        borderRadius: 999,
                                    }}
                                >
                                    전국 봉안당 · 수목장 · 공원묘지 전용
                                </span>
                            </Group>

                            <Text
                                fw={900}
                                c="white"
                                lh={1.32}
                                style={{
                                    fontSize: 'clamp(24px, 3.2vw, 36px)',
                                    letterSpacing: '-0.8px',
                                    wordBreak: 'keep-all',
                                }}
                            >
                                {prefilledFacility ? (
                                    <>
                                        <span style={{ color: '#60A5FA' }}>{prefilledFacility}</span>의 공식 분양가·사진을 직접 관리하고 유족 상담을 직통으로 받으세요
                                    </>
                                ) : (
                                    <>
                                        우리 추모시설의 <span style={{ color: '#60A5FA' }}>공식 분양가·실사진</span>을 직접 관리하고 유족과 직통 연결되세요
                                    </>
                                )}
                            </Text>

                            <Text
                                c="#CBD5E1"
                                mt={16}
                                lh={1.68}
                                style={{
                                    fontSize: '15.5px',
                                    maxWidth: 560,
                                    wordBreak: 'keep-all',
                                }}
                            >
                                장지를 알아보는 가족들이 가장 먼저 비교하는 기준은 투명한 분양가표와 실제 시설 사진입니다. 대대손손 공식 파트너로 등록하시면 시설 직원이 검증한 공식 데이터를 우선 노출하고, 1:1 방문 답사·상담 문의를 실시간으로 연결해 드립니다.
                            </Text>

                            {/* 히어로 CTA 버튼 그룹 */}
                            <Group gap={12} mt={28} wrap="wrap">
                                <button
                                    type="button"
                                    onClick={() => scrollToSection('apply-form')}
                                    style={{
                                        height: 50,
                                        padding: '0 24px',
                                        borderRadius: 12,
                                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                        color: '#FFFFFF',
                                        fontSize: 15,
                                        fontWeight: 800,
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        boxShadow: '0 10px 24px rgba(37, 99, 235, 0.35)',
                                    }}
                                >
                                    <span>공식 파트너 · 정보 관리 신청하기</span>
                                    <ArrowRight size={17} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollToSection('benefits-section')}
                                    style={{
                                        height: 50,
                                        padding: '0 20px',
                                        borderRadius: 12,
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                        color: '#E2E8F0',
                                        fontSize: 14,
                                        fontWeight: 700,
                                        border: '1px solid rgba(255, 255, 255, 0.16)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    제휴 혜택 자세히 보기
                                </button>
                            </Group>

                            {/* 핵심 지표 3열 */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 12,
                                    marginTop: 32,
                                    maxWidth: 540,
                                }}
                            >
                                {[
                                    { stat: '1,400+', label: '전국 등록 추모시설' },
                                    { stat: '1:1 비교', label: '권역별 분양가·관리비' },
                                    { stat: '24시간', label: '유족 답사·상담 직통 연결' },
                                ].map((item) => (
                                    <Box
                                        key={item.label}
                                        p={14}
                                        style={{
                                            borderRadius: 14,
                                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                        }}
                                    >
                                        <Text fw={900} c="#60A5FA" style={{ fontSize: 20, letterSpacing: '-0.5px' }}>
                                            {item.stat}
                                        </Text>
                                        <Text size="12px" c="#CBD5E1" fw={600} mt={4}>
                                            {item.label}
                                        </Text>
                                    </Box>
                                ))}
                            </div>
                        </Box>

                        {/* 히어로 우측: 실제 제휴 적용 시 노출되는 라이브 프리뷰 쇼케이스 카드 */}
                        <Paper
                            p={{ base: 20, sm: 24 }}
                            radius="lg"
                            bg="white"
                            style={{
                                color: '#191F28',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 24px 48px rgba(15, 23, 42, 0.35)',
                            }}
                        >
                            <Group justify="space-between" align="center" mb={14}>
                                <Group gap={6}>
                                    <Award size={18} color="#2563EB" />
                                    <Text size="sm" fw={800} c="#191F28" style={{ letterSpacing: '-0.3px' }}>
                                        제휴 등록 시 실제 노출 화면 미리보기
                                    </Text>
                                </Group>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: '#2563EB',
                                        backgroundColor: '#EFF6FF',
                                        border: '1px solid #DBEAFE',
                                        padding: '3px 9px',
                                        borderRadius: 999,
                                    }}
                                >
                                    공식 파트너 전용
                                </span>
                            </Group>

                            {/* 상세페이지/카드 목업 */}
                            <Box
                                p={18}
                                style={{
                                    borderRadius: 14,
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                }}
                            >
                                <Group justify="space-between" align="center" mb={10} wrap="wrap" gap={6}>
                                    <Group gap={6}>
                                        <span
                                            style={{
                                                backgroundColor: '#EFF6FF',
                                                color: '#2563EB',
                                                fontSize: 11.5,
                                                fontWeight: 700,
                                                padding: '3px 8px',
                                                borderRadius: 6,
                                            }}
                                        >
                                            사설 · 추모시설
                                        </span>
                                        <VerifiedBadge variant="partner" size="sm" label="공식 인증 파트너" />
                                    </Group>
                                    <Text size="11px" fw={700} c="#2563EB">
                                        권역 내 우선 추천
                                    </Text>
                                </Group>

                                <Group gap={6} align="center" mb={6}>
                                    <Text fw={800} c="#191F28" style={{ fontSize: 18, letterSpacing: '-0.4px' }}>
                                        {previewFacilityName}
                                    </Text>
                                    <VerifiedSealIcon size={18} />
                                </Group>

                                <Text size="xs" c="#64748B" mb={14}>
                                    시설 관계자 직접 등록 · 분양가표 및 고화질 실사진 업데이트 완료
                                </Text>

                                {/* 샘플 분양가 요약 바 */}
                                <Box
                                    p={12}
                                    mb={12}
                                    style={{
                                        borderRadius: 10,
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #DBEAFE',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Box>
                                        <Text size="11px" fw={700} c="#64748B">
                                            공식 대표 분양가 (개인단 · 부부단)
                                        </Text>
                                        <Text size="md" fw={900} c="#2563EB" mt={2}>
                                            350만원~ <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>/ 관리비 연 5만원~</span>
                                        </Text>
                                    </Box>
                                    <VerifiedBadge variant="pill" size="sm" label="공식 분양가" />
                                </Box>

                                {/* 3대 제공 기능 칩 */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: 8,
                                    }}
                                >
                                    {[
                                        { label: '공식 파트너 마크', sub: '시설명 옆 인증 배지' },
                                        { label: '분양가·사진 관리', sub: '단수별 요금 직접 반영' },
                                        { label: '1:1 답사·상담 연결', sub: '유족 문의 즉시 알림' },
                                    ].map((b) => (
                                        <Box
                                            key={b.label}
                                            p={9}
                                            style={{
                                                backgroundColor: '#FFFFFF',
                                                borderRadius: 8,
                                                border: '1px solid #E2E8F0',
                                            }}
                                        >
                                            <Group gap={4} mb={2} wrap="nowrap">
                                                <CheckCircle2 size={12} color="#2563EB" style={{ flexShrink: 0 }} />
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
                    </div>
                </Box>
            </Box>

            {/* ── SECTION 2: 핵심 파트너십 혜택 3열 소개 ── */}
            <Box id="benefits-section" maw={1120} mx="auto" px="md" pt={{ base: 44, md: 64 }}>
                <Box ta="center" mb={{ base: 28, md: 36 }}>
                    <Text size="xs" fw={800} c="#2563EB" mb={6} style={{ letterSpacing: '0.5px' }}>
                        PARTNERSHIP BENEFITS
                    </Text>
                    <Text
                        fw={900}
                        c="#191F28"
                        style={{
                            fontSize: 'clamp(20px, 2.4vw, 28px)',
                            letterSpacing: '-0.6px',
                        }}
                    >
                        대대손손 공식 파트너에게 제공되는 3가지 핵심 가치
                    </Text>
                    <Text size="sm" c="#64748B" mt={8}>
                        단순 광고 배너가 아닌, 유족이 실제로 신뢰하고 방문 답사를 예약하는 공식 채널을 만들어 드립니다.
                    </Text>
                </Box>

                <div className="landing-benefits-grid">
                    {[
                        {
                            icon: ShieldCheck,
                            badge: '공식 정보 관리',
                            title: '분양가표 · 관리비 · 고화질 실사진 직접 관리',
                            desc: '오래된 정보나 부정확한 가격 대신, 시설 관계자가 직접 검수한 단수별·안치단별 분양가와 고화질 내·외부 사진을 공식 데이터로 반영합니다.',
                        },
                        {
                            icon: PhoneCall,
                            badge: '유족 직통 연결',
                            title: '1:1 무료 상담 및 주말 현장 답사 예약 실시간 연결',
                            desc: '우리 시설의 상세 가격표와 위치를 확인한 진성 유족이 상담 또는 방문 답사를 신청하면 담당자님께 즉시 알림으로 직통 연결됩니다.',
                        },
                        {
                            icon: TrendingUp,
                            badge: '비교함 · 지도 추천',
                            title: '인근 권역 1:1 비교함 & 지도 탐색 우선 노출',
                            desc: '같은 지역의 봉안당·수목장·공원묘지를 1:1 비교 중인 가족들에게 공식 파트너 시설로 신뢰도 높게 안내되어 계약 전환율을 높입니다.',
                        },
                    ].map((item) => {
                        const IconComp = item.icon;
                        return (
                            <Paper
                                key={item.title}
                                p={26}
                                radius="lg"
                                bg="white"
                                style={{
                                    border: '1px solid #E5E8EB',
                                    boxShadow: '0 6px 20px rgba(15, 23, 42, 0.04)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Box>
                                    <Group justify="space-between" align="center" mb={16}>
                                        <Box
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 12,
                                                backgroundColor: '#EFF6FF',
                                                border: '1px solid #DBEAFE',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <IconComp size={22} color="#2563EB" />
                                        </Box>
                                        <span
                                            style={{
                                                fontSize: 11.5,
                                                fontWeight: 700,
                                                color: '#2563EB',
                                                backgroundColor: '#EFF6FF',
                                                padding: '4px 10px',
                                                borderRadius: 999,
                                            }}
                                        >
                                            {item.badge}
                                        </span>
                                    </Group>

                                    <Text fw={800} c="#191F28" mb={8} style={{ fontSize: 17, letterSpacing: '-0.3px', lineHeight: 1.4 }}>
                                        {item.title}
                                    </Text>
                                    <Text size="sm" c="#64748B" lh={1.65}>
                                        {item.desc}
                                    </Text>
                                </Box>
                            </Paper>
                        );
                    })}
                </div>
            </Box>

            {/* ── SECTION 3: 공식 제휴 및 등록 4단계 프로세스 ── */}
            <Box maw={1120} mx="auto" px="md" pt={{ base: 40, md: 56 }}>
                <Paper
                    p={{ base: 22, md: 32 }}
                    radius="lg"
                    bg="white"
                    style={{
                        border: '1px solid #E5E8EB',
                        boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)',
                    }}
                >
                    <Group justify="space-between" align="flex-end" mb={22} wrap="wrap" gap={8}>
                        <Box>
                            <Text size="xs" fw={800} c="#2563EB" mb={4}>
                                ONBOARDING PROCESS
                            </Text>
                            <Text fw={800} c="#191F28" style={{ fontSize: 20, letterSpacing: '-0.4px' }}>
                                간편 신청부터 공식 파트너 등록까지 빠르게 진행됩니다
                            </Text>
                        </Box>
                        <Text size="xs" fw={600} c="#64748B">
                            신청 접수 후 영업일 기준 1일 이내 전담 매니저가 안내해 드립니다
                        </Text>
                    </Group>

                    <div className="landing-steps-grid">
                        {[
                            {
                                step: 'STEP 01',
                                title: '제휴 · 정보 관리 신청',
                                desc: '하단 신청 폼에서 시설명과 담당자 연락처, 원하시는 항목을 남겨주세요.',
                            },
                            {
                                step: 'STEP 02',
                                title: '전담팀 1:1 확인 및 안내',
                                desc: '영업일 1일 이내에 시설 관계자 확인 및 제휴·업데이트 절차를 안내드립니다.',
                            },
                            {
                                step: 'STEP 03',
                                title: '분양가 · 실사진 데이터 반영',
                                desc: '전달주신 최신 분양가표와 시설 브로셔·사진을 대대손손 표준 규격으로 반영합니다.',
                            },
                            {
                                step: 'STEP 04',
                                title: '공식 배지 부여 & 상담 연결',
                                desc: '시설 상세페이지에 공식 파트너 인증을 부여하고 유족 1:1 상담을 직통 연결합니다.',
                            },
                        ].map((s) => (
                            <Box
                                key={s.step}
                                p={18}
                                style={{
                                    borderRadius: 14,
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                }}
                            >
                                <Text size="11px" fw={800} c="#2563EB" mb={6}>
                                    {s.step}
                                </Text>
                                <Text size="sm" fw={800} c="#191F28" mb={6}>
                                    {s.title}
                                </Text>
                                <Text size="xs" c="#64748B" lh={1.55}>
                                    {s.desc}
                                </Text>
                            </Box>
                        ))}
                    </div>
                </Paper>
            </Box>

            {/* ── SECTION 4: 공식 파트너 · 정보 업데이트 신청 폼 (#apply-form) ── */}
            <Box id="apply-form" maw={1120} mx="auto" px="md" pt={{ base: 44, md: 64 }}>
                <div className="landing-form-grid">
                    {/* 좌측 안내 요약 컬럼 */}
                    <Stack gap={16}>
                        <Box>
                            <VerifiedBadge variant="pill" size="md" label="1분 간편 접수" />
                            <Text
                                fw={900}
                                c="#191F28"
                                mt={12}
                                style={{
                                    fontSize: 'clamp(22px, 2.5vw, 28px)',
                                    letterSpacing: '-0.6px',
                                    lineHeight: 1.35,
                                }}
                            >
                                우리 시설의 공식 정보 관리와<br />
                                파트너 제휴를 지금 시작하세요
                            </Text>
                            <Text size="sm" c="#64748B" mt={10} lh={1.65}>
                                아직 제휴 전이라도 시설의 최신 분양가표나 사진 수정을 먼저 요청하실 수 있습니다. 담당자 정보를 남겨주시면 전담팀에서 신속히 연락드리겠습니다.
                            </Text>
                        </Box>

                        <Paper p={20} radius="lg" bg="white" style={{ border: '1px solid #DBEAFE', backgroundColor: '#F8FAFC' }}>
                            <Text size="xs" fw={800} c="#2563EB" mb={12}>
                                이런 시설 관계자분들께 추천합니다
                            </Text>
                            <Stack gap={10}>
                                {[
                                    '기존에 노출된 분양가·관리비 정보를 최신 기준으로 바로잡고 싶은 시설',
                                    '고화질 안치단·조경 실사진과 특징을 유족에게 제대로 보여주고 싶은 시설',
                                    '우리 권역에서 장지를 비교 중인 유족의 방문 답사·상담 예약을 늘리고 싶은 시설',
                                ].map((point) => (
                                    <Group key={point} gap={8} align="flex-start" wrap="nowrap">
                                        <CheckCircle2 size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
                                        <Text size="xs" fw={600} c="#334155" lh={1.5}>
                                            {point}
                                        </Text>
                                    </Group>
                                ))}
                            </Stack>
                        </Paper>
                    </Stack>

                    {/* 우측 신청 폼 카드 */}
                    <Paper
                        p={{ base: 22, sm: 32 }}
                        bg="white"
                        radius="lg"
                        style={{
                            border: '1px solid #DBEAFE',
                            boxShadow: '0 12px 36px rgba(37, 99, 235, 0.07)',
                        }}
                    >
                        <Group justify="space-between" align="center" mb={6}>
                            <Text size="lg" fw={800} c="#191F28" style={{ letterSpacing: '-0.4px' }}>
                                공식 파트너 · 정보 업데이트 신청서
                            </Text>
                            <Text size="11.5px" fw={700} c="#2563EB">
                                영업일 1일 내 회신
                            </Text>
                        </Group>
                        <Text size="xs" c="#64748B" mb={22} lh={1.5}>
                            필수 항목(*)을 입력해주시면 담당 매니저가 확인 후 안내드립니다.
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
                                        { label: '공식 파트너 · 상담 제휴', value: 'partnership' },
                                        { label: '시설 등록 · 분양가/사진 수정', value: 'facility' },
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
                                                    border: active ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                                                    backgroundColor: active ? '#2563EB' : '#FFFFFF',
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
                                    placeholder="예) 분당추모공원 휴 / 용인 평온의숲"
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
                                                    border: isSelected ? '1px solid #2563EB' : '1px solid #E2E8F0',
                                                    backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                                                    color: isSelected ? '#2563EB' : '#64748B',
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
                                    <Text size="11px" c="#2563EB" fw={600}>클릭 시 자동 입력</Text>
                                </Group>
                                <Group gap={6} mb={8} style={{ flexWrap: 'wrap' }}>
                                    {[
                                        '공식 파트너 등록 및 배지 발급 문의',
                                        '안치단 분양가 · 실사진 업데이트 요청',
                                        '유족 1:1 상담 · 답사 예약 연결 문의',
                                        '권역 내 우선 추천 및 비교함 제휴 문의',
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
                                                padding: '5px 10px',
                                                borderRadius: 8,
                                                border: '1px solid #DBEAFE',
                                                backgroundColor: '#EFF6FF',
                                                color: '#1E40AF',
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
                                    placeholder="시설 공식 정보 업데이트, 분양가/사진 관리, 유족 상담 연결 등 원하시는 내용을 남겨주세요."
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
                                            color="blue"
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                setForm({ ...form, agreeTerms: e.currentTarget.checked });
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <Text size="xs" fw={700} c="#191F28">
                                            <Text span c="#2563EB">[필수] </Text>
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
                                            <b>2. 이용 목적:</b> 공식 파트너 심사 및 시설 정보 수정·제휴 문의 응대
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
                                    backgroundColor: '#2563EB',
                                    fontWeight: 800,
                                    fontSize: 15.5,
                                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
                                }}
                            >
                                공식 파트너 · 정보 관리 신청하기
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
