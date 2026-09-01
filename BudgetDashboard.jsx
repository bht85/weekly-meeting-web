import React, { useState, useEffect, useMemo } from 'react';
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Save, AlertCircle, BarChart3, PieChart as PieChartIcon, Plus, Trash2, LayoutDashboard, Edit3, BookOpen, X, ChevronsRight, Download } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ACCOUNT_GUIDE } from './accountGuide';

const CATEGORIES = Object.keys(ACCOUNT_GUIDE);
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57', '#FEE500', '#FF9999'];

// 재무팀 및 관리자 이메일 목록
const FINANCE_EMAILS = [
    'choihy@composecoffee.co.kr',
    'kth@composecoffee.co.kr',
    'jiin0723@composecoffee.co.kr',
    'smin@composecoffee.co.kr',
    'daisy@composecoffee.co.kr',
    'esc913@composecoffee.co.kr'
];

const BudgetDashboard = ({ db, user, departments = [] }) => {
  const isFinance = user && FINANCE_EMAILS.includes(user.email);

  const [activeTab, setActiveTab] = useState(isFinance ? 'dashboard' : 'input');
  const [selectedYear, setSelectedYear] = useState(2027);
  // 재무팀(관리자)은 기본 선택 없음, 일반 유저는 본인 팀 자동 선택
  const [selectedTeam, setSelectedTeam] = useState(isFinance ? '' : (user?.department || ''));
  
  const [budgetData, setBudgetData] = useState([]);
  const [items, setItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [loadedFormId, setLoadedFormId] = useState(null);

  // 1. Fetch Data
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'budget_plans'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBudgetData(data);
    });
    return () => unsub();
  }, [db]);

  // 2. Load Form Data when Team or Year changes
  useEffect(() => {
    if (!selectedTeam) {
      setItems([]);
      setLoadedFormId(null);
      return;
    }
    const docId = `${selectedYear}_${selectedTeam}`;
    
    // 이미 현재 팀/연도의 데이터를 로드해서 작성 중인 경우, 
    // 누군가 다른 데이터를 저장하여 budgetData가 업데이트되더라도 내 화면이 초기화되지 않도록 방어
    if (loadedFormId === docId) {
      return;
    }

    const existing = budgetData.find(d => d.id === docId);
    
    // budgetData에 기존 데이터가 있으면 로드
    if (existing && existing.items && existing.items.length > 0) {
      setItems(existing.items);
      setLoadedFormId(docId);
    } else if (budgetData.length > 0 || !existing) {
      // 빈 항목 1개 기본 제공 (새로운 폼)
      const firstCategory = CATEGORIES[0];
      const firstDetail = ACCOUNT_GUIDE[firstCategory][0].name;
      setItems([{
        id: Date.now().toString(),
        category: firstCategory,
        detail: firstDetail,
        description: '',
        months: Array(12).fill(0)
      }]);
      // 아직 서버에서 budgetData 전체가 덜 불러와졌을 수 있으므로 budgetData가 비어있지 않을때만 완료처리하거나 일단 로컬 폼 할당
      // 더 안전한 방법은 위 로직대로 폼 ID를 마킹해두는 것.
      setLoadedFormId(docId);
    }
    setSaveMessage('');
  }, [selectedYear, selectedTeam, budgetData, loadedFormId]);

  // 3. Grid Handlers
  const handleAddRow = () => {
    const firstCategory = CATEGORIES[0];
    const firstDetail = ACCOUNT_GUIDE[firstCategory][0].name;
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      category: firstCategory,
      detail: firstDetail,
      description: '',
      months: Array(12).fill(0)
    }]);
  };

  const handleRemoveRow = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'category') {
          // 카테고리 변경 시, 첫 번째 세목으로 자동 변경
          const firstDetail = ACCOUNT_GUIDE[value]?.[0]?.name || '';
          return { ...item, category: value, detail: firstDetail };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleMonthChange = (id, monthIndex, value) => {
    const numStr = String(value).replace(/[^0-9]/g, '');
    const numVal = numStr ? parseInt(numStr, 10) : 0;
    
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newMonths = [...item.months];
        newMonths[monthIndex] = numVal;
        return { ...item, months: newMonths };
      }
      return item;
    }));
  };

  const handleFillRight = (id, startIndex, value) => {
    const numStr = String(value).replace(/[^0-9]/g, '');
    const numVal = numStr ? parseInt(numStr, 10) : 0;
    
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newMonths = [...item.months];
        for(let i = startIndex + 1; i < 12; i++) {
          newMonths[i] = numVal;
        }
        return { ...item, months: newMonths };
      }
      return item;
    }));
  };

  // 4. Save Data
  const handleSave = async () => {
    if (!selectedTeam) {
      alert("팀을 선택해주세요.");
      return;
    }
    setIsSaving(true);
    try {
      const docId = `${selectedYear}_${selectedTeam}`;
      
      let totalAmount = 0;
      const cleanItems = items.map(item => {
        const rowTotal = item.months.reduce((sum, val) => sum + (val || 0), 0);
        totalAmount += rowTotal;
        return {
          id: item.id || Date.now().toString(),
          category: item.category || '',
          detail: item.detail || '',
          description: item.description || '',
          months: (item.months || []).map(v => v || 0),
          rowTotal
        };
      });

      await setDoc(doc(db, 'budget_plans', docId), {
        year: selectedYear,
        team: selectedTeam,
        items: cleanItems,
        totalAmount,
        updatedBy: user?.email || 'Unknown',
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSaveMessage('저장되었습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error("Error saving budget:", error);
      setSaveMessage('저장 실패!');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isFinance && user?.department) {
      setSelectedTeam(user.department);
    }
  }, [user, isFinance]);

  const handleExportExcel = () => {
    const headers = ['부서명', '연도', '계정과목', '세목(세부항목)', '적요(상세내역)', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월', '합계'];
    let csvContent = '\uFEFF' + headers.join(',') + '\n';
    
    const exportData = budgetData.filter(d => d.year === selectedYear && Array.isArray(d.items) && d.team !== '선택');
    
    if (exportData.length === 0) {
      alert("해당 연도에 등록된 예산 데이터가 없습니다.");
      return;
    }

    exportData.forEach(doc => {
      doc.items.forEach(item => {
        const row = [
          doc.team,
          doc.year,
          item.category,
          item.detail,
          `"${(item.description || '').replace(/"/g, '""')}"`,
          ...item.months,
          item.months.reduce((sum, val) => sum + (val || 0), 0)
        ];
        csvContent += row.join(',') + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedYear}년도_판관비_예산취합.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSummaryExcel = () => {
    const headers = ['계정과목', '세목(세부항목)', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월', '합계'];
    let csvContent = '\uFEFF' + headers.join(',') + '\n';
    
    if (detailMonthlyTotals.length === 0) {
      alert("해당 연도에 등록된 예산 데이터가 없습니다.");
      return;
    }

    detailMonthlyTotals.forEach(c => {
      const row = [
        c.category,
        c.detail,
        ...c.months,
        c.total
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // 총계 행 추가
    const monthTotals = Array(12).fill(0).map((_, i) => detailMonthlyTotals.reduce((sum, c) => sum + c.months[i], 0));
    const grandTotal = detailMonthlyTotals.reduce((sum, c) => sum + c.total, 0);
    const totalRow = ['총계', '', ...monthTotals, grandTotal];
    csvContent += totalRow.join(',') + '\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedYear}년도_계정과목_월별합산현황.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. Dashboard Aggregation
  const currentYearData = useMemo(() => {
    return budgetData.filter(d => d.year === selectedYear && Array.isArray(d.items) && d.team !== '선택');
  }, [budgetData, selectedYear]);

  const totalSGA = useMemo(() => {
    return currentYearData.reduce((sum, doc) => sum + (doc.totalAmount || 0), 0);
  }, [currentYearData]);

  const categoryTotals = useMemo(() => {
    const totals = {};
    CATEGORIES.forEach(c => totals[c] = 0);
    currentYearData.forEach(doc => {
      (doc.items || []).forEach(item => {
        if (totals[item.category] !== undefined) {
          totals[item.category] += (item.rowTotal || 0);
        } else {
          totals[item.category] = (item.rowTotal || 0);
        }
      });
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [currentYearData]);

  const teamTotals = useMemo(() => {
    return currentYearData.map(doc => ({
      name: doc.team,
      value: doc.totalAmount || 0
    })).sort((a, b) => b.value - a.value);
  }, [currentYearData]);

  const detailMonthlyTotals = useMemo(() => {
    const map = {};

    currentYearData.forEach(doc => {
      (doc.items || []).forEach(item => {
        const cat = item.category || '미지정';
        const det = item.detail || '미지정';
        const key = `${cat}_${det}`;

        if (!map[key]) {
          map[key] = { category: cat, detail: det, months: Array(12).fill(0), total: 0 };
        }

        (item.months || []).forEach((val, idx) => {
          if (idx < 12) map[key].months[idx] += (val || 0);
        });
        map[key].total += (item.rowTotal || 0);
      });
    });

    return Object.values(map)
      .filter(c => c.total > 0)
      .sort((a, b) => {
        const idxA = CATEGORIES.indexOf(a.category);
        const idxB = CATEGORIES.indexOf(b.category);
        if (idxA !== -1 && idxB !== -1 && idxA !== idxB) return idxA - idxB;
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.detail.localeCompare(b.detail);
      });
  }, [currentYearData]);

  const formatNumber = (num) => {
    if (!num && num !== 0) return '';
    return num.toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-24">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            사업계획 (판관비) 취합
          </h1>
          <p className="text-sm text-slate-500 mt-1">각 팀별 월별 판관비 예산을 상세하게 입력하고 취합합니다.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {[2027, 2028].map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
                selectedYear === year ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {year}년
            </button>
          ))}
        </div>
      </div>

      {/* Tabs & Guide Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
          {isFinance && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              전사 대시보드 (재무팀 전용)
            </button>
          )}
          <button
            onClick={() => setActiveTab('input')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'input' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            부서별 예산 입력
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            엑셀 다운로드
          </button>
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            계정과목 기준표 (가이드)
          </button>
        </div>
      </div>

      {/* INPUT TAB */}
      {activeTab === 'input' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">예산 상세 입력 <span className="text-xs font-normal text-slate-500 ml-1">(단위: 천원)</span></h2>
              <select 
                value={selectedTeam} 
                onChange={(e) => setSelectedTeam(e.target.value)}
                disabled={!isFinance}
                className="border border-slate-200 rounded-lg p-1.5 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">본인 소속 팀을 선택하세요</option>
                {departments
                  .filter(dept => dept !== '선택' && (isFinance || dept === user?.department))
                  .map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleAddRow}
                disabled={!selectedTeam}
                className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> 항목 추가
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || !selectedTeam}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-[1650px] min-w-full divide-y divide-slate-200 table-fixed">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[140px]">계정과목</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[170px]">세목 (세부항목)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[170px]">적요 (상세내역)</th>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <th key={m} className="px-2 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-[85px]">{m}월</th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-bold text-indigo-600 uppercase tracking-wider w-[100px]">합계</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-[50px]">삭제</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {!selectedTeam ? (
                  <tr>
                    <td colSpan="17" className="px-6 py-12 text-center text-slate-500">
                      상단에서 팀을 먼저 선택해 주세요.
                    </td>
                  </tr>
                ) : items.map((item) => {
                  const rowTotal = item.months.reduce((sum, val) => sum + (val || 0), 0);
                  const availableDetails = ACCOUNT_GUIDE[item.category] || [];
                  const selectedDetailInfo = availableDetails.find(d => d.name === item.detail);
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-2 py-2 align-top">
                        <select 
                          value={item.category}
                          onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                          className="w-full border-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs py-1.5"
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <select 
                          value={item.detail}
                          onChange={(e) => handleItemChange(item.id, 'detail', e.target.value)}
                          className="w-full border-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs py-1.5"
                        >
                          {availableDetails.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                        </select>
                        {selectedDetailInfo && (
                          <div className="mt-1 text-[10px] text-slate-400 break-words leading-tight">
                            {selectedDetailInfo.desc}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <input 
                          type="text" 
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="비고, 상세명칭 입력"
                          className="w-full border-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs py-1.5"
                        />
                      </td>
                      {item.months.map((val, mIndex) => (
                        <td key={mIndex} className="px-1 py-2 align-top">
                          <div className="relative group flex items-center">
                            <input 
                              type="text" 
                              value={val ? formatNumber(val) : ''}
                              onChange={(e) => handleMonthChange(item.id, mIndex, e.target.value)}
                              className="w-full border-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs py-1.5 text-right px-1 pr-4"
                              placeholder="0"
                            />
                            {mIndex < 11 && (
                              <button
                                onClick={() => handleFillRight(item.id, mIndex, val)}
                                className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-indigo-500 hover:text-indigo-700 bg-white/80 rounded"
                                title="이 달의 금액을 12월까지 모두 동일하게 채우기"
                              >
                                <ChevronsRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      ))}
                      <td className="px-4 py-2 align-top text-right font-bold text-indigo-600 text-sm pt-3">
                        {formatNumber(rowTotal)}
                      </td>
                      <td className="px-2 py-2 align-top text-center pt-3">
                        <button 
                          onClick={() => handleRemoveRow(item.id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {selectedTeam && items.length > 0 && (
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-bold text-slate-700">총계</td>
                    {[0,1,2,3,4,5,6,7,8,9,10,11].map(mIndex => {
                      const monthTotal = items.reduce((sum, item) => sum + (item.months[mIndex] || 0), 0);
                      return (
                        <td key={mIndex} className="px-2 py-3 text-right font-bold text-slate-700 text-xs">
                          {formatNumber(monthTotal)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-bold text-indigo-600 text-sm">
                      {formatNumber(items.reduce((sum, item) => sum + item.months.reduce((s, v) => s + (v || 0), 0), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {saveMessage && (
            <div className="p-3 bg-emerald-50 border-t border-emerald-100 text-emerald-600 text-sm font-medium text-center">
              {saveMessage}
            </div>
          )}
        </div>
      )}

      {/* DASHBOARD TAB (Finance Only) */}
      {isFinance && activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{selectedYear}년 전사 판관비 총액</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(totalSGA)} <span className="text-base font-normal text-slate-500">천원</span></p>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">제출 완료 팀</p>
                <p className="text-2xl font-bold text-slate-800">{currentYearData.length} <span className="text-base font-normal text-slate-500">/ {departments.filter(d => d !== '선택').length} 팀</span></p>
              </div>
            </div>
          </div>

          {/* 차트 영역 숨김 처리 (요청 사항)
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            ... 차트 영역 ...
          </div>
          */}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-slate-800">팀별 세부 현황 (단위: 천원)</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-slate-200">
                 <thead className="bg-slate-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">팀명</th>
                     <th className="px-6 py-3 text-right text-xs font-bold text-indigo-600 uppercase">합계</th>
                     {categoryTotals.map(c => (
                       <th key={c.name} className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase whitespace-nowrap">{c.name}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-200">
                   {currentYearData.map(doc => {
                     // doc.items 에서 카테고리별 합계 계산
                     const docCatTotals = {};
                     (doc.items || []).forEach(item => {
                       docCatTotals[item.category] = (docCatTotals[item.category] || 0) + (item.rowTotal || 0);
                     });
                     
                     return (
                       <tr key={doc.team} className="hover:bg-slate-50">
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{doc.team}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600 text-right">{formatNumber(doc.totalAmount)}</td>
                         {categoryTotals.map(c => (
                           <td key={c.name} className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">
                             {formatNumber(docCatTotals[c.name] || 0)}
                           </td>
                         ))}
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
          </div>

          {/* New Category by Month Summary Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800">계정과목 및 세목별 월별 합산 현황 (단위: 천원)</h3>
               <button
                 onClick={handleExportSummaryExcel}
                 className="flex items-center gap-2 bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors"
               >
                 <Download className="w-4 h-4" />
                 엑셀 다운로드
               </button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-[1400px] min-w-full divide-y divide-slate-200 table-fixed border-collapse">
                 <thead className="bg-slate-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase w-[140px]">계정과목</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase w-[160px]">세목 (세부항목)</th>
                     {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                       <th key={m} className="px-2 py-3 text-right text-xs font-medium text-slate-500 uppercase w-[75px]">{m}월</th>
                     ))}
                     <th className="px-6 py-3 text-right text-xs font-bold text-indigo-600 uppercase w-[120px]">합계</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-200">
                   {detailMonthlyTotals.map((c, index) => (
                     <tr key={`${c.category}_${c.detail}_${index}`} className="hover:bg-slate-50">
                       <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{c.category}</td>
                       <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">{c.detail}</td>
                       {c.months.map((val, idx) => (
                         <td key={idx} className="px-2 py-3 whitespace-nowrap text-sm text-slate-500 text-right">
                           {formatNumber(val)}
                         </td>
                       ))}
                       <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-indigo-600 text-right">
                         {formatNumber(c.total)}
                       </td>
                     </tr>
                   ))}
                 </tbody>
                 <tfoot className="bg-slate-50 border-t border-slate-200">
                   <tr>
                     <td colSpan={2} className="px-6 py-3 text-left font-bold text-slate-700">총계</td>
                     {[0,1,2,3,4,5,6,7,8,9,10,11].map(mIndex => {
                       const monthGrandTotal = detailMonthlyTotals.reduce((sum, c) => sum + c.months[mIndex], 0);
                       return (
                         <td key={mIndex} className="px-2 py-3 text-right font-bold text-slate-700 text-sm">
                           {formatNumber(monthGrandTotal)}
                         </td>
                       );
                     })}
                     <td className="px-6 py-3 text-right font-bold text-indigo-600 text-base">
                       {formatNumber(totalSGA)}
                     </td>
                   </tr>
                 </tfoot>
               </table>
             </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">📘 판매관리비 운영 기준 (가이드)</h2>
              <button 
                onClick={() => setIsGuideOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto p-0 relative flex-1">
              <table className="min-w-full divide-y divide-slate-200 border-collapse">
                <thead className="bg-indigo-50 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-indigo-900 border-r border-indigo-100">계정과목</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-indigo-900 border-r border-indigo-100">세목 (세부항목)</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-indigo-900 border-r border-indigo-100">정의 및 관리 목적</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-indigo-900">구분(코드)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {Object.entries(ACCOUNT_GUIDE).flatMap(([category, subItems]) =>
                    subItems.map((sub, idx) => (
                      <tr key={`${category}-${sub.name}`} className="hover:bg-slate-50">
                        {idx === 0 && (
                          <td rowSpan={subItems.length} className="px-4 py-3 text-sm font-bold text-slate-800 align-middle border-r border-slate-200 bg-white">
                            {category}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap">{sub.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 border-r border-slate-200 break-words max-w-sm">{sub.desc}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 text-center whitespace-nowrap">{sub.code}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setIsGuideOpen(false)}
                className="bg-slate-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-900 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetDashboard;
