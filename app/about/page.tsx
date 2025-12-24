'use client';

import { Box, Text, Stack, Group } from '@mantine/core';
import { ArrowLeft, MapPin, Search, Shield, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';

export default function AboutPage() {
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
                    <Text size="lg" fw={700}>서비스 안내</Text>
                </Group>
            </Box>

            {/* 로고 섹션 */}
            <Box ta="center" py={40} bg="white">
                <Image src="/logo-horizontal.svg?v=4" alt="대대손손" width={140} height={40} />
                <Text size="sm" c="dimmed" mt="md">전국 장지 조회 1등 플랫폼</Text>
            </Box>

            {/* 서비스 소개 */}
            <Box p="md">
                <Stack gap="md">
                    <Box bg="white" p="lg" style={{ borderRadius: 12 }}>
                        <Group gap="md" mb="sm">
                            <Box p={10} bg="brand.0" style={{ borderRadius: 10 }}>
                                <MapPin size={24} color="#1D0098" />
                            </Box>
                            <Text fw={600}>전국 1,500+ 시설</Text>
                        </Group>
                        <Text size="sm" c="dimmed" lh={1.6}>
                            봉안당, 수목장, 공원묘지 등 전국의 장묘시설 정보를 한눈에 확인하세요.
                        </Text>
                    </Box>

                    <Box bg="white" p="lg" style={{ borderRadius: 12 }}>
                        <Group gap="md" mb="sm">
                            <Box p={10} bg="brand.0" style={{ borderRadius: 10 }}>
                                <Search size={24} color="#1D0098" />
                            </Box>
                            <Text fw={600}>쉬운 검색</Text>
                        </Group>
                        <Text size="sm" c="dimmed" lh={1.6}>
                            지역별, 유형별로 원하는 시설을 쉽게 찾아보세요. 지도에서 가격도 바로 확인!
                        </Text>
                    </Box>

                    <Box bg="white" p="lg" style={{ borderRadius: 12 }}>
                        <Group gap="md" mb="sm">
                            <Box p={10} bg="brand.0" style={{ borderRadius: 10 }}>
                                <Shield size={24} color="#1D0098" />
                            </Box>
                            <Text fw={600}>신뢰할 수 있는 정보</Text>
                        </Group>
                        <Text size="sm" c="dimmed" lh={1.6}>
                            공공데이터와 시설 공시 자료를 기반으로 정확한 정보를 제공합니다.
                        </Text>
                    </Box>

                    <Box bg="white" p="lg" style={{ borderRadius: 12 }}>
                        <Group gap="md" mb="sm">
                            <Box p={10} bg="brand.0" style={{ borderRadius: 10 }}>
                                <Heart size={24} color="#1D0098" />
                            </Box>
                            <Text fw={600}>함께하는 마음</Text>
                        </Group>
                        <Text size="sm" c="dimmed" lh={1.6}>
                            어려운 시기에 조금이나마 도움이 되고자 합니다. 문의사항은 언제든 연락주세요.
                        </Text>
                    </Box>
                </Stack>
            </Box>

            {/* 버전 */}
            <Box ta="center" py="xl">
                <Text size="xs" c="dimmed">대대손손 v1.0.0</Text>
                <Text size="xs" c="dimmed" mt={4}>© 2024 대대손손. All rights reserved.</Text>
            </Box>

            <BottomNav />
        </Box>
    );
}
