'use client';

import { Box, Text, Stack, Group, Accordion } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import BottomNav from '@/components/common/BottomNav';

// FAQ 카테고리별 데이터
const FAQ_CATEGORIES = [
    { value: 'all', label: '전체 보기' },
    { value: 'service', label: '서비스 이용' },
    { value: 'facility', label: '시설 정보' },
    { value: 'price', label: '가격/비용' },
    { value: 'inquiry', label: '문의' },
    { value: 'etc', label: '기타' },
];

const FAQ_DATA = [
    // 서비스 이용
    {
        category: 'service',
        question: "[서비스이용] 대대손손 서비스 가격정책이 어떻게 되나요?",
        answer: `대대손손 서비스는 무료로 이용 가능합니다.

전국 봉안당, 수목장, 공원묘지 등 장묘시설 검색과 가격 비교 기능을 무료로 제공하고 있습니다.

별도의 회원가입 없이도 모든 기능을 이용하실 수 있습니다.`
    },
    {
        category: 'service',
        question: "[서비스이용] 표시된 가격과 실제 시설의 가격이 다른 경우가 있나요?",
        answer: `대대손손에서 제공하는 가격 정보는 각 시설의 공시 자료와 공공데이터를 기반으로 합니다.

다만, 시설별로 시기에 따른 가격 변동이나 프로모션 등이 있을 수 있어 실제 이용료와 차이가 발생할 수 있습니다.

정확한 가격은 시설에 직접 문의해주시기 바랍니다.`
    },
    {
        category: 'service',
        question: "[서비스이용] 기존 고객 사례 별도 후기게시판은 있나요?",
        answer: `현재 대대손손에서는 별도의 후기 게시판을 운영하고 있지 않습니다.

다만, 각 시설 상세페이지에서 해당 시설에 대한 문의사항을 작성하실 수 있으며, 
다른 이용자들의 문의 내용도 확인하실 수 있습니다.

향후 이용자 분들의 생생한 경험담을 공유할 수 있는 후기 기능을 추가할 예정입니다.`
    },
    {
        category: 'service',
        question: "[서비스이용] 검색 결과가 너무 많아서 어떤 시설을 선택해야 할지 모르겠어요.",
        answer: `대대손손에서는 다양한 필터 기능을 제공하고 있습니다.

① 지역별 검색: 원하시는 지역을 선택하여 해당 지역의 시설만 확인
② 유형별 필터: 봉안당, 수목장, 공원묘지 중 원하시는 유형 선택
③ 지도 기반 검색: 지도에서 직접 위치를 확인하며 시설 탐색

가격 정보도 함께 표시되니 예산에 맞는 시설을 쉽게 찾으실 수 있습니다.`
    },

    // 시설 정보
    {
        category: 'facility',
        question: "[시설정보] 봉안당과 수목장의 차이점이 무엇인가요?",
        answer: `봉안당과 수목장은 장묘 방식의 차이가 있습니다.

【봉안당】
- 화장 후 유골을 봉안함에 모시는 방식입니다.
- 실내 시설로 날씨에 관계없이 참배가 가능합니다.
- 위치에 따라 개인, 부부, 가족 단위로 구분됩니다.

【수목장】
- 화장 후 유골을 나무 주변에 안장하는 자연장 방식입니다.
- 친환경적인 장묘 문화로 자연으로의 회귀를 지향합니다.
- 나무 종류에 따라 개별목, 공동목으로 구분됩니다.`
    },
    {
        category: 'facility',
        question: "[시설정보] 공원묘지는 어떤 시설인가요?",
        answer: `공원묘지는 전통적인 매장 방식의 묘지를 공원화한 시설입니다.

- 잔디 등으로 조성된 녹지 공간에 묘지가 위치합니다.
- 단독묘, 부부묘, 가족묘 등 다양한 형태가 있습니다.
- 봉분의 크기와 형태에 따라 이용료가 달라집니다.

최근에는 친환경적인 평장묘(잔디장)도 인기를 얻고 있습니다.`
    },
    {
        category: 'facility',
        question: "[시설정보] 시설 방문 전 예약이 필요한가요?",
        answer: `시설마다 운영 방침이 다르므로 방문 전 연락을 권장합니다.

대부분의 시설은 상담 예약 후 방문하시면 더 자세한 안내를 받으실 수 있습니다.

각 시설 상세페이지에 연락처가 표기되어 있으니 참고해주세요.`
    },

    // 가격/비용
    {
        category: 'price',
        question: "[가격/비용] 장묘시설 이용 시 어떤 비용이 발생하나요?",
        answer: `장묘시설 이용 시 일반적으로 다음과 같은 비용이 발생합니다:

【초기 비용】
- 사용료: 안치 공간 확보를 위한 비용
- 관리비: 시설 유지관리를 위한 비용

【정기 비용】
- 연간 관리비: 일부 시설에서 매년 부과

【추가 비용】
- 추모 용품비, 꽃꽂이 비용 등 (선택사항)

자세한 비용은 각 시설 상세페이지에서 확인하실 수 있습니다.`
    },
    {
        category: 'price',
        question: "[가격/비용] 공영시설과 사설시설의 가격 차이가 큰가요?",
        answer: `네, 일반적으로 공영시설이 사설시설보다 저렴합니다.

【공영시설】
- 지자체에서 운영하여 비교적 저렴
- 해당 지역 주민에게 우선권 또는 할인 혜택 제공
- 대기 기간이 길 수 있음

【사설시설】
- 다양한 서비스와 시설 수준 제공
- 가격대가 다양함 (일반형 ~ 프리미엄)
- 대기 없이 바로 이용 가능한 경우가 많음

대대손손에서 공영/사설 필터로 비교해보세요.`
    },
    {
        category: 'price',
        question: "[가격/비용] 사이트에 나와있는 추모시설 가격이 정확한 것인가요?",
        answer: `대대손손에서 제공하는 가격 정보는 각 시설의 공시 자료를 기반으로 합니다.

시설의 가격 정책 변경, 프로모션, 특별 할인 등에 따라 실제 가격과 차이가 있을 수 있습니다.

최신 가격 확인을 위해 시설에 직접 문의하시는 것을 권장합니다.

정보 오류 발견 시 문의하기를 통해 알려주시면 빠르게 수정하겠습니다.`
    },

    // 문의
    {
        category: 'inquiry',
        question: "[문의] 시설에 문의글을 남기면 답변을 받을 수 있나요?",
        answer: `문의 기능은 다른 이용자들과 정보를 공유하기 위한 게시판 형태로 운영됩니다.

시설에서 직접 답변을 드리는 것은 아니며, 
빠른 상담을 원하시면 시설 연락처로 직접 문의해주시기 바랍니다.

각 시설 상세페이지에서 전화번호를 확인하실 수 있습니다.`
    },
    {
        category: 'inquiry',
        question: "[문의] 비공개 문의는 어떻게 하나요?",
        answer: `문의 작성 시 '비공개' 옵션을 선택하시면 됩니다.

비공개 문의는 작성자 본인만 확인할 수 있으며,
문의 작성 시 입력한 연락처로 본인 확인이 가능합니다.

개인정보가 포함된 민감한 내용은 비공개로 작성해주세요.`
    },
    {
        category: 'inquiry',
        question: "[문의] 작성한 문의글을 수정하거나 삭제할 수 있나요?",
        answer: `문의글 수정 및 삭제는 작성 시 입력한 연락처(전화번호) 확인을 통해 가능합니다.

해당 문의글을 클릭하신 후 본인 확인 절차를 거쳐 수정 또는 삭제하실 수 있습니다.

도움이 필요하시면 help@daedaesonson.com으로 문의해주세요.`
    },

    // 기타
    {
        category: 'etc',
        question: "[기타] 시설 정보를 수정하고 싶습니다.",
        answer: `시설 정보에 오류가 있거나 업데이트가 필요한 경우,
아래 방법으로 정보 수정을 요청하실 수 있습니다:

① 해당 시설 상세페이지에서 '정보 수정 요청' 기능 이용
② 이메일: help@daedaesonson.com

담당자 확인 후 빠르게 반영될 수 있도록 하겠습니다.`
    },
    {
        category: 'etc',
        question: "[기타] 모바일에서도 이용 가능한가요?",
        answer: `네, 대대손손은 모바일에 최적화되어 있습니다.

별도의 앱 설치 없이 모바일 브라우저에서 바로 이용하실 수 있습니다.

PC, 태블릿, 스마트폰 등 모든 기기에서 편리하게 이용해보세요.`
    },
    {
        category: 'etc',
        question: "[기타] 대대손손에 시설을 등록하고 싶습니다.",
        answer: `장묘시설을 운영하고 계시고 대대손손에 시설 등록을 원하시는 경우,
아래 이메일로 문의해주시기 바랍니다.

📧 help@daedaesonson.com

담당자가 확인하여 빠르게 안내드리겠습니다.`
    },
];

