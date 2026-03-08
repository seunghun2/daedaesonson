'use client';

import { useState, useRef } from 'react';
import { Drawer, Box, Text, Textarea, Select, Button, Group, Stack, ActionIcon, Image, TextInput, ScrollArea } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ChevronDown, AlertCircle, CheckCircle, X, Camera } from 'lucide-react';

interface CorrectionRequestModalProps {
    facilityId: string;
    facilityName: string;
    isOpen: boolean;
    onClose: () => void;
}

const CORRECTION_TYPES = [
    { value: 'price', label: '가격 정보 오류' },
    { value: 'facility_info', label: '시설 정보 오류 (전화번호, 주소 등)' },
    { value: 'photo', label: '사진/이미지 변경 요청' },
    { value: 'business_status', label: '영업 상태 변경 (폐업, 휴업 등)' },
    { value: 'location', label: '위치 정보 오류 (지도, 주소)' },
    { value: 'other', label: '기타' },
];

export default function CorrectionRequestModal({ facilityId, facilityName, isOpen, onClose }: CorrectionRequestModalProps) {
    const isMobileQuery = useMediaQuery('(max-width: 800px)');
    const isMobile = isMobileQuery ?? true;

    const [correctionType, setCorrectionType] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [contact, setContact] = useState('');
    const [name, setName] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (photos.length + files.length > 10) {
            alert('이미지는 최대 10장까지 첨부할 수 있습니다.');
            return;
        }
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotos(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
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
        setCorrectionType(null);
        setContent('');
        setContact('');
        setName('');
        setPhotos([]);
        setError('');
        setSubmitted(false);
        setLoading(false);
        onClose();
    };

    return (
        <Drawer
            opened={isOpen}
            onClose={handleClose}
            position={isMobile ? 'bottom' : 'left'}
            size={isMobile ? '90%' : 400}
            zIndex={10010}
            transitionProps={{ duration: 0 }}
            styles={{
                overlay: {
                    backgroundColor: isMobile ? 'rgba(0,0,0,0.5)' : 'transparent',
                    pointerEvents: isMobile ? 'auto' : 'none'
                },
                content: isMobile ? {
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16
                } : {
                    marginLeft: '400px',
                    boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
                },
                header: { display: 'none' },
                body: { padding: 0, backgroundColor: '#fff', height: '100%' }
            }}
            withCloseButton={false}
            lockScroll={false}
        >
            <Stack gap={0} h="100%">
                {/* 헤더 — 등록하기 버튼 포함 */}
                <Box p="md" style={{ borderBottom: '1px solid #f1f3f5', flexShrink: 0 }}>
                    <Group justify="space-between" align="center">
                        <Text fw={700} size="lg">정보 수정 요청</Text>
                        <Group gap={8}>
                            <Button
                                size="xs"
                                radius="md"
                                fw={600}
                                onClick={handleSubmit}
                                loading={loading}
                                disabled={!isFormValid}
                                style={{ backgroundColor: isFormValid ? '#1D0098' : undefined }}
                            >
                                등록하기
                            </Button>
                            <ActionIcon variant="subtle" color="dark" onClick={handleClose}>
                                <X size={20} />
                            </ActionIcon>
                        </Group>
                    </Group>
                    <Text size="xs" c="dimmed" mt={4}>{facilityName}</Text>
                </Box>

                {/* 본체 */}
                <ScrollArea style={{ flex: 1 }}>
                    <Box px="lg" py="md">
                        {submitted ? (
                            <Stack align="center" py={40} gap="md">
                                <CheckCircle size={48} color="#40c057" strokeWidth={1.5} />
                                <Text size="lg" fw={600} ta="center">수정 요청이 등록되었습니다</Text>
                                <Text size="sm" c="gray.6" ta="center" lh={1.6}>
                                    빠르게 확인 후 수정하겠습니다.<br />감사합니다!
                                </Text>
                            </Stack>
                        ) : (
                            <Stack gap="lg">
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
                                        comboboxProps={{ zIndex: 10020, position: 'bottom' }}
                                        styles={{
                                            input: { borderRadius: 8, border: '1px solid #dee2e6', height: 44, fontSize: 14 },
                                            dropdown: { borderRadius: 8, border: '1px solid #dee2e6' },
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
                                            input: { borderRadius: 8, border: '1px solid #dee2e6', fontSize: 14, lineHeight: 1.6 },
                                        }}
                                    />
                                </Box>

                                {/* 사진 첨부 */}
                                <Box>
                                    <Text size="sm" fw={600} mb={6} c="dark.7">
                                        사진 첨부 <Text span c="gray.5" size="xs">(선택, 최대 10장)</Text>
                                    </Text>
                                    <input type="file" multiple accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhotoUpload} />
                                    <Group gap="xs" align="flex-start" style={{ flexWrap: 'wrap' }}>
                                        <Box
                                            w={72} h={72}
                                            style={{ border: '1px solid #dee2e6', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Camera size={22} color="#868e96" strokeWidth={1.5} />
                                            <Text size="xs" c="dimmed" mt={2}>{photos.length}/10</Text>
                                        </Box>
                                        {photos.map((photo, idx) => (
                                            <Box key={idx} pos="relative" w={72} h={72}>
                                                <Image src={photo} w={72} h={72} radius="md" style={{ objectFit: 'cover', border: '1px solid #dee2e6' }} />
                                                <ActionIcon size={18} radius="xl" color="dark" variant="filled" style={{ position: 'absolute', top: -6, right: -6 }} onClick={() => removePhoto(idx)}>
                                                    <X size={10} />
                                                </ActionIcon>
                                            </Box>
                                        ))}
                                    </Group>
                                </Box>

                                {/* 구분선 */}
                                <Box style={{ height: 1, backgroundColor: '#f1f3f5' }} />

                                {/* 성함 (필수) */}
                                <Box>
                                    <Text size="sm" fw={600} mb={6} c="dark.7">
                                        성함 <Text span c="red.5" size="xs">*</Text>
                                    </Text>
                                    <TextInput
                                        placeholder="성함을 입력해주세요"
                                        value={name}
                                        onChange={(e) => setName(e.currentTarget.value)}
                                        styles={{
                                            input: { borderRadius: 8, border: '1px solid #dee2e6', height: 44, fontSize: 14 },
                                        }}
                                    />
                                </Box>

                                {/* 연락처 (필수) */}
                                <Box>
                                    <Text size="sm" fw={600} mb={6} c="dark.7">
                                        연락처 <Text span c="red.5" size="xs">*</Text>
                                    </Text>
                                    <TextInput
                                        placeholder="답변 받으실 이메일 또는 전화번호"
                                        value={contact}
                                        onChange={(e) => setContact(e.currentTarget.value)}
                                        styles={{
                                            input: { borderRadius: 8, border: '1px solid #dee2e6', height: 44, fontSize: 14 },
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

                                {/* 안내 */}
                                <Text size="xs" c="gray.5" lh={1.6}>
                                    참고가 될 만한 사진이나 정보를 상세히 작성해주시면 더 정확한 확인이 가능합니다.
                                </Text>
                            </Stack>
                        )}
                    </Box>
                </ScrollArea>
            </Stack>
        </Drawer>
    );
}
