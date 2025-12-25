'use client';

import { useState } from 'react';
import { Box, Text, Group, Stack, TextInput, Textarea, Button, Select, Checkbox, SegmentedControl, Collapse } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/common/BottomNav';

export default function PartnershipPage() {
    const router = useRouter();
    const [inquiryType, setInquiryType] = useState('facility');
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
            alert('광고주/업체명을 입력해주세요.');
            return;
        }
        if (!form.email.trim()) {
            alert('이메일을 입력해주세요.');
            return;
        }
        if (!form.name.trim()) {
            alert('담당자 이름을 입력해주세요.');
            return;
        }
        if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
            alert('올바른 연락처를 입력해주세요.');
            return;
        }
        if (!form.content.trim()) {
            alert('문의 내용을 입력해주세요.');
            return;
        }
        if (!form.agreeTerms) {
            alert('약관에 동의해주세요.');
            return;
        }

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
                alert(data.error || '문의 접수에 실패했습니다.');
            }
        } catch (error) {
            alert('네트워크 오류가 발생했습니다.');
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

    if (submitted) {
        return (
            <Box style={{ minHeight: '100dvh', backgroundColor: 'white', paddingBottom: 70 }}>
                <Box
                    p="md"
                    style={{
                        backgroundColor: 'white',
                        borderBottom: '1px solid #e9ecef',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                    }}
                >
                    <Group justify="space-between" align="center">
                        <Group gap="sm">
                            <Link href="/menu" style={{ display: 'flex', alignItems: 'center' }}>
                                <ArrowLeft size={20} color="#495057" />
                            </Link>
                            <Text size="lg" fw={700}>광고/제휴 문의</Text>
                        </Group>
                    </Group>
                </Box>

                <Box style={{ padding: '32px 20px' }}>
                    {/* 체크 아이콘 + 메시지 */}
                    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
                        <Box
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #1D0098 0%, #4B3FD3 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 20
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'white' }}>check</span>
                        </Box>
                        <Text size="xl" fw={700} ta="center" mb={8}>
                            문의가 접수되었어요
                        </Text>
                        <Text size="sm" c="dimmed" ta="center">
                            영업일 기준 1일 이내 연락드릴게요
                        </Text>
                    </Box>

                    {/* 신청 정보 카드 */}
                    <Box
                        style={{
                            background: '#f8f9fa',
                            borderRadius: 12,
                            padding: 20,
                            marginBottom: 20
                        }}
                    >
                        <Text size="xs" c="dimmed" mb={16} fw={600}>신청 정보</Text>
                        <Stack gap={12}>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">문의 유형</Text>
                                <Text size="sm" fw={600}>{inquiryType === 'facility' ? '시설 등록 문의' : '광고/제휴 문의'}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">업체명</Text>
                                <Text size="sm" fw={600}>{form.companyName}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">담당자</Text>
                                <Text size="sm" fw={600}>{form.name}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">연락처</Text>
                                <Text size="sm" fw={600}>{form.phone}</Text>
                            </Group>
                        </Stack>
                    </Box>

                    {/* 홈으로 버튼 */}
                    <Button
                        size="lg"
                        color="brand"
                        fullWidth
                        onClick={() => router.push('/')}
                    >
                        홈으로 돌아가기
                    </Button>
                </Box>

                <BottomNav />
            </Box>
        );
    }

    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#f8f9fa', paddingBottom: 70 }}>
            {/* 헤더 */}
            <Box
                p="md"
                style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e9ecef',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <Group justify="space-between" align="center">
                    <Group gap="sm">
                        <Link href="/menu" style={{ display: 'flex', alignItems: 'center' }}>
                            <ArrowLeft size={20} color="#495057" />
                        </Link>
                        <Text size="lg" fw={700}>광고/제휴 문의</Text>
                    </Group>
                </Group>
            </Box>

            {/* 폼 */}
            <Box p="lg" bg="white" m="md" style={{ borderRadius: 12 }}>
                <Text size="xl" fw={800} ta="center" mb="xs">광고/제휴 문의하기</Text>
                <Text size="sm" c="dimmed" ta="center" mb="xl">
                    상담에 필요한 기본 정보를 입력해 주시면 담당자가 빠르게 확인하고 연락드릴게요!
                </Text>

                <Stack gap="lg">
                    {/* 문의 유형 */}
                    <Box>
                        <Text size="sm" fw={600} mb="xs">문의 유형</Text>
                        <SegmentedControl
                            fullWidth
                            value={inquiryType}
                            onChange={setInquiryType}
                            data={[
                                { label: '시설 등록 문의', value: 'facility' },
                                { label: '광고/제휴 문의', value: 'partnership' },
                            ]}
                            styles={{
                                root: { backgroundColor: '#f8f9fa' },
                                indicator: { backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
                                label: { fontWeight: 500 },
                            }}
                        />
                    </Box>

                    {/* 광고주명 */}
                    <Box>
                        <Text size="sm" fw={600} mb="xs">광고주/업체명</Text>
                        <TextInput
                            placeholder="광고주/업체명을 입력해주세요."
                            value={form.companyName}
                            onChange={(e) => setForm({ ...form, companyName: e.currentTarget.value })}
                            styles={{ input: { fontSize: 16 } }}
                        />
                    </Box>

                    {/* E-mail */}
                    <Box>
                        <Text size="sm" fw={600} mb="xs">E-mail</Text>
                        <Group gap="xs" wrap="nowrap">
                            <TextInput
                                placeholder="이메일"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
                                style={{ flex: 1 }}
                                styles={{ input: { fontSize: 16 } }}
                            />
                            <Text c="dimmed">@</Text>
                            <Select
                                placeholder="선택"
                                value={form.emailDomain}
                                onChange={(v) => setForm({ ...form, emailDomain: v || '' })}
                                data={emailDomains}
                                style={{ flex: 1 }}
                                styles={{ input: { fontSize: 16 } }}
                                searchable
                                allowDeselect={false}
                            />
                        </Group>
                    </Box>

                    {/* 이름 */}
                    <Box>
                        <Text size="sm" fw={600} mb="xs">담당자 이름</Text>
                        <TextInput
                            placeholder="이름을 입력해주세요."
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
                            styles={{ input: { fontSize: 16 } }}
                        />
                    </Box>

                    {/* 연락처 */}
                    <Box>
                        <Text size="sm" fw={600} mb="xs">연락처</Text>
                        <TextInput
                            placeholder="예) 010-1234-5678"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: formatPhoneNumber(e.currentTarget.value) })}
                            styles={{ input: { fontSize: 16 } }}
                        />
                    </Box>

                    {/* 문의 내용 */}
                    <Box>
                        <Text size="sm" fw={600} mb="xs">문의 내용</Text>
                        <Textarea
                            placeholder="광고 상품 관련하여 궁금한 점을 입력해주세요."
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.currentTarget.value.slice(0, 1000) })}
                            minRows={5}
                            maxRows={10}
                            styles={{ input: { fontSize: 16 } }}
                        />
                        <Text size="xs" c="dimmed" ta="right" mt={4}>
                            {form.content.length} / 1000자 입력
                        </Text>
                    </Box>

                    {/* 약관 동의 - 드롭다운 */}
                    <Box style={{ border: '1px solid #e9ecef', borderRadius: 8, overflow: 'hidden' }}>
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
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        setForm({ ...form, agreeTerms: e.currentTarget.checked });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <Text size="sm" fw={600} c="dark">[필수] 개인정보 수집 이용 동의</Text>
                            </Group>
                            <ChevronDown
                                size={18}
                                color="#868e96"
                                style={{
                                    transform: termsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s',
                                }}
                            />
                        </Box>

                        <Collapse in={termsExpanded}>
                            <Box p="md" bg="#fafafa" style={{ borderTop: '1px solid #f1f3f5' }}>
                                <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
                                    대대손손은 서비스 제공을 위하여 아래와 같이 개인정보를 수집 및 이용합니다.
                                    <br /><br />
                                    <b>1. 개인정보 수집 항목:</b> 문의 유형, 광고주/업체명, 이름, 연락처, E-mail, 문의 내용
                                    <br />
                                    <b>2. 수집 이용 목적:</b> 광고/제휴 문의자 연락 및 상담
                                    <br />
                                    <b>3. 보유 및 이용기간:</b> 6개월
                                    <br />
                                    <b>4. 개인정보 수집 및 이용 동의를 거부할 권리가 있으며, 거부할 경우 문의 신청이 불가능합니다.</b>
                                </Text>
                            </Box>
                        </Collapse>
                    </Box>

                    {/* 제출 버튼 */}
                    <Button
                        size="lg"
                        fullWidth
                        color="brand"
                        loading={isSubmitting}
                        onClick={handleSubmit}
                        mt="md"
                    >
                        문의하기
                    </Button>
                </Stack>
            </Box>

            {/* 하단 탭바 */}
            <BottomNav />
        </Box>
    );
}
