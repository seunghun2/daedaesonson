'use client';

import { Box, Text, Group, TextInput, Textarea, Select, Stack, Button, ActionIcon, Paper } from '@mantine/core';
import { ArrowLeft, ChevronDown, Send, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import BottomNav from '@/components/common/BottomNav';

const INQUIRY_TYPES = [
    { value: 'general', label: '일반 문의' },
    { value: 'price', label: '가격 문의' },
    { value: 'facility', label: '시설 정보' },
    { value: 'error', label: '오류 신고' },
    { value: 'partnership', label: '제휴/협력' },
    { value: 'other', label: '기타' },
];

export default function ContactPage() {
    const router = useRouter();
    const [inquiryType, setInquiryType] = useState<string | null>('general');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [contact, setContact] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const canSubmit = !!(inquiryType && title.trim() && content.trim() && contact.trim());

    const handleSubmit = async () => {
        if (!canSubmit) {
            setErrorMsg('모든 필수 항목을 입력해주세요.');
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

    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#F8FAFC', paddingBottom: 96 }}>
            {/* 헤더 */}
            <Box
                px="md"
                py={14}
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
                            style={{ backgroundColor: '#2563EB', height: 50, fontWeight: 700 }}
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
                        <Paper bg="white" p="xl" radius="lg" style={{ border: '1px solid #E5E8EB' }}>
                            <Stack gap={18}>
                                {/* 문의 종류 */}
                                <Box>
                                    <Text size="xs" fw={700} c="#334155" mb={6}>
                                        문의 종류 <Text component="span" c="#EF4444" inherit>*</Text>
                                    </Text>
                                    <Select
                                        placeholder="선택해주세요"
                                        data={INQUIRY_TYPES}
                                        value={inquiryType}
                                        onChange={setInquiryType}
                                        rightSection={<ChevronDown size={16} color="#64748B" />}
                                        styles={{
                                            input: {
                                                height: 46,
                                                borderRadius: 10,
                                                backgroundColor: '#FFFFFF',
                                                border: '1px solid #CBD5E1',
                                                fontSize: 14,
                                                color: '#191F28',
                                            },
                                        }}
                                        comboboxProps={{ position: 'bottom', shadow: 'md' }}
                                    />
                                </Box>

                                {/* 제목 */}
                                <Box>
                                    <Text size="xs" fw={700} c="#334155" mb={6}>
                                        제목 <Text component="span" c="#EF4444" inherit>*</Text>
                                    </Text>
                                    <TextInput
                                        placeholder="문의 제목을 입력해주세요"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        styles={{
                                            input: {
                                                height: 46,
                                                borderRadius: 10,
                                                backgroundColor: '#FFFFFF',
                                                border: '1px solid #CBD5E1',
                                                fontSize: 14,
                                                color: '#191F28',
                                            },
                                        }}
                                    />
                                </Box>

                                {/* 내용 */}
                                <Box>
                                    <Text size="xs" fw={700} c="#334155" mb={6}>
                                        문의 내용 <Text component="span" c="#EF4444" inherit>*</Text>
                                    </Text>
                                    <Textarea
                                        placeholder="궁금한 점을 자세히 적어주세요"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        minRows={6}
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
                                            },
                                        }}
                                    />
                                </Box>

                                {/* 연락처 */}
                                <Box>
                                    <Text size="xs" fw={700} c="#334155" mb={6}>
                                        답변 받을 연락처 <Text component="span" c="#EF4444" inherit>*</Text>
                                    </Text>
                                    <TextInput
                                        placeholder="휴대폰 번호 또는 이메일 주소"
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        styles={{
                                            input: {
                                                height: 46,
                                                borderRadius: 10,
                                                backgroundColor: '#FFFFFF',
                                                border: '1px solid #CBD5E1',
                                                fontSize: 14,
                                                color: '#191F28',
                                            },
                                        }}
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
                                    mt="xs"
                                    styles={{
                                        root: {
                                            height: 52,
                                            backgroundColor: canSubmit ? '#2563EB' : '#E2E8F0',
                                            color: canSubmit ? '#FFFFFF' : '#94A3B8',
                                            fontSize: 15.5,
                                            fontWeight: 700,
                                        }
                                    }}
                                >
                                    문의 등록하기
                                </Button>

                                <Text size="xs" c="#64748B" ta="center">
                                    영업일 기준 1~2일 내에 답변 드립니다
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
