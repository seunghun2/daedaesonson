'use client';

import { useState, useRef } from 'react';
import { Drawer, Box, Text, Textarea, Button, Group, Stack, ActionIcon, Image, TextInput, ScrollArea } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { AlertCircle, CheckCircle, X, Camera } from 'lucide-react';
import { compressImageFile } from '@/lib/clientImageCompress';

interface CorrectionRequestModalProps {
    facilityId: string;
    facilityName: string;
    isOpen: boolean;
    onClose: () => void;
}

const CORRECTION_TYPES = [
    { value: 'price', label: '가격·분양가 오류' },
    { value: 'facility_info', label: '전화번호·주소 오류' },
    { value: 'photo', label: '사진·이미지 변경' },
    { value: 'business_status', label: '만장·영업상태 변경' },
    { value: 'location', label: '지도 위치 오류' },
    { value: 'other', label: '기타 수정 요청' },
];

export default function CorrectionRequestModal({ facilityId, facilityName, isOpen, onClose }: CorrectionRequestModalProps) {
    const isMobileQuery = useMediaQuery('(max-width: 800px)');
    const isMobile = isMobileQuery ?? true;

    const [correctionType, setCorrectionType] = useState<string>('price');
    const [content, setContent] = useState('');
    const [contact, setContact] = useState('');
    const [name, setName] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (photos.length + files.length > 10) {
            setError('이미지는 최대 10장까지 첨부할 수 있습니다.');
            return;
        }
        const compressedList = await Promise.all(
            Array.from(files).map(file => compressImageFile(file, 1200, 0.7))
        );
        const validPhotos = compressedList.filter(Boolean);
        setPhotos(prev => [...prev, ...validPhotos]);
        e.target.value = '';
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const isFormValid = !!(correctionType && content.trim() && name.trim() && contact.trim());

    const handleSubmit = async () => {
        if (!correctionType) { setError('유형을 선택해주세요.'); return; }
        if (!content.trim()) { setError('수정 내용을 입력해주세요.'); return; }
        if (!name.trim()) { setError('성함을 입력해주세요.'); return; }
        if (!contact.trim()) { setError('연락처를 입력해주세요.'); return; }
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
                    contact: contact.trim(),
                    name: name.trim(),
                    photos: photos.length > 0 ? photos : null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '등록에 실패했습니다.');
            }

            setSubmitted(true);
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', '정보수정_요청', {
                    시설ID: facilityId,
                    시설명: facilityName,
                    유형: correctionType,
                    사진수: photos.length
                });
            }
            setTimeout(() => { handleClose(); }, 2000);
        } catch (err: any) {
            setError(err.message || '등록 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCorrectionType('price');
        setContent('');
        setContact('');
        setName('');
        setPhotos([]);
        setError('');
        setSubmitted(false);
        setLoading(false);
        onClose();
    };

    const inputStyles = {
        input: {
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            height: 46,
            fontSize: 14,
            color: '#191F28',
            paddingLeft: 12,
            paddingRight: 12,
        },
    };

    return (
        <Drawer
            opened={isOpen}
            onClose={handleClose}
            position={isMobile ? 'bottom' : 'left'}
            size={isMobile ? '92%' : 400}
            padding={0}
            withCloseButton={false}
            zIndex={10010}
            lockScroll={!!isMobile}
            transitionProps={{ duration: isMobile ? 150 : 0 }}
            styles={{
                overlay: {
                    backgroundColor: isMobile ? 'rgba(0,0,0,0.5)' : 'transparent',
                    pointerEvents: isMobile ? 'auto' : 'none',
                },
                content: isMobile
                    ? {
                          borderTopLeftRadius: 20,
                          borderTopRightRadius: 20,
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                      }
                    : {
                          marginLeft: '400px',
                          boxShadow: '4px 0 20px rgba(15, 23, 42, 0.12)',
                          borderLeft: '1px solid #E5E8EB',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                      },
                header: { display: 'none' },
                body: {
                    padding: 0,
                    backgroundColor: '#FFFFFF',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                },
            }}
        >
            <Stack gap={0} style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
                {isMobile && (
                    <Box pt={10} pb={2}>
                        <Box w={36} h={4} bg="#CBD5E1" mx="auto" style={{ borderRadius: 2 }} />
                    </Box>
                )}

                {/* 헤더 */}
                <Box px="lg" py={14} style={{ borderBottom: '1px solid #E5E8EB', flexShrink: 0 }}>
                    <Group justify="space-between" align="center">
                        <Box>
                            <Text fw={800} size="lg" c="#191F28" style={{ letterSpacing: '-0.3px' }}>
                                정보 수정 요청
                            </Text>
                            <Text size="xs" c="#191F28" fw={600} mt={2}>{facilityName}</Text>
                        </Box>
                        <ActionIcon variant="subtle" color="gray" size={34} radius="md" onClick={handleClose} aria-label="닫기">
                            <X size={20} color="#475569" />
                        </ActionIcon>
                    </Group>
                </Box>

                {/* 본체 */}
                <ScrollArea style={{ flex: 1 }}>
                    <Box px="lg" py="md">
                        {submitted ? (
                            <Stack align="center" py={40} gap="md">
                                <CheckCircle size={48} color="#191F28" strokeWidth={1.8} />
                                <Text size="lg" fw={800} c="#191F28" ta="center">수정 요청이 접수되었습니다</Text>
                                <Text size="sm" c="#64748B" ta="center" lh={1.6}>
                                    남겨주신 내용을 빠르게 검수하여 반영하겠습니다.<br />소중한 제보 감사합니다.
                                </Text>
                            </Stack>
                        ) : (
                            <Stack gap={16}>
                                {/* 유형 선택 - 2x3 원탭 칩 그리드 */}
                                <Box>
                                    <Text size="xs" fw={700} mb={8} c="#334155">
                                        수정이 필요한 항목 <Text span c="#EF4444">*</Text>
                                    </Text>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                        {CORRECTION_TYPES.map((item) => {
                                            const active = correctionType === item.value;
                                            return (
                                                <button
                                                    key={item.value}
                                                    type="button"
                                                    onClick={() => setCorrectionType(item.value)}
                                                    style={{
                                                        height: 40,
                                                        borderRadius: 10,
                                                        border: active ? '1.5px solid #191F28' : '1px solid #CBD5E1',
                                                        backgroundColor: active ? '#191F28' : '#FFFFFF',
                                                        color: active ? '#FFFFFF' : '#475569',
                                                        fontSize: 12.5,
                                                        fontWeight: active ? 700 : 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease',
                                                    }}
                                                >
                                                    {item.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </Box>

                                {/* 수정 내용 */}
                                <Box>
                                    <Text size="xs" fw={700} mb={6} c="#334155">
                                        상세 수정 내용 <Text span c="#EF4444">*</Text>
                                    </Text>
                                    <Textarea
                                        placeholder="실제 분양가, 변경된 전화번호 등 수정이 필요한 내용을 자세히 알려주세요."
                                        value={content}
                                        onChange={(e) => setContent(e.currentTarget.value)}
                                        minRows={4}
                                        maxRows={8}
                                        autosize
                                        styles={{
                                            input: {
                                                borderRadius: 10,
                                                backgroundColor: '#FFFFFF',
                                                border: '1px solid #CBD5E1',
                                                fontSize: 14,
                                                lineHeight: 1.6,
                                                color: '#191F28',
                                                padding: '10px 12px',
                                            },
                                        }}
                                    />
                                </Box>

                                {/* 사진 첨부 */}
                                <Box>
                                    <Text size="xs" fw={700} mb={6} c="#334155">
                                        참고 사진 · 가격표 첨부 <Text span c="#64748B" size="xs" fw={500}>(선택, 최대 10장)</Text>
                                    </Text>
                                    <input type="file" multiple accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhotoUpload} />
                                    <Group gap="xs" align="flex-start" style={{ flexWrap: 'wrap' }}>
                                        <Box
                                            w={68} h={68}
                                            style={{
                                                border: '1px solid #CBD5E1',
                                                backgroundColor: '#F8FAFC',
                                                borderRadius: 10,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                            }}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Camera size={20} color="#64748B" strokeWidth={1.6} />
                                            <Text size="11px" c="#64748B" mt={2}>{photos.length}/10</Text>
                                        </Box>
                                        {photos.map((photo, idx) => (
                                            <Box key={idx} pos="relative" w={68} h={68}>
                                                <Image src={photo} w={68} h={68} radius="md" style={{ objectFit: 'cover', border: '1px solid #CBD5E1' }} />
                                                <ActionIcon size={18} radius="xl" color="dark" variant="filled" style={{ position: 'absolute', top: -6, right: -6 }} onClick={() => removePhoto(idx)}>
                                                    <X size={10} />
                                                </ActionIcon>
                                            </Box>
                                        ))}
                                    </Group>
                                </Box>

                                {/* 성함 & 연락처 */}
                                <Group grow gap={10}>
                                    <Box>
                                        <Text size="xs" fw={700} mb={6} c="#334155">
                                            제보자 성함 <Text span c="#EF4444">*</Text>
                                        </Text>
                                        <TextInput
                                            placeholder="예) 홍길동"
                                            value={name}
                                            onChange={(e) => setName(e.currentTarget.value)}
                                            styles={inputStyles}
                                        />
                                    </Box>
                                    <Box>
                                        <Text size="xs" fw={700} mb={6} c="#334155">
                                            연락처 / 이메일 <Text span c="#EF4444">*</Text>
                                        </Text>
                                        <TextInput
                                            placeholder="010-1234-5678"
                                            value={contact}
                                            onChange={(e) => setContact(e.currentTarget.value)}
                                            styles={inputStyles}
                                        />
                                    </Box>
                                </Group>

                                {/* 에러 메시지 */}
                                {error && (
                                    <Group gap={6}>
                                        <AlertCircle size={14} color="#DC2626" />
                                        <Text size="xs" c="#DC2626" fw={600}>{error}</Text>
                                    </Group>
                                )}

                                <Text size="xs" c="#64748B" lh={1.5}>
                                    시설 관계자이신 경우 공식 제휴 신청을 통해 분양가·사진을 직접 관리하실 수도 있습니다.
                                </Text>
                            </Stack>
                        )}
                    </Box>
                </ScrollArea>

                {!submitted && (
                    <Box
                        p="md"
                        style={{
                            borderTop: '1px solid #E5E8EB',
                            backgroundColor: '#FFFFFF',
                            paddingBottom: isMobile ? 'calc(14px + env(safe-area-inset-bottom, 0px))' : 14,
                            flexShrink: 0,
                        }}
                    >
                        <Button
                            fullWidth
                            size="md"
                            radius="md"
                            onClick={handleSubmit}
                            loading={loading}
                            disabled={!isFormValid}
                            styles={{
                                root: {
                                    height: 48,
                                    borderRadius: 12,
                                    backgroundColor: isFormValid ? '#191F28' : '#E2E8F0',
                                    color: isFormValid ? '#FFFFFF' : '#94A3B8',
                                    fontWeight: 700,
                                    fontSize: 15,
                                }
                            }}
                        >
                            정보 수정 요청 접수하기
                        </Button>
                    </Box>
                )}
            </Stack>
        </Drawer>
    );
}
