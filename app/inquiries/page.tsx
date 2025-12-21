'use client';

import { Box, Text, Group, Stack, Button, ScrollArea, Loader } from '@mantine/core';
import { ChevronLeft, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import facilitiesData from '@/public/facilities.json';

interface Inquiry {
    id: string;
    facilityId: string;
    title: string;
    content: string;
    isPrivate: boolean;
    phone: string;
    type?: string;
    createdAt: string;
    replies?: { id: string; content: string; author: string; createdAt: string }[];
}

export default function InquiriesPage() {
    const router = useRouter();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 시설명 매핑
    const facilityNameMap = new Map((facilitiesData as any[]).map(f => [f.id, f.name]));

    useEffect(() => {
        loadInquiries();
    }, []);

    const loadInquiries = async () => {
        try {
            const res = await fetch('/api/admin/inquiries');
            const data = await res.json();
            if (data.inquiries) {
                const sorted = data.inquiries.sort((a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setInquiries(sorted);
            }
        } catch (e) {
            console.error('Failed to load inquiries:', e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box h="100vh" bg="white">
            {/* 헤더 */}
            <Box
                p="md"
                bg="brand.8"
                style={{ position: 'sticky', top: 0, zIndex: 100 }}
            >
                <Group>
                    <Button
                        variant="subtle"
                        color="white"
                        p={0}
                        onClick={() => router.back()}
                    >
                        <ChevronLeft size={24} color="white" />
                    </Button>
                    <Text fw={700} c="white" size="lg">문의 ({inquiries.length})</Text>
                </Group>
            </Box>

            {/* 안내 메시지 */}
            <Box p="md" bg="gray.0">
                <Text size="xs" c="dimmed">
                    💡 시설에 대해 궁금한 점을 문의하세요. 비공개 설정 시 제목만 공개됩니다.
                </Text>
            </Box>

            {/* 문의 목록 */}
            <ScrollArea h="calc(100vh - 130px)">
                {isLoading ? (
                    <Box p="xl" ta="center">
                        <Loader size="sm" />
                    </Box>
                ) : inquiries.length === 0 ? (
                    <Box p="xl" ta="center">
                        <Text c="dimmed">등록된 문의가 없습니다.</Text>
                    </Box>
                ) : (
                    <Stack gap={0} p="md">
                        {inquiries.map(inquiry => (
                            <Box
                                key={inquiry.id}
                                py="md"
                                style={{ borderBottom: '1px solid #f1f3f5' }}
                            >
                                {/* [시설명] 카테고리 + 날짜 */}
                                <Group justify="space-between" mb={4}>
                                    <Group gap={4}>
                                        <Text size="xs" c="dimmed">[{facilityNameMap.get(inquiry.facilityId) || '시설'}]</Text>
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
                                        ...(inquiry.isPrivate ? {
                                            filter: 'blur(4px)',
                                            userSelect: 'none'
                                        } : {})
                                    }}
                                >
                                    {inquiry.content || '문의 내용'}
                                </Text>
                            </Box>
                        ))}
                    </Stack>
                )}
            </ScrollArea>
        </Box>
    );
}
