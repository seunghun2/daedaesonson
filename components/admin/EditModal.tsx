'use client';

import { useState, useEffect, memo } from 'react';
import {
    Modal, Text, Group, Button, Paper, TextInput, ActionIcon,
    Badge, NumberInput, Stack, Tabs, SimpleGrid, FileButton,
    Box, ThemeIcon, Switch, ScrollArea
} from '@mantine/core';
import {
    Save, Trash, Plus, Star, FileText, Wand2, Scissors,
    CloudDownload, TrendingUp, TrendingDown
} from 'lucide-react';
import { Facility } from '@/types';
import { PRICE_TAB_CATEGORIES, OTHER_TAB_CATEGORY } from '@/lib/constants';

// 🚀 GroupEditor - 로컬 상태로 최적화
const GroupEditor = memo(({ groupName, groupData, onRename, onUpdateRows, onDeleteGroup }: {
    groupName: string;
    groupData: any;
    onRename: (oldName: string, newName: string) => void;
    onUpdateRows: (groupName: string, newRows: any[]) => void;
    onDeleteGroup: (groupName: string) => void;
}) => {
    const [localName, setLocalName] = useState(groupName);
    const [localRows, setLocalRows] = useState(groupData.rows || []);

    useEffect(() => {
        setLocalRows(groupData.rows || []);
    }, [groupData.rows]);

    useEffect(() => {
        if (groupName !== localName) setLocalName(groupName);
    }, [groupName]);

    const updateLocalRow = (idx: number, field: string, value: any) => {
        const newRows = [...localRows];
        newRows[idx] = { ...newRows[idx], [field]: value };
        setLocalRows(newRows);
    };

    const commitRows = () => onUpdateRows(groupName, localRows);

    return (
        <Paper withBorder p="sm" radius="md" mb="sm">
            <Group justify="space-between" mb="xs">
                <Group>
                    <TextInput
                        size="xs"
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        onBlur={() => localName !== groupName && onRename(groupName, localName)}
                        fw={700}
                        w={300}
                    />
                    <Badge variant="outline">{groupData.unit}</Badge>
                </Group>
                <ActionIcon color="red" variant="subtle" onClick={() => onDeleteGroup(groupName)}>
                    <Trash size={16} />
                </ActionIcon>
            </Group>
            <Stack gap="xs">
                {localRows.map((row: any, idx: number) => (
                    <Group key={idx} grow align="flex-end">
                        <TextInput
                            label="상품명" size="xs" value={row.name}
                            onChange={(e) => updateLocalRow(idx, 'name', e.target.value)}
                            onBlur={commitRows}
                        />
                        <TextInput
                            label="설명" size="xs" value={row.grade || ''} placeholder="예: 1평형/1년"
                            onChange={(e) => updateLocalRow(idx, 'grade', e.target.value)}
                            onBlur={commitRows}
                        />
                        <NumberInput
                            label="가격" size="xs" value={row.price}
                            onChange={(val) => updateLocalRow(idx, 'price', Number(val))}
                            onBlur={commitRows}
                        />
                        <ActionIcon color="red" variant="subtle" onClick={() => {
                            const newRows = localRows.filter((_: any, i: number) => i !== idx);
                            setLocalRows(newRows);
                            onUpdateRows(groupName, newRows);
                        }}>
                            <Trash size={16} />
                        </ActionIcon>
                    </Group>
                ))}
                <Button size="xs" variant="light" leftSection={<Plus size={14} />}
                    onClick={() => {
                        const newRows = [...localRows, { name: '새 상품', price: 0 }];
                        setLocalRows(newRows);
                        onUpdateRows(groupName, newRows);
                    }}
                >
                    상품 추가
                </Button>
            </Stack>
        </Paper>
    );
});
GroupEditor.displayName = 'GroupEditor';

// 로컬 상태 입력 컴포넌트
const LocalTextInput = memo(({ label, value, placeholder, onCommit, ...props }: any) => {
    const [localValue, setLocalValue] = useState(value || '');

    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    return (
        <TextInput
            label={label}
            value={localValue}
            placeholder={placeholder}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => onCommit(localValue)}
            {...props}
        />
    );
});
LocalTextInput.displayName = 'LocalTextInput';

