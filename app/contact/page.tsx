'use client';

import { Box, Text, Group, TextInput, Textarea, Select, Switch, ActionIcon, UnstyledButton } from '@mantine/core';
import { X, Camera, Mail, Phone } from 'lucide-react';
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
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = inquiryType && title.trim() && content.trim() && (email.trim() || phone.trim());

    const handleSubmit = async () => {
        if (!canSubmit) return;

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSubmitting(false);
        alert('문의가 접수되었습니다.');
        router.push('/menu');
    };

    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: 'white' }}>
            {/* 헤더 */}
            <Box
                px="md"
                py="sm"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: 'white',
                }}
            >
                <Group justify="space-between" align="center">
                    <ActionIcon variant="subtle" color="gray" onClick={() => router.back()}>
                        <X size={22} />
                    </ActionIcon>
                    <Text size="md" fw={600}>문의하기</Text>
                    <UnstyledButton
                        onClick={handleSubmit}
                        disabled={!canSubmit || isSubmitting}
                        style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            backgroundColor: canSubmit ? '#1D0098' : '#e9ecef',
                            color: canSubmit ? 'white' : '#adb5bd',
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        {isSubmitting ? '등록중...' : '등록'}
                    </UnstyledButton>
                </Group>
            </Box>

            {/* 안내 문구 */}
            <Box px="md" py="sm" bg="#f8f9fa">
                <Text size="xs" c="dimmed">
                    다른 사람을 비방하거나 부적절한 표현은 삼가해주세요.
                </Text>
            </Box>

            {/* 폼 */}
            <Box>
                {/* 문의 종류 */}
                <Group justify="space-between" align="center" px="md" py="md" style={{ borderBottom: '1px solid #f1f3f5' }}>
                    <Text size="sm" c="dark.6">문의 종류</Text>
                    <Select
                        placeholder="선택해주세요"
                        data={INQUIRY_TYPES}
                        value={inquiryType}
                        onChange={setInquiryType}
                        variant="unstyled"
                        rightSection={<Text size="xs" c="dimmed">▼</Text>}
                        styles={{
                            input: {
                                textAlign: 'right',
                                color: inquiryType ? '#212529' : '#adb5bd',
                                fontSize: 14,
                                paddingRight: 20,
                            },
                        }}
                        comboboxProps={{ position: 'bottom-end' }}
                    />
                </Group>

                {/* 제목 */}
                <Box px="md" py="md" style={{ borderBottom: '1px solid #f1f3f5' }}>
                    <Text size="sm" c="dark.6" mb={8}>
                        제목 <Text component="span" c="red" inherit>*</Text>
                    </Text>
                    <TextInput
                        placeholder="ex) 봉안당 가격이 궁금합니다"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        variant="unstyled"
                        styles={{
                            input: { fontSize: 14, padding: 0, color: '#495057' },
                        }}
                    />
                </Box>

                {/* 내용 */}
                <Box px="md" py="md" style={{ borderBottom: '1px solid #f1f3f5' }}>
                    <Textarea
                        placeholder="궁금한 점을 자세히 적어주세요."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        variant="unstyled"
                        minRows={6}
                        styles={{
                            input: { fontSize: 14, padding: 0, color: '#495057' },
                        }}
                    />
                </Box>

                {/* 연락처 섹션 */}
                <Box px="md" py="sm" bg="#f8f9fa">
                    <Text size="xs" c="dimmed" fw={500}>
                        답변 받으실 연락처 (이메일 또는 전화번호 중 하나는 필수)
                    </Text>
                </Box>

                {/* 이메일 */}
                <Group px="md" py="md" style={{ borderBottom: '1px solid #f1f3f5' }} gap="sm">
                    <Mail size={18} color="#868e96" />
                    <TextInput
                        placeholder="이메일 주소"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        variant="unstyled"
                        style={{ flex: 1 }}
                        styles={{
                            input: { fontSize: 14, padding: 0, color: '#495057' },
                        }}
                    />
                </Group>

                {/* 전화번호 */}
                <Group px="md" py="md" style={{ borderBottom: '1px solid #f1f3f5' }} gap="sm">
                    <Phone size={18} color="#868e96" />
                    <TextInput
                        placeholder="전화번호"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        variant="unstyled"
                        style={{ flex: 1 }}
                        styles={{
                            input: { fontSize: 14, padding: 0, color: '#495057' },
                        }}
                    />
                </Group>

                {/* 이미지 첨부 */}
                <Box px="md" py="md" style={{ borderBottom: '1px solid #f1f3f5' }}>
                    <Box
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 8,
                            border: '1px dashed #dee2e6',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <Camera size={20} color="#adb5bd" />
                        <Text size="xs" c="dimmed" mt={2}>0/5</Text>
                    </Box>
                </Box>

                {/* 비공개 */}
                <Group justify="space-between" align="center" px="md" py="md">
                    <Group gap="xs">
                        <Text size="sm">🔒</Text>
                        <Text size="sm" c="dark.6">비공개</Text>
                    </Group>
                    <Switch
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.currentTarget.checked)}
                        color="indigo"
                        size="md"
                    />
                </Group>
            </Box>
        </Box>
    );
}
