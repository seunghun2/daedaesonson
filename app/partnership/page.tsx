'use client';

import { useState, useEffect } from 'react';
import { Box, Text, Group, Stack, TextInput, Textarea, Button, Select, Checkbox, SegmentedControl, Collapse, ActionIcon, Paper } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, Check, AlertCircle, Building2, ShieldCheck, MessageSquare, TrendingUp } from 'lucide-react';
import BottomNav from '@/components/common/BottomNav';

export default function PartnershipPage() {
    const router = useRouter();
    const [inquiryType, setInquiryType] = useState('facility');
    const [prefilledFacility, setPrefilledFacility] = useState('');
    const [form, setForm] = useState({
        companyName: '',
        email: '',
        emailDomain: '',
        name: '',
        phone: '',
        content: '',
        agreeTerms: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [termsExpanded, setTermsExpanded] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // 상세페이지 또는 비교함에서 ?facility=시설명 으로 진입 시 자동 입력
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const fac = params.get('facility');
        if (fac && fac.trim()) {
            const decoded = fac.trim();
            setPrefilledFacility(decoded);
            setForm(prev => ({
                ...prev,
                companyName: prev.companyName || decoded,
                content: prev.content || `[${decoded}] 공식 파트너 제휴 및 시설 정보(분양가·실사진·상담 연결) 업데이트를 신청합니다.`,
            }));
        }
    }, []);

    const emailDomains = [
        { value: '', label: '직접입력' },
        { value: 'naver.com', label: 'naver.com' },
        { value: 'gmail.com', label: 'gmail.com' },
        { value: 'daum.net', label: 'daum.net' },
        { value: 'hanmail.net', label: 'hanmail.net' },
        { value: 'kakao.com', label: 'kakao.com' },
    ];

    const handleSubmit = async () => {
        if (!form.companyName.trim()) {
            setErrorMsg('광고주/업체명을 입력해주세요.');
            return;
        }
        if (!form.email.trim()) {
            setErrorMsg('이메일을 입력해주세요.');
            return;
        }
        if (!form.name.trim()) {
            setErrorMsg('담당자 이름을 입력해주세요.');
            return;
        }
        if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
            setErrorMsg('올바른 연락처를 입력해주세요.');
            return;
        }
        if (!form.content.trim()) {
            setErrorMsg('문의 내용을 입력해주세요.');
            return;
        }
        if (!form.agreeTerms) {
            setErrorMsg('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }

        setErrorMsg('');
        setIsSubmitting(true);

        try {
            const fullEmail = form.emailDomain
                ? `${form.email}@${form.emailDomain}`
                : form.email;

            const res = await fetch('/api/partnership', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: inquiryType,
                    companyName: form.companyName,
                    email: fullEmail,
                    name: form.name,
                    phone: form.phone,
                    content: form.content,
                }),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || '문의 접수에 실패했습니다.');
            }
        } catch (error) {
            setErrorMsg('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/[^0-9]/g, '');
        const limited = numbers.slice(0, 11);
        if (limited.length <= 3) return limited;
        if (limited.length <= 7) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
        return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
    };

    const inputStyles = {
        input: {
            height: 46,
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            fontSize: 15,
            color: '#191F28',
        }
    };

    if (submitted) {
        return (
            <Box style={{ minHeight: '100dvh', backgroundColor: '#F8FAFC', paddingBottom: 90 }}>
                <Box
                    px="md"
                    py={14}
                    style={{
                        backgroundColor: 'white',
                        borderBottom: '1px solid #E5E8EB',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                    }}
                >
                    <Group justify="space-between" align="center" maw={600} mx="auto">
                        <Group gap="sm">
                            <ActionIcon
                                onClick={() => router.back()}
                                size={36}
                                radius="md"
                                variant="subtle"
                                color="gray"
                                aria-label="뒤로가기"
                            >
                                <ArrowLeft size={20} color="#191F28" />
                            </ActionIcon>
                            <Text size="md" fw={700} c="#191F28">광고/제휴 문의</Text>
                        </Group>
                    </Group>
                </Box>

                <Box maw={600} mx="auto" style={{ padding: '40px 20px' }}>
                    <Paper p="xl" radius="lg" bg="#FFFFFF" style={{ border: '1px solid #E5E8EB' }}>
                        {/* 체크 아이콘 + 메시지 */}
                        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
                            <Box
                                style={{
                                    width: 68,
                                    height: 68,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 18,
                                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
                                }}
                            >
                                <Check size={34} color="white" strokeWidth={2.5} />
                            </Box>
                            <Text size="xl" fw={800} c="#191F28" ta="center" mb={6}>
                                제휴 문의가 접수되었습니다
                            </Text>
                            <Text size="sm" c="#64748B" ta="center">
                                담당자가 확인 후 영업일 기준 1일 이내 연락드리겠습니다.
                            </Text>
                        </Box>

                        {/* 신청 정보 카드 */}
                        <Box
                            style={{
                                background: '#F8FAFC',
                                borderRadius: 12,
                                border: '1px solid #EEF1F5',
                                padding: 20,
                                marginBottom: 24
                            }}
                        >
                            <Text size="xs" c="#64748B" mb={14} fw={700}>접수 내역</Text>
                            <Stack gap={10}>
                                <Group justify="space-between">
                                    <Text size="sm" c="#64748B">문의 유형</Text>
                                    <Text size="sm" fw={700} c="#2563EB">{inquiryType === 'facility' ? '시설 등록 문의' : '광고/제휴 문의'}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="#64748B">업체명</Text>
                                    <Text size="sm" fw={600} c="#191F28">{form.companyName}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="#64748B">담당자</Text>
                                    <Text size="sm" fw={600} c="#191F28">{form.name}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="#64748B">연락처</Text>
                                    <Text size="sm" fw={600} c="#191F28">{form.phone}</Text>
                                </Group>
                            </Stack>
                        </Box>

                        {/* 홈으로 버튼 */}
                        <Button
                            size="lg"
                            radius="md"
                            fullWidth
                            onClick={() => router.push('/')}
                            style={{ backgroundColor: '#2563EB', height: 50, fontWeight: 700 }}
                        >
                            홈으로 돌아가기
                        </Button>
                    </Paper>
                </Box>

                <BottomNav />
            </Box>
        );
    }

    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#F8FAFC', paddingBottom: 96 }}>
            {/* 헤더 */}
            <Box
                px="md"
                py={14}
                style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid #E5E8EB',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <Group justify="space-between" align="center" maw={600} mx="auto">
                    <Group gap="sm">
                        <ActionIcon
                            onClick={() => {
                                if (typeof window !== 'undefined' && window.history.length > 1) {
                                    router.back();
                                } else {
                                    router.push('/menu');
                                }
                            }}
                            size={36}
                            radius="md"
                            variant="subtle"
                            color="gray"
                            aria-label="뒤로가기"
                        >
                            <ArrowLeft size={20} color="#191F28" />
                        </ActionIcon>
                        <Text size="md" fw={700} c="#191F28">장지 시설 공식 제휴 · 등록 신청</Text>
                    </Group>
                </Group>
            </Box>

            {/* 폼 컨테이너 (PC 최대 너비 600px 중앙 정렬) */}
            <Box maw={600} mx="auto" p="md">
                {/* B2B 파트너 핵심 혜택 3가지 배너 */}
                <Paper
                    p="lg"
                    mb="md"
                    radius="lg"
                    style={{
                        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                        border: '1px solid #334155',
                        color: '#FFFFFF',
                    }}
                >
                    <Group gap={8} mb={8}>
                        <Box
                            px={8}
                            py={3}
                            style={{
                                borderRadius: 6,
                                backgroundColor: 'rgba(37, 99, 235, 0.25)',
                                border: '1px solid rgba(96, 165, 250, 0.4)',
                                fontSize: 11,
                                fontWeight: 800,
                                color: '#93C5FD',
                            }}
                        >
                            B2B OFFICIAL PARTNER
                        </Box>
                        {prefilledFacility && (
                            <Box
                                px={8}
                                py={3}
                                style={{
                                    borderRadius: 6,
                                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                    border: '1px solid rgba(52, 211, 153, 0.4)',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#6EE7B7',
                                }}
                            >
                                대상 시설: {prefilledFacility}
                            </Box>
                        )}
                    </Group>
                    <Text size="lg" fw={800} c="white" mb={4} style={{ letterSpacing: '-0.3px' }}>
                        전국 유족들이 비교하고 선택하는 대대손손 공식 파트너
                    </Text>
                    <Text size="xs" c="#94A3B8" mb={16} lh={1.5}>
                        봉안당·수목장·공원묘지 운영사 및 분양팀과 함께 투명하고 정확한 장지 비교 생태계를 만듭니다.
                    </Text>

                    <Stack gap={10}>
                        {[
                            {
                                icon: MessageSquare,
                                title: '실시간 유족 1:1 상담·답사 예약 리드 직결',
                                desc: '해당 지역·예산 조건에 맞는 실제 유족의 시설 문의와 방문 상담 예약을 담당자에게 즉시 연결합니다.',
                            },
                            {
                                icon: ShieldCheck,
                                title: '공식 분양가·실사진 인증 배지 및 정보 직접 관리',
                                desc: '안치단(개인/부부/특별단) 상세 분양가와 고화질 시설 사진, 프로모션 혜택을 공식 인증 마크와 함께 노출합니다.',
                            },
                            {
                                icon: TrendingUp,
                                title: '지역 검색 및 1:1 비교함 우선 추천 노출',
                                desc: '지도 검색 및 시설 비교함에서 높은 정보 공개도 점수와 함께 유족에게 신뢰도 높은 시설로 우선 안내됩니다.',
                            },
                        ].map((item) => {
                            const IconComp = item.icon;
                            return (
                                <Box
                                    key={item.title}
                                    p={12}
                                    style={{
                                        borderRadius: 10,
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 10,
                                    }}
                                >
                                    <Box
                                        style={{
                                            width: 30,
                                            height: 30,
                                            borderRadius: 8,
                                            backgroundColor: 'rgba(37, 99, 235, 0.25)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            marginTop: 1,
                                        }}
                                    >
                                        <IconComp size={15} color="#60A5FA" />
                                    </Box>
                                    <Box style={{ flex: 1 }}>
                                        <Text size="xs" fw={700} c="white" mb={2}>{item.title}</Text>
                                        <Text size="11.5px" c="#CBD5E1" lh={1.45}>{item.desc}</Text>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Stack>
                </Paper>

                <Paper p="xl" bg="white" radius="lg" style={{ border: '1px solid #E5E8EB' }}>
                    <Text size="xl" fw={800} c="#191F28" ta="center" mb={6}>공식 파트너 제휴 · 정보 업데이트 신청</Text>
                    <Text size="sm" c="#64748B" ta="center" mb="xl">
                        상담에 필요한 기본 정보를 남겨주시면 전담 매니저가 영업일 1일 이내 연락드립니다.
                    </Text>

                    {errorMsg && (
                        <Paper p="sm" mb="md" radius="md" bg="#FEF2F2" style={{ border: '1px solid #FECACA' }}>
                            <Group gap={8} wrap="nowrap">
                                <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                                <Text size="xs" fw={600} c="#DC2626">{errorMsg}</Text>
                            </Group>
                        </Paper>
                    )}

                    <Stack gap={18}>
                        {/* 문의 유형 */}
                        <Box>
                            <Text size="xs" fw={700} c="#334155" mb={8}>문의 유형 <Text span c="#EF4444">*</Text></Text>
                            <SegmentedControl
                                fullWidth
                                value={inquiryType}
                                onChange={setInquiryType}
                                radius="md"
                                size="md"
                                data={[
                                    { label: '시설 등록 문의', value: 'facility' },
                                    { label: '광고/제휴 문의', value: 'partnership' },
                                ]}
                                styles={{
                                    root: { backgroundColor: '#F1F5F9', padding: 4 },
                                    indicator: { backgroundColor: '#2563EB', boxShadow: '0 1px 3px rgba(37, 99, 235, 0.2)' },
                                    label: { fontWeight: 600, fontSize: 13.5 },
                                }}
                            />
                        </Box>

                        {/* 광고주명 */}
                        <Box>
                            <Text size="xs" fw={700} c="#334155" mb={6}>시설명 / 업체명 <Text span c="#EF4444">*</Text></Text>
                            <TextInput
                                placeholder="예) 용인 평온의숲 / 대대손손 파트너스"
                                value={form.companyName}
                                onChange={(e) => setForm({ ...form, companyName: e.currentTarget.value })}
                                styles={inputStyles}
                            />
                        </Box>

                        {/* 담당자 이름 */}
                        <Box>
                            <Text size="xs" fw={700} c="#334155" mb={6}>담당자 성함 / 직함 <Text span c="#EF4444">*</Text></Text>
                            <TextInput
                                placeholder="예) 홍길동 팀장"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
                                styles={inputStyles}
                            />
                        </Box>

                        {/* 연락처 */}
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

                        {/* E-mail */}
                        <Box>
                            <Text size="xs" fw={700} c="#334155" mb={6}>이메일 <Text span c="#EF4444">*</Text></Text>
                            <Group gap="xs" wrap="nowrap">
                                <TextInput
                                    placeholder="이메일 아이디"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
                                    style={{ flex: 1 }}
                                    styles={inputStyles}
                                />
                                <Text c="#64748B" fw={600}>@</Text>
                                <Select
                                    placeholder="직접입력"
                                    value={form.emailDomain}
                                    onChange={(v) => setForm({ ...form, emailDomain: v || '' })}
                                    data={emailDomains}
                                    style={{ flex: 1 }}
                                    styles={inputStyles}
                                    searchable
                                    allowDeselect={false}
                                />
                            </Group>
                        </Box>

                        {/* 문의 내용 */}
                        <Box>
                            <Text size="xs" fw={700} c="#334155" mb={6}>문의 내용 <Text span c="#EF4444">*</Text></Text>
                            <Textarea
                                placeholder="시설 등록, 정보 업데이트, 광고 제휴 등 궁금하신 내용을 자유롭게 남겨주세요."
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.currentTarget.value.slice(0, 1000) })}
                                minRows={5}
                                maxRows={10}
                                autosize
                                styles={{
                                    input: {
                                        borderRadius: 10,
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #CBD5E1',
                                        fontSize: 14,
                                        lineHeight: 1.6,
                                        color: '#191F28',
                                        padding: '12px',
                                    }
                                }}
                            />
                            <Text size="xs" c="#94A3B8" ta="right" mt={4}>
                                {form.content.length} / 1000자
                            </Text>
                        </Box>

                        {/* 약관 동의 - 드롭다운 */}
                        <Box style={{ border: '1px solid #CBD5E1', borderRadius: 10, overflow: 'hidden' }}>
                            <Box
                                p="md"
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
                                    size={18}
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
                                        대대손손은 제휴 및 등록 상담을 위하여 아래와 같이 개인정보를 수집 및 이용합니다.
                                        <br /><br />
                                        <b>1. 수집 항목:</b> 문의 유형, 업체명, 담당자명, 연락처, 이메일, 문의 내용
                                        <br />
                                        <b>2. 이용 목적:</b> 시설 등록 및 광고/제휴 문의 응대
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
                            mt="xs"
                            style={{
                                height: 52,
                                backgroundColor: '#2563EB',
                                fontWeight: 700,
                                fontSize: 16,
                            }}
                        >
                            제휴 문의 접수하기
                        </Button>
                    </Stack>
                </Paper>
            </Box>

            {/* 하단 탭바 */}
            <BottomNav />
        </Box>
    );
}
