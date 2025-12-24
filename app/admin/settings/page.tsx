'use client';

import { Box, Text, Group, Stack, TextInput, Textarea, Button, ActionIcon, Modal, Table, Badge, Tabs, Switch, Loader } from '@mantine/core';
import { ArrowLeft, Plus, Trash2, Edit, MessageSquare, FileText, HelpCircle, Save, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import BottomNav from '@/components/common/BottomNav';

interface FAQ {
    id: number;
    question: string;
    answer: string;
    category: string;
    is_active: boolean;
    sort_order: number;
}

interface Policy {
    type: string;
    title: string;
    content: string;
    version: string;
}

interface Inquiry {
    id: string;
    title: string;
    content: string;
    contactInfo?: string;
    contact?: string;
    createdAt: string;
    replies?: any[];
    facilityName?: string;
}

interface ContactInquiry {
    id: number;
    inquiry_type: string;
    title: string;
    content: string;
    contact: string;
    status: string;
    admin_reply?: string;
    created_at: string;
}

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState<string | null>('faq');
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [contactInquiries, setContactInquiries] = useState<ContactInquiry[]>([]);
    const [termsPolicy, setTermsPolicy] = useState<Policy | null>(null);
    const [privacyPolicy, setPrivacyPolicy] = useState<Policy | null>(null);
    const [loading, setLoading] = useState(true);

    // FAQ 모달
    const [faqModalOpen, setFaqModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: '일반' });

    // 약관 편집
    const [editingTerms, setEditingTerms] = useState(false);
    const [termsContent, setTermsContent] = useState('');
    const [editingPrivacy, setEditingPrivacy] = useState(false);
    const [privacyContent, setPrivacyContent] = useState('');

    // 답변 모달
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [replyContent, setReplyContent] = useState('');

    // 1:1 문의 답변 모달
    const [contactReplyModalOpen, setContactReplyModalOpen] = useState(false);
    const [selectedContactInquiry, setSelectedContactInquiry] = useState<ContactInquiry | null>(null);
    const [contactReplyContent, setContactReplyContent] = useState('');

    // 데이터 로드
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // FAQ 로드
            const faqRes = await fetch('/api/admin/faqs');
            if (faqRes.ok) {
                const faqData = await faqRes.json();
                setFaqs(Array.isArray(faqData) ? faqData : []);
            }

            // 문의 로드
            const inquiryRes = await fetch('/api/admin/inquiries');
            if (inquiryRes.ok) {
                const inquiryData = await inquiryRes.json();
                setInquiries(inquiryData.inquiries || []);
            }

            // 약관 로드
            const termsRes = await fetch('/api/admin/policies/terms');
            if (termsRes.ok) {
                const data = await termsRes.json();
                setTermsPolicy(data);
                setTermsContent(data?.content || '');
            }

            const privacyRes = await fetch('/api/admin/policies/privacy');
            if (privacyRes.ok) {
                const data = await privacyRes.json();
                setPrivacyPolicy(data);
                setPrivacyContent(data?.content || '');
            }

            // 1:1 문의 로드
            const contactRes = await fetch('/api/contact');
            if (contactRes.ok) {
                const contactData = await contactRes.json();
                setContactInquiries(Array.isArray(contactData) ? contactData : []);
            }
        } catch (error) {
            console.error('데이터 로드 오류:', error);
        }
        setLoading(false);
    };

    // FAQ 저장
    const saveFaq = async () => {
        try {
            if (editingFaq) {
                await fetch(`/api/admin/faqs/${editingFaq.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...faqForm, is_active: true }),
                });
            } else {
                await fetch('/api/admin/faqs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(faqForm),
                });
            }
            setFaqModalOpen(false);
            setEditingFaq(null);
            setFaqForm({ question: '', answer: '', category: '일반' });
            loadData();
        } catch (error) {
            alert('저장 실패');
        }
    };

    // FAQ 삭제
    const deleteFaq = async (id: number) => {
        if (!confirm('삭제하시겠습니까?')) return;
        try {
            await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
            loadData();
        } catch (error) {
            alert('삭제 실패');
        }
    };

    // 약관 저장
    const savePolicy = async (type: 'terms' | 'privacy') => {
        try {
            const content = type === 'terms' ? termsContent : privacyContent;
            const title = type === 'terms' ? '이용약관' : '개인정보 처리방침';

            await fetch(`/api/admin/policies/${type}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, version: '1.0' }),
            });

            if (type === 'terms') setEditingTerms(false);
            else setEditingPrivacy(false);

            loadData();
            alert('저장되었습니다');
        } catch (error) {
            alert('저장 실패');
        }
    };

    // 답변 등록
    const submitReply = async () => {
        if (!selectedInquiry || !replyContent.trim()) return;
        try {
            await fetch('/api/admin/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inquiryId: selectedInquiry.id, content: replyContent }),
            });
            setReplyModalOpen(false);
            setSelectedInquiry(null);
            setReplyContent('');
            loadData();
        } catch (error) {
            alert('답변 등록 실패');
        }
    };

    if (loading) {
        return (
            <Box style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader color="violet" />
            </Box>
        );
    }

    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#f8f9fa', paddingBottom: 100 }}>
            {/* 헤더 */}
            <Box px="md" py="md" bg="white" style={{ borderBottom: '1px solid #e9ecef', position: 'sticky', top: 0, zIndex: 100 }}>
                <Group justify="space-between">
                    <Group gap="sm">
                        <Link href="/admin"><ArrowLeft size={20} color="#495057" /></Link>
                        <Text size="lg" fw={700}>사이트 설정</Text>
                    </Group>
                </Group>
            </Box>

            {/* 탭 */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List grow px="md" bg="white">
                    <Tabs.Tab value="faq" leftSection={<HelpCircle size={16} />}>FAQ</Tabs.Tab>
                    <Tabs.Tab value="terms" leftSection={<FileText size={16} />}>약관</Tabs.Tab>
                    <Tabs.Tab value="contact" leftSection={<Mail size={16} />}>
                        1:1 문의 <Badge size="xs" color="blue" ml={4}>{contactInquiries.length}</Badge>
                    </Tabs.Tab>
                </Tabs.List>

                {/* FAQ 탭 */}
                <Tabs.Panel value="faq" p="md">
                    <Group justify="space-between" mb="md">
                        <Text size="sm" c="dimmed">총 {faqs.length}개</Text>
                        <Button size="xs" leftSection={<Plus size={14} />} color="violet" onClick={() => {
                            setEditingFaq(null);
                            setFaqForm({ question: '', answer: '', category: '일반' });
                            setFaqModalOpen(true);
                        }}>
                            추가
                        </Button>
                    </Group>

                    <Stack gap="sm">
                        {faqs.map((faq) => (
                            <Box key={faq.id} bg="white" p="md" style={{ borderRadius: 12 }}>
                                <Group justify="space-between" mb="xs">
                                    <Badge size="sm" color="gray">{faq.category}</Badge>
                                    <Group gap={4}>
                                        <ActionIcon size="sm" variant="subtle" onClick={() => {
                                            setEditingFaq(faq);
                                            setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category });
                                            setFaqModalOpen(true);
                                        }}>
                                            <Edit size={14} />
                                        </ActionIcon>
                                        <ActionIcon size="sm" variant="subtle" color="red" onClick={() => deleteFaq(faq.id)}>
                                            <Trash2 size={14} />
                                        </ActionIcon>
                                    </Group>
                                </Group>
                                <Text size="sm" fw={600} mb={4}>{faq.question}</Text>
                                <Text size="xs" c="dimmed" lineClamp={2}>{faq.answer}</Text>
                            </Box>
                        ))}
                        {faqs.length === 0 && (
                            <Text size="sm" c="dimmed" ta="center" py="xl">FAQ가 없습니다</Text>
                        )}
                    </Stack>
                </Tabs.Panel>

                {/* 약관 탭 */}
                <Tabs.Panel value="terms" p="md">
                    <Stack gap="md">
                        {/* 이용약관 */}
                        <Box bg="white" p="md" style={{ borderRadius: 12 }}>
                            <Group justify="space-between" mb="md">
                                <Text fw={600}>이용약관</Text>
                                {editingTerms ? (
                                    <Group gap={4}>
                                        <Button size="xs" variant="subtle" onClick={() => setEditingTerms(false)}>취소</Button>
                                        <Button size="xs" color="violet" leftSection={<Save size={14} />} onClick={() => savePolicy('terms')}>저장</Button>
                                    </Group>
                                ) : (
                                    <Button size="xs" variant="subtle" leftSection={<Edit size={14} />} onClick={() => setEditingTerms(true)}>수정</Button>
                                )}
                            </Group>
                            {editingTerms ? (
                                <Textarea value={termsContent} onChange={(e) => setTermsContent(e.target.value)} minRows={10} />
                            ) : (
                                <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }} lineClamp={5}>
                                    {termsPolicy?.content || '이용약관이 없습니다.'}
                                </Text>
                            )}
                        </Box>

                        {/* 개인정보처리방침 */}
                        <Box bg="white" p="md" style={{ borderRadius: 12 }}>
                            <Group justify="space-between" mb="md">
                                <Text fw={600}>개인정보 처리방침</Text>
                                {editingPrivacy ? (
                                    <Group gap={4}>
                                        <Button size="xs" variant="subtle" onClick={() => setEditingPrivacy(false)}>취소</Button>
                                        <Button size="xs" color="violet" leftSection={<Save size={14} />} onClick={() => savePolicy('privacy')}>저장</Button>
                                    </Group>
                                ) : (
                                    <Button size="xs" variant="subtle" leftSection={<Edit size={14} />} onClick={() => setEditingPrivacy(true)}>수정</Button>
                                )}
                            </Group>
                            {editingPrivacy ? (
                                <Textarea value={privacyContent} onChange={(e) => setPrivacyContent(e.target.value)} minRows={10} />
                            ) : (
                                <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }} lineClamp={5}>
                                    {privacyPolicy?.content || '개인정보 처리방침이 없습니다.'}
                                </Text>
                            )}
                        </Box>
                    </Stack>
                </Tabs.Panel>

                {/* 1:1 문의 탭 */}
                <Tabs.Panel value="contact" p="md">
                    <Stack gap="sm">
                        {contactInquiries.map((inq) => (
                            <Box key={inq.id} bg="white" p="md" style={{ borderRadius: 12 }}>
                                <Group justify="space-between" mb="xs">
                                    <Group gap="xs">
                                        <Badge size="sm" color="gray">{inq.inquiry_type}</Badge>
                                        <Badge size="sm" color={inq.status === 'answered' ? 'green' : 'orange'}>
                                            {inq.status === 'answered' ? '답변완료' : '대기중'}
                                        </Badge>
                                    </Group>
                                    <Text size="xs" c="dimmed">{new Date(inq.created_at).toLocaleDateString()}</Text>
                                </Group>
                                <Text size="sm" fw={600} mb={4}>{inq.title}</Text>
                                <Text size="xs" c="dimmed" mb="xs" lineClamp={2}>{inq.content}</Text>
                                <Group justify="space-between">
                                    <Text size="xs" c="dimmed">연락처: {inq.contact}</Text>
                                    <Button size="xs" variant="light" color="blue" onClick={() => {
                                        setSelectedContactInquiry(inq);
                                        setContactReplyContent(inq.admin_reply || '');
                                        setContactReplyModalOpen(true);
                                    }}>
                                        {inq.admin_reply ? '답변 보기' : '답변하기'}
                                    </Button>
                                </Group>
                            </Box>
                        ))}
                        {contactInquiries.length === 0 && (
                            <Text size="sm" c="dimmed" ta="center" py="xl">1:1 문의가 없습니다</Text>
                        )}
                    </Stack>
                </Tabs.Panel>
            </Tabs>

            {/* FAQ 모달 */}
            <Modal opened={faqModalOpen} onClose={() => setFaqModalOpen(false)} title={editingFaq ? 'FAQ 수정' : 'FAQ 추가'} centered>
                <Stack gap="md">
                    <TextInput label="질문" value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} />
                    <Textarea label="답변" value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} minRows={4} />
                    <TextInput label="카테고리" value={faqForm.category} onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })} />
                    <Button color="violet" onClick={saveFaq}>저장</Button>
                </Stack>
            </Modal>

            {/* 답변 모달 */}
            <Modal opened={replyModalOpen} onClose={() => setReplyModalOpen(false)} title="문의 상세" centered size="lg">
                {selectedInquiry && (
                    <Stack gap="md">
                        <Box>
                            <Text size="sm" fw={600}>{selectedInquiry.title}</Text>
                            <Text size="xs" c="dimmed" mt="xs">{selectedInquiry.content}</Text>
                        </Box>

                        {selectedInquiry.replies?.map((reply: any, idx: number) => (
                            <Box key={idx} bg="violet.0" p="sm" style={{ borderRadius: 8 }}>
                                <Text size="xs" c="dimmed">{reply.author} · {new Date(reply.createdAt).toLocaleDateString()}</Text>
                                <Text size="sm" mt={4}>{reply.content}</Text>
                            </Box>
                        ))}

                        <Textarea label="답변 작성" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} minRows={3} />
                        <Button color="violet" onClick={submitReply}>답변 등록</Button>
                    </Stack>
                )}
            </Modal>

            {/* 1:1 문의 답변 모달 */}
            <Modal opened={contactReplyModalOpen} onClose={() => setContactReplyModalOpen(false)} title="1:1 문의 상세" centered size="lg">
                {selectedContactInquiry && (
                    <Stack gap="md">
                        <Box>
                            <Group gap="xs" mb="xs">
                                <Badge size="sm">{selectedContactInquiry.inquiry_type}</Badge>
                                <Text size="xs" c="dimmed">{new Date(selectedContactInquiry.created_at).toLocaleDateString()}</Text>
                            </Group>
                            <Text size="sm" fw={600}>{selectedContactInquiry.title}</Text>
                            <Text size="xs" c="dimmed" mt="xs" style={{ whiteSpace: 'pre-wrap' }}>{selectedContactInquiry.content}</Text>
                            <Text size="xs" c="dimmed" mt="sm">연락처: {selectedContactInquiry.contact}</Text>
                        </Box>

                        {selectedContactInquiry.admin_reply && (
                            <Box bg="blue.0" p="sm" style={{ borderRadius: 8 }}>
                                <Text size="xs" c="dimmed">관리자 답변</Text>
                                <Text size="sm" mt={4}>{selectedContactInquiry.admin_reply}</Text>
                            </Box>
                        )}

                        <Textarea
                            label="답변 작성"
                            value={contactReplyContent}
                            onChange={(e) => setContactReplyContent(e.target.value)}
                            minRows={3}
                        />
                        <Button color="blue" onClick={async () => {
                            try {
                                await fetch(`/api/contact/${selectedContactInquiry.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ admin_reply: contactReplyContent, status: 'answered' }),
                                });
                                setContactReplyModalOpen(false);
                                loadData();
                            } catch (error) {
                                alert('답변 등록 실패');
                            }
                        }}>
                            답변 등록
                        </Button>
                    </Stack>
                )}
            </Modal>

            <BottomNav />
        </Box>
    );
}
