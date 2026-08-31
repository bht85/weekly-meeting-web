import React, { useState, useEffect, useMemo } from 'react';
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Save, AlertCircle, BarChart3, PieChart as PieChartIcon, Plus, Trash2, LayoutDashboard, Edit3 } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const CATEGORIES = [
  '인건비', '복리후생비', '여비교통비', '접대비', '통신비', '수도광열비', 
  '세금과공과', '감가상각비', '임차료', '수선비', '보험료', '차량유지비', 
  '교육훈련비', '도서인쇄비', '소모품비', '지급수수료', '광고선전비', '기타'
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57', '#FEE500', '#FF9999'];

// 재무팀 및 관리자 이메일 목록 (전체 데이터 조회 및 대시보드 접근 권한)
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
  const [selectedTeam, setSelectedTeam] = useState('');
  
  const [budgetData, setBudgetData] = useState([]);
  const [items, setItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

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
      return;
    }
    const docId = `${selectedYear}_${selectedTeam}`;
    const existing = budgetData.find(d => d.id === docId);
    
    if (existing && existing.items && existing.items.length > 0) {
      setItems(existing.items);
    } else {
      // 빈 항목 1개 기본 제공
      setItems([{
        id: Date.now().toString(),
        category: '인건비',
        detail: '',
        months: Array(12).fill(0)
      }]);
    }
    setSaveMessage('');
  }, [selectedYear, selectedTeam, budgetData]);

  // 3. Grid Handlers
  const handleAddRow = () => {
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      category: '기타',
      detail: '',
      months: Array(12).fill(0)
    }]);
  };

  const handleRemoveRow = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleMonthChange = (id, monthIndex, value) => {
    const numStr = value.replace(/[^0-9]/g, '');
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
          ...item,
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

  // 5. Dashboard Aggregation
  const currentYearData = useMemo(() => {
    return budgetData.filter(d => d.year === selectedYear);
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
      .sort((a, b) => b.value - a.value); // 큰 금액 순 정렬
  }, [currentYearData]);

  const teamTotals = useMemo(() => {
    return currentYearData.map(doc => ({
      name: doc.team,
      value: doc.totalAmount || 0
    })).sort((a, b) => b.value - a.value);
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

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit mb-6">
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

      {/* INPUT TAB */}
      {activeTab === 'input' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="font-bold text-slate-800">예산 상세 입력 <span className="text-xs font-normal text-slate-500 ml-1">(단위: 천원)</span></h2>
              <select 
                value={selectedTeam} 
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="border border-slate-200 rounded-lg p-1.5 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium"
              >
                <option value="">본인 소속 팀을 선택하세요</option>
                {departments.map(dept => (
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
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">계정과목</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[150px]">세부내용</th>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <th key={m} className="px-2 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-20">{m}월</th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-bold text-indigo-600 uppercase tracking-wider w-24">합계</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-12">삭제</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {!selectedTeam ? (
                  <tr>
                    <td colSpan="16" className="px-6 py-12 text-center text-slate-500">
                      상단에서 팀을 먼저 선택해 주세요.
                    </td>
                  </tr>
                ) : items.map((item, index) => {
                  const rowTotal = item.months.reduce((sum, val) => sum + (val || 0), 0);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-2 py-2">
                        <select 
                          value={item.category}
                          onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                          className="w-full border-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs py-1.5"
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="text" 
                          value={item.detail}
                          onChange={(e) => handleItemChange(item.id, 'detail', e.target.value)}
                          placeholder="세부내용 입력"
                          className="w-full border-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs py-1.5"
                        />
                      </td>
                      {item.months.map((val, mIndex) => (
                        <td key={mIndex} className="px-1 py-2">
                          <input 
                            type="text" 
                            value={val ? formatNumber(val) : ''}
                            onChange={(e) => handleMonthChange(item.id, mIndex, e.target.value)}
                            className="w-full border-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs py-1.5 text-right px-1"
                            placeholder="0"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2 text-right font-bold text-indigo-600 text-sm">
                        {formatNumber(rowTotal)}
                      </td>
                      <td className="px-2 py-2 text-center">
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
                    <td colSpan="2" className="px-4 py-3 text-right font-bold text-slate-700">총계</td>
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
                <p className="text-2xl font-bold text-slate-800">{currentYearData.length} <span className="text-base font-normal text-slate-500">/ {departments.length} 팀</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-slate-500" /> 항목별 비중</h3>
              <div className="h-64">
                {categoryTotals.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryTotals} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {categoryTotals.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value) + ' 천원'} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-slate-400 text-sm">데이터 없음</div>}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-slate-500" /> 팀별 판관비 총액</h3>
              <div className="h-64">
                {teamTotals.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamTotals} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                      <Tooltip formatter={(value) => formatNumber(value) + ' 천원'} />
                      <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-slate-400 text-sm">데이터 없음</div>}
              </div>
            </div>
          </div>

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
        </div>
      )}
    </div>
  );
};

export default BudgetDashboard;
