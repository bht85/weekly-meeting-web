import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Building2, Search, Plus, DollarSign, ShoppingCart, BarChart3, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileText, X, Settings, Trash2, Calculator, RotateCcw } from 'lucide-react';

const MOCK_VENDORS = [
    { id: 'v-1', name: '다온디자인', category: '기본 인테리어' },
    { id: 'v-2', name: '현대사인', category: '간판/외부사인' },
    { id: 'v-3', name: '제일공조', category: '냉난방/닥트' }
];

const MOCK_CATALOG = [
    { id: 'eq-1', name: '에스프레소 머신', price: 15000000 },
    { id: 'eq-2', name: '제빙기', price: 2000000 },
    { id: 'eq-3', name: '그라인더', price: 3000000 },
];

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
        expenses: { 
            equipmentItems: [{ itemId: 'eq-1', qty: 1 }, { itemId: 'eq-2', qty: 1 }],
            interiorItems: [{ id: 'int-0', vendorId: 'v-1', price: 30000000 }, { id: 'int-1', vendorId: 'v-2', price: 5000000 }]
        }
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
        expenses: { 
            equipmentItems: [{ itemId: 'eq-1', qty: 1 }, { itemId: 'eq-3', qty: 2 }],
            interiorItems: [{ id: 'int-2', vendorId: 'v-1', price: 38000000 }]
        }
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
        expenses: { 
            equipmentItems: [],
            interiorItems: [{ id: 'int-3', vendorId: 'v-1', price: 15000000 }]
        }
    }
];

const TABS = [
    { id: 'dashboard', label: '정산 대시보드', icon: BarChart3 },
    { id: 'basic', label: '가맹점 기본정보', icon: FileText },
    { id: 'sales', label: '매출/수금 관리', icon: DollarSign },
    { id: 'expense', label: '매입/비용 관리', icon: ShoppingCart },
    { id: 'accounting', label: '월별 세무/전표', icon: Calculator },
];

const DateInlineEditor = ({ value, onSave }) => {
    const [editValue, setEditValue] = React.useState(value || '');
    const isChanged = editValue !== (value || '');
    
    // 외부에서 데이터 변경 시 동기화
    React.useEffect(() => {
        setEditValue(value || '');
    }, [value]);

    return (
        <div className="flex items-center gap-1">
            <input 
                type="date" 
                value={editValue} 
                onChange={(e) => setEditValue(e.target.value)}
                className="w-28 px-1 py-1 border border-transparent rounded-md text-xs text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 hover:bg-white hover:border-slate-300 transition-colors bg-transparent"
            />
            {isChanged && (
                <button 
                    onClick={() => onSave(editValue)}
                    className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded shadow hover:bg-indigo-700 transition-colors whitespace-nowrap"
                >
                    저장
                </button>
            )}
        </div>
    );
};

const FranchiseDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Catalog State (Equipment only)
    const [expenseCatalog, setExpenseCatalog] = useState(() => {
        const saved = localStorage.getItem('expenseCatalogV2');
        return saved ? JSON.parse(saved) : MOCK_CATALOG;
    });

    useEffect(() => {
        localStorage.setItem('expenseCatalogV2', JSON.stringify(expenseCatalog));
    }, [expenseCatalog]);

    // Vendor State (Interior)
    const [vendorCatalog, setVendorCatalog] = useState(() => {
        const saved = localStorage.getItem('vendorCatalogV2');
        return saved ? JSON.parse(saved) : MOCK_VENDORS;
    });

    useEffect(() => {
        localStorage.setItem('vendorCatalogV2', JSON.stringify(vendorCatalog));
    }, [vendorCatalog]);

    // Franchises State
    const [franchises, setFranchises] = useState(() => {
        const saved = localStorage.getItem('franchisesV2');
        return saved ? JSON.parse(saved) : MOCK_FRANCHISES;
    });

    useEffect(() => {
        localStorage.setItem('franchisesV2', JSON.stringify(franchises));
    }, [franchises]);

    // Bank Transactions State
    const [bankTransactions, setBankTransactions] = useState(() => {
        const saved = localStorage.getItem('bankTransactionsV1');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('bankTransactionsV1', JSON.stringify(bankTransactions));
    }, [bankTransactions]);

    const getCurrentMonth = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };
    
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

    const handlePrevMonth = () => {
        if (!selectedMonth) return;
        const [year, month] = selectedMonth.split('-');
        const date = new Date(year, parseInt(month) - 1 - 1, 1);
        setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    };

    const handleNextMonth = () => {
        if (!selectedMonth) return;
        const [year, month] = selectedMonth.split('-');
        const date = new Date(year, parseInt(month) - 1 + 1, 1);
        setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    };
    
    // 모달 상태
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newFranchise, setNewFranchise] = useState({ name: '', owner: '', bizNumber: '', bizType: '', contractDate: '', openDate: '' });

    // 단가표 관리 모달 (기기장비 전용)
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
    const [newCatalogItem, setNewCatalogItem] = useState({ name: '', price: '' });

    // 협력업체 관리 모달 (인테리어 등)
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [newVendorItem, setNewVendorItem] = useState({ name: '', category: '' });

    // 비용 매칭 모달
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [matchingFranchise, setMatchingFranchise] = useState(null);
    const [editingEquipmentItems, setEditingEquipmentItems] = useState([]);
    const [editingInteriorItems, setEditingInteriorItems] = useState([]);

    // 입금 매칭 모달
    const [isDepositMatchModalOpen, setIsDepositMatchModalOpen] = useState(false);
    const [selectedDepositTxn, setSelectedDepositTxn] = useState(null);
    const [depositMatchForm, setDepositMatchForm] = useState({ franchiseId: '', category: '' });
    
    // 파일 업로드 ref 및 계좌 선택 상태
    const fileInputRef = useRef(null);
    const [uploadingAccount, setUploadingAccount] = useState('');
    
    // 미매칭 내역 검색 및 필터
    const [unmatchedSearchTerm, setUnmatchedSearchTerm] = useState('');
    const [unmatchedAccountFilter, setUnmatchedAccountFilter] = useState('ALL');

    // 세무/전표 탭 아코디언 상태
    const [expandedVendors, setExpandedVendors] = useState({});
    const [expandedEquipments, setExpandedEquipments] = useState({});

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
            expenses: { equipmentItems: [], interiorItems: [] }
        };
        setFranchises([...franchises, newEntry]);
        setIsAddModalOpen(false);
        setNewFranchise({ name: '', owner: '', bizNumber: '', bizType: '', contractDate: '', openDate: '' });
        setActiveTab('basic');
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

    // 엑셀 파일 파싱
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            
            // 2D 배열로 전체 데이터 가져오기
            const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            
            // 헤더 행 찾기 (보통 '입금' 이나 '거래일시'가 포함된 행)
            let headerRowIndex = 0;
            for (let i = 0; i < Math.min(rawData.length, 20); i++) {
                const rowStr = rawData[i].join('').replace(/\s/g, '');
                if (rowStr.includes('입금') || rowStr.includes('거래일시') || rowStr.includes('적요')) {
                    headerRowIndex = i;
                    break;
                }
            }

            const headers = rawData[headerRowIndex].map(h => String(h).trim().replace(/\s/g, ''));
            const newTxns = [];

            // 데이터 행 순회
            for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                const rowArray = rawData[i];
                if (!rowArray || rowArray.length === 0) continue;

                // 헤더를 키로 하는 객체 생성
                const rowObj = {};
                headers.forEach((h, idx) => {
                    rowObj[h] = rowArray[idx];
                });

                // 금액 파싱 (콤마 제거)
                let amountStr = String(rowObj['입금'] || rowObj['입금액'] || rowObj['입금액(원)'] || '0').replace(/,/g, '').trim();
                const amount = Number(amountStr);

                // 중복 방지를 위한 고유 키 생성 (날짜_적요_메모_의뢰인_금액_계좌)
                const uniqueKey = `${String(rowObj['거래일시'] || rowObj['거래일자'] || '')}_${String(rowObj['적요'] || '')}_${String(rowObj['메모'] || '')}_${String(rowObj['의뢰인/수취인'] || rowObj['의뢰인'] || rowObj['보낸사람'] || rowObj['수취인'] || '')}_${amount}_${uploadingAccount}`;
                
                if (amount > 0) {
                    newTxns.push({
                        id: uniqueKey, // 식별자로 고유 키 사용
                        date: String(rowObj['거래일시'] || rowObj['거래일자'] || ''),
                        summary: String(rowObj['적요'] || ''),
                        memo: String(rowObj['메모'] || ''),
                        sender: String(rowObj['의뢰인/수취인'] || rowObj['의뢰인'] || rowObj['보낸사람'] || rowObj['수취인'] || ''),
                        amount: amount,
                        account: uploadingAccount,
                        matchedFranchiseId: null,
                        matchedCategory: null
                    });
                }
            }

            // 기존 내역과 비교하여 중복 제거
            const existingKeys = new Set(bankTransactions.map(t => t.id));
            const uniqueNewTxns = newTxns.filter(t => !existingKeys.has(t.id));
            const duplicateCount = newTxns.length - uniqueNewTxns.length;

            if (uniqueNewTxns.length > 0) {
                setBankTransactions([...bankTransactions, ...uniqueNewTxns]);
                let msg = `${uniqueNewTxns.length}건의 입금 내역이 새로 추가되었습니다.`;
                if (duplicateCount > 0) msg += `\n(이미 업로드된 ${duplicateCount}건의 중복 내역은 제외되었습니다.)`;
                alert(msg);
            } else {
                if (duplicateCount > 0) {
                    alert(`업로드하신 ${duplicateCount}건 모두 이미 등록된 중복 내역입니다.`);
                } else {
                    alert('유효한 입금 내역을 찾을 수 없습니다.\n엑셀 파일 상단에 "거래일시", "입금", "의뢰인/수취인" 등의 열이 있는지 확인해주세요.');
                }
            }
            e.target.value = null; // reset input
            setUploadingAccount(''); // 리셋
        };
        reader.readAsBinaryString(file);
    };

    // 매칭 팝업 열기
    const openDepositMatchModal = (txn) => {
        setSelectedDepositTxn(txn);
        let defaultCategory = '';
        if (txn.account === '17104') defaultCategory = 'franchiseFee';
        else if (txn.account === '85804') defaultCategory = 'deposit';
        
        setDepositMatchForm({ franchiseId: '', category: defaultCategory });
        setIsDepositMatchModalOpen(true);
    };

    // 미매칭 내역 삭제
    const handleDeleteUnmatchedTxn = (id) => {
        if(confirm('이 내역을 목록에서 삭제하시겠습니까? (실제 계좌 내역에는 영향이 없습니다)')) {
            setBankTransactions(bankTransactions.filter(t => t.id !== id));
        }
    };

    const handleClearAllUnmatchedTxns = () => {
        if(confirm('현재 미매칭된 모든 내역을 삭제하시겠습니까?')) {
            setBankTransactions(bankTransactions.filter(t => t.matchedFranchiseId !== null));
        }
    };

    // 입금 매칭 실행
    const handleMatchDeposit = (e) => {
        e.preventDefault();
        const { franchiseId, category } = depositMatchForm;
        if(!franchiseId || !category || !selectedDepositTxn) return;

        // 1. Update bankTransaction
        const updatedTxns = bankTransactions.map(t => 
            t.id === selectedDepositTxn.id 
                ? { ...t, matchedFranchiseId: franchiseId, matchedCategory: category } 
                : t
        );
        setBankTransactions(updatedTxns);

        // 2. Add amount to selected franchise sales
        const amount = selectedDepositTxn.amount;
        const updatedFranchises = franchises.map(f => {
            if (f.id === franchiseId) {
                let newSales = JSON.parse(JSON.stringify(f.sales)); // deep clone
                if (category === 'franchiseFee') newSales.franchiseFee += amount;
                else if (category === 'educationFee') newSales.educationFee += amount;
                else if (category === 'deposit') newSales.open.deposit += amount;
                else if (category === 'middle') newSales.open.middle += amount;
                else if (category === 'balance') newSales.open.balance += amount;
                return { ...f, sales: newSales };
            }
            return f;
        });
        setFranchises(updatedFranchises);
        
        setIsDepositMatchModalOpen(false);
        setSelectedDepositTxn(null);
    };

    const handleUnmatchDeposit = (txnId) => {
        if (!window.confirm("매칭을 취소하고 다시 미매칭 상태로 되돌리시겠습니까?")) return;

        const txn = bankTransactions.find(t => t.id === txnId);
        if (!txn || !txn.matchedFranchiseId || !txn.matchedCategory) return;

        // 1. Subtract amount from franchise sales
        const amount = txn.amount;
        const updatedFranchises = franchises.map(f => {
            if (f.id === txn.matchedFranchiseId) {
                let newSales = JSON.parse(JSON.stringify(f.sales)); // deep clone
                if (txn.matchedCategory === 'franchiseFee') newSales.franchiseFee -= amount;
                else if (txn.matchedCategory === 'educationFee') newSales.educationFee -= amount;
                else if (txn.matchedCategory === 'deposit') newSales.open.deposit -= amount;
                else if (txn.matchedCategory === 'middle') newSales.open.middle -= amount;
                else if (txn.matchedCategory === 'balance') newSales.open.balance -= amount;
                
                // 음수 방지 (안전 장치)
                if (newSales.franchiseFee < 0) newSales.franchiseFee = 0;
                if (newSales.educationFee < 0) newSales.educationFee = 0;
                if (newSales.open.deposit < 0) newSales.open.deposit = 0;
                if (newSales.open.middle < 0) newSales.open.middle = 0;
                if (newSales.open.balance < 0) newSales.open.balance = 0;

                return { ...f, sales: newSales };
            }
            return f;
        });
        setFranchises(updatedFranchises);

        // 2. Clear matched info from bankTransaction
        const updatedTxns = bankTransactions.map(t => 
            t.id === txnId 
                ? { ...t, matchedFranchiseId: null, matchedCategory: null } 
                : t
        );
        setBankTransactions(updatedTxns);
    };

    // 마스터 단가표(기기장비) 추가
    const handleAddCatalogItem = (e) => {
        e.preventDefault();
        if(!newCatalogItem.name || !newCatalogItem.price) return;
        
        const newItem = {
            id: 'eq-' + Date.now(),
            name: newCatalogItem.name,
            price: Number(newCatalogItem.price)
        };
        setExpenseCatalog([...expenseCatalog, newItem]);
        setNewCatalogItem({ name: '', price: '' });
    };

    const handleDeleteCatalogItem = (id) => {
        setExpenseCatalog(expenseCatalog.filter(item => item.id !== id));
    };

    // 협력업체 마스터 추가
    const handleAddVendorItem = (e) => {
        e.preventDefault();
        if(!newVendorItem.name || !newVendorItem.category) return;
        
        const newItem = {
            id: 'v-' + Date.now(),
            name: newVendorItem.name,
            category: newVendorItem.category
        };
        setVendorCatalog([...vendorCatalog, newItem]);
        setNewVendorItem({ name: '', category: '' });
    };

    const handleDeleteVendorItem = (id) => {
        setVendorCatalog(vendorCatalog.filter(item => item.id !== id));
    };

    // 비용 상세 모달 열기
    const openMatchModal = (f) => {
        setMatchingFranchise(f);
        setEditingEquipmentItems([...(f.expenses?.equipmentItems || [])]);
        setEditingInteriorItems([...(f.expenses?.interiorItems || [])]);
        setIsMatchModalOpen(true);
    };

    // 기기장비 수량 변경
    const handleEquipmentQtyChange = (itemId, qty) => {
        const parsedQty = parseInt(qty, 10);
        let newItems = [...editingEquipmentItems];
        const existIndex = newItems.findIndex(i => i.itemId === itemId);
        
        if (isNaN(parsedQty) || parsedQty <= 0) {
            if (existIndex >= 0) newItems.splice(existIndex, 1);
        } else {
            if (existIndex >= 0) {
                newItems[existIndex].qty = parsedQty;
            } else {
                newItems.push({ itemId, qty: parsedQty });
            }
        }
        setEditingEquipmentItems(newItems);
    };

    // 인테리어 항목 추가
    const handleAddInterior = () => {
        setEditingInteriorItems([
            ...editingInteriorItems, 
            { id: 'int-' + Date.now(), vendorId: '', price: 0 }
        ]);
    };

    // 인테리어 항목 변경
    const handleUpdateInterior = (id, field, value) => {
        setEditingInteriorItems(editingInteriorItems.map(item => 
            item.id === id ? { ...item, [field]: field === 'price' ? Number(value) : value } : item
        ));
    };

    // 인테리어 항목 삭제
    const handleDeleteInterior = (id) => {
        setEditingInteriorItems(editingInteriorItems.filter(item => item.id !== id));
    };

    // 매칭 결과 저장
    const handleSaveExpenses = () => {
        setFranchises(franchises.map(f => 
            f.id === matchingFranchise.id 
                ? { ...f, expenses: { equipmentItems: editingEquipmentItems, interiorItems: editingInteriorItems } }
                : f
        ));
        setIsMatchModalOpen(false);
    };

    const calcTotalSales = (f) => f.sales.franchiseFee + f.sales.educationFee + f.sales.open.deposit + f.sales.open.middle + f.sales.open.balance;
    
    const calcEquipmentExpense = (f) => {
        if (!f.expenses?.equipmentItems) return 0;
        return f.expenses.equipmentItems.reduce((acc, item) => {
            const catalogItem = expenseCatalog.find(c => c.id === item.itemId);
            return acc + (catalogItem ? catalogItem.price * item.qty : 0);
        }, 0);
    };

    const calcInteriorExpense = (f) => {
        if (!f.expenses?.interiorItems) return 0;
        return f.expenses.interiorItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    };

    const calcTotalExpenses = (f) => calcEquipmentExpense(f) + calcInteriorExpense(f);

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
                                            <DateInlineEditor 
                                                value={f.openDate} 
                                                onSave={(newDate) => handleUpdateOpenDate(f.id, newDate)} 
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right text-green-600 font-medium">{totalSales.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-red-600 font-medium">{totalExpenses.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-indigo-600 font-bold">{margin.toLocaleString()}</td>
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
                                        <DateInlineEditor 
                                            value={f.openDate} 
                                            onSave={(newDate) => handleUpdateOpenDate(f.id, newDate)} 
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
    const renderSalesTab = () => {
        const totalUnmatchedTxns = bankTransactions.filter(t => !t.matchedFranchiseId);
        
        let displayUnmatchedTxns = totalUnmatchedTxns;
        
        if (unmatchedAccountFilter !== 'ALL') {
            // 미지정 계좌도 필터링을 원할 수 있으므로, 해당 문자열과 비교
            displayUnmatchedTxns = displayUnmatchedTxns.filter(t => (t.account || '') === unmatchedAccountFilter);
        }

        if (unmatchedSearchTerm) {
            const term = unmatchedSearchTerm.toLowerCase();
            displayUnmatchedTxns = displayUnmatchedTxns.filter(t => 
                (t.summary && t.summary.toLowerCase().includes(term)) || 
                (t.memo && t.memo.toLowerCase().includes(term)) || 
                (t.sender && t.sender.toLowerCase().includes(term)) ||
                (t.amount && t.amount.toString().includes(term))
            );
        }

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">매출/수금 내역</h2>
                    <div className="flex gap-2">
                        <input 
                            type="file" 
                            accept=".xlsx, .xls" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        <button 
                            onClick={() => { setUploadingAccount('17104'); fileInputRef.current.click(); }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                        >
                            <Plus className="w-4 h-4" /> 가맹/교육비 (17104계좌)
                        </button>
                        <button 
                            onClick={() => { setUploadingAccount('85804'); fileInputRef.current.click(); }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            <Plus className="w-4 h-4" /> 계약/중도/잔금 (85804계좌)
                        </button>
                    </div>
                </div>

                {/* 미매칭 입금 내역 */}
                {totalUnmatchedTxns.length > 0 && (
                    <div className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 overflow-hidden mb-6">
                        <div className="px-4 py-3 border-b border-orange-200 bg-orange-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <h3 className="font-bold text-orange-800">미매칭 입금 내역 ({totalUnmatchedTxns.length}건)</h3>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <select
                                    value={unmatchedAccountFilter}
                                    onChange={(e) => setUnmatchedAccountFilter(e.target.value)}
                                    className="px-2 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:border-orange-500 bg-white"
                                >
                                    <option value="ALL">전체 계좌</option>
                                    <option value="17104">17104 (가맹비/교육비)</option>
                                    <option value="85804">85804 (계약/중도/잔금)</option>
                                    <option value="">미지정</option>
                                </select>
                                <input 
                                    type="text"
                                    placeholder="적요, 메모, 수취인, 금액 검색..."
                                    value={unmatchedSearchTerm}
                                    onChange={(e) => setUnmatchedSearchTerm(e.target.value)}
                                    className="px-3 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:border-orange-500 w-full sm:w-64"
                                />
                                <button 
                                    onClick={handleClearAllUnmatchedTxns}
                                    className="text-xs px-2 py-1 bg-white text-orange-600 border border-orange-300 rounded hover:bg-orange-50 font-medium whitespace-nowrap"
                                >
                                    미매칭 전체 삭제
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto max-h-60 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-orange-700 bg-orange-50 border-b border-orange-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-2">수신계좌</th>
                                        <th className="px-4 py-2">거래일시</th>
                                        <th className="px-4 py-2">적요 / 메모</th>
                                        <th className="px-4 py-2">의뢰인/수취인</th>
                                        <th className="px-4 py-2 text-right">입금액(원)</th>
                                        <th className="px-4 py-2 text-center">작업</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayUnmatchedTxns.map(txn => (
                                        <tr key={txn.id} className="border-b border-orange-100 hover:bg-orange-100/50">
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${txn.account === '17104' ? 'bg-indigo-100 text-indigo-800' : txn.account === '85804' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                                                    {txn.account || '미지정'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">{txn.date}</td>
                                            <td className="px-4 py-2 text-xs">
                                                <div className="font-medium">{txn.summary}</div>
                                                <div className="text-orange-600">{txn.memo}</div>
                                            </td>
                                            <td className="px-4 py-2 font-bold text-slate-700">{txn.sender}</td>
                                            <td className="px-4 py-2 text-right font-bold text-indigo-600">
                                                {txn.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button 
                                                        onClick={() => openDepositMatchModal(txn)}
                                                        className="px-3 py-1 bg-white border border-orange-300 text-orange-700 rounded hover:bg-orange-50 text-xs font-bold"
                                                    >
                                                        매칭하기
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteUnmatchedTxn(txn.id)}
                                                        className="p-1 text-orange-400 hover:text-red-500 transition-colors"
                                                        title="내역 삭제"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {displayUnmatchedTxns.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-orange-600 font-medium">
                                                검색 결과가 없습니다.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">가맹점별 수금 현황</h3>
                    </div>
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
    };

    const renderExpenseTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">매입/비용 내역</h2>
                <div className="flex gap-2">
                    <button onClick={() => setIsVendorModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm">
                        <Settings className="w-4 h-4" /> 협력업체(인테리어) 마스터
                    </button>
                    <button onClick={() => setIsCatalogModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm">
                        <Settings className="w-4 h-4" /> 기기장비 마스터
                    </button>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">가맹점명</th>
                                <th className="px-4 py-3 text-right">총 매입액</th>
                                <th className="px-4 py-3 text-right text-orange-500">인테리어 합계</th>
                                <th className="px-4 py-3 text-right text-purple-500">기기장비 합계</th>
                                <th className="px-4 py-3 text-center">비용 상세 입력</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFranchises.map(f => (
                                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-bold text-slate-800">{f.name}</td>
                                    <td className="px-4 py-3 text-right font-bold text-red-600">{calcTotalExpenses(f).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-orange-600">{calcInteriorExpense(f).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-purple-600">{calcEquipmentExpense(f).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => openMatchModal(f)} className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-100 font-medium">
                                            매입/비용 입력
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

    const renderAccountingTab = () => {
        // 1. 매출 세금계산서 발행용 집계 (오픈일자 기준)
        const filteredFranchisesForTax = selectedMonth 
            ? franchises.filter(f => f.openDate && f.openDate.startsWith(selectedMonth))
            : franchises;

        // 2. 입금 내역별 전표 발행 내역 (입금일자 기준)
        const filteredBankTxnsForVoucher = selectedMonth
            ? bankTransactions.filter(t => t.matchedFranchiseId && t.date && t.date.startsWith(selectedMonth))
            : bankTransactions.filter(t => t.matchedFranchiseId);

        return (
            <div className="space-y-8">
                {!selectedMonth && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-center gap-2">
                        <span className="font-bold">안내:</span> 
                        <span>우측 상단에서 <strong>오픈월 선택</strong>을 하시면 해당 월의 세무/전표 데이터를 정확히 보실 수 있습니다.</span>
                    </div>
                )}

                {/* 매출 세금계산서 발행용 집계 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-lg font-bold text-slate-800">1. 월별 매출 확정 내역 (세금계산서 발행용)</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            오픈일자 기준으로 해당 월에 확정된 가맹점별 매출입니다. (오픈비용: 계약금+중도금+잔금 합계)
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs whitespace-nowrap">
                                <tr>
                                    <th className="px-4 py-3 border-b border-slate-200" rowSpan="2">가맹점명</th>
                                    <th className="px-4 py-3 border-b border-slate-200" rowSpan="2">사업자번호</th>
                                    <th className="px-4 py-2 text-center border-l border-slate-200 border-b border-slate-200" colSpan="3">가맹비+교육비 (입금총액 기준)</th>
                                    <th className="px-4 py-2 text-center border-l border-slate-200 border-b border-slate-200" colSpan="3">오픈비용 (입금총액 기준)</th>
                                </tr>
                                <tr>
                                    <th className="px-4 py-2 text-right border-l border-slate-200 bg-indigo-50/50">합계(총액)</th>
                                    <th className="px-4 py-2 text-right bg-indigo-50/30">공급가액</th>
                                    <th className="px-4 py-2 text-right bg-indigo-50/30">부가세</th>
                                    <th className="px-4 py-2 text-right border-l border-slate-200 bg-orange-50/50">합계(총액)</th>
                                    <th className="px-4 py-2 text-right bg-orange-50/30">공급가액</th>
                                    <th className="px-4 py-2 text-right bg-orange-50/30">부가세</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFranchisesForTax.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                                            선택하신 월에 오픈하는 가맹점이 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFranchisesForTax.map(f => {
                                        // 가맹+교육비 역산
                                        const basicTotal = (f.sales.franchiseFee || 0) + (f.sales.educationFee || 0);
                                        const basicSupply = Math.round(basicTotal / 1.1);
                                        const basicVat = basicTotal - basicSupply;

                                        // 오픈비용 역산
                                        const openTotal = (f.sales.open.deposit || 0) + (f.sales.open.middle || 0) + (f.sales.open.balance || 0);
                                        const openSupply = Math.round(openTotal / 1.1);
                                        const openVat = openTotal - openSupply;

                                        return (
                                            <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{f.name}</td>
                                                <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{f.bizNumber || '-'}</td>
                                                
                                                <td className="px-4 py-3 text-right font-bold text-indigo-700 border-l border-slate-100 bg-indigo-50/30">{basicTotal.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-slate-600 bg-indigo-50/10">{basicSupply.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-slate-500 bg-indigo-50/10">{basicVat.toLocaleString()}</td>
                                                
                                                <td className="px-4 py-3 text-right font-bold text-orange-700 border-l border-slate-100 bg-orange-50/30">{openTotal.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-slate-600 bg-orange-50/10">{openSupply.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-slate-500 bg-orange-50/10">{openVat.toLocaleString()}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 입금 매칭 전표 작성용 데이터 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-lg font-bold text-slate-800">2. 월별 입금 매칭 내역 (전표 작성용)</h2>
                        <p className="text-sm text-slate-500 mt-1">해당 월에 은행으로 입금되어 가맹점과 매칭이 완료된 내역입니다.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs whitespace-nowrap">
                                <tr>
                                    <th className="px-4 py-3">입금일자</th>
                                    <th className="px-4 py-3">가맹점(거래처)</th>
                                    <th className="px-4 py-3">사업자번호</th>
                                    <th className="px-4 py-3">수신계좌</th>
                                    <th className="px-4 py-3">수금항목</th>
                                    <th className="px-4 py-3">적요/메모</th>
                                    <th className="px-4 py-3 text-right">입금액(원)</th>
                                    <th className="px-4 py-3 text-center">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBankTxnsForVoucher.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                                            선택하신 월에 매칭된 입금 내역이 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBankTxnsForVoucher.sort((a,b) => a.date.localeCompare(b.date)).map(txn => {
                                        const matchedFranchise = franchises.find(f => f.id === txn.matchedFranchiseId);
                                        const fName = matchedFranchise ? matchedFranchise.name : '알수없음';
                                        const fBizNum = matchedFranchise ? matchedFranchise.bizNumber : '-';
                                        
                                        const catMap = {
                                            'franchiseFee': '가맹비',
                                            'educationFee': '교육비',
                                            'deposit': '계약금',
                                            'middle': '중도금',
                                            'balance': '잔금'
                                        };
                                        const catLabel = catMap[txn.matchedCategory] || txn.matchedCategory;

                                        return (
                                            <tr key={txn.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="px-4 py-3 whitespace-nowrap">{txn.date}</td>
                                                <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{fName}</td>
                                                <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{fBizNum || '-'}</td>
                                                <td className="px-4 py-3 text-xs whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded font-bold ${txn.account === '17104' ? 'bg-indigo-100 text-indigo-800' : txn.account === '85804' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                                                        {txn.account || '미지정'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{catLabel}</td>
                                                <td className="px-4 py-3 text-xs">
                                                    <div className="font-medium">{txn.summary}</div>
                                                    <div className="text-slate-500">{txn.memo}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-indigo-600 whitespace-nowrap">{txn.amount.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button 
                                                        onClick={() => handleUnmatchDeposit(txn.id)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors font-medium border border-rose-200 whitespace-nowrap"
                                                        title="매칭 취소"
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                        원복
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. 월별 매입 세부 내역 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">3. 월별 매입 세부 내역 (협력업체별)</h2>
                            <p className="text-sm text-slate-500 mt-1">해당 월에 오픈하는 가맹점의 인테리어 등 협력업체 매입 내역입니다.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs whitespace-nowrap">
                                <tr>
                                    <th className="px-4 py-3 w-8"></th>
                                    <th className="px-4 py-3">협력업체명</th>
                                    <th className="px-4 py-3">취급분야</th>
                                    <th className="px-4 py-3 text-right">총 매입가액(원)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const interiorDetails = filteredFranchisesForTax.flatMap(f => (f.expenses?.interiorItems || []).map(item => ({ f, item })));
                                    if (interiorDetails.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                                                    매입 세부 내역이 없습니다.
                                                </td>
                                            </tr>
                                        );
                                    }
                                    
                                    const grouped = interiorDetails.reduce((acc, curr) => {
                                        const vId = curr.item.vendorId;
                                        if (!acc[vId]) acc[vId] = { vendor: vendorCatalog.find(v => v.id === vId), items: [], total: 0 };
                                        acc[vId].items.push(curr);
                                        acc[vId].total += Number(curr.item.price) || 0;
                                        return acc;
                                    }, {});

                                    return Object.entries(grouped).map(([vId, group]) => {
                                        const isExpanded = expandedVendors[vId];
                                        return (
                                            <React.Fragment key={vId}>
                                                <tr 
                                                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                                                    onClick={() => setExpandedVendors(prev => ({...prev, [vId]: !prev[vId]}))}
                                                >
                                                    <td className="px-4 py-3 text-slate-400">
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-slate-800">{group.vendor ? group.vendor.name : '알수없음'}</td>
                                                    <td className="px-4 py-3 text-slate-600">{group.vendor ? group.vendor.category : '-'}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-red-600">{group.total.toLocaleString()}</td>
                                                </tr>
                                                {isExpanded && group.items.map((detail, idx) => (
                                                    <tr key={`${vId}-detail-${idx}`} className="bg-slate-50/50 border-b border-slate-50 text-xs">
                                                        <td className="px-4 py-2 border-l-2 border-red-300"></td>
                                                        <td className="px-4 py-2 text-slate-700" colSpan="2">
                                                            ↳ {detail.f.name} {detail.f.bizNumber ? `(${detail.f.bizNumber})` : ''}
                                                        </td>
                                                        <td className="px-4 py-2 text-right text-slate-600 font-medium">
                                                            {Number(detail.item.price).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. 기기장비 불출 내역 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">4. 월별 기기장비 불출 내역 (장비별)</h2>
                            <p className="text-sm text-slate-500 mt-1">해당 월에 오픈하는 가맹점에 불출된 기기장비 내역입니다.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs whitespace-nowrap">
                                <tr>
                                    <th className="px-4 py-3 w-8"></th>
                                    <th className="px-4 py-3">장비명</th>
                                    <th className="px-4 py-3 text-right">단가(원)</th>
                                    <th className="px-4 py-3 text-center">총 수량(개)</th>
                                    <th className="px-4 py-3 text-right">총 합계(원)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const equipmentDetails = filteredFranchisesForTax.flatMap(f => (f.expenses?.equipmentItems || []).map(item => ({ f, item })));
                                    if (equipmentDetails.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                                    기기장비 불출 내역이 없습니다.
                                                </td>
                                            </tr>
                                        );
                                    }
                                    
                                    const grouped = equipmentDetails.reduce((acc, curr) => {
                                        const eqId = curr.item.itemId;
                                        if (!acc[eqId]) {
                                            acc[eqId] = { eq: expenseCatalog.find(c => c.id === eqId), items: [], totalQty: 0, totalPrice: 0 };
                                        }
                                        acc[eqId].items.push(curr);
                                        acc[eqId].totalQty += curr.item.qty;
                                        acc[eqId].totalPrice += (acc[eqId].eq ? acc[eqId].eq.price : 0) * curr.item.qty;
                                        return acc;
                                    }, {});

                                    return Object.entries(grouped).map(([eqId, group]) => {
                                        const isExpanded = expandedEquipments[eqId];
                                        return (
                                            <React.Fragment key={eqId}>
                                                <tr 
                                                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                                                    onClick={() => setExpandedEquipments(prev => ({...prev, [eqId]: !prev[eqId]}))}
                                                >
                                                    <td className="px-4 py-3 text-slate-400">
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-slate-800">{group.eq ? group.eq.name : '알수없음'}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{group.eq ? group.eq.price.toLocaleString() : '0'}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-slate-800">{group.totalQty}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-purple-600">{group.totalPrice.toLocaleString()}</td>
                                                </tr>
                                                {isExpanded && group.items.map((detail, idx) => (
                                                    <tr key={`${eqId}-detail-${idx}`} className="bg-slate-50/50 border-b border-slate-50 text-xs">
                                                        <td className="px-4 py-2 border-l-2 border-purple-300"></td>
                                                        <td className="px-4 py-2 text-slate-700" colSpan="2">
                                                            ↳ {detail.f.name} {detail.f.bizNumber ? `(${detail.f.bizNumber})` : ''}
                                                        </td>
                                                        <td className="px-4 py-2 text-center text-slate-600 font-medium">
                                                            {detail.item.qty}개
                                                        </td>
                                                        <td className="px-4 py-2 text-right text-slate-600 font-medium">
                                                            {((group.eq ? group.eq.price : 0) * detail.item.qty).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

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
                    <div className="flex items-center">
                        <button 
                            onClick={handlePrevMonth}
                            className="p-2 border border-slate-300 border-r-0 rounded-l-lg hover:bg-slate-50 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 z-10"
                            title="이전 달"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <input 
                            type="month" 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-3 py-2 border border-slate-300 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:z-20"
                        />
                        <button 
                            onClick={handleNextMonth}
                            className="p-2 border border-slate-300 border-l-0 rounded-r-lg hover:bg-slate-50 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 z-10"
                            title="다음 달"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
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
                {activeTab === 'accounting' && renderAccountingTab()}
            </div>

            {/* 기기장비 마스터 관리 모달 */}
            {isCatalogModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Settings className="w-5 h-5"/> 기기장비 단가표 관리</h3>
                            <button onClick={() => setIsCatalogModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                            <form onSubmit={handleAddCatalogItem} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                                <h4 className="text-sm font-bold text-slate-800 mb-3">새 기기장비 추가</h4>
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">장비명 (규격)</label>
                                        <input 
                                            type="text" required
                                            value={newCatalogItem.name}
                                            onChange={e => setNewCatalogItem({...newCatalogItem, name: e.target.value})}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                                            placeholder="예: 에스프레소 머신"
                                        />
                                    </div>
                                    <div className="w-40">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">단가 (원)</label>
                                        <input 
                                            type="number" required min="0" step="1000"
                                            value={newCatalogItem.price}
                                            onChange={e => setNewCatalogItem({...newCatalogItem, price: e.target.value})}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-right"
                                            placeholder="0"
                                        />
                                    </div>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 h-[38px]">
                                        추가
                                    </button>
                                </div>
                            </form>

                            <h4 className="text-sm font-bold text-slate-800 mb-2">등록된 기기장비 리스트</h4>
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2 text-left">분류</th>
                                            <th className="px-4 py-2 text-left">장비명</th>
                                            <th className="px-4 py-2 text-right">단가(원)</th>
                                            <th className="px-4 py-2 text-center w-16">삭제</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenseCatalog.map(item => (
                                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-0">
                                                <td className="px-4 py-2">
                                                    <span className="px-2 py-1 text-[10px] rounded-md border bg-purple-50 text-purple-700 border-purple-200">
                                                        기기장비
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-slate-800 font-medium">{item.name}</td>
                                                <td className="px-4 py-2 text-right text-slate-600">{item.price.toLocaleString()}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => handleDeleteCatalogItem(item.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                                                        <Trash2 className="w-4 h-4 mx-auto" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {expenseCatalog.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-slate-500">등록된 품목이 없습니다.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 협력업체 마스터 관리 모달 */}
            {isVendorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Settings className="w-5 h-5"/> 협력업체(인테리어) 마스터 관리</h3>
                            <button onClick={() => setIsVendorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                            <form onSubmit={handleAddVendorItem} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                                <h4 className="text-sm font-bold text-slate-800 mb-3">새 협력업체 추가</h4>
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">업체명</label>
                                        <input 
                                            type="text" required
                                            value={newVendorItem.name}
                                            onChange={e => setNewVendorItem({...newVendorItem, name: e.target.value})}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                                            placeholder="예: 다온디자인"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">취급분야 (종목)</label>
                                        <input 
                                            type="text" required
                                            value={newVendorItem.category}
                                            onChange={e => setNewVendorItem({...newVendorItem, category: e.target.value})}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                                            placeholder="예: 간판/외부사인"
                                        />
                                    </div>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 h-[38px]">
                                        추가
                                    </button>
                                </div>
                            </form>

                            <h4 className="text-sm font-bold text-slate-800 mb-2">등록된 협력업체 리스트</h4>
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2 text-left">취급분야</th>
                                            <th className="px-4 py-2 text-left">업체명</th>
                                            <th className="px-4 py-2 text-center w-16">삭제</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendorCatalog.map(item => (
                                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-0">
                                                <td className="px-4 py-2">
                                                    <span className="px-2 py-1 text-[10px] rounded-md border bg-orange-50 text-orange-700 border-orange-200">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-slate-800 font-medium">{item.name}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => handleDeleteVendorItem(item.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                                                        <Trash2 className="w-4 h-4 mx-auto" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {vendorCatalog.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-8 text-center text-slate-500">등록된 협력업체가 없습니다.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 입금 매칭 팝업 모달 */}
            {isDepositMatchModalOpen && selectedDepositTxn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800">입금 내역 매칭</h3>
                            <button onClick={() => setIsDepositMatchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">수신계좌</span>
                                    <span className={`font-bold ${selectedDepositTxn.account === '17104' ? 'text-indigo-600' : selectedDepositTxn.account === '85804' ? 'text-blue-600' : 'text-slate-800'}`}>
                                        {selectedDepositTxn.account ? `${selectedDepositTxn.account} 계좌` : '미지정'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">거래일시</span>
                                    <span className="font-medium text-slate-800">{selectedDepositTxn.date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">의뢰인</span>
                                    <span className="font-medium text-slate-800">{selectedDepositTxn.sender}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">입금액</span>
                                    <span className="font-bold text-indigo-600">{selectedDepositTxn.amount.toLocaleString()}원</span>
                                </div>
                            </div>
                            
                            <form id="depositMatchForm" onSubmit={handleMatchDeposit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">대상 가맹점 선택</label>
                                    <select 
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                        value={depositMatchForm.franchiseId}
                                        onChange={e => setDepositMatchForm({...depositMatchForm, franchiseId: e.target.value})}
                                    >
                                        <option value="" disabled>가맹점을 선택하세요</option>
                                        {franchises.map(f => (
                                            <option key={f.id} value={f.id}>{f.name} ({f.owner})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">수금 항목 선택</label>
                                    <select 
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                        value={depositMatchForm.category}
                                        onChange={e => setDepositMatchForm({...depositMatchForm, category: e.target.value})}
                                    >
                                        <option value="" disabled>항목을 선택하세요</option>
                                        <option value="franchiseFee">가맹비 (17104 계좌 권장)</option>
                                        <option value="educationFee">교육비 (17104 계좌 권장)</option>
                                        <option value="deposit">계약금 (85804 계좌 권장)</option>
                                        <option value="middle">중도금 (85804 계좌 권장)</option>
                                        <option value="balance">잔금 (85804 계좌 권장)</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex gap-3 shrink-0">
                            <button type="button" onClick={() => setIsDepositMatchModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
                                취소
                            </button>
                            <button type="submit" form="depositMatchForm" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                                매칭 완료 (금액 합산)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 비용 상세 입력 모달 */}
            {isMatchModalOpen && matchingFranchise && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">가맹점 비용 상세 입력</h3>
                                <p className="text-xs text-slate-500 mt-0.5">[{matchingFranchise.name}] 기기장비 수량 선택 및 인테리어 내역 입력</p>
                            </div>
                            <button onClick={() => setIsMatchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-white space-y-8">
                            
                            {/* 인테리어 영역 */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                        인테리어 비용 (직접 입력)
                                    </h4>
                                    <button onClick={handleAddInterior} className="text-xs flex items-center gap-1 text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-1 rounded-md border border-orange-200">
                                        <Plus className="w-3 h-3"/> 항목 추가
                                    </button>
                                </div>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2 text-left">협력업체 선택</th>
                                                <th className="px-4 py-2 text-right w-48">금액(원)</th>
                                                <th className="px-4 py-2 text-center w-16">삭제</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {editingInteriorItems.map((item, idx) => (
                                                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                    <td className="px-4 py-2">
                                                        <select
                                                            value={item.vendorId || ''}
                                                            onChange={(e) => handleUpdateInterior(item.id, 'vendorId', e.target.value)}
                                                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-orange-400"
                                                        >
                                                            <option value="" disabled>업체를 선택하세요</option>
                                                            {vendorCatalog.map(v => (
                                                                <option key={v.id} value={v.id}>[{v.category}] {v.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input 
                                                            type="number" min="0" step="1000"
                                                            value={item.price}
                                                            onChange={(e) => handleUpdateInterior(item.id, 'price', e.target.value)}
                                                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-right focus:outline-none focus:border-orange-400"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button onClick={() => handleDeleteInterior(item.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                                                            <Trash2 className="w-4 h-4 mx-auto" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {editingInteriorItems.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-6 text-center text-slate-400 text-xs bg-slate-50/50">
                                                        우측 상단의 '항목 추가'를 눌러 인테리어 비용을 입력하세요.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {editingInteriorItems.length > 0 && (
                                            <tfoot className="bg-orange-50/50 border-t border-slate-200">
                                                <tr>
                                                    <td className="px-4 py-2 font-bold text-slate-700 text-right">인테리어 소계:</td>
                                                    <td className="px-4 py-2 text-right font-bold text-orange-600">
                                                        {editingInteriorItems.reduce((acc, item) => acc + (Number(item.price)||0), 0).toLocaleString()}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>

                            {/* 기기장비 영역 */}
                            <div>
                                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    기기장비 단가표 매칭
                                </h4>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2 text-left">장비명</th>
                                                <th className="px-4 py-2 text-right">단가(원)</th>
                                                <th className="px-4 py-2 text-center w-24">수량(개)</th>
                                                <th className="px-4 py-2 text-right">합계(원)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expenseCatalog.map(item => {
                                                const matchItem = editingEquipmentItems.find(i => i.itemId === item.id);
                                                const qty = matchItem ? matchItem.qty : '';
                                                const total = qty ? qty * item.price : 0;
                                                
                                                return (
                                                    <tr key={item.id} className={`border-b border-slate-100 ${qty ? 'bg-purple-50/30' : 'hover:bg-slate-50'} last:border-0`}>
                                                        <td className="px-4 py-2 text-slate-800 font-medium">{item.name}</td>
                                                        <td className="px-4 py-2 text-right text-slate-600">{item.price.toLocaleString()}</td>
                                                        <td className="px-4 py-2 text-center">
                                                            <input 
                                                                type="number" min="0" placeholder="0"
                                                                value={qty}
                                                                onChange={(e) => handleEquipmentQtyChange(item.id, e.target.value)}
                                                                className="w-16 px-2 py-1 text-center border border-slate-300 rounded text-sm focus:outline-none focus:border-purple-400"
                                                            />
                                                        </td>
                                                        <td className={`px-4 py-2 text-right font-medium ${qty ? 'text-purple-600' : 'text-slate-300'}`}>
                                                            {total.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {expenseCatalog.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-6 text-center text-slate-400 text-xs bg-slate-50/50">
                                                        등록된 마스터 단가표(기기장비)가 없습니다.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {editingEquipmentItems.length > 0 && (
                                            <tfoot className="bg-purple-50/50 border-t border-slate-200">
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-2 font-bold text-slate-700 text-right">기기장비 소계:</td>
                                                    <td className="px-4 py-2 text-right font-bold text-purple-600">
                                                        {editingEquipmentItems.reduce((acc, match) => {
                                                            const cat = expenseCatalog.find(c => c.id === match.itemId);
                                                            return acc + (cat ? cat.price * match.qty : 0);
                                                        }, 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* 합계 및 저장 영역 */}
                        <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between">
                            <div className="text-sm font-bold text-slate-800">
                                매입/비용 총 합계: <span className="text-red-600 text-xl ml-2">
                                    {(
                                        editingInteriorItems.reduce((acc, item) => acc + (Number(item.price)||0), 0) +
                                        editingEquipmentItems.reduce((acc, match) => {
                                            const cat = expenseCatalog.find(c => c.id === match.itemId);
                                            return acc + (cat ? cat.price * match.qty : 0);
                                        }, 0)
                                    ).toLocaleString()}원
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsMatchModalOpen(false)} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm">
                                    취소
                                </button>
                                <button onClick={handleSaveExpenses} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
                                    저장하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* 신규 등록 모달 */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800">신규 가맹점 등록</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                        <form id="addForm" onSubmit={handleAddSubmit} className="space-y-4">
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
                        </form>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex gap-3 shrink-0">
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
                                취소
                            </button>
                            <button type="submit" form="addForm" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                                등록하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 기본정보 수정 모달 */}
            {isEditModalOpen && editFranchise && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800">가맹점 기본정보 수정</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                        <form id="editForm" onSubmit={handleEditSubmit} className="space-y-4">
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">예상 오픈일자</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                        value={editFranchise.openDate}
                                        onChange={e => setEditFranchise({...editFranchise, openDate: e.target.value})}
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
                        </form>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex gap-3 shrink-0">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
                                취소
                            </button>
                            <button type="submit" form="editForm" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                                저장하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FranchiseDashboard;
