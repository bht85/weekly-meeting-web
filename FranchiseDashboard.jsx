import React, { useState } from 'react';
import { Building2, Search, Plus, DollarSign, ShoppingCart, BarChart3, ChevronRight, FileText, X } from 'lucide-react';

const MOCK_FRANCHISES = [
    {
        id: 'F20230801',
        name: '강남역점',
        owner: '홍길동',
        contractDate: '2023-08-01',
        openDate: '2023-09-15',
        status: '오픈완료',
        sales: { deposit: 10000000, middle: 20000000, balance: 20000000 },
        expenses: { interior: 15000000, equipment: 12000000, etc: 3000000 }
    },
    {
        id: 'F20230815',
        name: '판교테크노밸리점',
        owner: '김철수',
        contractDate: '2023-08-15',
        openDate: '2023-10-01',
        status: '잔금대기',
        sales: { deposit: 10000000, middle: 20000000, balance: 0 },
        expenses: { interior: 18000000, equipment: 12000000, etc: 0 }
    },
    {
        id: 'F20230901',
        name: '홍대입구점',
        owner: '이영희',
        contractDate: '2023-09-01',
        openDate: '2023-10-20',
        status: '인테리어중',
        sales: { deposit: 10000000, middle: 0, balance: 0 },
        expenses: { interior: 5000000, equipment: 0, etc: 0 }
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
    const [franchises, setFranchises] = useState(MOCK_FRANCHISES);
    
    // 모달 상태
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newFranchise, setNewFranchise] = useState({ name: '', owner: '', contractDate: '', openDate: '' });

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
            contractDate: newFranchise.contractDate,
            openDate: newFranchise.openDate,
            status: '계약완료',
            sales: { deposit: 0, middle: 0, balance: 0 },
            expenses: { interior: 0, equipment: 0, etc: 0 }
        };
        setFranchises([...franchises, newEntry]);
        setIsAddModalOpen(false);
        setNewFranchise({ name: '', owner: '', contractDate: '', openDate: '' });
        setActiveTab('dashboard'); // 등록 후 대시보드로 이동해서 확인
    };

    const renderDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">총 오픈/진행 가맹점</div>
                    <div className="text-2xl font-bold">{franchises.length}개</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">총 예상 매출액</div>
                    <div className="text-2xl font-bold text-green-600">
                        {(franchises.reduce((acc, f) => acc + f.sales.deposit + f.sales.middle + f.sales.balance, 0)).toLocaleString()}원
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">총 매입/비용</div>
                    <div className="text-2xl font-bold text-red-600">
                        {(franchises.reduce((acc, f) => acc + f.expenses.interior + f.expenses.equipment + f.expenses.etc, 0)).toLocaleString()}원
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">예상 누적 마진</div>
                    <div className="text-2xl font-bold text-indigo-600">
                        {((franchises.reduce((acc, f) => acc + f.sales.deposit + f.sales.middle + f.sales.balance, 0)) - 
                          (franchises.reduce((acc, f) => acc + f.expenses.interior + f.expenses.equipment + f.expenses.etc, 0))).toLocaleString()}원
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
                                <th className="px-4 py-3 text-right">총 매출 (A)</th>
                                <th className="px-4 py-3 text-right">총 매입 (B)</th>
                                <th className="px-4 py-3 text-right">최종 마진 (A-B)</th>
                                <th className="px-4 py-3 text-center">상세</th>
                            </tr>
                        </thead>
                        <tbody>
                            {franchises.map(f => {
                                const totalSales = f.sales.deposit + f.sales.middle + f.sales.balance;
                                const totalExpenses = f.expenses.interior + f.expenses.equipment + f.expenses.etc;
                                const margin = totalSales - totalExpenses;
                                return (
                                    <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{f.name}</div>
                                            <div className="text-xs text-slate-500">{f.id} | {f.owner}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(f.status)}`}>
                                                {f.status}
                                            </span>
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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                    오픈가맹 관리
                </h1>
                <p className="mt-2 text-slate-500 text-sm">신규 가맹점의 기본 정보, 수금, 비용을 각 부서에서 취합하여 최종 수익성을 분석합니다.</p>
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
                {activeTab === 'basic' && renderPlaceholder(
                    '가맹점 기본정보 관리', 
                    '영업/개설팀에서 신규 가맹점을 등록하고, 계약일자 및 대표자 정보 등을 관리하는 화면입니다.', 
                    <FileText className="w-12 h-12 text-slate-300" />,
                    '신규 가맹점 등록',
                    () => setIsAddModalOpen(true)
                )}
                {activeTab === 'sales' && renderPlaceholder(
                    '매출/수금 관리', 
                    '재무팀에서 통장 입금 내역을 업로드하고, 각 가맹점의 계약금/중도금/잔금과 매칭하는 화면입니다.', 
                    <DollarSign className="w-12 h-12 text-slate-300" />,
                    '입금 내역 업로드',
                    () => alert('입금 내역(엑셀) 업로드 기능은 데이터베이스 연동 시 구현됩니다.')
                )}
                {activeTab === 'expense' && renderPlaceholder(
                    '매입/비용 관리', 
                    '구매/시설팀에서 인테리어, 기기장비 등의 발주 비용을 가맹점별로 입력하고 매칭하는 화면입니다.', 
                    <ShoppingCart className="w-12 h-12 text-slate-300" />,
                    '비용 내역 등록',
                    () => alert('매입/비용 내역 등록 기능은 데이터베이스 연동 시 구현됩니다.')
                )}
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
        </div>
    );
};

export default FranchiseDashboard;