export default function FAQPage() {
    const [activeTab, setActiveTab] = useState('all');

    const filteredFAQ = activeTab === 'all'
        ? FAQ_DATA
        : FAQ_DATA.filter(item => item.category === activeTab);

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
                    <Text size="lg" fw={700}>자주 묻는 질문</Text>
                </Group>
            </Box>

            {/* 탭 메뉴 */}
            <Box bg="white" px="md" py="sm" style={{ borderBottom: '1px solid #e9ecef', overflowX: 'auto' }}>
                <Group gap={8} wrap="nowrap">
                    {FAQ_CATEGORIES.map((cat) => (
                        <Box
                            key={cat.value}
                            onClick={() => setActiveTab(cat.value)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 20,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontSize: '13px',
                                fontWeight: 500,
                                transition: 'all 0.2s ease',
                                ...(activeTab === cat.value ? {
                                    backgroundColor: '#1D0098',
                                    color: 'white',
                                } : {
                                    backgroundColor: '#f1f3f5',
                                    color: '#495057',
                                })
                            }}
                        >
                            {cat.label}
                        </Box>
                    ))}
                </Group>
            </Box>

            {/* FAQ 목록 */}
            <Box p="md">
                <Accordion variant="separated" radius="md">
                    {filteredFAQ.map((item, idx) => (
                        <Accordion.Item key={idx} value={`faq-${idx}`} style={{ backgroundColor: 'white', marginBottom: 8 }}>
                            <Accordion.Control>
                                <Text size="sm" fw={500} lh={1.5}>{item.question}</Text>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <Text size="sm" c="dark.6" lh={1.8} style={{ whiteSpace: 'pre-line' }}>
                                    {item.answer}
                                </Text>
                            </Accordion.Panel>
                        </Accordion.Item>
                    ))}
                </Accordion>

                {filteredFAQ.length === 0 && (
                    <Box ta="center" py="xl">
                        <Text size="sm" c="dimmed">해당 카테고리에 등록된 질문이 없습니다.</Text>
                    </Box>
                )}
            </Box>

            {/* 추가 문의 안내 */}
            <Box p="md" ta="center">
                <Text size="sm" c="dimmed">
                    원하는 답변을 찾지 못하셨나요?
                </Text>
                <Text size="sm" c="brand" fw={500} mt={4}>
                    <Link href="mailto:help@daedaesonson.com" style={{ color: '#1D0098' }}>
                        help@daedaesonson.com
                    </Link>
                    으로 문의해주세요.
                </Text>
            </Box>

            <BottomNav />
        </Box>
    );
}
