import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Building2, Search, Plus, DollarSign, ShoppingCart, BarChart3, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileText, X, Settings, Trash2, Calculator, RotateCcw, Package, Gift, Store } from 'lucide-react';

const MOCK_VENDORS = [
    { id: 'v-1', name: '다온디자인', category: '기본 인테리어' },
    { id: 'v-2', name: '간판마을', category: '간판/사인물' },
];

const MOCK_CATALOG = [
    { id: 'eq-1', name: '포스기 세트(본체+프린터)', price: 1200000 },
    { id: 'eq-2', name: '키오스크 21인치', price: 2500000 },
    { id: 'eq-3', name: '주방용 프린터', price: 350000 }
];

const MOCK_FRANCHISES = [
    {
        id: 'F20230801',
        name: '강남본점',
        owner: '홍길동',
        bizNumber: '123-45-67890',
        bizType: '일반음식점',
        contractDate: '2023-08-01',
        openDate: '2023-09-15',
        status: '오픈완료',
        sales: { franchiseFee: 15000000, educationFee: 3000000, open: { deposit: 10000000, middle: 20000000, balance: 10000000 } },
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
    { id: 'free_rental', label: '무상 대여 관리', icon: Gift },
    { id: 'operating', label: '운영점 관리', icon: Store },
    { id: 'accounting', label: '월별 세무/전표', icon: Calculator },
    { id: 'monthly_purchases', label: '월별 매입', icon: Package },
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
        const parsed = saved ? JSON.parse(saved) : MOCK_FRANCHISES;
        return parsed.map(f => ({
            ...f,
            freeRentals: f.freeRentals || { equipmentItems: [], interiorItems: [] },
            operating: f.operating || { sales: [], expenses: [], freeRentals: [] }
        }));
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
    const [newFranchise, setNewFranchise] = useState({ name: '', owner: '', bizNumber: '', bizType: '', contractDate: '', openDate: '', isFranchiseFeeCharged: true, isEducationFeeCharged: true, expectedOpenCost: 0 });

    // 단가표 관리 모달 (기기장비 전용)
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
    const [newCatalogItem, setNewCatalogItem] = useState({ name: '', price: '' });

    // 협력업체 관리 모달 (인테리어 등)
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [newVendorItem, setNewVendorItem] = useState({ name: '', category: '' });

    // 비용 매칭 모달
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [matchingFranchise, setMatchingFranchise] = useState(null);
    // 매칭된 입금내역 확인 모달
    const [matchedTxnModalFranchise, setMatchedTxnModalFranchise] = useState(null);
    const [editingEquipmentItems, setEditingEquipmentItems] = useState([]);
    const [editingInteriorItems, setEditingInteriorItems] = useState([]);
    // 무상 대여 관리 모달
    const [isFreeRentalModalOpen, setIsFreeRentalModalOpen] = useState(false);
    const [isOperatingHistoryModalOpen, setIsOperatingHistoryModalOpen] = useState(false);
    const [isOperatingSearchModalOpen, setIsOperatingSearchModalOpen] = useState(false);
    const [operatingSearchKeyword, setOperatingSearchKeyword] = useState('');
    const [selectedOperatingFranchise, setSelectedOperatingFranchise] = useState(null);

    const [isOperatingExpenseModalOpen, setIsOperatingExpenseModalOpen] = useState(false);
    const [isOperatingFreeRentalModalOpen, setIsOperatingFreeRentalModalOpen] = useState(false);
    
    // 추가 거래 내역 모달 공통 상태
    const [operatingTransactionMonth, setOperatingTransactionMonth] = useState('');

    const [freeRentalFranchise, setFreeRentalFranchise] = useState(null);
    const [editingFreeEquipmentItems, setEditingFreeEquipmentItems] = useState([]);
    const [editingFreeInteriorItems, setEditingFreeInteriorItems] = useState([]);

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
        
        const expectedFranchiseFee = (newFranchise.isFranchiseFeeCharged ? 5500000 : 0) + (newFranchise.isEducationFeeCharged ? 2200000 : 0);
        
        const newEntry = {
            id,
            name: newFranchise.name,
            owner: newFranchise.owner,
            bizNumber: newFranchise.bizNumber,
            bizType: newFranchise.bizType,
            contractDate: newFranchise.contractDate,
            openDate: newFranchise.openDate,
            isFranchiseFeeCharged: newFranchise.isFranchiseFeeCharged,
            isEducationFeeCharged: newFranchise.isEducationFeeCharged,
            expectedFranchiseFee: expectedFranchiseFee,
            expectedOpenCost: Number(newFranchise.expectedOpenCost) || 0,
            status: '계약완료',
            sales: { franchiseFee: 0, educationFee: 0, open: { deposit: 0, middle: 0, balance: 0 } },
            expenses: { equipmentItems: [], interiorItems: [] },
            freeRentals: { equipmentItems: [], interiorItems: [] }
        };
        setFranchises([...franchises, newEntry]);
        setIsAddModalOpen(false);
        setNewFranchise({ name: '', owner: '', bizNumber: '', bizType: '', contractDate: '', openDate: '', isFranchiseFeeCharged: true, isEducationFeeCharged: true, expectedOpenCost: 0 });
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
        
        const expectedFranchiseFee = (editFranchise.isFranchiseFeeCharged ? 5500000 : 0) + (editFranchise.isEducationFeeCharged ? 2200000 : 0);
        const updatedFranchise = {
            ...editFranchise,
            expectedFranchiseFee
        };
        
        setFranchises(franchises.map(f => f.id === editFranchise.id ? updatedFranchise : f));
        setIsEditModalOpen(false);
        setEditFranchise(null);
    };

    const handleUpdateOpenDate = (id, newDate) => {
        setFranchises(franchises.map(f => f.id === id ? { ...f, openDate: newDate } : f));
    };

    const handleUpdateExpectedFranchiseFee = (id, expectedFee) => {
        setFranchises(franchises.map(f => f.id === id ? { 
            ...f, 
            expectedFranchiseFee: expectedFee,
            isFranchiseFeeCharged: expectedFee >= 5500000,
            isEducationFeeCharged: expectedFee === 7700000 || expectedFee === 2200000
        } : f));
    };

    const handleUpdateExpectedOpenCost = (id, expectedCost) => {
        setFranchises(franchises.map(f => f.id === id ? { ...f, expectedOpenCost: Number(expectedCost) || 0 } : f));
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
        
        const searchKeyword = txn.sender || '';
        
        // 입금자명으로 가맹점 또는 대표자명 검색
        const matchedFranchises = franchises.filter(f => 
            searchKeyword ? (f.name.includes(searchKeyword) || (f.owner && f.owner.includes(searchKeyword))) : true
        );
        
        // 검색 결과가 딱 1개라면 자동으로 가맹점 선택
        const autoFranchiseId = matchedFranchises.length === 1 ? matchedFranchises[0].id : '';

        setDepositMatchForm({ 
            franchiseId: autoFranchiseId, 
            category: defaultCategory,
            searchKeyword: searchKeyword,
            attributionMonth: txn.date ? txn.date.substring(0, 7) : getCurrentMonth()
        });
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
                if (category === 'operating_sale') {
                    const newOp = JSON.parse(JSON.stringify(f.operating || { sales: [], expenses: [], freeRentals: [] }));
                    newOp.sales.push({
                        id: selectedDepositTxn.id,
                        date: depositMatchForm.attributionMonth || selectedDepositTxn.date.substring(0, 7), // 귀속월 (기본값: 입금월)
                        originalDate: selectedDepositTxn.date, // 실제 입금일자
                        amount: amount,
                        memo: selectedDepositTxn.sender
                    });
                    return { ...f, operating: newOp };
                } else {
                    let newSales = JSON.parse(JSON.stringify(f.sales)); // deep clone
                    if (category === 'franchiseFee') newSales.franchiseFee += amount;
                    else if (category === 'educationFee') newSales.educationFee += amount;
                    else if (category === 'deposit') newSales.open.deposit += amount;
                    else if (category === 'middle') newSales.open.middle += amount;
                    else if (category === 'balance') newSales.open.balance += amount;
                    return { ...f, sales: newSales };
                }
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
                if (txn.matchedCategory === 'operating_sale') {
                    const newOp = JSON.parse(JSON.stringify(f.operating || { sales: [], expenses: [], freeRentals: [] }));
                    newOp.sales = newOp.sales.filter(s => s.id !== txn.id);
                    return { ...f, operating: newOp };
                } else {
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

    // 무상 대여 상세 모달 열기
    const openFreeRentalModal = (f) => {
        setFreeRentalFranchise(f);
        setEditingFreeEquipmentItems([...(f.freeRentals?.equipmentItems || [])]);
        setEditingFreeInteriorItems([...(f.freeRentals?.interiorItems || [])]);
        setIsFreeRentalModalOpen(true);
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

    // 무상 대여 수량 변경
    const handleFreeEquipmentQtyChange = (itemId, qty) => {
        const parsedQty = parseInt(qty, 10);
        let newItems = [...editingFreeEquipmentItems];
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
        setEditingFreeEquipmentItems(newItems);
    };

    const handleAddFreeInterior = () => {
        setEditingFreeInteriorItems([
            ...editingFreeInteriorItems, 
            { id: 'int-' + Date.now(), vendorId: '', price: 0 }
        ]);
    };

    const handleUpdateFreeInterior = (id, field, value) => {
        setEditingFreeInteriorItems(editingFreeInteriorItems.map(item => 
            item.id === id ? { ...item, [field]: field === 'price' ? Number(value) : value } : item
        ));
    };

    const handleDeleteFreeInterior = (id) => {
        setEditingFreeInteriorItems(editingFreeInteriorItems.filter(item => item.id !== id));
    };

    const handleSaveFreeRentals = () => {
        setFranchises(franchises.map(f => 
            f.id === freeRentalFranchise.id 
                ? { ...f, freeRentals: { equipmentItems: editingFreeEquipmentItems, interiorItems: editingFreeInteriorItems } }
                : f
        ));
        setIsFreeRentalModalOpen(false);
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

    const calcFreeEquipmentExpense = (f) => {
        if (!f.freeRentals?.equipmentItems) return 0;
        return f.freeRentals.equipmentItems.reduce((acc, item) => {
            const catalogItem = expenseCatalog.find(c => c.id === item.itemId);
            return acc + (catalogItem ? catalogItem.price * item.qty : 0);
        }, 0);
    };

    const calcFreeInteriorExpense = (f) => {
        if (!f.freeRentals?.interiorItems) return 0;
        return f.freeRentals.interiorItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    };

    const calcTotalFreeRentals = (f) => calcFreeEquipmentExpense(f) + calcFreeInteriorExpense(f);
    
    // 운영점 추가 내역 삭제 핸들러
    const handleDeleteOperatingExpense = (franchiseId, expIndex) => {
        if (!confirm('이 매입/비용 내역을 삭제하시겠습니까?')) return;
        const updated = franchises.map(f => {
            if (f.id === franchiseId) {
                const newExps = f.operating.expenses.filter((_, i) => i !== expIndex);
                return { ...f, operating: { ...f.operating, expenses: newExps } };
            }
            return f;
        });
        setFranchises(updated);
        const currentF = updated.find(f => f.id === franchiseId);
        setSelectedOperatingFranchise(currentF);
    };

    const handleDeleteOperatingFreeRental = (franchiseId, frIndex) => {
        if (!confirm('이 무상 대여 내역을 삭제하시겠습니까?')) return;
        const updated = franchises.map(f => {
            if (f.id === franchiseId) {
                const newFrs = f.operating.freeRentals.filter((_, i) => i !== frIndex);
                return { ...f, operating: { ...f.operating, freeRentals: newFrs } };
            }
            return f;
        });
        setFranchises(updated);
        const currentF = updated.find(f => f.id === franchiseId);
        setSelectedOperatingFranchise(currentF);
    };
    // 운영점 추가 거래 합계 계산
    const calcOperatingSales = (f) => {
        if (!f.operating?.sales) return 0;
        return f.operating.sales.reduce((acc, sale) => acc + (Number(sale.amount) || 0), 0);
    };

    const calcOperatingExpenses = (f) => {
        if (!f.operating?.expenses) return 0;
        return f.operating.expenses.reduce((acc, exp) => {
            const eqSum = (exp.equipmentItems || []).reduce((sum, item) => {
                const catalogItem = expenseCatalog.find(c => c.id === item.itemId);
                return sum + (catalogItem ? catalogItem.price * item.qty : 0);
            }, 0);
            const intSum = (exp.interiorItems || []).reduce((sum, item) => sum + (Number(item.price) || 0), 0);
            return acc + eqSum + intSum;
        }, 0);
    };

    const calcOperatingFreeRentals = (f) => {
        if (!f.operating?.freeRentals) return 0;
        return f.operating.freeRentals.reduce((acc, fr) => {
            const eqSum = (fr.equipmentItems || []).reduce((sum, item) => {
                const catalogItem = expenseCatalog.find(c => c.id === item.itemId);
                return sum + (catalogItem ? catalogItem.price * item.qty : 0);
            }, 0);
            const intSum = (fr.interiorItems || []).reduce((sum, item) => sum + (Number(item.price) || 0), 0);
            return acc + eqSum + intSum;
        }, 0);
    };

    const filteredFranchises = selectedMonth
        ? franchises.filter(f => f.openDate && f.openDate.startsWith(selectedMonth))
        : franchises;

    const activeOperatingFranchises = React.useMemo(() => {
        return franchises.filter(f =>
            calcOperatingSales(f) > 0 ||
            calcOperatingExpenses(f) > 0 ||
            calcOperatingFreeRentals(f) > 0
        );
    }, [franchises, expenseCatalog]);

    const dashboardStats = React.useMemo(() => {
        let totalNewSales = 0;
        let totalNewExpenses = 0;
        let totalOpSales = 0;
        let totalOpExpenses = 0;
        
        const tableData = [];

        franchises.forEach(f => {
            let fNewSales = 0;
            let fNewExpenses = 0;
            let fOpSales = 0;
            let fOpExpenses = 0;
            let isIncluded = false;

            // 1. 신규 오픈 (New Open)
            if (!selectedMonth || (f.openDate && f.openDate.startsWith(selectedMonth))) {
                fNewSales = calcTotalSales(f);
                fNewExpenses = calcTotalExpenses(f);
                totalNewSales += fNewSales;
                totalNewExpenses += fNewExpenses;
                if (fNewSales > 0 || fNewExpenses > 0 || f.openDate) {
                    isIncluded = true;
                }
            }

            // 2. 운영점 (Operating)
            const opSales = f.operating?.sales || [];
            const opExps = f.operating?.expenses || [];
            const opFree = f.operating?.freeRentals || [];

            opSales.forEach(s => {
                if (!selectedMonth || s.date === selectedMonth) {
                    fOpSales += Number(s.amount) || 0;
                    totalOpSales += Number(s.amount) || 0;
                    isIncluded = true;
                }
            });

            const sumOpItems = (arr) => {
                arr.forEach(e => {
                    if (!selectedMonth || e.date === selectedMonth) {
                        const eqSum = (e.equipmentItems || []).reduce((sum, item) => {
                            const catalogItem = expenseCatalog.find(c => c.id === item.itemId);
                            return sum + ((catalogItem ? catalogItem.price : 0) * (item.qty || 1));
                        }, 0);
                        const intSum = (e.interiorItems || []).reduce((sum, item) => sum + (Number(item.price) || 0), 0);
                        fOpExpenses += (eqSum + intSum);
                        totalOpExpenses += (eqSum + intSum);
                        isIncluded = true;
                    }
                });
            };
            sumOpItems(opExps);
            sumOpItems(opFree);

            if (isIncluded) {
                tableData.push({
                    ...f,
                    _dashNewSales: fNewSales,
                    _dashNewExpenses: fNewExpenses,
                    _dashOpSales: fOpSales,
                    _dashOpExpenses: fOpExpenses,
                    _dashTotalSales: fNewSales + fOpSales,
                    _dashTotalExpenses: fNewExpenses + fOpExpenses,
                    _dashMargin: (fNewSales + fOpSales) - (fNewExpenses + fOpExpenses)
                });
            }
        });

        tableData.sort((a, b) => b._dashMargin - a._dashMargin || b._dashTotalSales - a._dashTotalSales);

        return {
            totalNewSales,
            totalNewExpenses,
            totalOpSales,
            totalOpExpenses,
            totalSales: totalNewSales + totalOpSales,
            totalExpenses: totalNewExpenses + totalOpExpenses,
            margin: (totalNewSales + totalOpSales) - (totalNewExpenses + totalOpExpenses),
            tableData
        };
    }, [franchises, selectedMonth, expenseCatalog]);

    const renderDashboard = () => {
        const newFranchises = dashboardStats.tableData.filter(f => f._dashNewSales > 0 || f._dashNewExpenses > 0);
        const opFranchises = dashboardStats.tableData.filter(f => f._dashNewSales === 0 && f._dashNewExpenses === 0);

        const TableHeader = () => (
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-4 py-3 align-middle border-r border-slate-200">코드/가맹점명</th>
                    <th className="px-4 py-3 align-middle border-r border-slate-200">오픈(예정)일자</th>
                    <th className="px-4 py-3 align-middle text-right border-r border-slate-200">총 매출액 (A)</th>
                    <th className="px-4 py-3 align-middle text-right border-r border-slate-200">총 매입/비용 (B)</th>
                    <th className="px-4 py-3 align-middle text-right text-indigo-700">최종 마진 (A-B)</th>
                </tr>
            </thead>
        );

        const renderTableRows = (franchises, isNewOpen) => {
            if (franchises.length === 0) {
                return (
                    <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                            해당 월에 정산할 내역이 있는 {isNewOpen ? '신규가맹점이' : '기존가맹점이'} 없습니다.
                        </td>
                    </tr>
                );
            }

            return franchises.map(f => (
                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 border-r border-slate-200">
                        <div className="font-medium text-slate-800">{f.name}</div>
                        <div className="text-xs text-slate-500">{f.id} | {f.owner}</div>
                        {f.bizNumber && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                                {f.bizNumber} {f.bizType ? `(${f.bizType})` : ''}
                            </div>
                        )}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200">
                        <DateInlineEditor 
                            value={f.openDate} 
                            onSave={(newDate) => handleUpdateOpenDate(f.id, newDate)} 
                        />
                    </td>
                    <td className="px-4 py-3 text-right border-r border-slate-200 bg-slate-50 font-bold text-green-600">
                        {f._dashTotalSales > 0 ? f._dashTotalSales.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-right border-r border-slate-200 bg-slate-50 font-bold text-red-600">
                        {f._dashTotalExpenses > 0 ? f._dashTotalExpenses.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">
                        {f._dashMargin.toLocaleString()}
                    </td>
                </tr>
            ));
        };

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">집계된 가맹점 수</div>
                        <div className="text-2xl font-bold text-slate-800">{dashboardStats.tableData.length}개</div>
                        <div className="text-[11px] text-slate-400 mt-1">선택월 기준 발생건 한정</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">총 예상 매출액</div>
                        <div className="text-2xl font-bold text-green-600">
                            {dashboardStats.totalSales.toLocaleString()}원
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1.5 flex justify-between">
                            <span>신규: {dashboardStats.totalNewSales.toLocaleString()}</span>
                            <span>추가: {dashboardStats.totalOpSales.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">총 매입/비용</div>
                        <div className="text-2xl font-bold text-red-600">
                            {dashboardStats.totalExpenses.toLocaleString()}원
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1.5 flex justify-between">
                            <span>신규: {dashboardStats.totalNewExpenses.toLocaleString()}</span>
                            <span>추가(무상포함): {dashboardStats.totalOpExpenses.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">예상 누적 마진</div>
                        <div className="text-2xl font-bold text-indigo-600">
                            {dashboardStats.margin.toLocaleString()}원
                        </div>
                        <div className="text-[11px] text-indigo-400 mt-1.5">
                            마진율: {dashboardStats.totalSales > 0 ? Math.round((dashboardStats.margin / dashboardStats.totalSales) * 100) : 0}%
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-slate-800">1. 오픈 정산 (신규가맹점)</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <TableHeader />
                            <tbody>
                                {renderTableRows(newFranchises, true)}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-slate-800">2. 가맹 정산 (기존가맹점)</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <TableHeader />
                            <tbody>
                                {renderTableRows(opFranchises, false)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

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
                                <th className="px-4 py-3 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-slate-100 border-b-2 border-slate-300 font-bold text-slate-800 text-right">
                                <td className="px-4 py-3 text-left">총 합계</td>
                                <td className="px-4 py-3 text-red-600">{totalAllExpenses.toLocaleString()}</td>
                                <td className="px-4 py-3 text-orange-600">{totalAllInterior.toLocaleString()}</td>
                                <td className="px-4 py-3 text-purple-600">{totalAllEquipment.toLocaleString()}</td>
                                <td className="px-4 py-3"></td>
                            </tr>
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
    };
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

        const totals = filteredFranchises.reduce((acc, f) => {
            const expectedFranchise = f.expectedFranchiseFee !== undefined ? f.expectedFranchiseFee : 7700000;
            const expectedOpen = f.expectedOpenCost || 0;
            const receivedFranchise = (f.sales.franchiseFee || 0) + (f.sales.educationFee || 0);
            const receivedOpen = (f.sales.open.deposit || 0) + (f.sales.open.middle || 0) + (f.sales.open.balance || 0);
            
            acc.expectedFranchise += expectedFranchise;
            acc.expectedOpen += expectedOpen;
            acc.receivedFranchise += receivedFranchise;
            acc.deposit += f.sales.open.deposit || 0;
            acc.middle += f.sales.open.middle || 0;
            acc.balance += f.sales.open.balance || 0;
            
            return acc;
        }, {
            expectedFranchise: 0, expectedOpen: 0, receivedFranchise: 0, deposit: 0, middle: 0, balance: 0
        });
        
        const totalExpected = totals.expectedFranchise + totals.expectedOpen;
        const totalReceived = totals.receivedFranchise + totals.deposit + totals.middle + totals.balance;
        const totalBalance = totalExpected - totalReceived;

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
                            <Plus className="w-4 h-4" /> 계약/착수/잔금 (85804계좌)
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
                                    <option value="85804">85804 (계약/착수/잔금)</option>
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
                    <table className="w-full text-[11px] whitespace-nowrap text-left">
                        <thead className="text-[11px] text-slate-500 bg-slate-50 border-b border-slate-200 text-center">
                            <tr>
                                <th rowSpan="2" className="px-2 py-1.5 text-left border-r border-slate-200">가맹점명(대표자)</th>
                                <th colSpan="3" className="px-2 py-1.5 border-b border-slate-200 border-r border-slate-200 bg-indigo-50/50 text-indigo-800">전체 합계 (채권 관리)</th>
                                <th colSpan="2" className="px-2 py-1.5 border-b border-slate-200 border-r border-slate-200 text-slate-600">가맹/교육비</th>
                                <th colSpan="3" className="px-2 py-1.5 border-b border-slate-200 bg-blue-50/30 text-blue-800">오픈비용 (인테리어/장비 등)</th>
                            </tr>
                            <tr>
                                <th className="px-2 py-1.5 bg-indigo-50/50 font-bold">총 견적(청구)</th>
                                <th className="px-2 py-1.5 bg-indigo-50/50 font-bold text-green-600">총 수납</th>
                                <th className="px-2 py-1.5 bg-indigo-50/50 font-bold text-red-500 border-r border-slate-200">미수잔액</th>
                                
                                <th className="px-2 py-1.5 bg-slate-50">견적</th>
                                <th className="px-2 py-1.5 bg-slate-50 border-r border-slate-200">수납</th>
                                
                                <th className="px-2 py-1.5 bg-blue-50/30">견적</th>
                                <th className="px-2 py-1.5 bg-blue-50/30">계약금(수납)</th>
                                <th className="px-2 py-1.5 bg-blue-50/30">착수금(수납)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b-2 border-slate-300 bg-slate-100 text-right font-bold text-slate-800">
                                <td className="px-2 py-1.5 text-left border-r border-slate-200">총 합계</td>
                                
                                <td className="px-2 py-1.5 bg-indigo-50/50 text-indigo-900">{totalExpected.toLocaleString()}</td>
                                <td className="px-2 py-1.5 bg-indigo-50/50 text-green-700">{totalReceived.toLocaleString()}</td>
                                <td className={`px-2 py-1.5 bg-indigo-50/50 border-r border-slate-200 ${totalBalance > 0 ? 'text-red-600' : totalBalance < 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                                    {totalBalance > 0 ? totalBalance.toLocaleString() : (totalBalance === 0 && totalExpected > 0) ? '완납' : (totalBalance < 0 ? `${Math.abs(totalBalance).toLocaleString()} (초과납)` : '-')}
                                </td>
                                
                                <td className="px-2 py-1.5">{totals.expectedFranchise.toLocaleString()}</td>
                                <td className="px-2 py-1.5 border-r border-slate-200">{totals.receivedFranchise.toLocaleString()}</td>
                                
                                <td className="px-2 py-1.5 bg-blue-50/20">{totals.expectedOpen.toLocaleString()}</td>
                                <td className="px-2 py-1.5 bg-blue-50/20 text-blue-700">{totals.deposit.toLocaleString()}</td>
                                <td className="px-2 py-1.5 bg-blue-50/20 text-blue-700">{totals.middle.toLocaleString()}</td>
                            </tr>
                            {filteredFranchises.map(f => {
                                const expectedFranchise = f.expectedFranchiseFee !== undefined ? f.expectedFranchiseFee : 7700000;
                                const expectedOpen = f.expectedOpenCost || 0;
                                const totalExpected = expectedFranchise + expectedOpen;
                                
                                const receivedFranchise = (f.sales.franchiseFee || 0) + (f.sales.educationFee || 0);
                                const receivedOpen = (f.sales.open.deposit || 0) + (f.sales.open.middle || 0) + (f.sales.open.balance || 0);
                                const totalReceived = receivedFranchise + receivedOpen;
                                
                                const balance = totalExpected - totalReceived;
                                
                                return (
                                    <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50 text-right">
                                        <td 
                                            className="px-2 py-1.5 text-left border-r border-slate-100 cursor-pointer hover:bg-slate-200 transition-colors"
                                            onClick={() => setMatchedTxnModalFranchise(f)}
                                            title="클릭하여 매칭된 입금 내역 확인"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-800">{f.name}</span>
                                                <span className="text-[10px] text-slate-500 ml-2">{f.owner}</span>
                                            </div>
                                        </td>
                                        
                                        <td className="px-2 py-1.5 bg-indigo-50/20">{totalExpected.toLocaleString()}</td>
                                        <td className="px-2 py-1.5 font-bold text-green-600 bg-indigo-50/20">{totalReceived.toLocaleString()}</td>
                                        <td className={`px-2 py-1.5 font-bold bg-indigo-50/20 border-r border-slate-100 ${balance > 0 ? 'text-red-500' : balance < 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                                            {balance > 0 ? balance.toLocaleString() : (balance === 0 && totalExpected > 0) ? '완납' : (balance < 0 ? `${Math.abs(balance).toLocaleString()} (초과납)` : '-')}
                                        </td>
                                        
                                        <td className="px-2 py-2 text-slate-400">
                                            <select 
                                                className="w-[90px] px-1 py-1 border border-slate-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-indigo-500 bg-white cursor-pointer hover:border-indigo-300 transition-colors"
                                                value={expectedFranchise}
                                                onChange={e => handleUpdateExpectedFranchiseFee(f.id, Number(e.target.value))}
                                            >
                                                <option value="7700000">가맹+교육</option>
                                                <option value="5500000">가맹비만</option>
                                                <option value="2200000">교육비만</option>
                                                <option value="0">전액면제</option>
                                            </select>
                                        </td>
                                        <td className="px-2 py-1.5 text-slate-600 border-r border-slate-100">{receivedFranchise.toLocaleString()}</td>
                                        
                                        <td className="px-2 py-2 text-slate-400 bg-blue-50/10">
                                            <input 
                                                type="text"
                                                className="w-24 px-2 py-1 text-right text-[11px] border border-slate-200 rounded outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white hover:border-blue-300 transition-colors"
                                                placeholder="0"
                                                value={f.expectedOpenCost ? f.expectedOpenCost.toLocaleString() : ''}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/[^\d]/g, '');
                                                    handleUpdateExpectedOpenCost(f.id, val);
                                                }}
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 text-blue-600 bg-blue-50/10">{f.sales.open.deposit.toLocaleString()}</td>
                                        <td className="px-2 py-1.5 text-blue-600 bg-blue-50/10">{f.sales.open.middle.toLocaleString()}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        );
    };

    const renderFreeRentalTab = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-indigo-50 text-indigo-900 p-4 rounded-xl flex items-start gap-3 border border-indigo-100 mb-6">
                <Gift className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                    <h3 className="font-bold">무상 대여 관리</h3>
                    <p className="text-sm mt-1 text-indigo-800">
                        가맹점에게 청구하지 않지만 자산 관리를 위해 기록이 필요한 무상 대여(기기장비, 인테리어/설치 등) 내역입니다.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">가맹점별 무상 대여 내역</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setIsVendorModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm">
                            <Settings className="w-4 h-4" /> 협력업체(인테리어) 마스터
                        </button>
                        <button onClick={() => setIsCatalogModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm">
                            <Settings className="w-4 h-4" /> 기기장비 마스터
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">가맹점명</th>
                                <th className="px-4 py-3 text-right">총 무상대여 가액</th>
                                <th className="px-4 py-3 text-right text-orange-500">인테리어/설치 합계</th>
                                <th className="px-4 py-3 text-right text-purple-500">기기장비 합계</th>
                                <th className="px-4 py-3 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const totalFreeRentals = filteredFranchises.reduce((sum, f) => sum + calcTotalFreeRentals(f), 0);
                                const totalInterior = filteredFranchises.reduce((sum, f) => sum + calcFreeInteriorExpense(f), 0);
                                const totalEquipment = filteredFranchises.reduce((sum, f) => sum + calcFreeEquipmentExpense(f), 0);

                                return (
                                    <>
                                        <tr className="border-b-2 border-slate-300 bg-slate-100 font-bold text-slate-800">
                                            <td className="px-4 py-3 text-center border-r border-slate-200">총 합계</td>
                                            <td className="px-4 py-3 text-right text-indigo-700 bg-indigo-50/50">{totalFreeRentals.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-orange-700 bg-orange-50/30">{totalInterior.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-purple-700 bg-purple-50/30">{totalEquipment.toLocaleString()}</td>
                                            <td className="px-4 py-3"></td>
                                        </tr>
                                        {filteredFranchises.map(f => (
                                            <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="px-4 py-3 font-bold text-slate-800 border-r border-slate-100">{f.name}</td>
                                                <td className="px-4 py-3 text-right font-bold text-indigo-600 bg-indigo-50/10">{calcTotalFreeRentals(f).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-orange-600 bg-orange-50/10">{calcFreeInteriorExpense(f).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-purple-600 bg-purple-50/10">{calcFreeEquipmentExpense(f).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-center border-l border-slate-100">
                                                    <button onClick={() => openFreeRentalModal(f)} className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-100 font-medium">
                                                        내역 입력
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                );
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const openOperatingHistoryModal = (f) => {
        setSelectedOperatingFranchise(f);
        setIsOperatingHistoryModalOpen(true);
    };

    const renderOperatingSearchModal = () => {
        if (!isOperatingSearchModalOpen) return null;

        const filtered = franchises.filter(f => 
            f.name.includes(operatingSearchKeyword) || 
            (f.owner && f.owner.includes(operatingSearchKeyword))
        );

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-emerald-50/30">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Search className="w-5 h-5 text-emerald-600" />
                                가맹점 검색 (내역 등록)
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">추가 거래를 등록할 가맹점 이름이나 점주명을 검색하세요.</p>
                        </div>
                        <button onClick={() => setIsOperatingSearchModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="가맹점명 또는 점주명 검색..."
                                value={operatingSearchKeyword}
                                onChange={(e) => setOperatingSearchKeyword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-base"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {filtered.length === 0 ? (
                            <div className="py-12 text-center text-slate-500">
                                검색 결과가 없습니다.
                            </div>
                        ) : (
                            <div className="space-y-1 p-2">
                                {filtered.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => {
                                            setIsOperatingSearchModalOpen(false);
                                            openOperatingHistoryModal(f);
                                            setOperatingSearchKeyword('');
                                        }}
                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-800 group-hover:text-emerald-700">{f.name}</div>
                                            <div className="text-sm text-slate-500 mt-0.5">{f.owner || '점주미상'} • 오픈일: {f.openDate || '미정'}</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderOperatingTab = () => {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-emerald-50 text-emerald-900 p-4 rounded-xl flex items-start gap-3 border border-emerald-100 mb-6">
                    <Store className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                        <h3 className="font-bold">운영점 추가 거래 관리</h3>
                        <p className="text-sm mt-1 text-emerald-800">
                            신규 오픈 시점이 아닌, 기존에 운영 중인 가맹점에서 발생한 기기장비 고장 수리/무상교체, 인테리어 보수, 추가 구매 등의 내역을 기록하고 관리합니다.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800">운영점 거래 현황 (발생 내역이 있는 가맹점만 표시)</h2>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => {
                                    setOperatingSearchKeyword('');
                                    setIsOperatingSearchModalOpen(true);
                                }}
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                새로운 내역 등록
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">가맹점명</th>
                                    <th className="px-4 py-3">최근 거래월</th>
                                    <th className="px-4 py-3 text-right text-blue-500">누적 추가매출</th>
                                    <th className="px-4 py-3 text-right text-red-500">누적 매입/비용</th>
                                    <th className="px-4 py-3 text-right text-indigo-500">누적 무상대여</th>
                                    <th className="px-4 py-3 text-center">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeOperatingFranchises.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                            운영점 추가 거래 내역이 발생한 가맹점이 없습니다.<br/>
                                            우측 상단의 "가맹점 선택"을 통해 새로운 내역을 등록해보세요.
                                        </td>
                                    </tr>
                                ) : (
                                    activeOperatingFranchises.map(f => {
                                        const allDates = [
                                            ...(f.operating?.sales?.map(s => s.date) || []),
                                            ...(f.operating?.expenses?.map(e => e.date) || []),
                                            ...(f.operating?.freeRentals?.map(fr => fr.date) || [])
                                        ].filter(Boolean);
                                        allDates.sort((a, b) => b.localeCompare(a));
                                        const latestMonth = allDates[0] || '-';

                                        return (
                                        <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 font-bold text-slate-800">{f.name}</td>
                                            <td className="px-4 py-3 text-slate-500 font-medium">{latestMonth}</td>
                                            <td className="px-4 py-3 text-right text-blue-600 font-bold">{calcOperatingSales(f).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-red-600 font-bold">{calcOperatingExpenses(f).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-indigo-600 font-bold">{calcOperatingFreeRentals(f).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => openOperatingHistoryModal(f)} className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md hover:bg-emerald-100 font-medium">
                                                    내역 관리
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
            </div>
        );
    };

    const renderExpenseTab = () => {
        const totalAllExpenses = filteredFranchises.reduce((sum, f) => sum + calcTotalExpenses(f), 0);
        const totalAllInterior = filteredFranchises.reduce((sum, f) => sum + calcInteriorExpense(f), 0);
        const totalAllEquipment = filteredFranchises.reduce((sum, f) => sum + calcEquipmentExpense(f), 0);

        return (
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
        const extractYearMonth = (dateStr) => {
            if (!dateStr) return '';
            const match = String(dateStr).match(/(\d{4})[^\d]*(\d{1,2})/);
            if (match) {
                return `${match[1]}-${match[2].padStart(2, '0')}`;
            }
            return '';
        };

        const filteredBankTxnsForVoucher = bankTransactions.filter(t => {
            if (!t.matchedFranchiseId) return false;
            if (!selectedMonth) return true;
            return extractYearMonth(t.date) === selectedMonth;
        });

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
                            오픈일자 기준으로 해당 월에 확정된 가맹점별 매출입니다. (매출 산정은 수납액이 아닌 견적액 기준입니다.)
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] whitespace-nowrap text-left">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs whitespace-nowrap">
                                <tr>
                                    <th className="px-2 py-1.5 border-b border-slate-200" rowSpan="2">가맹점명</th>
                                    <th className="px-2 py-1.5 border-b border-slate-200" rowSpan="2">사업자번호</th>
                                    <th className="px-2 py-1.5 border-b border-slate-200" rowSpan="2">구분</th>
                                    <th className="px-2 py-1.5 text-center border-l border-slate-200 border-b border-slate-200" colSpan="3">가맹비+교육비 (견적액 기준)</th>
                                    <th className="px-2 py-1.5 text-center border-l border-slate-200 border-b border-slate-200" colSpan="3">오픈비용 (견적액 기준)</th>
                                    <th className="px-2 py-1.5 text-center border-l border-slate-200 border-b border-slate-200" colSpan="3">운영점 추가매출 (발생액 기준)</th>
                                </tr>
                                <tr>
                                    <th className="px-2 py-1.5 text-right border-l border-slate-200 bg-indigo-50/50">합계(총액)</th>
                                    <th className="px-2 py-1.5 text-right bg-indigo-50/30">공급가액</th>
                                    <th className="px-2 py-1.5 text-right bg-indigo-50/30">부가세</th>
                                    <th className="px-2 py-1.5 text-right border-l border-slate-200 bg-orange-50/50">합계(총액)</th>
                                    <th className="px-2 py-1.5 text-right bg-orange-50/30">공급가액</th>
                                    <th className="px-2 py-1.5 text-right bg-orange-50/30">부가세</th>
                                    <th className="px-2 py-1.5 text-right border-l border-slate-200 bg-emerald-50/50">합계(총액)</th>
                                    <th className="px-2 py-1.5 text-right bg-emerald-50/30">공급가액</th>
                                    <th className="px-2 py-1.5 text-right bg-emerald-50/30">부가세</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // 1. 신규 오픈 가맹점
                                    const newOpens = filteredFranchisesForTax.map(f => ({ f, isNewOpen: true }));
                                    
                                    // 2. 운영점 추가매출이 있는 가맹점
                                    const operatingSalesFranchises = franchises
                                        .filter(f => selectedMonth && f.operating?.sales?.some(s => s.date === selectedMonth))
                                        .filter(f => !newOpens.some(no => no.f.id === f.id)) // 중복 제거
                                        .map(f => ({ f, isNewOpen: false }));
                                    
                                    const combinedForTax = [...newOpens, ...operatingSalesFranchises];

                                    if (combinedForTax.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan="12" className="px-4 py-8 text-center text-slate-500">
                                                    선택하신 월에 오픈하거나 추가매출이 발생한 가맹점이 없습니다.
                                                </td>
                                            </tr>
                                        );
                                    }

                                    const totals = combinedForTax.reduce((acc, { f, isNewOpen }) => {
                                        const basicTotal = isNewOpen ? (f.expectedFranchiseFee !== undefined ? f.expectedFranchiseFee : 7700000) : 0;
                                        const openTotal = isNewOpen ? (f.expectedOpenCost || 0) : 0;
                                        const opTotal = (f.operating?.sales || [])
                                            .filter(s => s.date === selectedMonth)
                                            .reduce((sum, s) => sum + s.amount, 0);

                                        acc.basicTotal += basicTotal;
                                        acc.openTotal += openTotal;
                                        acc.opTotal += opTotal;
                                        return acc;
                                    }, { basicTotal: 0, openTotal: 0, opTotal: 0 });

                                    const basicSupply = Math.round(totals.basicTotal / 1.1);
                                    const basicVat = totals.basicTotal - basicSupply;
                                    const openSupply = Math.round(totals.openTotal / 1.1);
                                    const openVat = totals.openTotal - openSupply;
                                    const opSupply = Math.round(totals.opTotal / 1.1);
                                    const opVat = totals.opTotal - opSupply;

                                    return (
                                        <>
                                            <tr className="border-b-2 border-slate-300 bg-slate-100 font-bold text-slate-800">
                                                <td colSpan="3" className="px-2 py-1.5 text-center border-r border-slate-200">총 합계</td>
                                                
                                                <td className="px-2 py-1.5 text-right text-indigo-800 bg-indigo-50 border-l border-slate-200">{totals.basicTotal.toLocaleString()}</td>
                                                <td className="px-2 py-1.5 text-right text-indigo-700 bg-indigo-50/50">{basicSupply.toLocaleString()}</td>
                                                <td className="px-2 py-1.5 text-right text-indigo-600 bg-indigo-50/50">{basicVat.toLocaleString()}</td>
                                                
                                                <td className="px-2 py-1.5 text-right text-orange-800 border-l border-slate-200 bg-orange-50">{totals.openTotal.toLocaleString()}</td>
                                                <td className="px-2 py-1.5 text-right text-orange-700 bg-orange-50/50">{openSupply.toLocaleString()}</td>
                                                <td className="px-2 py-1.5 text-right text-orange-600 bg-orange-50/50">{openVat.toLocaleString()}</td>

                                                <td className="px-2 py-1.5 text-right text-emerald-800 border-l border-slate-200 bg-emerald-50">{totals.opTotal.toLocaleString()}</td>
                                                <td className="px-2 py-1.5 text-right text-emerald-700 bg-emerald-50/50">{opSupply.toLocaleString()}</td>
                                                <td className="px-2 py-1.5 text-right text-emerald-600 bg-emerald-50/50">{opVat.toLocaleString()}</td>
                                            </tr>
                                            {combinedForTax.map(({ f, isNewOpen }) => {
                                                // 가맹+교육비 역산 (신규오픈인 경우만 - 견적액 기준)
                                                const basicTotal = isNewOpen ? (f.expectedFranchiseFee !== undefined ? f.expectedFranchiseFee : 7700000) : 0;
                                                const basicSupply = Math.round(basicTotal / 1.1);
                                                const basicVat = basicTotal - basicSupply;

                                                // 오픈비용 역산 (신규오픈인 경우만 - 견적액 기준)
                                                const openTotal = isNewOpen ? (f.expectedOpenCost || 0) : 0;
                                                const openSupply = Math.round(openTotal / 1.1);
                                                const openVat = openTotal - openSupply;

                                                // 운영점 추가매출 역산
                                                const opTotal = (f.operating?.sales || [])
                                                    .filter(s => s.date === selectedMonth)
                                                    .reduce((sum, s) => sum + s.amount, 0);
                                                const opSupply = Math.round(opTotal / 1.1);
                                                const opVat = opTotal - opSupply;

                                                return (
                                                    <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                        <td className="px-2 py-1.5 font-medium text-slate-800 whitespace-nowrap">{f.name}</td>
                                                        <td className="px-2 py-1.5 font-mono text-slate-600 whitespace-nowrap">{f.bizNumber || '-'}</td>
                                                        <td className="px-2 py-1.5 text-center whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isNewOpen ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {isNewOpen ? '신규오픈' : '추가매출'}
                                                            </span>
                                                        </td>
                                                        
                                                        <td className="px-2 py-1.5 text-right font-bold text-indigo-700 border-l border-slate-100 bg-indigo-50/30">{basicTotal.toLocaleString()}</td>
                                                        <td className="px-2 py-1.5 text-right text-slate-600 bg-indigo-50/10">{basicSupply.toLocaleString()}</td>
                                                        <td className="px-2 py-1.5 text-right text-slate-500 bg-indigo-50/10">{basicVat.toLocaleString()}</td>
                                                        
                                                        <td className="px-2 py-1.5 text-right font-bold text-orange-700 border-l border-slate-100 bg-orange-50/30">{openTotal.toLocaleString()}</td>
                                                        <td className="px-2 py-1.5 text-right text-slate-600 bg-orange-50/10">{openSupply.toLocaleString()}</td>
                                                        <td className="px-2 py-1.5 text-right text-slate-500 bg-orange-50/10">{openVat.toLocaleString()}</td>

                                                        <td className="px-2 py-1.5 text-right font-bold text-emerald-700 border-l border-slate-100 bg-emerald-50/30">{opTotal.toLocaleString()}</td>
                                                        <td className="px-2 py-1.5 text-right text-slate-600 bg-emerald-50/10">{opSupply.toLocaleString()}</td>
                                                        <td className="px-2 py-1.5 text-right text-slate-500 bg-emerald-50/10">{opVat.toLocaleString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </>
                                    );
                                })()}
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
                                    <th className="px-4 py-3">의뢰인/수취인</th>
                                    <th className="px-4 py-3">수금항목</th>
                                    <th className="px-4 py-3">적요/메모</th>
                                    <th className="px-4 py-3 text-right">입금액(원)</th>
                                    <th className="px-4 py-3 text-center">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBankTxnsForVoucher.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                                            선택하신 월에 매칭된 입금 내역이 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBankTxnsForVoucher.sort((a,b) => a.date.localeCompare(b.date)).map(txn => {
                                        const matchedFranchise = franchises.find(f => f.id === txn.matchedFranchiseId);
                                        const fName = matchedFranchise ? matchedFranchise.name : '알수없음';
                                        const fBizNum = matchedFranchise ? matchedFranchise.bizNumber : '-';
                                        
                                        const catMap = {
                                            'franchiseFee': '가맹/교육비',
                                            'educationFee': '가맹/교육비',
                                            'deposit': '계약금',
                                            'middle': '착수금',
                                            'balance': '잔금',
                                            'operating_sale': '추가매출(운영)'
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
                                                <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{txn.sender || '-'}</td>
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
            </div>
        );
    };

    const renderMonthlyPurchasesTab = () => {
        if (!selectedMonth) {
            return (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <p className="text-slate-500">우측 상단에서 <strong className="text-slate-700">오픈월</strong>을 선택해주세요.</p>
                </div>
            );
        }

        const filteredFranchisesForTax = franchises.filter(f => f.openDate && f.openDate.startsWith(selectedMonth));

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-indigo-50 text-indigo-900 p-4 rounded-xl flex items-start gap-3 border border-indigo-100">
                    <Package className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                        <h3 className="font-bold">월별 매입 관리 ({selectedMonth})</h3>
                        <p className="text-sm mt-1 text-indigo-800">선택하신 월에 오픈하는 가맹점과 관련된 협력업체 매입 내역 및 기기장비 불출 내역을 관리합니다.</p>
                    </div>
                </div>

                {/* 1. 월별 매입 세부 내역 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">1. 월별 매입 세부 내역 (협력업체별)</h2>
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
                                    const interiorDetails = filteredFranchisesForTax.flatMap(f => {
                                        const expenses = (f.expenses?.interiorItems || []).map(item => ({ f, item, type: '판매분', openType: '신규오픈' }));
                                        const freeRentals = (f.freeRentals?.interiorItems || []).map(item => ({ f, item, type: '무상대여', openType: '신규오픈' }));
                                        return [...expenses, ...freeRentals];
                                    });

                                    const operatingInteriorDetails = franchises.flatMap(f => {
                                        const opsExpenses = (f.operating?.expenses || []).filter(e => e.date === selectedMonth).flatMap(e => e.interiorItems.map(item => ({ f, item, type: '판매분', openType: '운영점추가' })));
                                        const opsFreeRentals = (f.operating?.freeRentals || []).filter(e => e.date === selectedMonth).flatMap(e => e.interiorItems.map(item => ({ f, item, type: '무상대여', openType: '운영점추가' })));
                                        return [...opsExpenses, ...opsFreeRentals];
                                    });

                                    const combinedInteriorDetails = [...interiorDetails, ...operatingInteriorDetails];
                                    if (combinedInteriorDetails.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                                                    매입 세부 내역이 없습니다.
                                                </td>
                                            </tr>
                                        );
                                    }
                                    
                                    const grouped = combinedInteriorDetails.reduce((acc, curr) => {
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
                                                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${detail.openType === '신규오픈' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-100 text-orange-700 border-orange-200'} border`}>
                                                                {detail.openType}
                                                            </span>
                                                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${detail.type === '무상대여' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                                {detail.type}
                                                            </span>
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

                {/* 2. 기기장비 불출 내역 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">2. 월별 기기장비 불출 내역 (장비별)</h2>
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
                                    const equipmentDetails = filteredFranchisesForTax.flatMap(f => {
                                        const expenses = (f.expenses?.equipmentItems || []).map(item => ({ f, item, type: '판매분', openType: '신규오픈' }));
                                        const freeRentals = (f.freeRentals?.equipmentItems || []).map(item => ({ f, item, type: '무상대여', openType: '신규오픈' }));
                                        return [...expenses, ...freeRentals];
                                    });

                                    const operatingEquipmentDetails = franchises.flatMap(f => {
                                        const opsExpenses = (f.operating?.expenses || []).filter(e => e.date === selectedMonth).flatMap(e => e.equipmentItems.map(item => ({ f, item, type: '판매분', openType: '운영점추가' })));
                                        const opsFreeRentals = (f.operating?.freeRentals || []).filter(e => e.date === selectedMonth).flatMap(e => e.equipmentItems.map(item => ({ f, item, type: '무상대여', openType: '운영점추가' })));
                                        return [...opsExpenses, ...opsFreeRentals];
                                    });

                                    const combinedEquipmentDetails = [...equipmentDetails, ...operatingEquipmentDetails];
                                    if (combinedEquipmentDetails.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                                    기기장비 불출 내역이 없습니다.
                                                </td>
                                            </tr>
                                        );
                                    }
                                    
                                    const grouped = combinedEquipmentDetails.reduce((acc, curr) => {
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
                                                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${detail.openType === '신규오픈' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-100 text-orange-700 border-orange-200'} border`}>
                                                                {detail.openType}
                                                            </span>
                                                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${detail.type === '무상대여' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                                {detail.type}
                                                            </span>
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
                {activeTab === 'free_rental' && renderFreeRentalTab()}
                {activeTab === 'operating' && renderOperatingTab()}
                {activeTab === 'accounting' && renderAccountingTab()}
                {activeTab === 'monthly_purchases' && renderMonthlyPurchasesTab()}
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">대상 가맹점 검색/선택</label>
                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="text"
                                            placeholder="지점명 또는 대표자명 검색..."
                                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                            value={depositMatchForm.searchKeyword || ''}
                                            onChange={e => setDepositMatchForm({...depositMatchForm, searchKeyword: e.target.value})}
                                        />
                                    </div>
                                    <select 
                                        required
                                        size="4"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                        value={depositMatchForm.franchiseId}
                                        onChange={e => setDepositMatchForm({...depositMatchForm, franchiseId: e.target.value})}
                                    >
                                        <option value="" disabled>검색 후 선택하세요</option>
                                        {franchises
                                            .filter(f => depositMatchForm.searchKeyword ? (f.name.includes(depositMatchForm.searchKeyword) || (f.owner && f.owner.includes(depositMatchForm.searchKeyword))) : true)
                                            .map(f => (
                                            <option key={f.id} value={f.id}>{f.name} ({f.owner || '대표자미상'})</option>
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
                                        <option value="franchiseFee">가맹/교육비 (17104 계좌 권장)</option>
                                        <option value="deposit">계약금 (85804 계좌 권장)</option>
                                        <option value="middle">착수금 (85804 계좌 권장)</option>
                                        <option value="balance">잔금 (85804 계좌 권장)</option>
                                        <option value="operating_sale">추가 매출 (운영점)</option>
                                    </select>
                                </div>
                                {depositMatchForm.category === 'operating_sale' && (
                                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                        <label className="block text-sm font-bold text-indigo-900 mb-1">거래 귀속월 (필수)</label>
                                        <input 
                                            type="month" 
                                            required
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                            value={depositMatchForm.attributionMonth}
                                            onChange={e => setDepositMatchForm({...depositMatchForm, attributionMonth: e.target.value})}
                                        />
                                        <p className="text-xs text-indigo-700 mt-1">이 수금 내역이 어느 달의 추가매출로 정산될지 선택하세요.</p>
                                    </div>
                                )}
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

            {/* 매칭된 입금내역 확인 모달 */}
            {matchedTxnModalFranchise && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <span className="text-indigo-600">{matchedTxnModalFranchise.name}</span> 매칭된 입금 내역
                                </h3>
                                <div className="text-sm text-slate-500 mt-1">이 가맹점과 매칭된 통장 입금 내역을 확인하고 취소할 수 있습니다.</div>
                            </div>
                            <button 
                                onClick={() => setMatchedTxnModalFranchise(null)}
                                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 bg-slate-50 border-y border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">거래일시</th>
                                            <th className="px-4 py-3">계좌/은행</th>
                                            <th className="px-4 py-3">적요/보낸분</th>
                                            <th className="px-4 py-3 text-right">입금액</th>
                                            <th className="px-4 py-3">매칭 항목</th>
                                            <th className="px-4 py-3 text-center">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bankTransactions.filter(t => t.matchedFranchiseId === matchedTxnModalFranchise.id).length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                                    매칭된 입금 내역이 없습니다.
                                                </td>
                                            </tr>
                                        ) : (
                                            bankTransactions
                                                .filter(t => t.matchedFranchiseId === matchedTxnModalFranchise.id)
                                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                .map(t => (
                                                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                        <td className="px-4 py-3 text-slate-600">
                                                            {t.date} <span className="text-xs text-slate-400">{t.time}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-slate-700">{t.account}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs">
                                                            <div className="font-medium text-slate-800">{t.summary}</div>
                                                            <div className="text-slate-500">{t.memo}</div>
                                                            <div className="text-indigo-600 font-bold">{t.sender}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-indigo-600">
                                                            {t.amount.toLocaleString()}원
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100">
                                                                {t.matchedCategory === 'franchiseFee' ? '가맹/교육비' :
                                                                 t.matchedCategory === 'openDeposit' ? '오픈 계약금' :
                                                                 t.matchedCategory === 'openMiddle' ? '오픈 착수금' :
                                                                 t.matchedCategory === 'openBalance' ? '오픈 잔금' :
                                                                 t.matchedCategory === 'opRoyalty' ? '운영 로열티' :
                                                                 t.matchedCategory === 'opAs' ? '운영 A/S' :
                                                                 t.matchedCategory === 'opIngredient' ? '운영 물류' :
                                                                 t.matchedCategory === 'opOthers' ? '기타매출' : t.matchedCategory}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button 
                                                                onClick={() => handleUnmatchDeposit(t.id)}
                                                                className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                                                            >
                                                                매칭취소
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                            <button 
                                type="button" 
                                onClick={() => setMatchedTxnModalFranchise(null)}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                닫기
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

            {/* 무상 대여 상세 입력 모달 */}
            {isFreeRentalModalOpen && freeRentalFranchise && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2"><Gift className="w-5 h-5"/> 가맹점 무상 대여 내역 입력</h3>
                                <p className="text-xs text-indigo-700 mt-0.5">[{freeRentalFranchise.name}] 무상으로 지원한 기기장비 및 인테리어 내역 입력</p>
                            </div>
                            <button onClick={() => setIsFreeRentalModalOpen(false)} className="text-indigo-400 hover:text-indigo-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-white space-y-8">
                            
                            {/* 인테리어 영역 */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                        무상 지원 인테리어/설치 비용 (직접 입력)
                                    </h4>
                                    <button onClick={handleAddFreeInterior} className="text-xs flex items-center gap-1 text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-1 rounded-md border border-orange-200">
                                        <Plus className="w-3 h-3"/> 항목 추가
                                    </button>
                                </div>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2 text-left">협력업체 선택</th>
                                                <th className="px-4 py-2 text-right w-48">가액(원)</th>
                                                <th className="px-4 py-2 text-center w-16">삭제</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {editingFreeInteriorItems.map((item, idx) => (
                                                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                    <td className="px-4 py-2">
                                                        <select
                                                            value={item.vendorId || ''}
                                                            onChange={(e) => handleUpdateFreeInterior(item.id, 'vendorId', e.target.value)}
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
                                                            onChange={(e) => handleUpdateFreeInterior(item.id, 'price', e.target.value)}
                                                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-right focus:outline-none focus:border-orange-400"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button onClick={() => handleDeleteFreeInterior(item.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                                                            <Trash2 className="w-4 h-4 mx-auto" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {editingFreeInteriorItems.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-6 text-center text-slate-400 text-xs bg-slate-50/50">
                                                        우측 상단의 '항목 추가'를 눌러 무상 지원 인테리어 가액을 입력하세요.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {editingFreeInteriorItems.length > 0 && (
                                            <tfoot className="bg-orange-50/50 border-t border-slate-200">
                                                <tr>
                                                    <td className="px-4 py-2 font-bold text-slate-700 text-right">인테리어/설치 소계:</td>
                                                    <td className="px-4 py-2 text-right font-bold text-orange-600">
                                                        {editingFreeInteriorItems.reduce((acc, item) => acc + (Number(item.price)||0), 0).toLocaleString()}
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
                                    무상 대여 기기장비 매칭
                                </h4>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2 text-left">장비명</th>
                                                <th className="px-4 py-2 text-right">단가(원)</th>
                                                <th className="px-4 py-2 text-center w-24">지원 수량(개)</th>
                                                <th className="px-4 py-2 text-right">합계(원)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expenseCatalog.map(item => {
                                                const matchItem = editingFreeEquipmentItems.find(i => i.itemId === item.id);
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
                                                                onChange={(e) => handleFreeEquipmentQtyChange(item.id, e.target.value)}
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
                                        {editingFreeEquipmentItems.length > 0 && (
                                            <tfoot className="bg-purple-50/50 border-t border-slate-200">
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-2 font-bold text-slate-700 text-right">기기장비 소계:</td>
                                                    <td className="px-4 py-2 text-right font-bold text-purple-600">
                                                        {editingFreeEquipmentItems.reduce((acc, match) => {
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
                                무상 대여 총 가액: <span className="text-indigo-600 text-xl ml-2">
                                    {(
                                        editingFreeInteriorItems.reduce((acc, item) => acc + (Number(item.price)||0), 0) +
                                        editingFreeEquipmentItems.reduce((acc, match) => {
                                            const cat = expenseCatalog.find(c => c.id === match.itemId);
                                            return acc + (cat ? cat.price * match.qty : 0);
                                        }, 0)
                                    ).toLocaleString()}원
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsFreeRentalModalOpen(false)} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm">
                                    취소
                                </button>
                                <button onClick={handleSaveFreeRentals} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
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
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">가맹/교육비 기본 청구</label>
                                    <div className="flex flex-col gap-2 mt-1">
                                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                checked={newFranchise.isFranchiseFeeCharged}
                                                onChange={e => setNewFranchise({...newFranchise, isFranchiseFeeCharged: e.target.checked})}
                                            />
                                            가맹비 청구 (5,500,000원)
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                checked={newFranchise.isEducationFeeCharged}
                                                onChange={e => setNewFranchise({...newFranchise, isEducationFeeCharged: e.target.checked})}
                                            />
                                            교육비 청구 (2,200,000원)
                                        </label>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-2">체크 해제 시 면제로 처리됩니다.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">오픈비용 견적금액</label>
                                    <input 
                                        type="number" 
                                        min="0" step="1000"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-right font-medium"
                                        placeholder="예: 50000000"
                                        value={newFranchise.expectedOpenCost}
                                        onChange={e => setNewFranchise({...newFranchise, expectedOpenCost: e.target.value})}
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">인테리어/장비 등 전체 오픈비용 총액</p>
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

            {/* 운영점 내역 관리 모달 */}
            {renderOperatingSearchModal()}
            {isOperatingHistoryModalOpen && selectedOperatingFranchise && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-emerald-900">{selectedOperatingFranchise.name} 추가 거래 내역</h3>
                                <p className="text-sm text-emerald-700 mt-1">오픈 이후에 발생한 매출, 비용, 무상교체 내역을 관리합니다.</p>
                            </div>
                            <button onClick={() => setIsOperatingHistoryModalOpen(false)} className="text-emerald-500 hover:text-emerald-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                            <div className="flex gap-2 mb-6">
                                <button 
                                    onClick={() => {
                                        setOperatingTransactionMonth(getCurrentMonth());
                                        setEditingEquipmentItems([]);
                                        setEditingInteriorItems([]);
                                        setIsOperatingExpenseModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg border border-red-200 hover:bg-red-100 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> 매입/비용 등록
                                </button>
                                <button 
                                    onClick={() => {
                                        setOperatingTransactionMonth(getCurrentMonth());
                                        setEditingFreeEquipmentItems([]);
                                        setEditingFreeInteriorItems([]);
                                        setIsOperatingFreeRentalModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-lg border border-indigo-200 hover:bg-indigo-100 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> 무상 교체/대여 등록
                                </button>
                                <div className="ml-auto text-sm text-slate-500 flex items-center">
                                    추가 매출은 [매출/수금 관리] 탭에서 입금내역 매칭을 통해 등록하세요.
                                </div>
                            </div>

                            {/* 매출 내역 */}
                            <div className="mb-8">
                                <h4 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-blue-500" /> 추가 매출 (수금) 내역
                                </h4>
                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2">귀속월</th>
                                                <th className="px-4 py-2">입금일자</th>
                                                <th className="px-4 py-2">적요(입금자)</th>
                                                <th className="px-4 py-2 text-right">금액</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOperatingFranchise.operating?.sales?.length > 0 ? (
                                                selectedOperatingFranchise.operating.sales.map((sale, idx) => (
                                                    <tr key={idx} className="border-b border-slate-100">
                                                        <td className="px-4 py-2 font-medium text-indigo-600">{sale.date}</td>
                                                        <td className="px-4 py-2 text-slate-500">{sale.originalDate || sale.date}</td>
                                                        <td className="px-4 py-2">{sale.memo || '-'}</td>
                                                        <td className="px-4 py-2 text-right font-medium text-blue-600">{Number(sale.amount).toLocaleString()}원</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="3" className="px-4 py-4 text-center text-slate-400">내역이 없습니다.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 매입/비용 내역 */}
                            <div className="mb-8">
                                <h4 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-red-500" /> 추가 매입/비용 내역
                                </h4>
                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2">귀속월</th>
                                                <th className="px-4 py-2">내역 요약</th>
                                                <th className="px-4 py-2 text-right">금액</th>
                                                <th className="px-4 py-2 w-16 text-center">관리</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOperatingFranchise.operating?.expenses?.length > 0 ? (
                                                selectedOperatingFranchise.operating.expenses.map((exp, idx) => {
                                                    const eqCount = exp.equipmentItems?.length || 0;
                                                    const intCount = exp.interiorItems?.length || 0;
                                                    const eqSum = (exp.equipmentItems || []).reduce((sum, i) => sum + ((expenseCatalog.find(c => c.id === i.itemId)?.price || 0) * i.qty), 0);
                                                    const intSum = (exp.interiorItems || []).reduce((sum, i) => sum + (Number(i.price) || 0), 0);
                                                    
                                                    return (
                                                        <tr key={idx} className="border-b border-slate-100">
                                                            <td className="px-4 py-2 font-medium">{exp.date}</td>
                                                            <td className="px-4 py-2 text-slate-600">장비 {eqCount}건, 인테리어 {intCount}건</td>
                                                            <td className="px-4 py-2 text-right font-medium text-red-600">{(eqSum + intSum).toLocaleString()}원</td>
                                                            <td className="px-4 py-2 text-center">
                                                                <button 
                                                                    onClick={() => handleDeleteOperatingExpense(selectedOperatingFranchise.id, idx)}
                                                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                                    title="내역 삭제"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            ) : (
                                                <tr><td colSpan="3" className="px-4 py-4 text-center text-slate-400">내역이 없습니다.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 무상 대여 내역 */}
                            <div className="mb-4">
                                <h4 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <Gift className="w-4 h-4 text-indigo-500" /> 추가 무상교체/대여 내역
                                </h4>
                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2">귀속월</th>
                                                <th className="px-4 py-2">내역 요약</th>
                                                <th className="px-4 py-2 text-right">가액 합계</th>
                                                <th className="px-4 py-2 w-16 text-center">관리</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOperatingFranchise.operating?.freeRentals?.length > 0 ? (
                                                selectedOperatingFranchise.operating.freeRentals.map((fr, idx) => {
                                                    const eqCount = fr.equipmentItems?.length || 0;
                                                    const intCount = fr.interiorItems?.length || 0;
                                                    const eqSum = (fr.equipmentItems || []).reduce((sum, i) => sum + ((expenseCatalog.find(c => c.id === i.itemId)?.price || 0) * i.qty), 0);
                                                    const intSum = (fr.interiorItems || []).reduce((sum, i) => sum + (Number(i.price) || 0), 0);
                                                    
                                                    return (
                                                        <tr key={idx} className="border-b border-slate-100">
                                                            <td className="px-4 py-2 font-medium">{fr.date}</td>
                                                            <td className="px-4 py-2 text-slate-600">장비 {eqCount}건, 인테리어 {intCount}건</td>
                                                            <td className="px-4 py-2 text-right font-medium text-indigo-600">{(eqSum + intSum).toLocaleString()}원</td>
                                                            <td className="px-4 py-2 text-center">
                                                                <button 
                                                                    onClick={() => handleDeleteOperatingFreeRental(selectedOperatingFranchise.id, idx)}
                                                                    className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                                                                    title="내역 삭제"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            ) : (
                                                <tr><td colSpan="3" className="px-4 py-4 text-center text-slate-400">내역이 없습니다.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* 운영점 추가 매입/비용 등록 모달 */}
            {isOperatingExpenseModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-red-50 shrink-0">
                            <h3 className="text-lg font-bold text-red-900">운영점 추가 매입/비용 등록</h3>
                            <button onClick={() => setIsOperatingExpenseModalOpen(false)} className="text-red-400 hover:text-red-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">거래 귀속월 (필수)</label>
                                <input 
                                    type="month" 
                                    required
                                    className="w-full max-w-[200px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                    value={operatingTransactionMonth}
                                    onChange={e => setOperatingTransactionMonth(e.target.value)}
                                />
                                <p className="text-xs text-slate-500 mt-1">이 내역이 어느 달의 월별 매입으로 정산될지 선택하세요.</p>
                            </div>

                            <div className="space-y-6">
                                {/* 장비 추가 */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-slate-800 text-sm">기기장비 불출 내역 추가</h4>
                                        <button 
                                            onClick={() => setEditingEquipmentItems([...editingEquipmentItems, { itemId: '', qty: 1 }])}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-200 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> 장비 항목 추가
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {editingEquipmentItems.map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <select 
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    value={item.itemId}
                                                    onChange={e => {
                                                        const newArr = [...editingEquipmentItems];
                                                        newArr[idx].itemId = e.target.value;
                                                        setEditingEquipmentItems(newArr);
                                                    }}
                                                >
                                                    <option value="" disabled>장비 선택</option>
                                                    {expenseCatalog.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name} ({c.price.toLocaleString()}원)</option>
                                                    ))}
                                                </select>
                                                <input 
                                                    type="number" min="1"
                                                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    value={item.qty}
                                                    onChange={e => {
                                                        const newArr = [...editingEquipmentItems];
                                                        newArr[idx].qty = Number(e.target.value);
                                                        setEditingEquipmentItems(newArr);
                                                    }}
                                                />
                                                <button 
                                                    onClick={() => setEditingEquipmentItems(editingEquipmentItems.filter((_, i) => i !== idx))}
                                                    className="p-2 text-slate-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 인테리어 추가 */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-slate-800 text-sm">인테리어/설치비/기타 매입 추가</h4>
                                        <button 
                                            onClick={() => setEditingInteriorItems([...editingInteriorItems, { id: `int-new-${Date.now()}`, vendorId: '', price: 0 }])}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-200 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> 매입 항목 추가
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {editingInteriorItems.map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <select 
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    value={item.vendorId}
                                                    onChange={e => {
                                                        const newArr = [...editingInteriorItems];
                                                        newArr[idx].vendorId = e.target.value;
                                                        setEditingInteriorItems(newArr);
                                                    }}
                                                >
                                                    <option value="" disabled>협력업체 선택</option>
                                                    {vendorCatalog.map(v => (
                                                        <option key={v.id} value={v.id}>[{v.category}] {v.name}</option>
                                                    ))}
                                                </select>
                                                <div className="relative">
                                                    <input 
                                                        type="number" min="0" placeholder="금액"
                                                        className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm text-right pr-6"
                                                        value={item.price || ''}
                                                        onChange={e => {
                                                            const newArr = [...editingInteriorItems];
                                                            newArr[idx].price = Number(e.target.value);
                                                            setEditingInteriorItems(newArr);
                                                        }}
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">원</span>
                                                </div>
                                                <button 
                                                    onClick={() => setEditingInteriorItems(editingInteriorItems.filter((_, i) => i !== idx))}
                                                    className="p-2 text-slate-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex gap-3 shrink-0">
                            <button onClick={() => setIsOperatingExpenseModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium">
                                취소
                            </button>
                            <button 
                                onClick={() => {
                                    if(!operatingTransactionMonth) {
                                        alert("거래 귀속월을 선택해주세요.");
                                        return;
                                    }
                                    const updated = [...franchises];
                                    const idx = updated.findIndex(f => f.id === selectedOperatingFranchise.id);
                                    if(idx > -1) {
                                        if(!updated[idx].operating) updated[idx].operating = { sales: [], expenses: [], freeRentals: [] };
                                        if(!updated[idx].operating.expenses) updated[idx].operating.expenses = [];
                                        
                                        updated[idx].operating.expenses.push({
                                            id: `op_exp_${Date.now()}`,
                                            date: operatingTransactionMonth,
                                            equipmentItems: editingEquipmentItems.filter(i => i.itemId && i.qty > 0),
                                            interiorItems: editingInteriorItems.filter(i => i.vendorId && i.price > 0)
                                        });
                                        setFranchises(updated);
                                        setSelectedOperatingFranchise(updated[idx]);
                                    }
                                    setIsOperatingExpenseModalOpen(false);
                                }}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                저장하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 운영점 무상대여 등록 모달 */}
            {isOperatingFreeRentalModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50 shrink-0">
                            <h3 className="text-lg font-bold text-indigo-900">운영점 추가 무상교체/대여 등록</h3>
                            <button onClick={() => setIsOperatingFreeRentalModalOpen(false)} className="text-indigo-400 hover:text-indigo-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">거래 귀속월 (필수)</label>
                                <input 
                                    type="month" 
                                    required
                                    className="w-full max-w-[200px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    value={operatingTransactionMonth}
                                    onChange={e => setOperatingTransactionMonth(e.target.value)}
                                />
                                <p className="text-xs text-slate-500 mt-1">이 내역이 어느 달의 무상대여 매입으로 정산될지 선택하세요.</p>
                            </div>

                            <div className="space-y-6">
                                {/* 장비 추가 */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-slate-800 text-sm">무상 기기장비 내역 추가</h4>
                                        <button 
                                            onClick={() => setEditingFreeEquipmentItems([...editingFreeEquipmentItems, { itemId: '', qty: 1 }])}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-200 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> 장비 항목 추가
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {editingFreeEquipmentItems.map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <select 
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    value={item.itemId}
                                                    onChange={e => {
                                                        const newArr = [...editingFreeEquipmentItems];
                                                        newArr[idx].itemId = e.target.value;
                                                        setEditingFreeEquipmentItems(newArr);
                                                    }}
                                                >
                                                    <option value="" disabled>장비 선택</option>
                                                    {expenseCatalog.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name} ({c.price.toLocaleString()}원)</option>
                                                    ))}
                                                </select>
                                                <input 
                                                    type="number" min="1"
                                                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    value={item.qty}
                                                    onChange={e => {
                                                        const newArr = [...editingFreeEquipmentItems];
                                                        newArr[idx].qty = Number(e.target.value);
                                                        setEditingFreeEquipmentItems(newArr);
                                                    }}
                                                />
                                                <button 
                                                    onClick={() => setEditingFreeEquipmentItems(editingFreeEquipmentItems.filter((_, i) => i !== idx))}
                                                    className="p-2 text-slate-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 인테리어 추가 */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-slate-800 text-sm">무상 인테리어/설치비 추가</h4>
                                        <button 
                                            onClick={() => setEditingFreeInteriorItems([...editingFreeInteriorItems, { id: `int-new-${Date.now()}`, vendorId: '', price: 0 }])}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-200 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> 무상 매입 항목 추가
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {editingFreeInteriorItems.map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <select 
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    value={item.vendorId}
                                                    onChange={e => {
                                                        const newArr = [...editingFreeInteriorItems];
                                                        newArr[idx].vendorId = e.target.value;
                                                        setEditingFreeInteriorItems(newArr);
                                                    }}
                                                >
                                                    <option value="" disabled>협력업체 선택</option>
                                                    {vendorCatalog.map(v => (
                                                        <option key={v.id} value={v.id}>[{v.category}] {v.name}</option>
                                                    ))}
                                                </select>
                                                <div className="relative">
                                                    <input 
                                                        type="number" min="0" placeholder="금액"
                                                        className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm text-right pr-6"
                                                        value={item.price || ''}
                                                        onChange={e => {
                                                            const newArr = [...editingFreeInteriorItems];
                                                            newArr[idx].price = Number(e.target.value);
                                                            setEditingFreeInteriorItems(newArr);
                                                        }}
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">원</span>
                                                </div>
                                                <button 
                                                    onClick={() => setEditingFreeInteriorItems(editingFreeInteriorItems.filter((_, i) => i !== idx))}
                                                    className="p-2 text-slate-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex gap-3 shrink-0">
                            <button onClick={() => setIsOperatingFreeRentalModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium">
                                취소
                            </button>
                            <button 
                                onClick={() => {
                                    if(!operatingTransactionMonth) {
                                        alert("거래 귀속월을 선택해주세요.");
                                        return;
                                    }
                                    const updated = [...franchises];
                                    const idx = updated.findIndex(f => f.id === selectedOperatingFranchise.id);
                                    if(idx > -1) {
                                        if(!updated[idx].operating) updated[idx].operating = { sales: [], expenses: [], freeRentals: [] };
                                        if(!updated[idx].operating.freeRentals) updated[idx].operating.freeRentals = [];
                                        
                                        updated[idx].operating.freeRentals.push({
                                            id: `op_fr_${Date.now()}`,
                                            date: operatingTransactionMonth,
                                            equipmentItems: editingFreeEquipmentItems.filter(i => i.itemId && i.qty > 0),
                                            interiorItems: editingFreeInteriorItems.filter(i => i.vendorId && i.price > 0)
                                        });
                                        setFranchises(updated);
                                        setSelectedOperatingFranchise(updated[idx]);
                                    }
                                    setIsOperatingFreeRentalModalOpen(false);
                                }}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                            >
                                저장하기
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
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">가맹/교육비 기본 청구</label>
                                    <div className="flex flex-col gap-2 mt-1">
                                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                checked={editFranchise.isFranchiseFeeCharged !== false}
                                                onChange={e => setEditFranchise({...editFranchise, isFranchiseFeeCharged: e.target.checked})}
                                            />
                                            가맹비 청구 (5,500,000원)
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                checked={editFranchise.isEducationFeeCharged !== false}
                                                onChange={e => setEditFranchise({...editFranchise, isEducationFeeCharged: e.target.checked})}
                                            />
                                            교육비 청구 (2,200,000원)
                                        </label>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-2">체크 해제 시 면제로 처리됩니다.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">오픈비용 견적금액</label>
                                    <input 
                                        type="number" 
                                        min="0" step="1000"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-right font-medium"
                                        placeholder="예: 50000000"
                                        value={editFranchise.expectedOpenCost || ''}
                                        onChange={e => setEditFranchise({...editFranchise, expectedOpenCost: Number(e.target.value) || 0})}
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">인테리어/장비 등 전체 오픈비용 총액</p>
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
