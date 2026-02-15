'use client';

import { Drawer, Box, Text, Group, Stack, ActionIcon, ScrollArea, TextInput, Textarea, Button, LoadingOverlay } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Facility } from '@/types';
import { formatRelativeTime } from '@/lib/format';

interface ReviewsPanelProps {
    facility: Facility;
    isOpen: boolean;
    onClose: () => void;
}

export default function ReviewsPanel({ facility, isOpen, onClose }: ReviewsPanelProps) {
    const isMobileQuery = useMediaQuery('(max-width: 800px)');
    const isMobile = isMobileQuery ?? true;

    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replyNickname, setReplyNickname] = useState('');
    const [replyPassword, setReplyPassword] = useState('');
    const [replyPhotos, setReplyPhotos] = useState<string[]>([]);
    const replyFileInputRef = useRef<HTMLInputElement>(null);

    const [enlargedImages, setEnlargedImages] = useState<string[]>([]);
    const [enlargedImageIndex, setEnlargedImageIndex] = useState(0);

    const [deleteReviewModal, setDeleteReviewModal] = useState<string | null>(null);
    const [deleteReviewPassword, setDeleteReviewPassword] = useState('');
    const [deleteReviewError, setDeleteReviewError] = useState('');

    const [deleteReplyModal, setDeleteReplyModal] = useState<{ reviewId: string; replyId: string } | null>(null);
    const [deleteReplyPassword, setDeleteReplyPassword] = useState('');
    const [deleteReplyError, setDeleteReplyError] = useState('');

    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) loadReviews();
    }, [isOpen, facility.id]);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/facilities/${facility.id}`, { cache: 'no-store' });
            const data = await res.json();
            setReviews(data.reviews || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleReplyPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (replyPhotos.length + files.length > 3) { alert('이미지는 최대 3장까지 첨부할 수 있습니다.'); return; }
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => setReplyPhotos(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const handleSubmitReply = async (reviewId: string) => {
        if (!replyContent.trim() || !replyNickname.trim() || !replyPassword.trim()) { alert('닉네임, 비밀번호, 내용을 모두 입력해주세요.'); return; }
        try {
            const res = await fetch('/api/reviews/interact', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ facilityId: facility.id, reviewId, action: 'REPLY', content: replyContent, photos: replyPhotos, author: replyNickname, password: replyPassword })
            });
            if (res.ok) {
                const data = await res.json();
                setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, replies: [...(r.replies || []), { id: data.reply?.id || `rep-${Date.now()}`, author: replyNickname, content: replyContent, photos: replyPhotos, createdAt: new Date().toISOString() }] } : r));
                setReplyContent(''); setReplyNickname(''); setReplyPassword(''); setReplyPhotos([]); setReplyingTo(null);
            } else { const errData = await res.json(); alert(errData.error || '등록에 실패했습니다.'); }
        } catch (e) { console.error(e); }
    };

    const handleDeleteReview = async () => {
        if (!deleteReviewModal || !deleteReviewPassword.trim()) { setDeleteReviewError('비밀번호를 입력해주세요.'); return; }
        try {
            const res = await fetch('/api/reviews/interact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ facilityId: facility.id, reviewId: deleteReviewModal, action: 'DELETE_REVIEW', password: deleteReviewPassword }) });
            if (res.ok) { setReviews(prev => prev.filter(r => r.id !== deleteReviewModal)); setDeleteReviewModal(null); setDeleteReviewPassword(''); setDeleteReviewError(''); }
            else { const errData = await res.json(); setDeleteReviewError(errData.error || '삭제에 실패했습니다.'); }
        } catch { setDeleteReviewError('오류가 발생했습니다.'); }
    };

    const handleDeleteReply = async () => {
        if (!deleteReplyModal || !deleteReplyPassword.trim()) { setDeleteReplyError('비밀번호를 입력해주세요.'); return; }
        try {
            const res = await fetch('/api/reviews/interact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ facilityId: facility.id, reviewId: deleteReplyModal.reviewId, replyId: deleteReplyModal.replyId, action: 'DELETE_REPLY', password: deleteReplyPassword }) });
            if (res.ok) { setReviews(prev => prev.map(r => r.id === deleteReplyModal.reviewId ? { ...r, replies: r.replies?.filter((rep: any) => rep.id !== deleteReplyModal.replyId) } : r)); setDeleteReplyModal(null); setDeleteReplyPassword(''); setDeleteReplyError(''); }
            else { const errData = await res.json(); setDeleteReplyError(errData.error || '삭제에 실패했습니다.'); }
        } catch { setDeleteReplyError('오류가 발생했습니다.'); }
    };

    return (
        <>
            {/* ─── Drawer: InquiryPanel과 완전히 동일한 설정 ─── */}
            <Drawer
                opened={isOpen}
                onClose={onClose}
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
                lockScroll={isMobile}
            >
                <Stack gap={0} h="100%">
                    {/* Header */}
                    <Box p="md" style={{ borderBottom: '1px solid #f1f3f5' }}>
                        <Group justify="space-between">
                            <Text fw={700} size="lg">이야기 ({reviews.length})</Text>
                            <ActionIcon variant="subtle" color="dark" onClick={onClose}>
                                <X size={20} />
                            </ActionIcon>
                        </Group>
                        <Text size="xs" c="dimmed" mt={4}>{facility.name}</Text>
                    </Box>

                    {/* 리뷰 목록 */}
                    <ScrollArea style={{ flex: 1 }}>
                        {loading ? (
                            <Box pos="relative" mih={200}><LoadingOverlay visible /></Box>
                        ) : (
                            <Box p="md">
                                {reviews.length > 0 ? (
                                    <Stack gap="lg">
                                        {reviews.map((review: any) => (
                                            <Box key={review.id} pb="lg" style={{ borderBottom: '1px solid #f1f3f5' }}>
                                                <Group gap="xs" mb={4}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#adb5bd' }}>account_circle</span>
                                                    <Text size="sm" fw={600} c="dark.8">{review.author}</Text>
                                                    <Text size="xs" c="dimmed">· {formatRelativeTime(review.createdAt || review.date)}</Text>
                                                    <ActionIcon variant="transparent" color="gray" size="xs" ml="auto"
                                                        onClick={() => { setDeleteReviewModal(review.id); setDeleteReviewPassword(''); setDeleteReviewError(''); }}>
                                                        <X size={14} />
                                                    </ActionIcon>
                                                </Group>
                                                <Text size="md" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#343a40' }} ml={32}>{review.content}</Text>

                                                {review.photos && review.photos.length > 0 && (
                                                    <Group gap="xs" mt="sm" ml={32}>
                                                        {review.photos.map((photo: string, idx: number) => (
                                                            <Box key={idx} style={{ cursor: 'pointer' }} onClick={() => { setEnlargedImages(review.photos); setEnlargedImageIndex(idx); }}>
                                                                <img src={photo} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '8px', border: '1px solid #f1f3f5' }} />
                                                            </Box>
                                                        ))}
                                                    </Group>
                                                )}

                                                <Group gap="lg" mt="sm" ml={32}>
                                                    <Group gap={4} style={{ cursor: 'pointer' }} onClick={() => {
                                                        setReplyingTo(replyingTo === review.id ? null : review.id);
                                                        setReplyContent(''); setReplyPhotos([]); setReplyNickname(''); setReplyPassword('');
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
                                                                    <ActionIcon variant="transparent" color="gray" size="xs" ml="auto"
                                                                        onClick={() => { setDeleteReplyModal({ reviewId: review.id, replyId: reply.id }); setDeleteReplyPassword(''); setDeleteReplyError(''); }}>
                                                                        <X size={12} />
                                                                    </ActionIcon>
                                                                </Group>
                                                                <Text size="sm" c="dark.7" ml={26}>{reply.content}</Text>
                                                                {reply.photos && reply.photos.length > 0 && (
                                                                    <Group gap={6} mt="xs" ml={26}>
                                                                        {reply.photos.map((photo: string, idx: number) => (
                                                                            <Box key={idx} style={{ cursor: 'pointer' }} onClick={() => { setEnlargedImages(reply.photos); setEnlargedImageIndex(idx); }}>
                                                                                <img src={photo} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '8px', border: '1px solid #dee2e6' }} />
                                                                            </Box>
                                                                        ))}
                                                                    </Group>
                                                                )}
                                                            </Box>
                                                        ))}
                                                        {review.replies.length > 3 && (
                                                            <Box ta="center" pt="xs">
                                                                <Button variant="subtle" color="gray" size="xs"
                                                                    onClick={() => setExpandedReplies(prev => { const next = new Set(prev); next.has(review.id) ? next.delete(review.id) : next.add(review.id); return next; })}
                                                                    styles={{ root: { color: '#868e96', fontWeight: 600 } }}>
                                                                    {expandedReplies.has(review.id) ? '댓글 접기' : `댓글 더보기 (${review.replies.length - 3}개)`}
                                                                </Button>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                )}

                                                {/* 답글 입력 */}
                                                {replyingTo === review.id && (
                                                    <Box mt="md" ml={32} p="sm" bg="gray.0" style={{ borderRadius: '8px' }}>
                                                        <Group gap="xs" mb="sm">
                                                            <TextInput placeholder="닉네임" size="xs" value={replyNickname} onChange={(e) => setReplyNickname(e.currentTarget.value)}
                                                                style={{ flex: 1 }} styles={{ input: { fontSize: '13px', borderRadius: '8px', backgroundColor: 'white' } }} />
                                                            <TextInput placeholder="비밀번호" size="xs" type="password" value={replyPassword} onChange={(e) => setReplyPassword(e.currentTarget.value)}
                                                                style={{ flex: 1 }} styles={{ input: { fontSize: '13px', borderRadius: '8px', backgroundColor: 'white' } }} />
                                                        </Group>
                                                        <Textarea placeholder="답글을 입력하세요" size="xs" minRows={2} maxRows={4} autosize
                                                            value={replyContent} onChange={(e) => setReplyContent(e.currentTarget.value)}
                                                            styles={{ input: { fontSize: '13px', borderRadius: '8px', backgroundColor: 'white' } }} />
                                                        {replyPhotos.length > 0 && (
                                                            <Group gap={6} mt="xs">
                                                                {replyPhotos.map((photo, idx) => (
                                                                    <Box key={idx} pos="relative">
                                                                        <img src={photo} alt="" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '8px' }} />
                                                                        <ActionIcon variant="filled" color="dark" size={16} radius="xl" pos="absolute" top={2} right={2}
                                                                            onClick={() => setReplyPhotos(prev => prev.filter((_, i) => i !== idx))}><X size={8} /></ActionIcon>
                                                                    </Box>
                                                                ))}
                                                            </Group>
                                                        )}
                                                        <Group justify="space-between" mt="sm">
                                                            <Group gap={4}>
                                                                <input type="file" accept="image/*" multiple ref={replyFileInputRef} style={{ display: 'none' }} onChange={handleReplyPhotoUpload} />
                                                                <ActionIcon variant="light" color="gray" size="sm" radius="xl" onClick={() => replyFileInputRef.current?.click()}>
                                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#868e96' }}>photo_camera</span>
                                                                </ActionIcon>
                                                                <Text size="xs" c="dimmed">{replyPhotos.length}/3</Text>
                                                            </Group>
                                                            <Button size="xs" variant="filled" color="#302E92" radius="xl" px="lg"
                                                                onClick={() => handleSubmitReply(review.id)}
                                                                disabled={!replyContent.trim() || !replyNickname.trim() || !replyPassword.trim()}>등록</Button>
                                                        </Group>
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
                        )}
                    </ScrollArea>
                </Stack>
            </Drawer>

            {/* 삭제 모달 */}
            {deleteReviewModal && (
                <>
                    <Box pos="fixed" top={0} left={0} w="100%" h="100%" style={{ zIndex: 10020, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setDeleteReviewModal(null)} />
                    <Box pos="fixed" bottom={0} left={0} w="100%" p="lg" pb={40}
                        style={{ zIndex: 10021, backgroundColor: 'white', borderRadius: '16px 16px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' }}>
                        <Box mx="auto" mb="md" w={36} h={4} style={{ borderRadius: 2, backgroundColor: '#dee2e6' }} />
                        <Group justify="space-between" mb="md"><Text fw={600} size="lg">이야기 삭제</Text><ActionIcon variant="subtle" color="gray" onClick={() => setDeleteReviewModal(null)}><X size={20} /></ActionIcon></Group>
                        <Text size="sm" c="dimmed" mb="md">비밀번호를 입력하세요.</Text>
                        <TextInput placeholder="비밀번호" type="password" value={deleteReviewPassword}
                            onChange={(e) => { setDeleteReviewPassword(e.currentTarget.value); setDeleteReviewError(''); }}
                            error={deleteReviewError} onKeyDown={(e) => e.key === 'Enter' && handleDeleteReview()} mb="md" styles={{ input: { borderRadius: 12, height: 44 } }} />
                        <Group grow gap="sm">
                            <Button variant="light" color="gray" size="md" radius="xl" onClick={() => setDeleteReviewModal(null)}>취소</Button>
                            <Button variant="filled" color="dark.6" size="md" radius="xl" onClick={handleDeleteReview}>삭제하기</Button>
                        </Group>
                    </Box>
                </>
            )}
            {deleteReplyModal && (
                <>
                    <Box pos="fixed" top={0} left={0} w="100%" h="100%" style={{ zIndex: 10020, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setDeleteReplyModal(null)} />
                    <Box pos="fixed" bottom={0} left={0} w="100%" p="lg" pb={40}
                        style={{ zIndex: 10021, backgroundColor: 'white', borderRadius: '16px 16px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' }}>
                        <Box mx="auto" mb="md" w={36} h={4} style={{ borderRadius: 2, backgroundColor: '#dee2e6' }} />
                        <Group justify="space-between" mb="md"><Text fw={600} size="lg">댓글 삭제</Text><ActionIcon variant="subtle" color="gray" onClick={() => setDeleteReplyModal(null)}><X size={20} /></ActionIcon></Group>
                        <Text size="sm" c="dimmed" mb="md">비밀번호를 입력하세요.</Text>
                        <TextInput placeholder="비밀번호" type="password" value={deleteReplyPassword}
                            onChange={(e) => { setDeleteReplyPassword(e.currentTarget.value); setDeleteReplyError(''); }}
                            error={deleteReplyError} onKeyDown={(e) => e.key === 'Enter' && handleDeleteReply()} mb="md" styles={{ input: { borderRadius: 12, height: 44 } }} />
                        <Group grow gap="sm">
                            <Button variant="light" color="gray" size="md" radius="xl" onClick={() => setDeleteReplyModal(null)}>취소</Button>
                            <Button variant="filled" color="dark.6" size="md" radius="xl" onClick={handleDeleteReply}>삭제하기</Button>
                        </Group>
                    </Box>
                </>
            )}

            {/* 이미지 뷰어 */}
            {enlargedImages.length > 0 && (
                <Box pos="fixed" top={0} left={0} w="100%" h="100dvh" style={{ zIndex: 10020, backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
                    <Box pos="absolute" top={0} left={0} w="100%" p="md" style={{ zIndex: 10021, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' }}>
                        <Group justify="space-between" align="center">
                            <Text c="white" fw={600} size="md">{enlargedImageIndex + 1} / {enlargedImages.length}</Text>
                            <ActionIcon variant="transparent" c="white" size="lg" onClick={() => { setEnlargedImages([]); setEnlargedImageIndex(0); }}><X size={28} /></ActionIcon>
                        </Group>
                    </Box>
                    <Box style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 16px 16px' }}
                        onClick={() => { setEnlargedImages([]); setEnlargedImageIndex(0); }}>
                        <img src={enlargedImages[enlargedImageIndex]} alt="" onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }} />
                    </Box>
                    {enlargedImages.length > 1 && (
                        <>
                            {enlargedImageIndex > 0 && (
                                <ActionIcon variant="transparent" c="white" size="xl" pos="absolute" top="50%" left={8}
                                    style={{ transform: 'translateY(-50%)', zIndex: 10021 }}
                                    onClick={(e) => { e.stopPropagation(); setEnlargedImageIndex(prev => prev - 1); }}><ChevronLeft size={32} /></ActionIcon>
                            )}
                            {enlargedImageIndex < enlargedImages.length - 1 && (
                                <ActionIcon variant="transparent" c="white" size="xl" pos="absolute" top="50%" right={8}
                                    style={{ transform: 'translateY(-50%)', zIndex: 10021 }}
                                    onClick={(e) => { e.stopPropagation(); setEnlargedImageIndex(prev => prev + 1); }}><ChevronRight size={32} /></ActionIcon>
                            )}
                        </>
                    )}
                </Box>
            )}
        </>
    );
}
