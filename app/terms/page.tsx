'use client';

import { Box, Text, Stack, Group, Divider } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/common/BottomNav';

export default function TermsPage() {
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
                    <Text size="lg" fw={700}>서비스 이용약관</Text>
                </Group>
            </Box>

            {/* 약관 내용 */}
            <Box p="md">
                <Stack gap="xl">
                    {/* 제1조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제1조 (목적)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            본 약관은 대대손손(https://daedaesonson.com, 이하 '회사')이 운영하는 장묘시설 정보 서비스(이하 '서비스')를 이용함에 있어 당사자의 권리 의무 및 책임사항을 규정하는 것을 목적으로 합니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제2조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제2조 (이용약관의 효력 및 변경)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① 이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 서비스 화면에 게시하여 공시함으로써 그 효력을 발생합니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ② 회사는 합리적인 사유가 발생될 경우에는 이 약관을 변경할 수 있으며, 약관을 변경할 경우에는 지체 없이 이를 사전에 공지합니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ③ 이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있습니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제3조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제3조 (정의)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① '회사'라 함은, 대대손손이 이용자에게 정보통신설비를 통해 장묘시설 정보를 제공하는 서비스 운영자를 말합니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ② '서비스'는 회사가 운영하는 대대손손(https://daedaesonson.com)을 통해 제공되는 장묘시설 정보 검색, 비교, 문의 서비스를 말합니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ③ '이용자'라 함은, 사이트에 접속하여 본 약관에 따라 회사가 제공하는 서비스를 이용하는 모든 사용자를 말합니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ④ '시설정보'라 함은, 봉안당, 수목장, 공원묘지 등 장묘시설의 명칭, 위치, 연락처, 이용료 등의 정보를 말합니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ⑤ '문의'라 함은, 이용자가 서비스를 통해 시설에 대해 작성하는 질문, 의견 등을 말합니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제4조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제4조 (약관 외 준칙)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            서비스 이용에 관하여는 이 약관을 적용하며, 이 약관에 명시되지 아니한 사항에 대하여는 전기통신기본법, 전기통신사업법, 정보통신망 이용촉진 등에 관한 법률 및 기타 관계법령의 규정에 의합니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제5조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제5조 (제공하는 서비스)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① 회사가 제공하는 서비스는 다음과 같습니다:
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs" pl="md">
                            • 전국 봉안당, 수목장, 공원묘지 등 장묘시설 위치 및 정보 검색
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 시설별 이용료 비교 서비스
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 지역/유형별 시설 추천
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 시설 문의 서비스
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 기타 회사가 정하는 서비스
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ② 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 단, 시스템 점검 등의 사유로 일시 중단될 수 있습니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ③ 서비스에서 제공하는 시설정보는 공공데이터 및 각 시설의 공시자료를 기반으로 합니다. 실제 시설 이용 시 현장 상황과 다를 수 있으므로 방문 전 해당 시설에 직접 확인하시기 바랍니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제6조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제6조 (이용자의 의무)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            이용자는 다음의 행위를 하여서는 안 됩니다:
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs" pl="md">
                            • 허위 정보를 등록하거나 타인의 정보를 도용하는 행위
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 회사 및 제3자의 명예를 훼손하거나 업무를 방해하는 행위
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 외설 또는 폭력적인 내용을 게시하는 행위
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 서비스 정보를 무단으로 수집, 복제, 배포하는 행위
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 서비스의 정상적 운영을 방해하는 행위
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 관계법령 또는 공서양속에 반하는 행위
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제7조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제7조 (개인정보의 보호)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① 회사는 문의 작성 시 다음의 최소한의 정보만을 수집합니다:
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs" pl="md">
                            • 연락처 (비밀번호 확인 및 답변 안내 목적)
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ② 수집된 개인정보는 문의 답변 목적으로만 사용되며, 목적 달성 후 지체 없이 파기합니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ③ 회사는 제공된 개인정보를 이용자의 동의 없이 목적 외 이용하거나 제3자에게 제공하지 않습니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ④ 본 약관에 기재된 사항 이외의 개인정보보호에 관한 사항은 회사의 '개인정보처리방침'에 따릅니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제8조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제8조 (게시물에 대한 책임)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① 회사는 이용자가 게시하는 문의 내용이 다음 각 호에 해당하는 경우 사전 통지 없이 삭제할 수 있습니다:
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs" pl="md">
                            • 다른 이용자 또는 제3자를 비방하거나 명예를 손상시키는 내용
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 공공질서 및 미풍양속에 위반되는 내용
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 범죄 행위에 결부된다고 인정되는 내용
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 타인의 저작권 등 권리를 침해하는 내용
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 서비스와 관련 없는 광고, 홍보 내용
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} pl="md">
                            • 기타 관계법령에 위반된다고 판단되는 내용
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제9조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제9조 (저작권의 귀속)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① 회사가 제공하는 서비스 및 이와 관련된 모든 지식재산권은 회사에 귀속됩니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ② 이용자는 서비스를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포 등 영리목적으로 이용하거나 제3자에게 제공해서는 안 됩니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제10조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제10조 (면책사항)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① 회사는 천재지변, 전쟁 및 기타 불가항력으로 인하여 서비스를 제공할 수 없는 경우 책임이 면제됩니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ② 회사는 기간통신 사업자가 전기통신 서비스를 중지하거나 정상적으로 제공하지 아니하여 발생한 손해에 대해 책임이 면제됩니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ③ 회사는 서비스용 설비의 보수, 교체, 정기점검, 공사 등 부득이한 사유로 발생한 손해에 대한 책임이 면제됩니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ④ 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애 또는 손해에 대하여 책임을 지지 않습니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ⑤ 회사는 이용자가 서비스에 게재한 정보, 자료의 신뢰도, 정확성 등의 내용에 대하여 책임을 지지 않습니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ⑥ 회사는 이용자와 시설 간의 거래에 개입하지 않으며, 이로 인해 발생하는 분쟁에 대해 책임을 지지 않습니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ⑦ 회사에서 무료로 제공하는 서비스의 이용과 관련해서는 어떠한 손해도 책임을 지지 않습니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 제11조 */}
                    <Box>
                        <Text size="md" fw={700} mb="sm">제11조 (분쟁의 해결)</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            ① 회사는 이용자가 제기하는 불만사항 및 의견을 지체없이 처리하기 위하여 노력합니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8} mt="xs">
                            ② 회사와 이용자 간 발생한 분쟁에 관한 소송은 민사소송법에 따른 관할법원을 전속 관할법원으로 하며, 준거법은 대한민국의 법령을 적용합니다.
                        </Text>
                    </Box>

                    <Divider />

                    {/* 부칙 */}
                    <Box py="md" bg="gray.0" style={{ borderRadius: 8, padding: 16 }}>
                        <Text size="sm" fw={600} mb="xs">부칙</Text>
                        <Text size="sm" c="dimmed">
                            제1조 (시행일) 본 약관은 2024년 1월 1일부터 시행합니다.
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
