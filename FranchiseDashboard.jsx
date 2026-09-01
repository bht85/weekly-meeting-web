import React, { useState, useEffect } from 'react';
import { Building2, Search, Plus, DollarSign, ShoppingCart, BarChart3, ChevronRight, FileText, X } from 'lucide-react';

const MOCK_FRANCHISES = [
    {
        id: 'F20230801',
        name: '강남역점',
        owner: '홍길동',
        bizNumber: '123-45-67890',
        bizType: '커피전문점',
        contractDate: '2023-08-01',
        openDate: '2023-09-15',
        status: '오픈완료',
        sales: { franchiseFee: 15000000, educationFee: 3000000, open: { deposit: 10000000, middle: 20000000, balance: 20000000 } },
        expenses: { interior: 35000000, equipment: 25000000 }
    },
    {
        id: 'F20230815',
        name: '판교테크노밸리점',
        owner: '김철수',
        bizNumber: '234-56-78901',
        bizType: '휴게음식점',
        contractDate: '2023-08-15',
        openDate: '2023-10-01',
        status: '잔금대기',
        sales: { franchiseFee: 15000000, educationFee: 3000000, open: { deposit: 10000000, middle: 20000000, balance: 0 } },
        expenses: { interior: 38000000, equipment: 25000000 }
    },
    {
        id: 'F20230901',
        name: '홍대입구점',
        owner: '이영희',
        bizNumber: '345-67-89012',
        bizType: '일반음식점',
        contractDate: '2023-09-01',
        openDate: '2023-10-20',
        status: '인테리어중',
        sales: { franchiseFee: 15000000, educationFee: 3000000, open: { deposit: 10000000, middle: 0, balance: 0 } },
        expenses: { interior: 15000000, equipment: 0 }
    }
];

const TABS = [
    { id: 'dashboard', label: '정산 대시보드', icon: BarChart3 },
    { id: 'basic', label: '가맹점 기본정보', icon: FileText },
    { id: 'sales', label: '매출/수금 관리', icon: DollarSign },
    { id: 'expense', label: '매입/비용 관리', icon: ShoppingCart },
];

const FranchiseDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [franchises, setFranchises] = useState(() => {
        const saved = localStorage.getItem('franchises');
        if (saved) {
            return JSON.parse(saved);
        }
        return MOCK_FRANCHISES;
    });

    useEffect(() => {
        localStorage.setItem('franchises', JSON.stringify(franchises));
    }, [franchises]);

    const getCurrentMonth = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };
    
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    
    // 모달 상태
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newFranchise, setNewFranchise] = useState({ name: '', owner: '', bizNumber: '', bizType: '', contractDate: '', openDate: '' });

    const getStatusColor = (status) => {
        switch(status) {
            case '오픈완료': return 'bg-blue-100 text-blue-800 border-blue-200';
            case '잔금대기': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case '인테리어중': return 'bg-purple-100 text-purple-800 border-purple-200';
            case '계약완료': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        const id = 'F' + new Date().toISOString().replace(/\D/g, '').slice(0, 8) + Math.floor(Math.random() * 1000);
        const newEntry = {
            id,
            name: newFranchise.name,
            owner: newFranchise.owner,
            bizNumber: newFranchise.bizNumber,
            bizType: newFranchise.bizType,
            contractDate: newFranchise.contractDate,
            openDate: newFranchise.openDate,
            status: '계약완료',
            sales: { franchiseFee: 0, educationFee: 0, open: { deposit: 0, middle: 0, balance: 0 } },
            expenses: { interior: 0, equipment: 0 }
        };
        setFranchises([...franchises, newEntry]);
        setIsAddModalOpen(false);
        setNewFranchise({ name: '', owner: '', bizNumber: '', bizType: '', contractDate: '', openDate: '' });
        setActiveTab('basic'); // 등록 후 기본정보 목록으로 이동
    };

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFranchise, setEditFranchise] = useState(null);

    const openEditModal = (f) => {
        setEditFranchise({ ...f });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        setFranchises(franchises.map(f => f.id === editFranchise.id ? editFranchise : f));
        setIsEditModalOpen(false);
        setEditFranchise(null);
    };

    const handleUpdateOpenDate = (id, newDate) => {
        setFranchises(franchises.map(f => f.id === id ? { ...f, openDate: newDate } : f));
    };

    const calcTotalSales = (f) => f.sales.franchiseFee + f.sales.educationFee + f.sales.open.deposit + f.sales.open.middle + f.sales.open.balance;
    const calcTotalExpenses = (f) => f.expenses.interior + f.expenses.equipment;

    const filteredFranchises = selectedMonth
        ? franchises.filter(f => f.openDate && f.openDate.startsWith(selectedMonth))
        : franchises;

    const renderDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">총 오픈/진행 가맹점</div>
                    <div className="text-2xl font-bold">{filteredFranchises.length}개</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">총 예상 매출액</div>
                    <div className="text-2xl font-bold text-green-600">
                        {(filteredFranchises.reduce((acc, f) => acc + calcTotalSales(f), 0)).toLocaleString()}원
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">총 매입/비용</div>
                    <div className="text-2xl font-bold text-red-600">
                        {(filteredFranchises.reduce((acc, f) => acc + calcTotalExpenses(f), 0)).toLocaleString()}원
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">예상 누적 마진</div>
                    <div className="text-2xl font-bold text-indigo-600">
                        {((filteredFranchises.reduce((acc, f) => acc + calcTotalSales(f), 0)) - 
                          (filteredFranchises.reduce((acc, f) => acc + calcTotalExpenses(f), 0))).toLocaleString()}원
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">가맹점별 정산 현황</h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="가맹점 검색..." className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-sm" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">코드/가맹점명</th>
                                <th className="px-4 py-3">상태</th>
                                <th className="px-4 py-3">오픈(예정)일자</th>
                                <th className="px-4 py-3 text-right">총 매출 (A)</th>
                                <th className="px-4 py-3 text-right">총 매입 (B)</th>
                                <th className="px-4 py-3 text-right">최종 마진 (A-B)</th>
                                <th className="px-4 py-3 text-center">상세</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFranchises.map(f => {
                                const totalSales = calcTotalSales(f);
                                const totalExpenses = calcTotalExpenses(f);
                                const margin = totalSales - totalExpenses;
                                return (
                                    <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{f.name}</div>
                                            <div className="text-xs text-slate-500">{f.id} | {f.owner}</div>
                                            {f.bizNumber && (
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                    {f.bizNumber} {f.bizType ? `(${f.bizType})` : ''}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(f.status)}`}>
                                                {f.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input 
                                                type="date" 
                                                value={f.openDate || ''} 
                                                onChange={(e) => handleUpdateOpenDate(f.id, e.target.value)}
                                                className="px-2 py-1 border border-transparent rounded-md text-xs text-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 bg-transparent hover:bg-white hover:border-slate-300 transition-colors"
                                                title="클릭하여 오픈일자 수정"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right text-green-600 font-medium">{totalSales.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-red-600 font-medium">{totalExpenses.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-indigo-600 font-bold">{margin.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button className="text-slate-400 hover:text-indigo-600">
                                                <ChevronRight className="w-5 h-5 mx-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderBasicInfoTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">가맹점 기본정보 목록</h2>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                    <Plus className="w-4 h-4" /> 신규 가맹점 등록
                </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">가맹점 코드</th>
                                <th className="px-4 py-3">가맹점명</th>
                                <th className="px-4 py-3">대표자</th>
                                <th className="px-4 py-3">사업자등록번호</th>
                                <th className="px-4 py-3">업태/종목</th>
                                <th className="px-4 py-3">계약일자</th>
                                <th className="px-4 py-3">오픈(예정)일자</th>
                                <th className="px-4 py-3">상태</th>
                                <th className="px-4 py-3 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFranchises.map(f => (
                                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-500">{f.id}</td>
                                    <td className="px-4 py-3 font-bold text-slate-800">{f.name}</td>
                                    <td className="px-4 py-3">{f.owner}</td>
                                    <td className="px-4 py-3 text-slate-500">{f.bizNumber || '-'}</td>
                                    <td className="px-4 py-3 text-slate-500">{f.bizType || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600">{f.contractDate}</td>
                                    <td className="px-4 py-3 text-indigo-600 font-medium">
                                        <input 
                                            type="date" 
                                            value={f.openDate || ''} 
                                            onChange={(e) => handleUpdateOpenDate(f.id, e.target.value)}
                                            className="px-2 py-1 border border-transparent rounded-md text-xs text-indigo-600 font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 bg-transparent hover:bg-white hover:border-slate-300 transition-colors"
                                            title="클릭하여 오픈일자 수정"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-[10px] rounded-full border ${getStatusColor(f.status)}`}>
                                            {f.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => openEditModal(f)} className="px-2 py-1 text-xs text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50">
                                            수정
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    const renderSalesTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">매출/수금 내역</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                    <Plus className="w-4 h-4" /> 입금 내역 업로드
                </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">가맹점명</th>
                                <th className="px-4 py-3 text-right">총 수금액</th>
                                <th className="px-4 py-3 text-right text-slate-400">가맹비</th>
                                <th className="px-4 py-3 text-right text-slate-400">교육비</th>
                                <th className="px-4 py-3 text-right text-blue-500">계약금</th>
                                <th className="px-4 py-3 text-right text-blue-500">중도금</th>
                                <th className="px-4 py-3 text-right text-blue-500">잔금</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFranchises.map(f => (
                                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-bold text-slate-800">{f.name}</td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600">{calcTotalSales(f).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{f.sales.franchiseFee.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{f.sales.educationFee.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-blue-600">{f.sales.open.deposit.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-blue-600">{f.sales.open.middle.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-blue-600">{f.sales.open.balance.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderExpenseTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">매입/비용 내역</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                    <Plus className="w-4 h-4" /> 매입 내역 등록
                </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">가맹점명</th>
                                <th className="px-4 py-3 text-right">총 매입액</th>
                                <th className="px-4 py-3 text-right text-orange-500">인테리어</th>
                                <th className="px-4 py-3 text-right text-purple-500">기기장비</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFranchises.map(f => (
                                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-bold text-slate-800">{f.name}</td>
                                    <td className="px-4 py-3 text-right font-bold text-red-600">{calcTotalExpenses(f).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-orange-600">{f.expenses.interior.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-purple-600">{f.expenses.equipment.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );


    const renderPlaceholder = (title, description, icon, actionLabel, onAction) => (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
            {icon}
            <h3 className="mt-4 text-lg font-bold text-slate-800">{title}</h3>
            <p className="mt-2 text-slate-500 max-w-md">{description}</p>
            <button onClick={onAction} className="mt-6 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4" /> {actionLabel}
            </button>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto relative">
            <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                        오픈가맹 관리
                    </h1>
                    <p className="mt-2 text-slate-500 text-sm">신규 가맹점의 기본 정보, 수금, 비용을 각 부서에서 취합하여 최종 수익성을 분석합니다.</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700 whitespace-nowrap">오픈월 선택:</label>
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    {selectedMonth && (
                        <button 
                            onClick={() => setSelectedMonth('')}
                            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                        >
                            전체보기
                        </button>
                    )}
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex space-x-1 border-b border-slate-200 mb-6 overflow-x-auto">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === tab.id 
                                ? 'border-indigo-600 text-indigo-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* 탭 콘텐츠 */}
            <div>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'basic' && renderBasicInfoTab()}
                {activeTab === 'sales' && renderSalesTab()}
                {activeTab === 'expense' && renderExpenseTab()}
            </div>

            {/* 신규 등록 모달 */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">신규 가맹점 등록</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">가맹점명 (지점명)</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="예: 강남역점"
                                    value={newFranchise.name}
                                    onChange={e => setNewFranchise({...newFranchise, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">대표자명</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder="대표자 성함"
                                        value={newFranchise.owner}
                                        onChange={e => setNewFranchise({...newFranchise, owner: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">사업자등록번호</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder="예: 123-45-67890"
                                        value={newFranchise.bizNumber}
                                        onChange={e => setNewFranchise({...newFranchise, bizNumber: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">업태/종목</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="예: 커피전문점 / 휴게음식점"
                                    value={newFranchise.bizType}
                                    onChange={e => setNewFranchise({...newFranchise, bizType: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">계약일자</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                        value={newFranchise.contractDate}
                                        onChange={e => setNewFranchise({...newFranchise, contractDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">예상 오픈일자</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                        value={newFranchise.openDate}
                                        onChange={e => setNewFranchise({...newFranchise, openDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
                                    취소
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                                    등록하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 기본정보 수정 모달 */}
            {isEditModalOpen && editFranchise && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">가맹점 기본정보 수정</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">가맹점명 (지점명)</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    value={editFranchise.name}
                                    onChange={e => setEditFranchise({...editFranchise, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">대표자명</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        value={editFranchise.owner}
                                        onChange={e => setEditFranchise({...editFranchise, owner: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">사업자등록번호</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        value={editFranchise.bizNumber}
                                        onChange={e => setEditFranchise({...editFranchise, bizNumber: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">업태/종목</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    value={editFranchise.bizType}
                                    onChange={e => setEditFranchise({...editFranchise, bizType: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">계약일자</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                        value={editFranchise.contractDate}
                                        onChange={e => setEditFranchise({...editFranchise, contractDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">상태</label>
                                    <select 
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                        value={editFranchise.status}
                                        onChange={e => setEditFranchise({...editFranchise, status: e.target.value})}
                                    >
                                        <option value="계약완료">계약완료</option>
                                        <option value="인테리어중">인테리어중</option>
                                        <option value="잔금대기">잔금대기</option>
                                        <option value="오픈완료">오픈완료</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
                                    취소
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                                    저장하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FranchiseDashboard;
