'use client';

import { Box, Text, Group, TextInput, Textarea, Select, Stack, UnstyledButton } from '@mantine/core';
import { ArrowLeft, ChevronDown, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
    const [inquiryType, setInquiryType] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [contact, setContact] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = inquiryType && title.trim() && content.trim() && contact.trim();

    const handleSubmit = async () => {
        if (!canSubmit) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inquiry_type: inquiryType,
                    title,
                    content,
                    contact,
                }),
            });

            if (res.ok) {
                alert('문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.');
                router.push('/menu');
            } else {
                alert('문의 접수에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        }
        setIsSubmitting(false);
    };

    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#f8f9fa' }}>
            {/* 헤더 */}
            <Box
                px="md"
                py="md"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e9ecef',
                }}
            >
                <Group justify="space-between" align="center">
                    <UnstyledButton onClick={() => router.back()}>
                        <ArrowLeft size={22} color="#495057" />
                    </UnstyledButton>
                    <Text size="lg" fw={700}>문의하기</Text>
                    <Box style={{ width: 22 }} />
                </Group>
            </Box>

            {/* 본문 */}
            <Box p="md">
                <Stack gap="md">
                    {/* 폼 카드 */}
                    <Box bg="white" p="lg" style={{ borderRadius: 16 }}>
                        <Stack gap="lg">
                            {/* 문의 종류 */}
                            <Box>
                                <Text size="sm" fw={600} c="dark.7" mb="xs">
                                    문의 종류 <Text component="span" c="red" inherit>*</Text>
                                </Text>
                                <Select
                                    placeholder="선택해주세요"
                                    data={INQUIRY_TYPES}
                                    value={inquiryType}
                                    onChange={setInquiryType}
                                    rightSection={<ChevronDown size={16} color="#868e96" />}
                                    styles={{
                                        input: {
                                            height: 48,
                                            borderRadius: 12,
                                            border: '1px solid #e9ecef',
                                            fontSize: 14,
                                        },
                                    }}
                                    comboboxProps={{ position: 'bottom', shadow: 'md' }}
                                />
                            </Box>

                            {/* 제목 */}
                            <Box>
                                <Text size="sm" fw={600} c="dark.7" mb="xs">
                                    제목 <Text component="span" c="red" inherit>*</Text>
                                </Text>
                                <TextInput
                                    placeholder="문의 제목을 입력해주세요"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    styles={{
                                        input: {
                                            height: 48,
                                            borderRadius: 12,
                                            border: '1px solid #e9ecef',
                                            fontSize: 14,
                                        },
                                    }}
                                />
                            </Box>

                            {/* 내용 */}
                            <Box>
                                <Text size="sm" fw={600} c="dark.7" mb="xs">
                                    내용 <Text component="span" c="red" inherit>*</Text>
                                </Text>
                                <Textarea
                                    placeholder="궁금한 점을 자세히 적어주세요"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    minRows={8}
                                    styles={{
                                        input: {
                                            borderRadius: 12,
                                            border: '1px solid #e9ecef',
                                            fontSize: 14,
                                        },
                                    }}
                                />
                            </Box>

                            {/* 연락처 */}
                            <Box>
                                <Text size="sm" fw={600} c="dark.7" mb="xs">
                                    연락처 <Text component="span" c="red" inherit>*</Text>
                                </Text>
                                <TextInput
                                    placeholder="이메일 또는 전화번호"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    styles={{
                                        input: {
                                            height: 48,
                                            borderRadius: 12,
                                            border: '1px solid #e9ecef',
                                            fontSize: 14,
                                        },
                                    }}
                                />
                            </Box>
                        </Stack>
                    </Box>

                    {/* 제출 버튼 */}
                    <UnstyledButton
                        onClick={handleSubmit}
                        disabled={!canSubmit || isSubmitting}
                        style={{
                            width: '100%',
                            height: 56,
                            borderRadius: 16,
                            backgroundColor: canSubmit ? '#1D0098' : '#e9ecef',
                            color: canSubmit ? 'white' : '#adb5bd',
                            fontSize: 16,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                        }}
                    >
                        <Send size={18} />
                        {isSubmitting ? '등록 중...' : '문의하기'}
                    </UnstyledButton>

                    <Text size="xs" c="dimmed" ta="center">
                        영업일 기준 1~2일 내에 답변 드립니다
                    </Text>
                </Stack>
            </Box>
        </Box>
    );
}
