'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Text, Group, Stack, Button, TextInput, ActionIcon, LoadingOverlay, Textarea } from '@mantine/core';
import { ChevronLeft, ChevronRight, X, Camera } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';

export default function ReviewsListPage() {
    const router = useRouter();
    const params = useParams();
    const facilityId = params.id as string;

    const [facility, setFacility] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // 대댓글 입력 상태
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replyNickname, setReplyNickname] = useState('');
    const [replyPassword, setReplyPassword] = useState('');
    const [replyPhotos, setReplyPhotos] = useState<string[]>([]);
    const replyFileInputRef = useRef<HTMLInputElement>(null);

    // 이미지 확대 (풀스크린 오버레이)
    const [enlargedImages, setEnlargedImages] = useState<string[]>([]);
    const [enlargedImageIndex, setEnlargedImageIndex] = useState(0);

    // 리뷰 삭제 모달
    const [deleteReviewModal, setDeleteReviewModal] = useState<string | null>(null);
    const [deleteReviewPassword, setDeleteReviewPassword] = useState('');
    const [deleteReviewError, setDeleteReviewError] = useState('');

    // 댓글 삭제 모달
    const [deleteReplyModal, setDeleteReplyModal] = useState<{ reviewId: string; replyId: string } | null>(null);
    const [deleteReplyPassword, setDeleteReplyPassword] = useState('');
    const [deleteReplyError, setDeleteReplyError] = useState('');

    // 펼치기 상태
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/facilities/${facilityId}`, { cache: 'no-store' });
            const data = await res.json();
            setFacility(data);
            setReviews(data.reviews || []);
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

    const handleSubmitReply = async (reviewId: string) => {
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
                setReviews(prev => prev.map(r => {
                    if (r.id === reviewId) {
                        return { ...r, replies: [...(r.replies || []), newReply] };
                    }
                    return r;
                }));
                setReplyContent('');
                setReplyNickname('');
                setReplyPassword('');
                setReplyPhotos([]);
                setReplyingTo(null);
            } else {
                const errData = await res.json();
                alert(errData.error || '등록에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
        }
    };

    // 리뷰 삭제
    const handleDeleteReview = async () => {
        if (!deleteReviewModal) return;
        if (!deleteReviewPassword.trim()) {
            setDeleteReviewError('비밀번호를 입력해주세요.');
            return;
        }
        try {
            const res = await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facilityId,
                    reviewId: deleteReviewModal,
                    action: 'DELETE_REVIEW',
                    password: deleteReviewPassword
                })
            });
            if (res.ok) {
                setReviews(prev => prev.filter(r => r.id !== deleteReviewModal));
                setDeleteReviewModal(null);
                setDeleteReviewPassword('');
                setDeleteReviewError('');
            } else {
                const errData = await res.json();
                setDeleteReviewError(errData.error || '삭제에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            setDeleteReviewError('오류가 발생했습니다.');
        }
    };

    // 댓글 삭제
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
                    reviewId: deleteReplyModal.reviewId,
                    replyId: deleteReplyModal.replyId,
                    action: 'DELETE_REPLY',
                    password: deleteReplyPassword
                })
            });
            if (res.ok) {
                setReviews(prev => prev.map(r => {
                    if (r.id === deleteReplyModal.reviewId) {
                        return { ...r, replies: r.replies?.filter((rep: any) => rep.id !== deleteReplyModal.replyId) };
                    }
                    return r;
                }));
                setDeleteReplyModal(null);
                setDeleteReplyPassword('');
                setDeleteReplyError('');
            } else {
                const errData = await res.json();
                setDeleteReplyError(errData.error || '삭제에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            setDeleteReplyError('오류가 발생했습니다.');
        }
    };

    // 이미지 확대
    const openImageViewer = (photos: string[], index: number) => {
        setEnlargedImages(photos);
        setEnlargedImageIndex(index);
    };
    const closeImageViewer = () => {
        setEnlargedImages([]);
        setEnlargedImageIndex(0);
    };

    if (loading) {
        return (
            <Box pos="relative" mih="100vh" bg="white">
                <LoadingOverlay visible />
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
                    <Text fw={600} size="md">이야기 {reviews.length}개</Text>
                </Group>
            </Box>

            {/* 시설 이름 */}
            {facility && (
                <Box p="md" style={{ borderBottom: '1px solid #f1f3f5' }}>
                    <Text size="sm" c="dimmed">{facility.name}</Text>
                </Box>
            )}

            {/* 리뷰 목록 */}
            <Box p="md">
                {reviews.length > 0 ? (
                    <Stack gap="lg">
                        {reviews.map((review: any) => (
                            <Box key={review.id} pb="lg" style={{ borderBottom: '1px solid #f1f3f5' }}>
                                {/* 리뷰 헤더 */}
                                <Group gap="xs" mb={4}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#adb5bd' }}>account_circle</span>
                                    <Text size="sm" fw={600} c="dark.8">{review.author}</Text>
                                    <Text size="xs" c="dimmed">· {formatRelativeTime(review.createdAt || review.date)}</Text>
                                    <ActionIcon
                                        variant="transparent" color="gray" size="xs" ml="auto"
                                        onClick={() => {
                                            setDeleteReviewModal(review.id);
                                            setDeleteReviewPassword('');
                                            setDeleteReviewError('');
                                        }}
                                    >
                                        <X size={14} />
                                    </ActionIcon>
                                </Group>

                                {/* 리뷰 내용 */}
                                <Text size="md" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#343a40' }} ml={32}>
                                    {review.content}
                                </Text>

                                {/* 리뷰 사진 */}
                                {review.photos && review.photos.length > 0 && (
                                    <Group gap="xs" mt="sm" ml={32}>
                                        {review.photos.map((photo: string, idx: number) => (
                                            <Box key={idx} style={{ cursor: 'pointer' }} onClick={() => openImageViewer(review.photos, idx)}>
                                                <img src={photo} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '8px', border: '1px solid #f1f3f5' }} />
                                            </Box>
                                        ))}
                                    </Group>
                                )}

                                {/* 좋아요 / 답글달기 */}
                                <Group gap="lg" mt="sm" ml={32}>
                                    <Group gap={4} style={{ cursor: 'pointer' }} onClick={() => {
                                        setReplyingTo(replyingTo === review.id ? null : review.id);
                                        setReplyContent('');
                                        setReplyPhotos([]);
                                        setReplyNickname('');
                                        setReplyPassword('');
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#868e96' }}>chat_bubble_outline</span>
                                        <Text size="xs" c="dimmed">답글달기 {review.replies?.length || 0}</Text>
                                    </Group>
                                </Group>

                                {/* 답글 목록 */}
                                {review.replies && review.replies.length > 0 && (
                                    <Box mt="md" ml={32} bg="gray.0" p="sm" style={{ borderRadius: '8px' }}>
                                        {(expandedReplies.has(review.id) ? review.replies : review.replies.slice(0, 3)).map((reply: any) => (
                                            <Box key={reply.id} mb="sm" pb="sm" style={{ borderBottom: '1px solid #f1f3f5' }}>
                                                <Group gap="xs" mb={4}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#adb5bd' }}>account_circle</span>
                                                    <Text size="sm" fw={700} c="dark.8">{reply.author}</Text>
                                                    <Text size="xs" c="dimmed">· {formatRelativeTime(reply.createdAt || reply.date)}</Text>
                                                    <ActionIcon
                                                        variant="transparent" color="gray" size="xs"
                                                        onClick={() => {
                                                            setDeleteReplyModal({ reviewId: review.id, replyId: reply.id });
                                                            setDeleteReplyPassword('');
                                                            setDeleteReplyError('');
                                                        }}
                                                        ml="auto"
                                                    >
                                                        <X size={12} />
                                                    </ActionIcon>
                                                </Group>
                                                <Text size="sm" c="dark.7" ml={26}>{reply.content}</Text>
                                                {/* 대댓글 이미지 - 클릭 시 풀스크린 확대 */}
                                                {reply.photos && reply.photos.length > 0 && (
                                                    <Group gap={6} mt="xs" ml={26}>
                                                        {reply.photos.map((photo: string, idx: number) => (
                                                            <Box key={idx} style={{ cursor: 'pointer' }} onClick={() => openImageViewer(reply.photos, idx)}>
                                                                <img src={photo} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '8px', border: '1px solid #dee2e6' }} />
                                                            </Box>
                                                        ))}
                                                    </Group>
                                                )}
                                            </Box>
                                        ))}
                                        {/* 3개 이상이면 더보기/접기 */}
                                        {review.replies.length > 3 && (
                                            <Box ta="center" pt="xs">
                                                <Button
                                                    variant="subtle" color="gray" size="xs"
                                                    onClick={() => {
                                                        setExpandedReplies(prev => {
                                                            const next = new Set(prev);
                                                            if (next.has(review.id)) next.delete(review.id);
                                                            else next.add(review.id);
                                                            return next;
                                                        });
                                                    }}
                                                    styles={{ root: { color: '#868e96', fontWeight: 600 } }}
                                                >
                                                    {expandedReplies.has(review.id)
                                                        ? '댓글 접기'
                                                        : `댓글 더보기 (${review.replies.length - 3}개)`
                                                    }
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Stack>
                ) : (
                    <Box ta="center" py="xl">
                        <Text size="sm" c="dimmed">아직 이야기가 없습니다.</Text>
                    </Box>
                )}
            </Box>

            {/* 💬 댓글 입력 바텀시트 모달 */}
            {replyingTo && (
                <>
                    <Box
                        pos="fixed" top={0} left={0} w="100%" h="100%"
                        style={{ zIndex: 9998, backgroundColor: 'rgba(0,0,0,0.4)' }}
                        onClick={() => {
                            setReplyingTo(null); setReplyContent(''); setReplyPhotos([]);
                            setReplyNickname(''); setReplyPassword('');
                        }}
                    />
                    <Box
                        pos="fixed" bottom={0} left={0} w="100%"
                        style={{
                            zIndex: 9999, backgroundColor: 'white',
                            borderRadius: '16px 16px 0 0',
                            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                            animation: 'slideUp 0.15s ease-out',
                            maxHeight: '80vh', overflowY: 'auto',
                        }}
                    >
                        <Box ta="center" pt={8} pb={4}>
                            <Box mx="auto" w={40} h={4} style={{ backgroundColor: '#dee2e6', borderRadius: 2 }} />
                        </Box>
                        <Box p="md" pt={4}>
                            <Group justify="space-between" mb="md">
                                <Text fw={600} size="md">댓글 작성</Text>
                                <ActionIcon variant="transparent" color="gray" onClick={() => {
                                    setReplyingTo(null); setReplyContent(''); setReplyPhotos([]);
                                    setReplyNickname(''); setReplyPassword('');
                                }}>
                                    <X size={20} />
                                </ActionIcon>
                            </Group>

                            <Group gap="xs" mb="sm">
                                <TextInput
                                    placeholder="닉네임" size="sm" value={replyNickname}
                                    onChange={(e) => setReplyNickname(e.currentTarget.value)}
                                    style={{ flex: 1 }}
                                    styles={{ input: { fontSize: '14px', borderRadius: '10px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' } }}
                                />
                                <TextInput
                                    placeholder="비밀번호" size="sm" type="password" value={replyPassword}
                                    onChange={(e) => setReplyPassword(e.currentTarget.value)}
                                    style={{ flex: 1 }}
                                    styles={{ input: { fontSize: '14px', borderRadius: '10px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' } }}
                                />
                            </Group>

                            <Textarea
                                placeholder="댓글을 입력하세요" size="sm" minRows={3} maxRows={5} autosize
                                value={replyContent} onChange={(e) => setReplyContent(e.currentTarget.value)}
                                styles={{ input: { fontSize: '14px', borderRadius: '10px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' } }}
                            />

                            {replyPhotos.length > 0 && (
                                <Group gap={8} mt="sm">
                                    {replyPhotos.map((photo, idx) => (
                                        <Box key={idx} pos="relative" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                                            <img src={photo} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '10px', border: '1px solid #e9ecef' }} />
                                            <ActionIcon variant="filled" color="dark" size={18} radius="xl" pos="absolute" top={4} right={4}
                                                onClick={() => setReplyPhotos(prev => prev.filter((_, i) => i !== idx))}>
                                                <X size={10} />
                                            </ActionIcon>
                                        </Box>
                                    ))}
                                </Group>
                            )}

                            <Group justify="space-between" mt="md" pb="env(safe-area-inset-bottom, 8px)">
                                <Group gap={6}>
                                    <input type="file" accept="image/*" multiple ref={replyFileInputRef}
                                        style={{ display: 'none' }} onChange={handleReplyPhotoUpload} />
                                    <ActionIcon variant="light" color="gray" size="lg" radius="xl"
                                        onClick={() => replyFileInputRef.current?.click()}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#868e96' }}>photo_camera</span>
                                    </ActionIcon>
                                    <Text size="xs" c="dimmed">{replyPhotos.length}/3</Text>
                                </Group>
                                <Button size="sm" variant="filled" color="#1D0098" radius="xl" px="xl"
                                    onClick={() => handleSubmitReply(replyingTo)}
                                    disabled={!replyContent.trim() || !replyNickname.trim() || !replyPassword.trim()}
                                    styles={{ root: { fontWeight: 600 } }}>
                                    등록
                                </Button>
                            </Group>
                        </Box>
                    </Box>
                    <style>{`
                        @keyframes slideUp {
                            from { transform: translateY(100%); }
                            to { transform: translateY(0); }
                        }
                    `}</style>
                </>
            )}

            {/* 🖼️ 풀스크린 이미지 뷰어 */}
            {enlargedImages.length > 0 && (
                <Box pos="fixed" top={0} left={0} w="100%" h="100dvh"
                    style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
                    <Box pos="absolute" top={0} left={0} w="100%" p="md"
                        style={{ zIndex: 10000, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' }}>
                        <Group justify="space-between" align="center">
                            <Text c="white" fw={600} size="md">{enlargedImageIndex + 1} / {enlargedImages.length}</Text>
                            <ActionIcon variant="transparent" c="white" size="lg" onClick={closeImageViewer}>
                                <X size={28} />
                            </ActionIcon>
                        </Group>
                    </Box>
                    <Box style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 16px 16px' }}
                        onClick={closeImageViewer}>
                        <img src={enlargedImages[enlargedImageIndex]} alt="확대 이미지"
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }} />
                    </Box>
                    {enlargedImages.length > 1 && (
                        <Box pos="absolute" bottom={24} left={0} w="100%" style={{ zIndex: 10000 }}>
                            <Group justify="center" gap={6}>
                                {enlargedImages.map((_, idx) => (
                                    <Box key={idx} w={idx === enlargedImageIndex ? 10 : 8} h={idx === enlargedImageIndex ? 10 : 8}
                                        style={{
                                            borderRadius: '50%',
                                            backgroundColor: idx === enlargedImageIndex ? 'white' : 'rgba(255,255,255,0.4)',
                                            cursor: 'pointer', transition: 'all 0.2s ease',
                                        }}
                                        onClick={(e) => { e.stopPropagation(); setEnlargedImageIndex(idx); }} />
                                ))}
                            </Group>
                        </Box>
                    )}
                    {enlargedImages.length > 1 && (
                        <>
                            {enlargedImageIndex > 0 && (
                                <ActionIcon variant="transparent" c="white" size="xl" pos="absolute" top="50%" left={8}
                                    style={{ transform: 'translateY(-50%)', zIndex: 10000 }}
                                    onClick={(e) => { e.stopPropagation(); setEnlargedImageIndex(prev => prev - 1); }}>
                                    <ChevronLeft size={32} />
                                </ActionIcon>
                            )}
                            {enlargedImageIndex < enlargedImages.length - 1 && (
                                <ActionIcon variant="transparent" c="white" size="xl" pos="absolute" top="50%" right={8}
                                    style={{ transform: 'translateY(-50%)', zIndex: 10000 }}
                                    onClick={(e) => { e.stopPropagation(); setEnlargedImageIndex(prev => prev + 1); }}>
                                    <ChevronRight size={32} />
                                </ActionIcon>
                            )}
                        </>
                    )}
                </Box>
            )}

            {/* 🔒 리뷰(이야기) 삭제 바텀시트 */}
            {deleteReviewModal && (
                <>
                    <Box
                        pos="fixed" top={0} left={0} w="100%" h="100%"
                        style={{ zIndex: 9998, backgroundColor: 'rgba(0,0,0,0.4)' }}
                        onClick={() => setDeleteReviewModal(null)}
                    />
                    <Box
                        pos="fixed" bottom={0} left={0} w="100%"
                        p="lg" pb={40}
                        style={{
                            zIndex: 9999, backgroundColor: 'white',
                            borderRadius: '16px 16px 0 0',
                            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                            animation: 'slideUp 0.15s ease-out',
                        }}
                    >
                        <Box mx="auto" mb="md" w={36} h={4} style={{ borderRadius: 2, backgroundColor: '#dee2e6' }} />
                        <Group justify="space-between" mb="md">
                            <Text fw={600} size="lg">이야기 삭제</Text>
                            <ActionIcon variant="subtle" color="gray" onClick={() => setDeleteReviewModal(null)}>
                                <X size={20} />
                            </ActionIcon>
                        </Group>
                        <Text size="sm" c="dimmed" mb="md">이야기를 삭제하려면 비밀번호를 입력하세요.</Text>
                        <TextInput
                            placeholder="비밀번호" type="password"
                            value={deleteReviewPassword}
                            onChange={(e) => { setDeleteReviewPassword(e.currentTarget.value); setDeleteReviewError(''); }}
                            error={deleteReviewError}
                            onKeyDown={(e) => e.key === 'Enter' && handleDeleteReview()}
                            mb="md"
                            styles={{ input: { borderRadius: 12, height: 44 } }}
                        />
                        <Group grow gap="sm">
                            <Button variant="light" color="gray" size="md" radius="xl" onClick={() => setDeleteReviewModal(null)}>취소</Button>
                            <Button variant="filled" color="dark.6" size="md" radius="xl" onClick={handleDeleteReview}>삭제하기</Button>
                        </Group>
                    </Box>
                    <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
                </>
            )}

            {/* 🔒 댓글 삭제 바텀시트 */}
            {deleteReplyModal && (
                <>
                    <Box
                        pos="fixed" top={0} left={0} w="100%" h="100%"
                        style={{ zIndex: 9998, backgroundColor: 'rgba(0,0,0,0.4)' }}
                        onClick={() => setDeleteReplyModal(null)}
                    />
                    <Box
                        pos="fixed" bottom={0} left={0} w="100%"
                        p="lg" pb={40}
                        style={{
                            zIndex: 9999, backgroundColor: 'white',
                            borderRadius: '16px 16px 0 0',
                            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                            animation: 'slideUp 0.15s ease-out',
                        }}
                    >
                        <Box mx="auto" mb="md" w={36} h={4} style={{ borderRadius: 2, backgroundColor: '#dee2e6' }} />
                        <Group justify="space-between" mb="md">
                            <Text fw={600} size="lg">댓글 삭제</Text>
                            <ActionIcon variant="subtle" color="gray" onClick={() => setDeleteReplyModal(null)}>
                                <X size={20} />
                            </ActionIcon>
                        </Group>
                        <Text size="sm" c="dimmed" mb="md">댓글을 삭제하려면 비밀번호를 입력하세요.</Text>
                        <TextInput
                            placeholder="비밀번호" type="password"
                            value={deleteReplyPassword}
                            onChange={(e) => { setDeleteReplyPassword(e.currentTarget.value); setDeleteReplyError(''); }}
                            error={deleteReplyError}
                            onKeyDown={(e) => e.key === 'Enter' && handleDeleteReply()}
                            mb="md"
                            styles={{ input: { borderRadius: 12, height: 44 } }}
                        />
                        <Group grow gap="sm">
                            <Button variant="light" color="gray" size="md" radius="xl" onClick={() => setDeleteReplyModal(null)}>취소</Button>
                            <Button variant="filled" color="dark.6" size="md" radius="xl" onClick={handleDeleteReply}>삭제하기</Button>
                        </Group>
                    </Box>
                    <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
                </>
            )}
        </Box>
    );
}
