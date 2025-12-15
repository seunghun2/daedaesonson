'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Group, Text, Loader, TextInput, Checkbox, NativeSelect } from '@mantine/core';

interface PricingItem {
    id: string;
    parkId: string; // Refined to string
    parkName: string;
    institutionType: string;
    category0?: string; // New field
    category1: string;
    category2: string;
    category3?: string;
    itemName1?: string;
    itemName2?: string;
    rawText: string;
    price: string | number;
}

export default function PricingAdmin() {
    const [data, setData] = useState<PricingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modifiedItems, setModifiedItems] = useState<{ [key: string]: Partial<PricingItem> }>({});

    // Filters & Limits
    const [showRepresentativeOnly, setShowRepresentativeOnly] = useState(false);
    const [hideEmptyCategory3, setHideEmptyCategory3] = useState(false);
    const [displayLimit, setDisplayLimit] = useState<string>('1000'); // Default 1000

    // Column Resizing State
    const [colWidths, setColWidths] = useState({
        id: 60,
        parkName: 130,
        institutionType: 50,
        category0: 120, // New field width
        category1: 80,
        category2: 80,
        category3: 80,
        itemName1: 160,
        itemName2: 160,
        rawText: 180,
        price: 90
    });

    const [resizing, setResizing] = useState<{ colKey: string, startX: number, startWidth: number } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    // Load Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/pricing?search=${searchTerm}`);
            if (!res.ok) throw new Error('API Error');
            const json = await res.json();

            // Data is already sorted by script. Do not re-sort to avoid crashes.
            setData(json);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('데이터 로드 실패 (API Error)');
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic with useMemo
    const filteredData = useMemo(() => {
        return data.filter(item => {
            if (showRepresentativeOnly && !item.itemName1) return false;
            if (hideEmptyCategory3 && !item.category3) return false;
            return true;
        });
    }, [data, showRepresentativeOnly, hideEmptyCategory3]);

    // Apply Limit for Rendering
    const visibleData = useMemo(() => {
        if (displayLimit === '전체보기') return filteredData;
        return filteredData.slice(0, parseInt(displayLimit));
    }, [filteredData, displayLimit]);

    const handleSearch = () => {
        fetchData();
    };

    const handleCellChange = (id: string, field: keyof PricingItem, value: any) => {
        setData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
        setModifiedItems(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const handleSave = async (id: string) => {
        const changes = modifiedItems[id];
        if (!changes) return;

        try {
            const res = await fetch('/api/admin/pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...changes }),
            });

            if (res.ok) {
                console.log('Saved:', id);
                setModifiedItems(prev => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
                alert('저장되었습니다.');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error(error);
            alert('저장 실패!');
        }
    };

    // Resizing Logic
    const startResize = (e: React.MouseEvent, colKey: string) => {
        e.preventDefault();
        setResizing({ colKey, startX: e.clientX, startWidth: (colWidths as any)[colKey] });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizing) return;
            const diff = e.clientX - resizing.startX;
            const newWidth = Math.max(50, resizing.startWidth + diff);
            setColWidths(prev => ({ ...prev, [resizing.colKey]: newWidth }));
        };

        const handleMouseUp = () => {
            setResizing(null);
        };

        if (resizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizing]);

    const Resizer = ({ colKey }: { colKey: string }) => (
        <div
            onMouseDown={(e) => startResize(e, colKey)}
            style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '5px',
                cursor: 'col-resize', userSelect: 'none', zIndex: 1
            }}
        />
    );

    return (
        <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Group mb="md" justify="space-between">
                <Text size="xl" fw={700}>가격 데이터 관리 (Refined Mode)</Text>
                <Group>
                    <Group gap="xs">
                        <Text size="sm">표시 개수:</Text>
                        <NativeSelect
                            data={['1000', '2000', '5000', '10000', '20000', '전체보기']}
                            value={displayLimit}
                            onChange={(event) => setDisplayLimit(event.currentTarget.value)}
                            style={{ width: '100px' }}
                        />
                    </Group>
                    <Checkbox
                        label="대표 상품만 보기"
                        checked={showRepresentativeOnly}
                        onChange={(event) => setShowRepresentativeOnly(event.currentTarget.checked)}
                    />
                    <Checkbox
                        label="분류 3(관내/외) 있는 것만 보기"
                        checked={hideEmptyCategory3}
                        onChange={(event) => setHideEmptyCategory3(event.currentTarget.checked)}
                    />
                    <TextInput
                        placeholder="검색어 입력..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch}>검색</Button>
                </Group>
            </Group>

            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #dee2e6' }}>
                <Table striped highlightOnHover withTableBorder withColumnBorders stickyHeader style={{ tableLayout: 'fixed', minWidth: '100%' }}>
                    <colgroup>
                        <col style={{ width: colWidths.id }} />
                        <col style={{ width: colWidths.parkName }} />
                        <col style={{ width: colWidths.institutionType }} />
                        <col style={{ width: colWidths.category0 }} />
                        <col style={{ width: colWidths.category1 }} />
                        <col style={{ width: colWidths.category2 }} />
                        <col style={{ width: colWidths.category3 }} />
                        <col style={{ width: colWidths.itemName1 }} />
                        <col style={{ width: colWidths.itemName2 }} />
                        <col style={{ width: colWidths.rawText }} />
                        <col style={{ width: colWidths.price }} />
                        <col style={{ width: 60 }} />
                    </colgroup>
                    <Table.Thead bg="#f8f9fa">
                        <Table.Tr>
                            <Table.Th style={{ position: 'relative', overflow: 'hidden' }}>ID <Resizer colKey="id" /></Table.Th>
                            <Table.Th style={{ position: 'relative', overflow: 'hidden' }}>시설명 <Resizer colKey="parkName" /></Table.Th>
                            <Table.Th style={{ position: 'relative', overflow: 'hidden' }}>기관 <Resizer colKey="institutionType" /></Table.Th>
                            <Table.Th style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#e7f5ff' }}>분류 0 (종합) <Resizer colKey="category0" /></Table.Th>
                            <Table.Th style={{ position: 'relative', overflow: 'hidden' }}>분류 1 <Resizer colKey="category1" /></Table.Th>
                            <Table.Th style={{ position: 'relative', overflow: 'hidden' }}>분류 2 <Resizer colKey="category2" /></Table.Th>
                            <Table.Th style={{ position: 'relative', overflow: 'hidden' }}>분류 3 <Resizer colKey="category3" /></Table.Th>
                            <Table.Th style={{ position: 'relative', overflow: 'hidden' }}>항목명 1 <Resizer colKey="itemName1" /></Table.Th>
                            <Table.Th style={{ position: 'relative', overflow: 'hidden' }}>항목명 2 <Resizer colKey="itemName2" /></Table.Th>
                            <Table.Th style={{ position: 'relative', overflow: 'hidden' }}>비고 <Resizer colKey="rawText" /></Table.Th>
                            <Table.Th style={{ position: 'relative', overflow: 'hidden' }}>가격 <Resizer colKey="price" /></Table.Th>
                            <Table.Th>저장</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {loading ? (
                            <Table.Tr>
                                <Table.Td colSpan={12} align="center" py={20}><Loader size="sm" /></Table.Td>
                            </Table.Tr>
                        ) : visibleData.map((item) => (
                            <Table.Tr key={item.id}>
                                <Table.Td style={{ fontWeight: 'bold' }}>{item.parkId}</Table.Td>
                                <Table.Td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.parkName}</Table.Td>
                                <Table.Td align="center">{item.institutionType}</Table.Td>
                                <Table.Td style={{ padding: 0 }}>
                                    <input
                                        type="text"
                                        value={item.category0 || ''}
                                        onChange={(e) => handleCellChange(item.id, 'category0', e.target.value)}
                                        style={{
                                            width: '100%', height: '100%', border: 'none', padding: '0 4px',
                                            backgroundColor: modifiedItems[item.id]?.category0 ? '#fff3bf' : '#f8f9fa',
                                            color: '#1098ad', fontWeight: 600
                                        }}
                                    />
                                </Table.Td>
                                <Table.Td style={{ padding: 0 }}>
                                    <input type="text" value={item.category1 || ''} onChange={(e) => handleCellChange(item.id, 'category1', e.target.value)} style={{ width: '100%', height: '100%', border: 'none', padding: '0 4px', backgroundColor: modifiedItems[item.id]?.category1 ? '#fff3bf' : 'transparent' }} />
                                </Table.Td>
                                <Table.Td style={{ padding: 0 }}>
                                    <input type="text" value={item.category2 || ''} onChange={(e) => handleCellChange(item.id, 'category2', e.target.value)} style={{ width: '100%', height: '100%', border: 'none', padding: '0 4px', backgroundColor: modifiedItems[item.id]?.category2 ? '#fff3bf' : 'transparent' }} />
                                </Table.Td>
                                <Table.Td style={{ padding: 0 }}>
                                    <input type="text" value={item.category3 || ''} onChange={(e) => handleCellChange(item.id, 'category3', e.target.value)} style={{ width: '100%', height: '100%', border: 'none', padding: '0 4px', backgroundColor: modifiedItems[item.id]?.category3 ? '#fff3bf' : 'transparent' }} />
                                </Table.Td>
                                <Table.Td style={{ padding: 0 }}>
                                    <input type="text" value={item.itemName1 || ''} onChange={(e) => handleCellChange(item.id, 'itemName1', e.target.value)} style={{ width: '100%', height: '100%', border: 'none', padding: '0 4px', backgroundColor: modifiedItems[item.id]?.itemName1 ? '#fff3bf' : 'transparent', fontWeight: 'bold' }} />
                                </Table.Td>
                                <Table.Td style={{ padding: 0 }}>
                                    <input type="text" value={item.itemName2 || ''} onChange={(e) => handleCellChange(item.id, 'itemName2', e.target.value)} style={{ width: '100%', height: '100%', border: 'none', padding: '0 4px', backgroundColor: modifiedItems[item.id]?.itemName2 ? '#fff3bf' : 'transparent' }} />
                                </Table.Td>
                                <Table.Td style={{ padding: 0 }}>
                                    <input type="text" value={item.rawText || ''} onChange={(e) => handleCellChange(item.id, 'rawText', e.target.value)} style={{ width: '100%', height: '100%', border: 'none', padding: '0 4px', backgroundColor: modifiedItems[item.id]?.rawText ? '#fff3bf' : 'transparent', fontSize: '12px', color: '#868e96' }} />
                                </Table.Td>
                                <Table.Td style={{ padding: 0 }}>
                                    <input type="text" value={item.price} onChange={(e) => handleCellChange(item.id, 'price', e.target.value)} style={{ width: '100%', height: '100%', border: 'none', padding: '0 4px', backgroundColor: modifiedItems[item.id]?.price ? '#fff3bf' : 'transparent', textAlign: 'right' }} />
                                </Table.Td>
                                <Table.Td align="center">
                                    {modifiedItems[item.id] && <Button size="compact-xs" onClick={() => handleSave(item.id)}>저장</Button>}
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </div>
        </div>
    );
}
