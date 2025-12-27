'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, Save, RefreshCw, Star } from 'lucide-react';

interface PricingRow {
    id: string;
    facilityId: string;
    facilityName: string;
    category: string;
    name: string;
    desc: string;
    price: number;
    isDeleted: boolean;
    isRepresentative: boolean;
}

export default function PricingManagerV2() {
    const [facilities, setFacilities] = useState<any[]>([]);
    const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
    const [rows, setRows] = useState<PricingRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch('/api/facilities-v2')
            .then(res => res.json())
            .then(data => {
                setFacilities(data.sort((a: any, b: any) => parseInt(a.id.replace(/\D/g, '')) - parseInt(b.id.replace(/\D/g, ''))));
                if (data.length > 0) setSelectedFacility(data[0].id);
            })
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (!selectedFacility) return;
        setLoading(true);
        fetch(`/api/facilities/${selectedFacility}`)
            .then(res => res.json())
            .then(data => {
                const newRows: PricingRow[] = [];
                if (data.pricing) {
                    Object.entries(data.pricing).forEach(([cat, content]: [string, any]) => {
                        if (content.rows) {
                            content.rows.forEach((r: any, idx: number) => {
                                newRows.push({
                                    id: `${selectedFacility}_${cat}_${idx}_${Date.now()}_${Math.random()}`,
                                    facilityId: selectedFacility,
                                    facilityName: data.name,
                                    category: cat,
                                    name: r.name,
                                    desc: r.description || '',
                                    price: r.price,
                                    isDeleted: false,
                                    isRepresentative: r.isRepresentative || false
                                });
                            });
                        }
                    });
                }
                setRows(newRows);
                setLoading(false);
            });
    }, [selectedFacility]);

    const handleAutoFilter = () => {
        const junkKeywords = [
            '작업비', '개장', '수선', '유골함', '석물', '석곽', '석봉분',
            '향로', '구판', '설치비', '각자대', '식당', '천막', '나무제거',
            '철거', '안치단', '단형봉분'
        ];
        setRows(prev => prev.map(r => {
            const text = (r.name + r.desc).toLowerCase();
            if (junkKeywords.some(k => text.includes(k))) {
                return { ...r, isDeleted: true };
            }
            return r;
        }));
    };

    const toggleDelete = (id: string) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, isDeleted: !r.isDeleted } : r));
    };

    const toggleRepresentative = (id: string) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, isRepresentative: !r.isRepresentative } : r));
    };

    const moveRow = (id: string, direction: 'up' | 'down') => {
        const rowToMove = rows.find(r => r.id === id);
        if (!rowToMove) return;

        // Visual Reordering Logic (Category-safe)
        const categoryRows = rows.filter(r => r.category === rowToMove.category);
        const visualIndex = categoryRows.findIndex(r => r.id === id);

        if (direction === 'up') {
            if (visualIndex === 0) return;
            const swapTargetRow = categoryRows[visualIndex - 1];
            swapGlobal(id, swapTargetRow.id);
        } else {
            if (visualIndex === categoryRows.length - 1) return;
            const swapTargetRow = categoryRows[visualIndex + 1];
            swapGlobal(id, swapTargetRow.id);
        }
    };

    const swapGlobal = (id1: string, id2: string) => {
        const idx1 = rows.findIndex(r => r.id === id1);
        const idx2 = rows.findIndex(r => r.id === id2);
        const newRows = [...rows];
        [newRows[idx1], newRows[idx2]] = [newRows[idx2], newRows[idx1]];
        setRows(newRows);
    };

    const handleSave = async () => {
        if (!selectedFacility) return;
        const validRows = rows.filter(r => !r.isDeleted);

        try {
            const res = await fetch('/api/save-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facilityId: selectedFacility,
                    rows: validRows
                })
            });
            if (res.ok) {
                alert('저장 완료! ✅');
            } else {
                alert('저장 실패 ❌');
            }
        } catch (e) {
            console.error(e);
            alert('에러 발생');
        }
    };

    const filteredFacilities = facilities.filter(f => f.name.includes(searchTerm) || f.id.includes(searchTerm));

    return (
        <div className="flex h-screen bg-gray-100 font-sans text-gray-900">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r flex flex-col shadow-sm z-20 flex-shrink-0">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-sm mb-2">시설 목록 🏢</h2>
                    <input
                        className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="이름/ID 검색..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredFacilities.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setSelectedFacility(f.id)}
                            className={`w-full text-left px-4 py-3 text-sm border-b truncate transition-colors ${selectedFacility === f.id
                                    ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-l-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <span className="text-xs text-gray-400 mr-2">{f.id}</span>
                            {f.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50 overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b px-8 py-5 flex justify-between items-center shadow-sm z-10 flex-shrink-0">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            데이터 편집
                            <div className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-mono flex items-center gap-2">
                                {selectedFacility}
                                {selectedFacility && <span className="font-bold text-gray-800">{facilities.find(f => f.id === selectedFacility)?.name}</span>}
                            </div>
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAutoFilter} className="px-4 py-2 border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 flex items-center transition-colors">
                            <Trash2 className="w-4 h-4 mr-2" /> 자동 필터
                        </button>
                        <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-transform active:scale-95">
                            <Save className="w-4 h-4" /> 변경사항 저장
                        </button>
                    </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Loader2 className="animate-spin mb-3 w-10 h-10 text-blue-500" />
                            <p className="text-lg font-medium">데이터 불러오는 중...</p>
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <p className="text-xl">시설을 선택하거나 데이터가 없습니다.</p>
                        </div>
                    ) : (
                        <>
                            {/* 1. Representative Review Section (The Yellow Box) */}
                            {rows.some(r => r.isRepresentative) && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-sm mb-6">
                                    <h3 className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-2">
                                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                        대표 가격 미리보기
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {rows.filter(r => r.isRepresentative).map(r => (
                                            <div key={r.id} className="flex items-center gap-2 bg-white border border-yellow-300 px-3 py-2 rounded-lg shadow-sm">
                                                <span className={`w-2 h-2 rounded-full ${r.category === '매장묘' ? 'bg-emerald-500' :
                                                        r.category === '봉안당' ? 'bg-amber-500' : 'bg-gray-400'
                                                    }`}></span>
                                                <span className="font-bold text-gray-800 text-sm">{r.name}</span>
                                                <span className="text-xs text-gray-400 px-1 border-l border-gray-200">{r.category}</span>
                                                <span className="font-bold text-blue-600 text-sm">{r.price.toLocaleString()}원</span>
                                                <button
                                                    onClick={() => toggleRepresentative(r.id)}
                                                    className="ml-2 text-gray-300 hover:text-red-500 text-lg leading-none"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 2. Main Categories (Card Layout) */}
                            {['매장묘', '봉안당', '수목장'].map(cat => {
                                const catRows = rows.filter(r => r.category === cat);
                                if (catRows.length === 0) return null;

                                return (
                                    <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className={`px-6 py-4 border-b flex justify-between items-center ${cat === '매장묘' ? 'bg-emerald-50/50 border-emerald-100' :
                                                cat === '봉안당' ? 'bg-amber-50/50 border-amber-100' : 'bg-green-50/50 border-green-100'
                                            }`}>
                                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-3">
                                                <span className="text-2xl">{cat === '매장묘' ? '🪦' : cat === '봉안당' ? '🏛' : '🌳'}</span>
                                                {cat}
                                            </h3>
                                            <span className="text-xs bg-white px-3 py-1 rounded-full border text-gray-500 font-bold">{catRows.length}개 상품</span>
                                        </div>
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                                <tr>
                                                    <th className="px-4 py-3 w-16 text-center">순서</th>
                                                    <th className="px-4 py-3 w-16 text-center">대표</th>
                                                    <th className="px-4 py-3 w-16 text-center">삭제</th>
                                                    <th className="px-6 py-3">상품명 / 설명</th>
                                                    <th className="px-6 py-3 text-right">가격</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {catRows.map((row) => (
                                                    <tr key={row.id} className={`group hover:bg-blue-50/30 transition-colors ${row.isRepresentative ? 'bg-yellow-50/40' : ''} ${row.isDeleted ? 'bg-red-50/50 opacity-60' : ''}`}>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={(e) => { e.stopPropagation(); moveRow(row.id, 'up'); }} className="p-1 hover:bg-blue-100 text-blue-600 rounded text-xs">▲</button>
                                                                <button onClick={(e) => { e.stopPropagation(); moveRow(row.id, 'down'); }} className="p-1 hover:bg-blue-100 text-blue-600 rounded text-xs">▼</button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <input type="checkbox" checked={row.isRepresentative} onChange={() => toggleRepresentative(row.id)} className="w-5 h-5 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500 cursor-pointer" />
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <input type="checkbox" checked={row.isDeleted} onChange={() => toggleDelete(row.id)} className="w-5 h-5 text-red-500 border-gray-300 rounded focus:ring-red-500 cursor-pointer" />
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className={`font-bold text-gray-800 text-base mb-1 ${row.isDeleted && 'line-through text-gray-400'}`}>{row.name}</div>
                                                            <div className={`text-sm text-gray-500 ${row.isDeleted && 'text-gray-300'}`}>
                                                                {row.desc}
                                                                {row.isRepresentative && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">대표가 노출</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <div className={`font-mono font-bold text-lg ${row.isDeleted ? 'line-through text-gray-300' : 'text-blue-600'}`}>
                                                                {row.price > 0 ? row.price.toLocaleString() + '원' : <span className="text-gray-400 text-sm font-normal">문의/별도</span>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            })}

                            {/* 3. Options Category (Separate Style) */}
                            {rows.filter(r => (r.category === '기타' || r.category === '옵션')).length > 0 && (
                                <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 overflow-hidden mt-8">
                                    <div className="px-6 py-3 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
                                        <h3 className="font-bold text-gray-600 text-sm">✚ 옵션 및 추가 비용 (관리비, 작업비 등)</h3>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <tbody className="divide-y divide-gray-200">
                                            {rows.filter(r => (r.category === '기타' || r.category === '옵션')).map(row => (
                                                <tr key={row.id} className={`hover:bg-white transition-colors ${row.isDeleted ? 'bg-red-50/50 text-gray-300' : 'text-gray-600'}`}>
                                                    <td className="px-6 py-3 w-16 text-center">
                                                        <input type="checkbox" checked={row.isDeleted} onChange={() => toggleDelete(row.id)} className="w-4 h-4 text-red-500 rounded cursor-pointer" />
                                                    </td>
                                                    <td className="px-6 py-3 w-1/3 font-medium text-base ${row.isDeleted && 'line-through'}">{row.name}</td>
                                                    <td className="px-6 py-3 w-1/3 text-sm ${row.isDeleted && 'line-through'}">{row.desc}</td>
                                                    <td className="px-6 py-3 w-1/3 text-right font-mono text-base">
                                                        {row.price > 0 ? row.price.toLocaleString() : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
