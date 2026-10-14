'use client';

import { Modal, Drawer, Box, Text, Group, Stack, ActionIcon, ScrollArea, TextInput, Textarea, Button, LoadingOverlay } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { X, ChevronLeft, ChevronRight, User, MessageSquare, Camera, Star } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Facility } from '@/types';
import { formatRelativeTime } from '@/lib/format';
import { compressImageFile } from '@/lib/clientImageCompress';

interface ReviewsPanelProps {
    facility: Facility;
    isOpen: boolean;
    onClose: () => void;
    onOpenWriteReview?: () => void;
}

export default function ReviewsPanel({ facility, isOpen, onClose, onOpenWriteReview }: ReviewsPanelProps) {
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

    const handleReplyPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (replyPhotos.length + files.length > 3) { alert('이미지는 최대 3장까지 첨부할 수 있습니다.'); return; }
        const compressedList = await Promise.all(
            files.map(file => compressImageFile(file, 1200, 0.7))
        );
        const validPhotos = compressedList.filter(Boolean);
        setReplyPhotos(prev => [...prev, ...validPhotos]);
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

    const unifiedSmallInputStyles = {
        input: {
            height: 40,
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            fontSize: '13px',
            color: '#191F28',
            '&::placeholder': { color: '#94A3B8' }
        }
    };

    return (
        <>
            <Drawer
                opened={isOpen}
                onClose={onClose}
                position={isMobile ? 'bottom' : 'left'}
                size={isMobile ? '92%' : 400}
                withCloseButton={false}
                zIndex={10010}
                padding={0}
                lockScroll={!!isMobile}
                transitionProps={{ duration: isMobile ? 150 : 0 }}
                styles={{
                    overlay: {
                        backgroundColor: isMobile ? 'rgba(0,0,0,0.5)' : 'transparent',
                        pointerEvents: isMobile ? 'auto' : 'none',
                    },
                    content: isMobile ? {
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    } : {
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
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        minHeight: 0,
                        backgroundColor: '#FFFFFF',
                    }
                }}
            >
                {isMobile && (
                    <Box pt={10} pb={2} style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
                        <Box style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' }} />
                    </Box>
                )}

                <Stack gap={0} style={{ flex: 1, minHeight: 0 }}>
                    {/* Header */}
                    <Box px={20} py={16} style={{ borderBottom: '1px solid #F1F5F9', flexShrink: 0, backgroundColor: '#FFFFFF' }}>
                        <Group justify="space-between" align="center">
                            <Box>
                                <Text fw={800} style={{ fontSize: 18, color: '#191F28', letterSpacing: '-0.3px' }}>방문 이야기 ({reviews.length})</Text>
                                <Text size="xs" fw={600} style={{ color: '#2563EB', marginTop: 2 }}>{facility.name}</Text>
                            </Box>
                            <ActionIcon variant="subtle" color="gray" radius="xl" size="lg" onClick={onClose}>
                                <X size={20} color="#64748B" />
                            </ActionIcon>
                        </Group>
                    </Box>

                    {/* 리뷰 목록 */}
                    <ScrollArea style={{ flex: 1 }}>
                        {loading ? (
                            <Box pos="relative" mih={240}><LoadingOverlay visible /></Box>
                        ) : (
                            <Box p={20}>
                                {reviews.length > 0 ? (
                                    <Stack gap={16}>
                                        {reviews.map((review: any) => (
                                            <Box key={review.id} pb={16} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                <Group gap={8} mb={6}>
                                                    <Box
                                                        style={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: 14,
                                                            backgroundColor: '#EFF6FF',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <User size={15} color="#2563EB" />
                                                    </Box>
                                                    <Text size="sm" fw={700} style={{ color: '#191F28' }}>{review.author}</Text>
                                                    {review.rating > 0 && (
                                                        <Group gap={2}>
                                                            <Star size={13} color="#F59E0B" fill="#F59E0B" />
                                                            <Text size="xs" fw={700} style={{ color: '#D97706' }}>{review.rating}.0</Text>
                                                        </Group>
                                                    )}
                                                    <Text size="xs" style={{ color: '#94A3B8' }}>· {formatRelativeTime(review.createdAt || review.date)}</Text>
                                                    <ActionIcon variant="subtle" color="gray" size="xs" ml="auto"
                                                        onClick={() => { setDeleteReviewModal(review.id); setDeleteReviewPassword(''); setDeleteReviewError(''); }}>
                                                        <X size={14} />
                                                    </ActionIcon>
                                                </Group>
                                                <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, color: '#334155' }} ml={36}>
                                                    {typeof review.content === 'string' ? review.content.replace(/\n?\[bugo:\d+\]/g, '').trim() : review.content}
                                                </Text>

                                                {review.photos && review.photos.length > 0 && (
                                                    <Box
                                                        mt="sm"
                                                        ml={36}
                                                        style={{
                                                            display: 'flex',
                                                            gap: '8px',
                                                            overflowX: 'auto',
                                                            overflowY: 'hidden',
                                                            scrollSnapType: 'x mandatory',
                                                            WebkitOverflowScrolling: 'touch',
                                                            scrollbarWidth: 'none',
                                                            paddingBottom: '4px',
                                                        }}
                                                    >
                                                        {review.photos.map((photo: string, idx: number) => (
                                                            <Box
                                                                key={idx}
                                                                style={{
                                                                    flexShrink: 0,
                                                                    scrollSnapAlign: 'start',
                                                                    cursor: 'pointer',
                                                                }}
                                                                onClick={() => { setEnlargedImages(review.photos); setEnlargedImageIndex(idx); }}
                                                            >
                                                                <img src={photo} alt="리뷰 사진" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                )}

                                                <Group gap="lg" mt="sm" ml={36}>
                                                    <Group gap={5} style={{ cursor: 'pointer' }} onClick={() => {
                                                        setReplyingTo(replyingTo === review.id ? null : review.id);
                                                        setReplyContent(''); setReplyPhotos([]); setReplyNickname(''); setReplyPassword('');
                                                    }}>
                                                        <MessageSquare size={15} color="#64748B" />
                                                        <Text size="xs" fw={600} style={{ color: '#64748B' }}>답글 {review.replies?.length || 0}</Text>
                                                    </Group>
                                                </Group>

                                                {/* 답글 목록 */}
                                                {review.replies && review.replies.length > 0 && (
                                                    <Box mt="sm" ml={36} p="sm" style={{ borderRadius: 12, backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                                                        {(expandedReplies.has(review.id) ? review.replies : review.replies.slice(0, 3)).map((reply: any) => (
                                                            <Box key={reply.id} mb="xs" pb="xs" style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                                <Group gap="xs" mb={4}>
                                                                    <User size={15} color="#64748B" />
                                                                    <Text size="xs" fw={700} style={{ color: '#191F28' }}>{reply.author}</Text>
                                                                    <Text size="xs" style={{ color: '#94A3B8' }}>· {formatRelativeTime(reply.createdAt || reply.date)}</Text>
                                                                    <ActionIcon variant="transparent" color="gray" size="xs" ml="auto"
                                                                        onClick={() => { setDeleteReplyModal({ reviewId: review.id, replyId: reply.id }); setDeleteReplyPassword(''); setDeleteReplyError(''); }}>
                                                                        <X size={12} />
                                                                    </ActionIcon>
                                                                </Group>
                                                                <Text size="xs" style={{ color: '#334155', lineHeight: 1.5 }} ml={22}>{reply.content}</Text>
                                                                {reply.photos && reply.photos.length > 0 && (
                                                                    <Group gap={6} mt="xs" ml={22}>
                                                                        {reply.photos.map((photo: string, idx: number) => (
                                                                            <Box key={idx} style={{ cursor: 'pointer' }} onClick={() => { setEnlargedImages(reply.photos); setEnlargedImageIndex(idx); }}>
                                                                                <img src={photo} alt="답글 사진" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                                                                            </Box>
                                                                        ))}
                                                                    </Group>
                                                                )}
                                                            </Box>
                                                        ))}
                                                        {review.replies.length > 3 && (
                                                            <Box ta="center" pt={4}>
                                                                <Button variant="subtle" color="gray" size="xs"
                                                                    onClick={() => setExpandedReplies(prev => { const next = new Set(prev); next.has(review.id) ? next.delete(review.id) : next.add(review.id); return next; })}
                                                                    styles={{ root: { color: '#64748B', fontWeight: 600 } }}>
                                                                    {expandedReplies.has(review.id) ? '댓글 접기' : `댓글 더보기 (${review.replies.length - 3}개)`}
                                                                </Button>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                )}

                                                {/* 답글 입력 */}
                                                {replyingTo === review.id && (
                                                    <Box mt="sm" ml={36} p="sm" style={{ borderRadius: 12, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                                        <Group gap={8} mb={8}>
                                                            <TextInput placeholder="닉네임" size="xs" value={replyNickname} onChange={(e) => setReplyNickname(e.currentTarget.value)}
                                                                style={{ flex: 1 }} styles={unifiedSmallInputStyles} />
                                                            <TextInput placeholder="비밀번호" size="xs" type="password" value={replyPassword} onChange={(e) => setReplyPassword(e.currentTarget.value)}
                                                                style={{ flex: 1 }} styles={unifiedSmallInputStyles} />
                                                        </Group>
                                                        <Textarea placeholder="답글을 입력하세요" size="xs" minRows={2} maxRows={4} autosize
                                                            value={replyContent} onChange={(e) => setReplyContent(e.currentTarget.value)}
                                                            styles={{
                                                                input: {
                                                                    fontSize: '13px',
                                                                    borderRadius: 10,
                                                                    backgroundColor: '#FFFFFF',
                                                                    border: '1px solid #CBD5E1',
                                                                    padding: '10px 12px',
                                                                    color: '#191F28',
                                                                }
                                                            }} />
                                                        {replyPhotos.length > 0 && (
                                                            <Group gap={6} mt="xs">
                                                                {replyPhotos.map((photo, idx) => (
                                                                    <Box key={idx} pos="relative">
                                                                        <img src={photo} alt="리뷰 사진" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '8px' }} />
                                                                        <ActionIcon variant="filled" color="dark" size={16} radius="xl" pos="absolute" top={2} right={2}
                                                                            onClick={() => setReplyPhotos(prev => prev.filter((_, i) => i !== idx))}><X size={8} /></ActionIcon>
                                                                    </Box>
                                                                ))}
                                                            </Group>
                                                        )}
                                                        <Group justify="space-between" mt="sm">
                                                            <Group gap={6}>
                                                                <input type="file" accept="image/*" multiple ref={replyFileInputRef} style={{ display: 'none' }} onChange={handleReplyPhotoUpload} />
                                                                <ActionIcon variant="light" color="gray" size="md" radius="md" onClick={() => replyFileInputRef.current?.click()}>
                                                                    <Camera size={16} color="#64748B" />
                                                                </ActionIcon>
                                                                <Text size="xs" c="dimmed">{replyPhotos.length}/3</Text>
                                                            </Group>
                                                            <Button size="xs" variant="filled" radius={8} px="md"
                                                                onClick={() => handleSubmitReply(review.id)}
                                                                disabled={!replyContent.trim() || !replyNickname.trim() || !replyPassword.trim()}
                                                                style={{
                                                                    backgroundColor: (!replyContent.trim() || !replyNickname.trim() || !replyPassword.trim()) ? '#E2E8F0' : '#2563EB',
                                                                    color: (!replyContent.trim() || !replyNickname.trim() || !replyPassword.trim()) ? '#94A3B8' : '#FFFFFF',
                                                                    fontWeight: 700,
                                                                }}>
                                                                답글 등록
                                                            </Button>
                                                        </Group>
                                                    </Box>
                                                )}
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Box ta="center" py={48}>
                                        <Text size="sm" fw={600} style={{ color: '#64748B' }}>아직 등록된 방문 이야기가 없습니다.</Text>
                                        <Text size="xs" style={{ color: '#94A3B8', marginTop: 4 }}>첫 번째 방문 이야기를 남겨주세요.</Text>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </ScrollArea>

                    {onOpenWriteReview && (
                        <Box
                            px={20}
                            py={14}
                            style={{
                                borderTop: '1px solid #F1F5F9',
                                backgroundColor: '#FFFFFF',
                                paddingBottom: isMobile ? 'calc(14px + env(safe-area-inset-bottom, 0px))' : 14,
                                flexShrink: 0,
                            }}
                        >
                            <Button
                                fullWidth
                                size="lg"
                                radius={12}
                                onClick={onOpenWriteReview}
                                style={{ height: 50, backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 700, fontSize: 15 }}
                            >
                                방문 이야기 작성하기
                            </Button>
                        </Box>
                    )}
                </Stack>
            </Drawer>

            {/* 리뷰 삭제 모달 */}
            <Modal
                opened={!!deleteReviewModal}
                onClose={() => setDeleteReviewModal(null)}
                title={<Text fw={800} size="md" style={{ color: '#191F28' }}>이야기 삭제</Text>}
                centered
                size={360}
                radius={16}
                zIndex={10025}
            >
                <Stack gap={12}>
                    <Text size="xs" style={{ color: '#64748B' }}>작성 시 설정한 비밀번호를 입력해 주세요.</Text>
                    <TextInput
                        placeholder="비밀번호 입력"
                        type="password"
                        value={deleteReviewPassword}
                        onChange={(e) => { setDeleteReviewPassword(e.currentTarget.value); setDeleteReviewError(''); }}
                        error={deleteReviewError}
                        onKeyDown={(e) => e.key === 'Enter' && handleDeleteReview()}
                        styles={{
                            input: {
                                height: 44,
                                borderRadius: 10,
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                fontSize: '14px',
                            }
                        }}
                    />
                    <Group grow gap={8} mt={4}>
                        <Button variant="light" color="gray" radius={10} onClick={() => setDeleteReviewModal(null)} style={{ height: 44, fontWeight: 600 }}>취소</Button>
                        <Button variant="filled" color="red" radius={10} onClick={handleDeleteReview} style={{ height: 44, fontWeight: 700 }}>삭제하기</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* 답글 삭제 모달 */}
            <Modal
                opened={!!deleteReplyModal}
                onClose={() => setDeleteReplyModal(null)}
                title={<Text fw={800} size="md" style={{ color: '#191F28' }}>댓글 삭제</Text>}
                centered
                size={360}
                radius={16}
                zIndex={10025}
            >
                <Stack gap={12}>
                    <Text size="xs" style={{ color: '#64748B' }}>작성 시 설정한 비밀번호를 입력해 주세요.</Text>
                    <TextInput
                        placeholder="비밀번호 입력"
                        type="password"
                        value={deleteReplyPassword}
                        onChange={(e) => { setDeleteReplyPassword(e.currentTarget.value); setDeleteReplyError(''); }}
                        error={deleteReplyError}
                        onKeyDown={(e) => e.key === 'Enter' && handleDeleteReply()}
                        styles={{
                            input: {
                                height: 44,
                                borderRadius: 10,
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                fontSize: '14px',
                            }
                        }}
                    />
                    <Group grow gap={8} mt={4}>
                        <Button variant="light" color="gray" radius={10} onClick={() => setDeleteReplyModal(null)} style={{ height: 44, fontWeight: 600 }}>취소</Button>
                        <Button variant="filled" color="red" radius={10} onClick={handleDeleteReply} style={{ height: 44, fontWeight: 700 }}>삭제하기</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* 이미지 뷰어 */}
            {enlargedImages.length > 0 && (
                <Box pos="fixed" top={0} left={0} w="100%" h="100dvh" style={{ zIndex: 10030, backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
                    <Box pos="absolute" top={0} left={0} w="100%" p="md" style={{ zIndex: 10031, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' }}>
                        <Group justify="space-between" align="center">
                            <Text c="white" fw={600} size="md">{enlargedImageIndex + 1} / {enlargedImages.length}</Text>
                            <ActionIcon variant="transparent" c="white" size="lg" onClick={() => { setEnlargedImages([]); setEnlargedImageIndex(0); }}><X size={28} /></ActionIcon>
                        </Group>
                    </Box>
                    <Box style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 16px 16px' }}
                        onClick={() => { setEnlargedImages([]); setEnlargedImageIndex(0); }}>
                        <img src={enlargedImages[enlargedImageIndex]} alt="확대 이미지" onError={(e) => { e.currentTarget.style.display = 'none'; }} onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }} />
                    </Box>
                    {enlargedImages.length > 1 && (
                        <>
                            {enlargedImageIndex > 0 && (
                                <ActionIcon variant="transparent" c="white" size="xl" pos="absolute" top="50%" left={8}
                                    style={{ transform: 'translateY(-50%)', zIndex: 10031 }}
                                    onClick={(e) => { e.stopPropagation(); setEnlargedImageIndex(prev => prev - 1); }}><ChevronLeft size={32} /></ActionIcon>
                            )}
                            {enlargedImageIndex < enlargedImages.length - 1 && (
                                <ActionIcon variant="transparent" c="white" size="xl" pos="absolute" top="50%" right={8}
                                    style={{ transform: 'translateY(-50%)', zIndex: 10031 }}
                                    onClick={(e) => { e.stopPropagation(); setEnlargedImageIndex(prev => prev + 1); }}><ChevronRight size={32} /></ActionIcon>
                            )}
                        </>
                    )}
                </Box>
            )}
        </>
    );
}
