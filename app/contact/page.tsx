'use client';

import { Box, Text, Group, Stack, TextInput, Textarea, Button, Select } from '@mantine/core';
import { ArrowLeft, Send, Phone, Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import BottomNav from '@/components/common/BottomNav';

const INQUIRY_TYPES = [
    { value: 'service', label: '서비스 이용 문의' },
    { value: 'facility', label: '시설 정보 오류 신고' },
    { value: 'price', label: '가격 정보 문의' },
    { value: 'partnership', label: '제휴/협력 문의' },
    { value: 'suggestion', label: '서비스 개선 제안' },
    { value: 'other', label: '기타 문의' },
];

export default function ContactPage() {
    const [inquiryType, setInquiryType] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!inquiryType || !title.trim() || !content.trim()) {
            alert('문의 유형, 제목, 내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        // TODO: 실제 API 연동
        // 현재는 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    if (isSubmitted) {
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
                    <Group gap="sm">
                        <Link href="/menu" style={{ display: 'flex', alignItems: 'center' }}>
                            <ArrowLeft size={20} color="#495057" />
                        </Link>
                        <Text size="lg" fw={700}>문의하기</Text>
                    </Group>
                </Box>

                {/* 완료 메시지 */}
                <Box p="xl" ta="center" mt={60}>
                    <Box
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            backgroundColor: '#1D0098',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}
                    >
                        <Send size={32} color="white" />
                    </Box>
                    <Text size="xl" fw={700} mb="xs">문의가 접수되었습니다</Text>
                    <Text size="sm" c="dimmed" lh={1.6}>
                        빠른 시일 내에 확인 후 답변드리겠습니다.
                        <br />
                        입력하신 연락처로 답변을 안내해드립니다.
                    </Text>
                    <Button
                        mt="xl"
                        variant="light"
                        color="brand"
                        onClick={() => {
                            setIsSubmitted(false);
                            setInquiryType(null);
                            setTitle('');
                            setContent('');
                            setEmail('');
                            setPhone('');
                        }}
                    >
                        새 문의 작성하기
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
                <Group gap="sm">
                    <Link href="/menu" style={{ display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} color="#495057" />
                    </Link>
                    <Text size="lg" fw={700}>문의하기</Text>
                </Group>
            </Box>

            {/* 연락처 안내 */}
            <Box p="md" bg="white" mb="sm">
                <Text size="sm" fw={600} mb="md">다른 방법으로 문의하기</Text>
                <Group gap="md">
                    <Box
                        p="md"
                        bg="gray.0"
                        style={{ borderRadius: 12, flex: 1, textAlign: 'center', cursor: 'pointer' }}
                        onClick={() => window.location.href = 'mailto:help@daedaesonson.com'}
                    >
                        <Mail size={24} color="#1D0098" style={{ margin: '0 auto 8px' }} />
                        <Text size="xs" c="dimmed">이메일</Text>
                        <Text size="xs" fw={500}>help@daedaesonson.com</Text>
                    </Box>
                    {/* 카카오톡 채널은 향후 추가 */}
                    {/*
                    <Box 
                        p="md" 
                        bg="gray.0" 
                        style={{ borderRadius: 12, flex: 1, textAlign: 'center', cursor: 'pointer' }}
                    >
                        <MessageCircle size={24} color="#FEE500" style={{ margin: '0 auto 8px' }} />
                        <Text size="xs" c="dimmed">카카오톡</Text>
                        <Text size="xs" fw={500}>@대대손손</Text>
                    </Box>
                    */}
                </Group>
            </Box>

            {/* 문의 폼 */}
            <Box p="md">
                <Text size="sm" fw={600} mb="md">1:1 문의하기</Text>
                <Stack gap="md" bg="white" p="md" style={{ borderRadius: 12 }}>
                    <Select
                        label="문의 유형"
                        placeholder="선택해주세요"
                        data={INQUIRY_TYPES}
                        value={inquiryType}
                        onChange={setInquiryType}
                        required
                    />

                    <TextInput
                        label="제목"
                        placeholder="문의 제목을 입력해주세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <Textarea
                        label="문의 내용"
                        placeholder="문의하실 내용을 자세히 작성해주세요"
                        minRows={5}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    />

                    <TextInput
                        label="이메일"
                        placeholder="답변 받으실 이메일 주소"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <TextInput
                        label="연락처"
                        placeholder="답변 받으실 전화번호 (선택)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />

                    <Button
                        fullWidth
                        size="md"
                        color="brand"
                        loading={isSubmitting}
                        onClick={handleSubmit}
                        leftSection={<Send size={16} />}
                    >
                        문의 접수하기
                    </Button>
                </Stack>
            </Box>

            {/* 안내 문구 */}
            <Box px="md" py="sm">
                <Text size="xs" c="dimmed" lh={1.6}>
                    • 문의 접수 후 영업일 기준 1~2일 이내 답변드립니다.
                    <br />
                    • 시설 정보 오류 신고 시 빠르게 확인 후 수정합니다.
                    <br />
                    • 제휴/협력 문의는 별도로 검토 후 연락드립니다.
                </Text>
            </Box>

            <BottomNav />
        </Box>
    );
}
