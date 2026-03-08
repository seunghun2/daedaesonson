'use client';

import { useState } from 'react';
import { Box, Text, Textarea, Select, Button, Group, Stack, CloseButton, Transition } from '@mantine/core';
import { Send, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';

interface CorrectionRequestModalProps {
    facilityId: string;
    facilityName: string;
    isOpen: boolean;
    onClose: () => void;
}

const CORRECTION_TYPES = [
    { value: 'price', label: '가격 정보 오류' },
    { value: 'facility_info', label: '시설 정보 오류' },
    { value: 'photo', label: '사진/이미지 오류' },
    { value: 'other', label: '기타' },
];

export default function CorrectionRequestModal({ facilityId, facilityName, isOpen, onClose }: CorrectionRequestModalProps) {
    const [correctionType, setCorrectionType] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [contact, setContact] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!correctionType) {
            setError('유형을 선택해주세요.');
            return;
        }
        if (!content.trim()) {
            setError('수정 내용을 입력해주세요.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/corrections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facility_id: facilityId,
                    facility_name: facilityName,
                    correction_type: correctionType,
                    content: content.trim(),
                    contact: contact.trim() || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '등록에 실패했습니다.');
            }

            setSubmitted(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || '등록 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCorrectionType(null);
        setContent('');
        setContact('');
        setError('');
        setSubmitted(false);
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Box
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
            }}
        >
            {/* 배경 오버레이 */}
            <Box
                onClick={handleClose}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    animation: 'fadeIn 0.2s ease',
                }}
            />

            {/* 모달 본체 */}
            <Box
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 500,
                    maxHeight: '90vh',
                    backgroundColor: 'white',
                    borderRadius: '16px 16px 0 0',
                    overflow: 'hidden',
                    animation: 'slideUp 0.3s ease',
                }}
            >
                {/* 헤더 */}
                <Box px="lg" pt="lg" pb="sm">
                    <Group justify="space-between" align="center">
                        <Text size="lg" fw={700}>정보 수정 요청</Text>
                        <CloseButton onClick={handleClose} size="lg" />
                    </Group>
                </Box>

                {/* 본체 */}
                <Box px="lg" pb="xl" style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 60px)' }}>
                    {submitted ? (
                        // 성공 화면
                        <Stack align="center" py={40} gap="md">
                            <CheckCircle size={48} color="#40c057" strokeWidth={1.5} />
                            <Text size="lg" fw={600} ta="center">수정 요청이 등록되었습니다</Text>
                            <Text size="sm" c="gray.6" ta="center" lh={1.6}>
                                빠르게 확인 후 수정하겠습니다.<br />감사합니다!
                            </Text>
                        </Stack>
                    ) : (
                        <Stack gap="lg">
                            {/* 시설명 (자동 입력) */}
                            <Box>
                                <Text size="sm" fw={600} mb={6} c="dark.7">
                                    시설명
                                </Text>
                                <Box
                                    px="sm"
                                    py={10}
                                    style={{
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: 8,
                                        border: '1px solid #e9ecef',
                                    }}
                                >
                                    <Text size="sm" c="dark.5">{facilityName}</Text>
                                </Box>
                            </Box>

                            {/* 유형 선택 */}
                            <Box>
                                <Text size="sm" fw={600} mb={6} c="dark.7">
                                    유형 선택 <Text span c="red.5" size="xs">*</Text>
                                </Text>
                                <Select
                                    placeholder="수정이 필요한 유형을 선택해주세요"
                                    data={CORRECTION_TYPES}
                                    value={correctionType}
                                    onChange={setCorrectionType}
                                    rightSection={<ChevronDown size={16} color="#868e96" />}
                                    styles={{
                                        input: {
                                            borderRadius: 8,
                                            border: '1px solid #dee2e6',
                                            height: 44,
                                            fontSize: 14,
                                        },
                                        dropdown: {
                                            borderRadius: 8,
                                            border: '1px solid #dee2e6',
                                        },
                                    }}
                                />
                            </Box>

                            {/* 수정 내용 */}
                            <Box>
                                <Text size="sm" fw={600} mb={6} c="dark.7">
                                    수정 내용 <Text span c="red.5" size="xs">*</Text>
                                </Text>
                                <Textarea
                                    placeholder="어떤 정보가 잘못되었는지 자세히 알려주세요"
                                    value={content}
                                    onChange={(e) => setContent(e.currentTarget.value)}
                                    minRows={4}
                                    maxRows={8}
                                    autosize
                                    styles={{
                                        input: {
                                            borderRadius: 8,
                                            border: '1px solid #dee2e6',
                                            fontSize: 14,
                                            lineHeight: 1.6,
                                        },
                                    }}
                                />
                                <Text size="xs" c="gray.5" mt={4}>
                                    © 어떤 말을 써야하나요
                                </Text>
                            </Box>

                            {/* 연락처 (선택) */}
                            <Box>
                                <Text size="sm" fw={600} mb={6} c="dark.7">
                                    연락처 <Text span c="gray.5" size="xs">(선택)</Text>
                                </Text>
                                <Box
                                    component="input"
                                    value={contact}
                                    onChange={(e: any) => setContact(e.target.value)}
                                    placeholder="답변 받으실 이메일 또는 연락처"
                                    style={{
                                        width: '100%',
                                        height: 44,
                                        borderRadius: 8,
                                        border: '1px solid #dee2e6',
                                        padding: '0 12px',
                                        fontSize: 14,
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                    }}
                                />
                            </Box>

                            {/* 에러 메시지 */}
                            {error && (
                                <Group gap={6}>
                                    <AlertCircle size={14} color="#fa5252" />
                                    <Text size="xs" c="red.6">{error}</Text>
                                </Group>
                            )}

                            {/* 안내 텍스트 */}
                            <Text size="xs" c="gray.5" lh={1.6}>
                                참고가 될 만한 정보를 상세히 작성해주시면 더 정확한 확인이 가능합니다.
                            </Text>

                            {/* 등록 버튼 */}
                            <Button
                                fullWidth
                                size="lg"
                                onClick={handleSubmit}
                                loading={loading}
                                disabled={!correctionType || !content.trim()}
                                leftSection={<Send size={18} />}
                                style={{
                                    borderRadius: 12,
                                    height: 52,
                                    fontSize: 16,
                                    fontWeight: 600,
                                    backgroundColor: (!correctionType || !content.trim()) ? '#e9ecef' : '#1D0098',
                                    marginBottom: 16,
                                }}
                            >
                                등록하기
                            </Button>
                        </Stack>
                    )}
                </Box>
            </Box>

            {/* 애니메이션 */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
        </Box>
    );
}