interface EditModalProps {
    opened: boolean;
    onClose: () => void;
    editingId: string | null;
    editForm: Partial<Facility>;
    setEditForm: React.Dispatch<React.SetStateAction<Partial<Facility>>>;
    onSave: () => void;
    onSync?: () => void;
    syncing?: boolean;
}

const EditModal = memo(({
    opened,
    onClose,
    editingId,
    editForm,
    setEditForm,
    onSave,
    onSync,
    syncing
}: EditModalProps) => {
    const [activeMajorTab, setActiveMajorTab] = useState<string>('매장묘');

    // 가격 편집 헬퍼
    const handleRename = (oldName: string, newName: string) => {
        if (!editForm?.priceInfo?.priceTable) return;
        const table = { ...editForm.priceInfo.priceTable };
        if (table[oldName] && oldName !== newName) {
            table[newName] = table[oldName];
            delete table[oldName];
            setEditForm(prev => ({ ...prev, priceInfo: { ...prev.priceInfo, priceTable: table } }));
        }
    };

    const handleUpdateRows = (groupName: string, newRows: any[]) => {
        if (!editForm?.priceInfo?.priceTable) return;
        const table = { ...editForm.priceInfo.priceTable };
        if (table[groupName]) {
            table[groupName] = { ...table[groupName], rows: newRows };
            setEditForm(prev => ({ ...prev, priceInfo: { ...prev.priceInfo, priceTable: table } }));
        }
    };

    const handleDeleteGroup = (groupName: string) => {
        if (!editForm?.priceInfo?.priceTable) return;
        if (!confirm(`'${groupName}' 그룹을 삭제하시겠습니까?`)) return;
        const table = { ...editForm.priceInfo.priceTable };
        delete table[groupName];
        setEditForm(prev => ({ ...prev, priceInfo: { ...prev.priceInfo, priceTable: table } }));
    };

    // 가격 테이블 분류
    const priceTable = editForm.priceInfo?.priceTable || {};
    const mainGroups: any[] = [];
    const installationGroups: any[] = [];
    const managementGroups: any[] = [];

    Object.entries(priceTable).forEach(([groupName, groupData]: [string, any]) => {
        if (groupName.includes('[별도]') || groupName.includes('시설') || groupName.includes('석물')) {
            installationGroups.push({ groupName, groupData });
        } else if (groupName.includes('[안내]') || groupName.includes('관리비') || groupName.includes('용역')) {
            managementGroups.push({ groupName, groupData });
        } else {
            mainGroups.push({ groupName, groupData });
        }
    });

    // 탭 카테고리 분류
    const tabCategories: Record<string, any[]> = {};
    PRICE_TAB_CATEGORIES.forEach(cat => {
        tabCategories[cat.label] = mainGroups.filter(g => {
            if (g.groupData.category === cat.key) return true;
            return cat.keywords.some((k: string) => g.groupName.includes(k));
        });
    });
    tabCategories[OTHER_TAB_CATEGORY.label] = mainGroups.filter(g =>
        !Object.values(tabCategories).flat().includes(g)
    );

    const updateField = (field: keyof Facility, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={editingId ? '시설 정보 수정' : '새 시설 등록'}
            size="lg"
            scrollAreaComponent={ScrollArea.Autosize}
        >
            {/* Sync Button */}
            {onSync && (
                <Group justify="flex-end" mb="md">
                    <Button
                        variant="subtle" color="green" leftSection={<CloudDownload size={16} />}
                        onClick={onSync} loading={syncing}
                        disabled={!editingId?.startsWith('esky-')} size="xs"
                    >
                        e하늘 실시간 동기화
                    </Button>
                </Group>
            )}

            {/* 기본 정보 */}
            <Paper withBorder p="md" radius="md" mb="md">
                <Text size="sm" fw={700} mb="sm">기본 정보</Text>
                <Stack gap="sm">
                    <LocalTextInput label="시설명" value={editForm.name} onCommit={(v: string) => updateField('name', v)} />
                    <LocalTextInput label="주소" value={editForm.address} onCommit={(v: string) => updateField('address', v)} />
                    <Group grow>
                        <LocalTextInput label="전화번호" value={editForm.phone} onCommit={(v: string) => updateField('phone', v)} />
                        <LocalTextInput label="총매장능력" value={editForm.capacity} onCommit={(v: string) => updateField('capacity', parseInt(v) || 0)} />
                    </Group>
                    <LocalTextInput label="홈페이지" value={editForm.websiteUrl} onCommit={(v: string) => updateField('websiteUrl', v)} />
                </Stack>
            </Paper>

            {/* 가격 정보 */}
            <Paper withBorder p="md" radius="md">
                <Text size="sm" fw={700} mb="sm">가격 정보</Text>

                <Tabs value={activeMajorTab} onChange={(v) => setActiveMajorTab(v || '매장묘')}>
                    <Tabs.List mb="md">
                        {PRICE_TAB_CATEGORIES.map(cat => (
                            <Tabs.Tab key={cat.key} value={cat.label}>
                                {cat.label} <Badge size="xs" ml={4}>{tabCategories[cat.label]?.length || 0}</Badge>
                            </Tabs.Tab>
                        ))}
                        <Tabs.Tab value={OTHER_TAB_CATEGORY.label}>
                            {OTHER_TAB_CATEGORY.label} <Badge size="xs" ml={4}>{tabCategories[OTHER_TAB_CATEGORY.label]?.length || 0}</Badge>
                        </Tabs.Tab>
                    </Tabs.List>

                    {[...PRICE_TAB_CATEGORIES, OTHER_TAB_CATEGORY].map(cat => (
                        <Tabs.Panel key={cat.label} value={cat.label}>
                            {(tabCategories[cat.label] || []).map((g, idx) => (
                                <GroupEditor
                                    key={idx}
                                    groupName={g.groupName}
                                    groupData={g.groupData}
                                    onRename={handleRename}
                                    onUpdateRows={handleUpdateRows}
                                    onDeleteGroup={handleDeleteGroup}
                                />
                            ))}
                            {(!tabCategories[cat.label] || tabCategories[cat.label].length === 0) && (
                                <Text c="dimmed" size="sm">이 카테고리에 등록된 상품이 없습니다.</Text>
                            )}
                        </Tabs.Panel>
                    ))}
                </Tabs>

                {/* 설치비/관리비 */}
                {installationGroups.length > 0 && (
                    <Box mt="lg" p="sm" bg="gray.0" style={{ borderRadius: 8 }}>
                        <Text size="sm" fw={700} mb="sm">➕ 별도 시설 설치비용</Text>
                        {installationGroups.map((g, idx) => (
                            <GroupEditor key={idx} groupName={g.groupName} groupData={g.groupData}
                                onRename={handleRename} onUpdateRows={handleUpdateRows} onDeleteGroup={handleDeleteGroup} />
                        ))}
                    </Box>
                )}

                {managementGroups.length > 0 && (
                    <Box mt="md" p="sm" bg="blue.0" style={{ borderRadius: 8 }}>
                        <Text size="sm" fw={700} mb="sm" c="blue.9">ℹ️ 관리비 및 안내사항</Text>
                        {managementGroups.map((g, idx) => (
                            <GroupEditor key={idx} groupName={g.groupName} groupData={g.groupData}
                                onRename={handleRename} onUpdateRows={handleUpdateRows} onDeleteGroup={handleDeleteGroup} />
                        ))}
                    </Box>
                )}
            </Paper>

            {/* 저장 버튼 */}
            <Group justify="flex-end" mt="lg">
                <Button variant="subtle" onClick={onClose}>취소</Button>
                <Button leftSection={<Save size={16} />} onClick={onSave}>저장</Button>
            </Group>
        </Modal>
    );
});

EditModal.displayName = 'EditModal';

export default EditModal;
