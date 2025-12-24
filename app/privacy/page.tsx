'use client';

import { Box, Text, Stack, Group, Divider, Table } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/common/BottomNav';

export default function PrivacyPage() {
    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: 'white', paddingBottom: 70 }}>
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
                    <Text size="lg" fw={700}>개인정보 처리방침</Text>
                </Group>
            </Box>

            {/* 내용 */}
            <Box p="md">
                <Stack gap="xl">
                    {/* 서문 */}
                    <Box>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            대대손손(https://daedaesonson.com, 이하 '회사')은 이용자의 개인정보를 매우 중요시하며, 「개인정보 보호법」 등 관련 법률을 준수하고 있습니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            본 개인정보 처리방침을 통하여 이용자가 제공한 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제1조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제1조 (개인정보의 처리목적 및 수집항목)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① 회사는 다음의 목적을 위해 최소한의 개인정보를 수집합니다:
                        </Text>

                        <Box mt="md" p="sm" bg="gray.0" style={{ borderRadius: 8 }}>
                            <Text size="sm" fw={600} mb="xs">문의 서비스 이용 시</Text>
                            <Table withTableBorder withColumnBorders>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th><Text size="xs">수집 항목</Text></Table.Th>
                                        <Table.Th><Text size="xs">이용 목적</Text></Table.Th>
                                        <Table.Th><Text size="xs">보유 기간</Text></Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    <Table.Tr>
                                        <Table.Td><Text size="xs">연락처(전화번호)</Text></Table.Td>
                                        <Table.Td><Text size="xs">비공개 문의 확인, 답변 안내</Text></Table.Td>
                                        <Table.Td><Text size="xs">처리 후 6개월</Text></Table.Td>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </Box>

                        <Box mt="md" p="sm" bg="gray.0" style={{ borderRadius: 8 }}>
                            <Text size="sm" fw={600} mb="xs">서비스 이용 시 자동 수집</Text>
                            <Table withTableBorder withColumnBorders>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th><Text size="xs">수집 항목</Text></Table.Th>
                                        <Table.Th><Text size="xs">이용 목적</Text></Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    <Table.Tr>
                                        <Table.Td><Text size="xs">접속 로그, 접속 IP, 쿠키</Text></Table.Td>
                                        <Table.Td><Text size="xs">서비스 이용 통계, 서비스 개선</Text></Table.Td>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </Box>

                        <Text size="sm" c="dark.6" lh={1.8} mt="md">
                            ② 개인정보 수집 방법: 웹사이트 문의 작성, 서비스 이용 시 자동 수집
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제2조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제2조 (개인정보의 보유 및 이용기간)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① 회사는 개인정보의 수집 목적이 달성되면 지체 없이 개인정보를 파기합니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ② 다만, 관련 법률에 따라 다음의 기간 동안 보관할 수 있습니다:
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs" pl="md">
                            • 접속에 관한 기록: 3개월 (통신비밀보호법)
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 소비자의 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제3조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제3조 (개인정보의 제3자 제공)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① 회사는 이용자의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며, 이용자의 동의 없이 제3자에게 제공하지 않습니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ② 다만, 다음의 경우에는 예외로 합니다:
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs" pl="md">
                            • 법률에 특별한 규정이 있는 경우
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 수사 목적으로 법령에 정해진 절차에 따라 요청이 있는 경우
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제4조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제4조 (개인정보의 파기)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① 파기 절차: 개인정보 보유기간 경과 또는 처리목적 달성 시 지체 없이 파기합니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ② 파기 방법: 전자적 파일은 복구할 수 없는 방법으로 삭제하며, 종이 문서는 분쇄하거나 소각합니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제5조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제5조 (이용자의 권리와 행사방법)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① 이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ② 권리 행사는 서면, 이메일을 통해 요청할 수 있으며, 회사는 지체 없이 조치합니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제6조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제6조 (개인정보의 안전성 확보조치)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs" pl="md">
                            • 개인정보 접근 권한 최소화
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 개인정보의 암호화 저장 및 전송
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 해킹 등에 대비한 보안 시스템 운영
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제7조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제7조 (쿠키의 사용)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① 회사는 서비스 이용 통계 및 맞춤 서비스 제공을 위해 쿠키를 사용합니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ② 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며, 이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제8조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제8조 (개인정보 보호책임자)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            회사는 개인정보 처리에 관한 업무를 총괄하고, 이용자의 불만처리 및 피해구제를 위해 개인정보 보호책임자를 지정하고 있습니다.
                        </Text>
                        <Box mt="md" p="sm" bg="gray.0" style={{ borderRadius: 8 }}>
                            <Text size="sm" fw={600}>개인정보 보호책임자</Text>
                            <Text size="sm" c="dimmed" mt={4}>이메일: help@daedaesonson.com</Text>
                        </Box>
                    </Box>

                    <Divider />

                    {/* 제9조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제9조 (개인정보 침해 관련 상담 및 신고)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            개인정보 침해에 대한 신고 및 상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다:
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs" pl="md">
                            • 개인정보 침해신고센터: privacy.kisa.or.kr / 118
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 개인정보 분쟁조정위원회: kopico.go.kr / 1833-6972
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 경찰청 사이버안전국: cyberbureau.police.go.kr / 182
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 대검찰청 사이버수사과: spo.go.kr / 1301
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제10조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제10조 (처리방침의 변경)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            본 개인정보 처리방침은 법률·정책 또는 보안기술의 변경에 따라 내용이 변경될 수 있으며, 변경 시에는 시행 최소 7일 전에 웹사이트를 통해 공지합니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 부칙 */}
                    <Box py="md" bg="gray.0" style={{ borderRadius: 8, padding: 16 }}>
                        <Text size="sm" fw={600} mb="xs">부칙</Text>
                        <Text size="sm" c="dimmed">
                            본 개인정보 처리방침은 2024년 1월 1일부터 시행합니다.
                        </Text>
                        <Text size="sm" c="dimmed" mt={4}>
                            최종 수정일: 2024년 12월 24일
                        </Text>
                    </Box>
                </Stack>
            </Box>

            <BottomNav />
        </Box>
    );
}
