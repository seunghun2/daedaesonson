'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Text, Group, Stack, Button, TextInput, ActionIcon, Modal, Image, Paper, LoadingOverlay } from '@mantine/core';
import { ChevronLeft, X, Camera } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';

export default function ReviewRepliesPage() {
    const router = useRouter();
    const params = useParams();
    const facilityId = params.id as string;
    const reviewId = params.reviewId as string;

    const [review, setReview] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // 대댓글 입력 상태
    const [replyContent, setReplyContent] = useState('');
    const [replyNickname, setReplyNickname] = useState('');
    const [replyPassword, setReplyPassword] = useState('');
    const [replyPhotos, setReplyPhotos] = useState<string[]>([]);
    const replyFileInputRef = useRef<HTMLInputElement>(null);

    // 이미지 확대 모달
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

    // 삭제 모달
    const [deleteReplyModal, setDeleteReplyModal] = useState<string | null>(null);
    const [deleteReplyPassword, setDeleteReplyPassword] = useState('');
    const [deleteReplyError, setDeleteReplyError] = useState('');

    useEffect(() => {
        fetchReview();
    }, []);

    const fetchReview = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/facilities/${facilityId}`);
            const data = await res.json();
            const found = data.reviews?.find((r: any) => r.id === reviewId);
            if (found) setReview(found);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleReplyPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (replyPhotos.length + files.length > 3) {
            alert('이미지는 최대 3장까지 첨부할 수 있습니다.');
            return;
        }
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                setReplyPhotos(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const handleSubmitReply = async () => {
        if (!replyContent.trim() || !replyNickname.trim() || !replyPassword.trim()) {
            alert('닉네임, 비밀번호, 내용을 모두 입력해주세요.');
            return;
        }

        try {
            const res = await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facilityId,
                    reviewId,
                    action: 'REPLY',
                    content: replyContent,
                    photos: replyPhotos,
                    author: replyNickname,
                    password: replyPassword
                })
            });

            if (res.ok) {
                const data = await res.json();
                const newReply = {
                    id: data.reply?.id || `rep-${Date.now()}`,
                    author: replyNickname,
                    content: replyContent,
                    photos: replyPhotos,
                    createdAt: new Date().toISOString()
                };
                setReview((prev: any) => ({
                    ...prev,
                    replies: [...(prev.replies || []), newReply]
                }));
                setReplyContent('');
                setReplyNickname('');
                setReplyPassword('');
                setReplyPhotos([]);
            } else {
                const errData = await res.json();
                alert(errData.error || '등록에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteReply = async () => {
        if (!deleteReplyModal) return;
        if (!deleteReplyPassword.trim()) {
            setDeleteReplyError('비밀번호를 입력해주세요.');
            return;
        }
        try {
            const res = await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facilityId,
                    reviewId,
                    replyId: deleteReplyModal,
                    action: 'DELETE_REPLY',
                    password: deleteReplyPassword
                })
            });
            if (res.ok) {
                setReview((prev: any) => ({
                    ...prev,
                    replies: prev.replies?.filter((r: any) => r.id !== deleteReplyModal)
                }));
                setDeleteReplyModal(null);
            } else {
                const errData = await res.json();
                setDeleteReplyError(errData.error || '삭제에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            setDeleteReplyError('오류가 발생했습니다.');
        }
    };

    if (loading) {
        return (
            <Box pos="relative" mih="100vh">
                <LoadingOverlay visible />
            </Box>
        );
    }

    if (!review) {
        return (
            <Box p="xl" ta="center">
                <Text c="dimmed">리뷰를 찾을 수 없습니다.</Text>
                <Button mt="md" variant="light" onClick={() => router.back()}>돌아가기</Button>
            </Box>
        );
    }

    return (
        <Box maw={600} mx="auto" bg="white" mih="100vh">
            {/* 헤더 */}
            <Box
                p="md"
                style={{
                    borderBottom: '1px solid #f1f3f5',
                    position: 'sticky',
                    top: 0,
                    background: 'white',
                    zIndex: 10
                }}
            >
                <Group gap="xs">
                    <ActionIcon variant="transparent" color="dark" onClick={() => router.back()}>
                        <ChevronLeft size={20} />
                    </ActionIcon>
                    <Text fw={600} size="md">댓글 {review.replies?.length || 0}개</Text>
                </Group>
            </Box>

            {/* 원본 리뷰 */}
            <Box p="md" style={{ borderBottom: '8px solid #f1f3f5' }}>
                <Group gap="xs" mb={4}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#adb5bd' }}>account_circle</span>
                    <Text size="sm" fw={600} c="dark.8">{review.author}</Text>
                    <Text size="xs" c="dimmed">· {formatRelativeTime(review.createdAt || review.date)}</Text>
                </Group>
                <Text size="md" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#343a40' }} ml={32}>
                    {review.content}
                </Text>
                {review.photos && review.photos.length > 0 && (
                    <Group gap="xs" mt="sm" ml={32}>
                        {review.photos.map((photo: string, idx: number) => (
                            <Box key={idx} style={{ cursor: 'pointer' }} onClick={() => setEnlargedImage(photo)}>
                                <Image src={photo} w={100} h={100} radius="md" style={{ objectFit: 'cover', border: '1px solid #f1f3f5' }} />
                            </Box>
                        ))}
                    </Group>
                )}
            </Box>

            {/* 댓글 목록 */}
            <Box p="md">
                {review.replies && review.replies.length > 0 ? (
                    <Stack gap="md">
                        {review.replies.map((reply: any) => (
                            <Box key={reply.id} pb="md" style={{ borderBottom: '1px solid #f1f3f5' }}>
                                <Group gap="xs" mb={4}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#adb5bd' }}>account_circle</span>
                                    <Text size="sm" fw={700} c="dark.8">{reply.author}</Text>
                                    <Text size="xs" c="dimmed">· {formatRelativeTime(reply.createdAt || reply.date)}</Text>
                                    <ActionIcon
                                        variant="transparent"
                                        color="gray"
                                        size="xs"
                                        onClick={() => {
                                            setDeleteReplyModal(reply.id);
                                            setDeleteReplyPassword('');
                                            setDeleteReplyError('');
                                        }}
                                        ml="auto"
                                    >
                                        <X size={12} />
                                    </ActionIcon>
                                </Group>
                                <Text size="sm" c="dark.7" ml={28}>{reply.content}</Text>
                                {reply.photos && reply.photos.length > 0 && (
                                    <Group gap={6} mt="xs" ml={28}>
                                        {reply.photos.map((photo: string, idx: number) => (
                                            <Box key={idx} style={{ cursor: 'pointer' }} onClick={() => setEnlargedImage(photo)}>
                                                <img src={photo} alt="리뷰 사진" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '8px', border: '1px solid #dee2e6' }} />
                                            </Box>
                                        ))}
                                    </Group>
                                )}
                            </Box>
                        ))}
                    </Stack>
                ) : (
                    <Box ta="center" py="xl">
                        <Text size="sm" c="dimmed">아직 댓글이 없습니다.</Text>
                    </Box>
                )}
            </Box>

            {/* 댓글 입력 영역 (하단 고정) */}
            <Box
                p="md"
                style={{
                    borderTop: '1px solid #e9ecef',
                    position: 'sticky',
                    bottom: 0,
                    background: 'white'
                }}
            >
                <Group gap="xs" mb="xs">
                    <TextInput
                        placeholder="닉네임"
                        size="xs"
                        value={replyNickname}
                        onChange={(e) => setReplyNickname(e.currentTarget.value)}
                        style={{ flex: 1 }}
                        styles={{ input: { fontSize: '13px' } }}
                    />
                    <TextInput
                        placeholder="비밀번호"
                        size="xs"
                        type="password"
                        value={replyPassword}
                        onChange={(e) => setReplyPassword(e.currentTarget.value)}
                        style={{ flex: 1 }}
                        styles={{ input: { fontSize: '13px' } }}
                    />
                </Group>

                <TextInput
                    placeholder="댓글을 입력하세요"
                    size="sm"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.currentTarget.value)}
                    styles={{ input: { fontSize: '14px' } }}
                />

                {/* 이미지 미리보기 */}
                {replyPhotos.length > 0 && (
                    <Group gap={6} mt="xs">
                        {replyPhotos.map((photo, idx) => (
                            <Box key={idx} pos="relative" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                                <img src={photo} alt="답글 사진" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '8px', border: '1px solid #dee2e6' }} />
                                <ActionIcon
                                    variant="filled" color="dark" size={14} radius="xl"
                                    pos="absolute" top={2} right={2}
                                    onClick={() => setReplyPhotos(prev => prev.filter((_, i) => i !== idx))}
                                >
                                    <X size={8} />
                                </ActionIcon>
                            </Box>
                        ))}
                    </Group>
                )}

                <Group justify="space-between" mt="xs">
                    <Group gap={4}>
                        <input
                            type="file" accept="image/*" multiple
                            ref={replyFileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleReplyPhotoUpload}
                        />
                        <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => replyFileInputRef.current?.click()}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#868e96' }}>photo_camera</span>
                        </ActionIcon>
                        <Text size="xs" c="dimmed">{replyPhotos.length}/3</Text>
                    </Group>
                    <Button
                        size="xs" variant="filled" color="brand" radius="xl"
                        onClick={handleSubmitReply}
                        disabled={!replyContent.trim() || !replyNickname.trim() || !replyPassword.trim()}
                    >
                        등록
                    </Button>
                </Group>
            </Box>

            {/* 이미지 확대 모달 */}
            <Modal
                opened={!!enlargedImage}
                onClose={() => setEnlargedImage(null)}
                size="100%"
                padding={0}
                withCloseButton
                centered
                styles={{
                    content: { background: 'rgba(0,0,0,0.9)', maxHeight: '100vh' },
                    header: { background: 'transparent', position: 'absolute', top: 8, right: 8, zIndex: 10 },
                    body: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 0 }
                }}
            >
                {enlargedImage && (
                    <img src={enlargedImage} alt="확대 이미지" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ maxWidth: '95%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
                )}
            </Modal>

            {/* 삭제 비밀번호 모달 */}
            <Modal
                opened={!!deleteReplyModal}
                onClose={() => setDeleteReplyModal(null)}
                title="댓글 삭제"
                centered
                size="xs"
            >
                <Stack gap="sm">
                    <Text size="sm" c="dimmed">댓글을 삭제하려면 비밀번호를 입력하세요.</Text>
                    <TextInput
                        placeholder="비밀번호"
                        type="password"
                        value={deleteReplyPassword}
                        onChange={(e) => { setDeleteReplyPassword(e.currentTarget.value); setDeleteReplyError(''); }}
                        error={deleteReplyError}
                        onKeyDown={(e) => e.key === 'Enter' && handleDeleteReply()}
                    />
                    <Group justify="flex-end" gap="xs">
                        <Button variant="subtle" color="gray" size="sm" onClick={() => setDeleteReplyModal(null)}>취소</Button>
                        <Button variant="filled" color="red" size="sm" onClick={handleDeleteReply}>삭제</Button>
                    </Group>
                </Stack>
            </Modal>
        </Box>
    );
}
