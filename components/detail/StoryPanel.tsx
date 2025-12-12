import { Drawer, Box, Text, Group, Button, Stack, Image, TextInput, ActionIcon, Paper, Modal, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Camera, X, ChevronRight, PenLine, Trash } from 'lucide-react';
import { useState } from 'react';
import { Review, ReviewReply, Facility } from '@/types';

interface StoryPanelProps {
    facility: Facility;
    isOpen: boolean;
    onClose: () => void;
}

export default function StoryPanel({ facility, isOpen, onClose }: StoryPanelProps) {
    const [activeTab, setActiveTab] = useState<'recommend' | 'newest'>('recommend');
    // Local state for reviews (synced with parent ideally, but for now specific to story)
    const [reviews, setReviews] = useState<Review[]>(facility.reviews || []);
    const [replyingTo, setReplyingTo] = useState<{ reviewId: string, replyId?: string } | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const handleDeleteReview = async (reviewId: string) => {
        if (!confirm('리뷰를 삭제하시겠습니까?')) return;
        try {
            await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ facilityId: facility.id, reviewId, action: 'DELETE_REVIEW' })
            });
            setReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteReply = async (reviewId: string, replyId: string) => {
        if (!confirm('답글을 삭제하시겠습니까?')) return;
        try {
            await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ facilityId: facility.id, reviewId, replyId, action: 'DELETE_REPLY' })
            });
            setReviews(prev => prev.map(r => {
                if (r.id === reviewId) {
                    return { ...r, replies: r.replies?.filter(rep => rep.id !== replyId) };
                }
                return r;
            }));
        } catch (e) {
            console.error(e);
        }
    };

    const handleReplySubmit = async (reviewId: string) => {
        if (!replyContent.trim()) return;
        // Logic to submit reply
        // If replying to a reply (Level 2), we might just tag the user or visually nest?
        // For now, simplicity: just add to the reply list.
        // Real "Reply to reply" needs backend update which we skipped for complexity, 
        // so we will just append to the list.
        try {
            const res = await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facilityId: facility.id,
                    reviewId,
                    action: 'REPLY',
                    content: replyContent,
                    author: '관리자'
                })
            });
            if (res.ok) {
                const newReply = {
                    id: `rep-${Date.now()}`,
                    author: '관리자',
                    content: replyContent,
                    date: new Date().toISOString().split('T')[0]
                };
                setReviews(prev => prev.map(r => {
                    if (r.id === reviewId) {
                        return { ...r, replies: [...(r.replies || []), newReply] };
                    }
                    return r;
                }));
                setReplyingTo(null);
                setReplyContent('');
            }
        } catch (e) { console.error(e); }
    };

    return (
        <Drawer
            opened={isOpen}
            onClose={onClose}
            position="right"
            size="100%" // Full screen on mobile, maybe 400px on Desktop? 
            // Better: use styling to behave like the screenshot
            styles={{
                root: { zIndex: 2100 },
                content: { width: '100%', maxWidth: '480px' }, // Mobile-like width
                header: { display: 'none' }, // Custom header
                body: { padding: 0, backgroundColor: '#fff', height: '100%' }
            }}
            withCloseButton={false}
        >
            <Stack gap={0} h="100%">
                {/* Header */}
                <Box p="md" style={{ borderBottom: '1px solid #f1f3f5' }}>
                    <Group justify="space-between">
                        <Group gap="sm" style={{ cursor: 'pointer' }} onClick={onClose}>
                            <ChevronRight style={{ transform: 'rotate(180deg)' }} />
                            <Text fw={700} size="lg">이야기 ({reviews.length})</Text>
                        </Group>
                        <Group>
                            {/* Icons like Bell/Search if needed */}
                        </Group>
                    </Group>
                </Box>

                <ScrollArea style={{ flex: 1 }} bg="gray.0">
                    <Stack gap="md" p="md">
                        {/* Filter Tabs */}
                        <Group>
                            <Button
                                variant={activeTab === 'recommend' ? 'filled' : 'subtle'}
                                color="dark"
                                radius="xl"
                                size="xs"
                                onClick={() => setActiveTab('recommend')}
                            >
                                추천순
                            </Button>
                            <Button
                                variant={activeTab === 'newest' ? 'filled' : 'subtle'}
                                color="gray"
                                c="dark"
                                radius="xl"
                                size="xs"
                                onClick={() => setActiveTab('newest')}
                            >
                                최신순
                            </Button>
                        </Group>

                        {/* Review List */}
                        {reviews.map(review => (
                            <Paper key={review.id} p="md" radius="md" bg="white" withBorder style={{ borderColor: '#f1f3f5' }}>
                                {/* Review Content similar to main detail but with Delete option */}
                                <Group justify="space-between" mb="xs">
                                    <Group gap="xs">
                                        <Text fw={700}>{review.author}</Text>
                                        <Text size="xs" c="dimmed">{review.date}</Text>
                                    </Group>
                                    <Group gap="xs">
                                        {/* Delete Button (Mock logic: always show or check author) */}
                                        <ActionIcon variant="subtle" color="gray" onClick={() => handleDeleteReview(review.id)}>
                                            <Trash size={14} />
                                        </ActionIcon>
                                    </Group>
                                </Group>

                                <Text size="sm" mb="sm">{review.content}</Text>

                                {/* Photos */}
                                {review.photos && (
                                    <Group gap="xs" mb="sm">
                                        {review.photos.map((p, i) => <Image key={i} src={p} w={80} h={80} radius="md" />)}
                                    </Group>
                                )}

                                <Group gap="lg" mb="sm">
                                    <Group gap={4}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#fa5252' }}>favorite</span>
                                        <Text size="xs">좋아요 {review.likes}</Text>
                                    </Group>
                                    <Group gap={4} style={{ cursor: 'pointer' }} onClick={() => setReplyingTo({ reviewId: review.id })}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#adb5bd' }}>chat_bubble</span>
                                        <Text size="xs" c="dimmed">답글달기</Text>
                                    </Group>
                                </Group>

                                {/* Replies */}
                                {review.replies?.map(reply => (
                                    <Box key={reply.id} bg="gray.1" p="sm" radius="md" mb="xs">
                                        <Group justify="space-between" mb={2}>
                                            <Group gap="xs">
                                                <Text size="xs" fw={700}>{reply.author}</Text>
                                                <Text size="xs" c="dimmed">{reply.date}</Text>
                                            </Group>
                                            <ActionIcon variant="subtle" color="gray" size="xs" onClick={() => handleDeleteReply(review.id, reply.id)}>
                                                <X size={12} />
                                            </ActionIcon>
                                        </Group>
                                        <Text size="sm">{reply.content}</Text>
                                        {/* Re-reply Button (Level 2) - Visual only for now */}
                                        <Text size="xs" c="blue" mt={4} style={{ cursor: 'pointer' }} onClick={() => setReplyingTo({ reviewId: review.id, replyId: reply.id })}>답글달기</Text>
                                    </Box>
                                ))}

                                {/* Reply Input */}
                                {replyingTo?.reviewId === review.id && (
                                    <Box mt="sm">
                                        <TextInput
                                            placeholder={replyingTo.replyId ? "대댓글 입력..." : "답글 입력..."}
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.currentTarget.value)}
                                            rightSection={
                                                <Button size="xs" onClick={() => handleReplySubmit(review.id)}>등록</Button>
                                            }
                                        />
                                    </Box>
                                )}
                            </Paper>
                        ))}
                    </Stack>
                </ScrollArea>

                {/* Floating Write Button */}
                <Box pos="absolute" bottom={20} right={20}>
                    <Button variant="filled" color="brand" radius="xl" size="md" leftSection={<PenLine size={18} />}>
                        글쓰기
                    </Button>
                </Box>
            </Stack>
        </Drawer>
    );
}
