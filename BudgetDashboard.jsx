import React, { useState, useEffect, useMemo } from 'react';
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Save, AlertCircle, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const CATEGORIES = [
  '인건비',
  '복리후생비',
  '여비교통비',
  '광고선전비',
  '지급수수료',
  '소모품비',
  '기타'
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const BudgetDashboard = ({ db, user, departments = [] }) => {
  const [selectedYear, setSelectedYear] = useState(2027);
  const [selectedTeam, setSelectedTeam] = useState(departments[0] || '');
  const [budgetData, setBudgetData] = useState([]);
  const [formData, setFormData] = useState({});
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
    const docId = `${selectedYear}_${selectedTeam}`;
    const existing = budgetData.find(d => d.id === docId);
    if (existing && existing.categories) {
      setFormData(existing.categories);
    } else {
      const emptyForm = {};
      CATEGORIES.forEach(c => emptyForm[c] = '');
      setFormData(emptyForm);
    }
    setSaveMessage('');
  }, [selectedYear, selectedTeam, budgetData]);

  // 3. Handle Input Change
  const handleInputChange = (category, value) => {
    const numStr = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({
      ...prev,
      [category]: numStr ? parseInt(numStr, 10) : ''
    }));
  };

  // 4. Save Data
  const handleSave = async () => {
    if (!selectedTeam) return;
    setIsSaving(true);
    try {
      const docId = `${selectedYear}_${selectedTeam}`;
      
      let totalAmount = 0;
      const cleanCategories = {};
      CATEGORIES.forEach(c => {
        const val = parseInt(formData[c], 10) || 0;
        cleanCategories[c] = val;
        totalAmount += val;
      });

      await setDoc(doc(db, 'budget_plans', docId), {
        year: selectedYear,
        team: selectedTeam,
        categories: cleanCategories,
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

  // 5. Aggregate Data for Dashboard
  const currentYearData = useMemo(() => {
    return budgetData.filter(d => d.year === selectedYear);
  }, [budgetData, selectedYear]);

  const totalSGA = useMemo(() => {
    return currentYearData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  }, [currentYearData]);

  const categoryTotals = useMemo(() => {
    const totals = {};
    CATEGORIES.forEach(c => totals[c] = 0);
    currentYearData.forEach(item => {
      CATEGORIES.forEach(c => {
        totals[c] += (item.categories?.[c] || 0);
      });
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [currentYearData]);

  const teamTotals = useMemo(() => {
    return currentYearData.map(item => ({
      name: item.team,
      value: item.totalAmount || 0
    })).sort((a, b) => b.value - a.value);
  }, [currentYearData]);

  const formatNumber = (num) => {
    if (!num && num !== 0) return '';
    return num.toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-24">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            사업계획 (판관비) 취합
          </h1>
          <p className="text-sm text-slate-500 mt-1">각 팀별 연간 판매관리비 예산을 입력하고 실시간으로 취합합니다.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-1 flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">예산 입력 <span className="text-xs font-normal text-slate-500 ml-1">(단위: 천원)</span></h2>
          </div>
          <div className="p-4 flex-1">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">대상 팀 선택</label>
              <select 
                value={selectedTeam} 
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">팀을 선택하세요</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {CATEGORIES.map(category => (
                <div key={category} className="flex flex-col">
                  <label className="text-xs font-medium text-slate-600 mb-1">{category}</label>
                  <input
                    type="text"
                    value={formData[category] ? formatNumber(formData[category]) : ''}
                    onChange={(e) => handleInputChange(category, e.target.value)}
                    placeholder="0"
                    className="w-full border border-slate-200 p-2 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-right"
                    disabled={!selectedTeam}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-700">합계:</span>
              <span className="font-bold text-indigo-600 text-lg">
                {formatNumber(CATEGORIES.reduce((sum, c) => sum + (parseInt(formData[c], 10) || 0), 0))} <span className="text-sm font-normal text-slate-500">천원</span>
              </span>
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <button 
              onClick={handleSave}
              disabled={isSaving || !selectedTeam}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
            {saveMessage && <p className="text-center text-sm mt-2 text-emerald-600 font-medium">{saveMessage}</p>}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
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
                     <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">합계</th>
                     {CATEGORIES.map(c => <th key={c} className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase whitespace-nowrap">{c}</th>)}
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-200">
                   {currentYearData.map(item => (
                     <tr key={item.team} className="hover:bg-slate-50">
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.team}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600 text-right">{formatNumber(item.totalAmount)}</td>
                       {CATEGORIES.map(c => (
                         <td key={c} className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">{formatNumber(item.categories?.[c] || 0)}</td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetDashboard;
