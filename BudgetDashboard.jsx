import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Save, AlertCircle, BarChart3, PieChart as PieChartIcon, Plus, Trash2, LayoutDashboard, Edit3, BookOpen, X, ChevronsRight, Download, Upload, CheckCircle, FileSpreadsheet, Scissors, HelpCircle } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import { ACCOUNT_GUIDE } from './accountGuide';

const CATEGORIES = Object.keys(ACCOUNT_GUIDE);
const COGS_CATEGORIES = ['원가성 비용']; // 판관비와 구분되는 원가성 비용 계정과목
const SGA_CATEGORIES = CATEGORIES.filter(c => !COGS_CATEGORIES.includes(c)); // 순수 판관비만
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
  const isFinance = user && (FINANCE_EMAILS.includes(user.email) || user.department === '재무팀' || user.department === '재무기획팀');

  const [activeTab, setActiveTab] = useState(isFinance ? 'dashboard' : 'input');
  const [selectedYear, setSelectedYear] = useState(2026);
  // 재무팀(관리자)은 기본 선택 없음, 일반 유저는 본인 팀 자동 선택
  const [selectedTeam, setSelectedTeam] = useState(isFinance ? '' : (user?.department || ''));
  
  const [budgetData, setBudgetData] = useState([]);
  const [items, setItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isUsageGuideOpen, setIsUsageGuideOpen] = useState(false);
  const [loadedFormId, setLoadedFormId] = useState(null);

  // 실적 업로드 관련 상태
  const uploadInputRef = useRef(null);
  const [uploadPreview, setUploadPreview] = useState(null); // { rows: [], errors: [] }
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'deduction') {
      setSelectedTeam('DEDUCTIONS');
    } else if (selectedTeam === 'DEDUCTIONS') {
      setSelectedTeam(isFinance ? '' : (user?.department || ''));
    }
  };

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
    let numStr = String(value).replace(/[^0-9-]/g, '');
    if (numStr.includes('-')) {
       const isNegative = numStr.startsWith('-');
       numStr = numStr.replace(/-/g, '');
       if (isNegative) numStr = '-' + numStr;
    }

    let numVal = 0;
    if (numStr === '-') {
      numVal = '-'; // temporarily store minus sign for typing
    } else {
      numVal = numStr ? parseInt(numStr, 10) : 0;
    }
    
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
    let numStr = String(value).replace(/[^0-9-]/g, '');
    if (numStr.includes('-')) {
       const isNegative = numStr.startsWith('-');
       numStr = numStr.replace(/-/g, '');
       if (isNegative) numStr = '-' + numStr;
    }

    let numVal = 0;
    if (numStr === '-') {
      numVal = '-';
    } else {
      numVal = numStr ? parseInt(numStr, 10) : 0;
    }
    
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newMonths = [...item.months];
        for (let i = startIndex + 1; i < 12; i++) {
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
        const rowTotal = item.months.reduce((sum, val) => sum + (val === '-' ? 0 : (val || 0)), 0);
        totalAmount += rowTotal;
        return {
          id: item.id || Date.now().toString(),
          category: item.category || '',
          detail: item.detail || '',
          description: item.description || '',
          months: (item.months || []).map(v => (v === '-' ? 0 : (v || 0))),
          rowTotal,
          ...(item.isActual ? { isActual: true } : {}),
          ...(selectedTeam === 'DEDUCTIONS' ? { targetTeam: item.targetTeam || '' } : {})
        };
      });

      await setDoc(doc(db, 'budget_plans', docId), {
        year: selectedYear,
        team: selectedTeam,
        items: cleanItems,
        totalAmount,
        updatedBy: user?.email || 'Unknown',
        updatedAt: serverTimestamp(),
        hasEstimateData: true
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

  // ─── 실적 및 예산 업로드 핸들러들 ───────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const validTeams = departments.filter(d => d && d !== '선택');
    const validCategories = CATEGORIES;

    const guideData = [
      ['📌 작성 안내'],
      [''],
      ['1. [데이터입력] 시트에 데이터를 입력해 주세요.'],
      ['2. 조직명은 정확히 입력해야 합니다. 아래 목록을 참고하세요.'],
      ['3. 계정과목 및 세목(세부항목)도 아래 기준표에 맞게 정확히 입력해 주세요.'],
      ['4. 금액 단위: 원 / 빈 행은 무시됩니다.'],
      [''],
      ['▣ 스마트 반영 규칙'],
      [' - 2026년 업로드 시: 일반 부서는 9~12월(추정)만 반영되고 1~8월은 무시됩니다.'],
      [' - 재무팀이 2026년 업로드 시: 1~8월(실적)만 반영되고 9~12월은 무시됩니다.'],
      [' - 2027/2028년 업로드 시: 1~12월 전체가 반영됩니다.'],
      [''],
      ['▣ 등록된 조직 목록'],
      ...validTeams.map(t => [t]),
      [''],
      ['▣ 계정과목 및 세목(세부항목) 기준표'],
      ['계정과목', '세목(세부항목)', '상세 설명'],
    ];

    Object.entries(ACCOUNT_GUIDE).forEach(([category, details]) => {
      details.forEach(detail => {
        guideData.push([category, detail.name, detail.desc]);
      });
    });

    const guideSheet = XLSX.utils.aoa_to_sheet(guideData);
    guideSheet['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, guideSheet, '작성안내');

    const headers = ['조직명', '계정과목', '세목(세부항목)', '적요(상세내역)', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const sampleRows = [
      [user?.department && user.department !== '선택' ? user.department : '재무팀', '직원급여', '직원급여', '', 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000],
    ];
    const inputData = [headers, ...sampleRows];
    const inputSheet = XLSX.utils.aoa_to_sheet(inputData);
    inputSheet['!cols'] = [
      { wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 20 },
      ...Array(12).fill({ wch: 8 })
    ];
    XLSX.utils.book_append_sheet(wb, inputSheet, '데이터입력');

    XLSX.writeFile(wb, `${selectedYear}년도_예산_업로드_템플릿.xlsx`);
  };

  const handleUploadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`선택된 기준 연도는 [${selectedYear}년] 입니다.\n\n해당 연도에 데이터를 업로드(덮어쓰기) 하시겠습니까?\n(만약 다른 연도의 데이터라면 '취소'를 누르고 우측 상단에서 연도를 먼저 변경해주세요)`)) {
      e.target.value = ''; // input 초기화
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const sheetName = wb.SheetNames.includes('데이터입력') ? '데이터입력' : (wb.SheetNames.includes('실적입력') ? '실적입력' : wb.SheetNames[0]);
        const ws = wb.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (rawRows.length < 2) {
          alert('데이터가 없습니다. 템플릿 양식을 확인해 주세요.');
          return;
        }

        const validTeams = new Set(departments.filter(d => d && d !== '선택'));
        const validCats = new Set(CATEGORIES);
        const dataRows = rawRows.slice(1);

        const parsed = [];
        const errors = [];

        dataRows.forEach((row, idx) => {
          const team = String(row[0] || '').trim();
          const category = String(row[1] || '').trim();
          const detail = String(row[2] || '').trim();
          const description = String(row[3] || '').trim();
          // 1~12월 (인덱스 4~15)
          const months = Array(12).fill(0).map((_, i) => {
            const n = Number(String(row[4 + i] || '0').replace(/[^0-9.-]/g, ''));
            return isNaN(n) ? 0 : Math.round(n);
          });

          if (!team && !category && months.every(m => m === 0)) return;

          const rowErrors = [];
          if (!team) rowErrors.push('조직명 없음');
          else if (!validTeams.has(team)) rowErrors.push(`조직명 불일치: "${team}"`);
          else if (!isFinance && team !== user?.department) rowErrors.push(`타 부서("${team}") 업로드 불가`);
          
          if (!category) rowErrors.push('계정과목 없음');
          else if (!validCats.has(category)) rowErrors.push(`계정과목 불일치: "${category}"`);
          if (!detail) rowErrors.push('세목 없음');

          parsed.push({
            rowNum: idx + 2,
            team, category, detail, description, months,
            hasError: rowErrors.length > 0,
            errorMsg: rowErrors.join(', '),
          });
          if (rowErrors.length > 0) errors.push({ rowNum: idx + 2, msg: rowErrors.join(', ') });
        });

        setUploadPreview({ rows: parsed, errors });
        setIsPreviewModalOpen(true);
      } catch (err) {
        console.error(err);
        alert('파일 파싱 중 오류가 발생했습니다. xlsx 형식인지 확인해 주세요.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!uploadPreview) return;
    const validRows = uploadPreview.rows.filter(r => !r.hasError);
    if (validRows.length === 0) {
      alert('저장할 수 있는 유효한 행이 없습니다.');
      return;
    }

    setIsUploading(true);
    try {
      const byTeam = {};
      validRows.forEach(row => {
        if (!byTeam[row.team]) byTeam[row.team] = [];
        byTeam[row.team].push(row);
      });

      for (const [team, rows] of Object.entries(byTeam)) {
        const docId = `${selectedYear}_${team}`;
        const existing = budgetData.find(d => d.id === docId);
        
        const newItems = rows.map(r => {
          let finalMonths = [...r.months];
          let isActual = false;

          if (selectedYear === 2026) {
            if (isFinance) {
              // 재무팀: 1~8월만 실적으로 반영
              finalMonths = [...r.months.slice(0, 8), 0, 0, 0, 0];
              isActual = true;
            } else {
              // 일반팀: 9~12월만 추정으로 반영
              finalMonths = [0, 0, 0, 0, 0, 0, 0, 0, ...r.months.slice(8, 12)];
              isActual = false;
            }
          } else {
            // 2027/2028: 전 기간 추정치로 반영
            isActual = false;
          }

          return {
            id: `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            category: r.category,
            detail: r.detail,
            description: r.description,
            months: finalMonths,
            rowTotal: finalMonths.reduce((s, v) => s + v, 0),
            isActual,
          };
        });

        let existingItemsToKeep = [];
        let hasActualData = existing?.hasActualData || false;

        if (existing?.items) {
          if (selectedYear === 2026) {
            if (isFinance) {
              // 재무팀 업로드 시, 기존 추정 데이터(일반팀 입력분) 보존
              existingItemsToKeep = existing.items.filter(i => !i.isActual);
              hasActualData = true; // 재무팀이 올렸으니 실제 데이터 존재함
            } else {
              // 일반팀 업로드 시, 기존 실적 데이터(재무팀 입력분) 보존
              existingItemsToKeep = existing.items.filter(i => i.isActual);
            }
          } else {
            // 2027년 이상은 통째로 덮어쓰기이므로 보존 안 함
            hasActualData = false;
          }
        } else if (selectedYear === 2026 && isFinance) {
           hasActualData = true;
        }

        const mergedItems = [...existingItemsToKeep, ...newItems];
        const totalAmount = mergedItems.reduce((s, i) => s + (i.rowTotal || 0), 0);

        let updatePayload = {
          year: selectedYear,
          team,
          items: mergedItems,
          totalAmount,
          hasActualData,
          updatedBy: user?.email || 'Unknown',
          updatedAt: serverTimestamp(),
        };

        if (selectedYear !== 2026 || !isFinance) {
          updatePayload.hasEstimateData = true;
        }

        await setDoc(doc(db, 'budget_plans', docId), updatePayload, { merge: true });
      }

      setUploadMessage(`✅ ${Object.keys(byTeam).length}개 부서, ${validRows.length}개 항목 저장 완료!`);
      setTimeout(() => setUploadMessage(''), 5000);
      setIsPreviewModalOpen(false);
      setUploadPreview(null);
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };
  // ────────────────────────────────────────────────────────────────────

  const handleExportExcel = () => {
    const headers = ['부서명', '연도', '계정과목', '세목(세부항목)', '적요(상세내역)', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월', '합계'];
    let csvContent = '\uFEFF' + headers.join(',') + '\n';
    
    let exportData = budgetData.filter(d => d.year === selectedYear && Array.isArray(d.items) && d.team !== '선택');
    
    let filename = `${selectedYear}년도_전체_판관비_예산취합.csv`;
    
    if (activeTab === 'input' && selectedTeam && selectedTeam !== '선택') {
      exportData = exportData.filter(d => d.team === selectedTeam);
      filename = `${selectedYear}년도_${selectedTeam}_판관비_예산.csv`;
    } else if (activeTab === 'deduction') {
      exportData = exportData.filter(d => d.team === 'DEDUCTIONS');
      filename = `${selectedYear}년도_매출차감조정_예산.csv`;
    }

    if (exportData.length === 0) {
      alert("해당 연도에 등록된 예산 데이터가 없습니다.");
      return;
    }

    exportData.forEach(doc => {
      doc.items.forEach(item => {
        const row = [
          doc.team === 'DEDUCTIONS' ? `[매출차감조정] ${item.targetTeam || '미지정'}` : doc.team,
          doc.year,
          item.category,
          item.detail,
          `"${(item.description || '').replace(/"/g, '""')}"`,
          ...item.months,
          item.months.reduce((sum, val) => sum + (val === '-' ? 0 : (val || 0)), 0)
        ];
        csvContent += row.join(',') + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleDeleteDepartmentData = async (dept) => {
    if (!window.confirm(`${dept}의 ${selectedYear}년도 데이터를 모두 삭제하시겠습니까?\n삭제 후에는 복구할 수 없으며, 초기(미업로드) 상태로 돌아갑니다.`)) return;
    
    try {
      const docId = `${selectedYear}_${dept}`;
      await deleteDoc(doc(db, 'budget_plans', docId));
      alert('삭제되었습니다.');
    } catch (error) {
      console.error(error);
      alert('삭제 중 오류가 발생했습니다.');
    }
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
    return budgetData.filter(d => d.year === selectedYear && Array.isArray(d.items) && d.team !== '선택' && d.team !== 'DEDUCTIONS');
  }, [budgetData, selectedYear]);

  // 판관비 합계 (원가성 비용 제외)
  const totalSGA = useMemo(() => {
    return currentYearData.reduce((sum, doc) => {
      const sgaOnly = (doc.items || []).reduce((s, item) => {
        if (!COGS_CATEGORIES.includes(item.category)) {
          return s + (item.rowTotal || 0);
        }
        return s;
      }, 0);
      return sum + sgaOnly;
    }, 0);
  }, [currentYearData]);

  // 원가성 비용 합계 (COGS)
  const totalCOGS = useMemo(() => {
    return currentYearData.reduce((sum, doc) => {
      const cogsOnly = (doc.items || []).reduce((s, item) => {
        if (COGS_CATEGORIES.includes(item.category)) {
          return s + (item.rowTotal || 0);
        }
        return s;
      }, 0);
      return sum + cogsOnly;
    }, 0);
  }, [currentYearData]);

  const deductionData = useMemo(() => {
    const doc = budgetData.find(d => d.id === `${selectedYear}_DEDUCTIONS`);
    return doc?.items || [];
  }, [budgetData, selectedYear]);

  const totalDeduction = useMemo(() => {
    return deductionData.reduce((sum, item) => sum + (item.rowTotal || 0), 0);
  }, [deductionData]);

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
      .sort((a, b) => {
        const idxA = CATEGORIES.indexOf(a.name);
        const idxB = CATEGORIES.indexOf(b.name);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        return a.name.localeCompare(b.name);
      });
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
        const isCOGS = COGS_CATEGORIES.includes(cat);

        if (!map[key]) {
          map[key] = { category: cat, detail: det, months: Array(12).fill(0), total: 0, isCOGS };
        }

        (item.months || []).forEach((val, idx) => {
          if (idx < 12) map[key].months[idx] += (val === '-' ? 0 : (val || 0));
        });
        map[key].total += (item.rowTotal || 0);
      });
    });

    deductionData.forEach(item => {
      const cat = item.category || '미지정';
      const originalDet = item.detail || '미지정';
      const det = `${originalDet} (차감)`;
      const key = `${cat}_${originalDet}_DEDUCT`;

      if (!map[key]) {
        map[key] = { category: cat, detail: det, originalDetail: originalDet, months: Array(12).fill(0), total: 0, isDeduction: true };
      }

      (item.months || []).forEach((val, idx) => {
        if (idx < 12) map[key].months[idx] += (val === '-' ? 0 : (val || 0));
      });
      map[key].total += (item.rowTotal || 0);
    });

    return Object.values(map)
      .filter(c => c.total !== 0)
      .sort((a, b) => {
        const idxA = CATEGORIES.indexOf(a.category);
        const idxB = CATEGORIES.indexOf(b.category);
        if (idxA !== -1 && idxB !== -1 && idxA !== idxB) return idxA - idxB;
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        
        const detailsGuide = ACCOUNT_GUIDE[a.category] || [];
        const detailIdxA = detailsGuide.findIndex(d => d.name === (a.originalDetail || a.detail));
        const detailIdxB = detailsGuide.findIndex(d => d.name === (b.originalDetail || b.detail));
        
        if (detailIdxA !== -1 && detailIdxB !== -1 && detailIdxA !== detailIdxB) return detailIdxA - detailIdxB;
        
        // If they belong to the same detail, put deduction after normal
        if ((a.originalDetail || a.detail) === (b.originalDetail || b.detail)) {
          if (a.isDeduction && !b.isDeduction) return 1;
          if (!a.isDeduction && b.isDeduction) return -1;
        }

        return a.detail.localeCompare(b.detail);
      });
  }, [currentYearData, deductionData]);

  const formatNumber = (num) => {
    if (!num && num !== 0) return '';
    return num.toLocaleString();
  };

  const deadlineText = useMemo(() => {
    const today = new Date();
    const target = new Date('2026-09-28T23:59:59+09:00');
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diff > 0) return `D-${diff}`;
    if (diff === 0) return 'D-Day';
    return '마감됨';
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-24">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              사업계획 (판관비) 취합
            </h1>
            <span className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-md text-sm font-bold shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              제출 마감: 9/28 ({deadlineText})
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">각 팀별 월별 판관비 예산을 상세하게 입력하고 취합합니다.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {[2026, 2027, 2028].map(year => (
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg w-full xl:w-fit">
          {isFinance && (
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              전사 대시보드
            </button>
          )}
          <button
            onClick={() => handleTabChange('input')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'input' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Edit3 className="w-4 h-4 shrink-0" />
            부서별 예산 입력
          </button>
          {isFinance && (
            <button
              onClick={() => handleTabChange('deduction')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'deduction' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Scissors className="w-4 h-4 shrink-0" />
              매출 차감 조정
            </button>
          )}
          <button
            onClick={() => handleTabChange('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'upload' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4 shrink-0" />
            엑셀 업로드
          </button>
          <button
            onClick={() => handleTabChange('status')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'status' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            업로드 현황
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
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
            계정과목 기준표
          </button>
          <button 
            onClick={() => setIsUsageGuideOpen(true)}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            시스템 이용 가이드
          </button>
        </div>
      </div>

      {/* INPUT OR DEDUCTION TAB */}
      {(activeTab === 'input' || activeTab === 'deduction') && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                {activeTab === 'deduction' ? '매출 차감 내역 일괄 입력' : '예산 상세 입력'}
                <span className="text-xs font-normal text-slate-500 ml-1">(단위: 원)</span>
              </h2>
              {activeTab === 'input' && (
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
              )}
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
            <table className="w-[2000px] min-w-full divide-y divide-slate-200 table-fixed">
              <thead className="bg-slate-50">
                <tr>
                  {activeTab === 'deduction' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[140px]">대상 부서</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[140px]">계정과목</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[170px]">세목 (세부항목)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[170px]">적요 (상세내역)</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-indigo-600 uppercase tracking-wider w-[130px] bg-slate-100/50">합계</th>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
                    const isActualMonth = selectedYear === 2026 && m <= 8 && activeTab !== 'deduction';
                    const isEstimateMonth = selectedYear === 2026 && m >= 9 && activeTab !== 'deduction';
                    return (
                      <th key={m} className={`px-2 py-3 text-right text-xs font-medium uppercase tracking-wider w-[110px] ${
                        isActualMonth ? 'text-blue-600 bg-blue-50' :
                        isEstimateMonth ? 'text-orange-500 bg-orange-50' :
                        'text-slate-500'
                      }`}>
                        {m}월{isActualMonth ? '▣' : isEstimateMonth ? '◎' : ''}
                      </th>
                    );
                  })}
                  <th className="px-2 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-[50px]">삭제</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {!selectedTeam ? (
                  <tr>
                    <td colSpan={activeTab === 'deduction' ? 18 : 17} className="px-6 py-12 text-center text-slate-500">
                      상단에서 팀을 먼저 선택해 주세요.
                    </td>
                  </tr>
                ) : items.map((item) => {
                  const rowTotal = item.months.reduce((sum, val) => sum + (val === '-' ? 0 : (val || 0)), 0);
                  const availableDetails = [...(ACCOUNT_GUIDE[item.category] || [])];
                  if (item.category && !availableDetails.find(d => d.name === item.category)) {
                    availableDetails.unshift({ name: item.category, desc: item.category + ' 기본' });
                  }
                  if (item.detail && !availableDetails.find(d => d.name === item.detail)) {
                    availableDetails.push({ name: item.detail, desc: '직접입력' });
                  }
                  const selectedDetailInfo = availableDetails.find(d => d.name === item.detail);
                  const isLockedByFinance = item.isActual && !isFinance;
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      {activeTab === 'deduction' && (
                        <td className="px-2 py-2 align-top">
                          <select 
                            value={item.targetTeam || ''}
                            onChange={(e) => handleItemChange(item.id, 'targetTeam', e.target.value)}
                            className="w-full border-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs py-1.5"
                          >
                            <option value="">부서 선택</option>
                            {departments.filter(d => d !== '선택').map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td className="px-2 py-2 align-top">
                        <select 
                          value={item.category}
                          onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                          disabled={isLockedByFinance}
                          className={`w-full border-slate-200 rounded-md shadow-sm text-xs py-1.5 ${isLockedByFinance ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <select 
                          value={item.detail}
                          onChange={(e) => handleItemChange(item.id, 'detail', e.target.value)}
                          disabled={isLockedByFinance}
                          className={`w-full border-slate-200 rounded-md shadow-sm text-xs py-1.5 ${isLockedByFinance ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
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
                          readOnly={isLockedByFinance}
                          placeholder="비고, 상세명칭 입력"
                          className={`w-full border-slate-200 rounded-md shadow-sm text-xs py-1.5 ${isLockedByFinance ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                        />
                      </td>
                      <td className="px-2 py-2 align-top text-right font-bold text-indigo-600 text-sm pt-3 bg-slate-50/50">
                        {formatNumber(rowTotal)}
                      </td>
                      {item.months.map((val, mIndex) => {
                        const isActualCell = selectedYear === 2026 && mIndex < 8 && item.isActual;
                        const isActualColBg = selectedYear === 2026 && mIndex < 8;
                        const isEstimateColBg = selectedYear === 2026 && mIndex >= 8;
                        return (
                          <td key={mIndex} className={`px-1 py-2 align-top ${isActualColBg ? 'bg-blue-50/40' : isEstimateColBg ? 'bg-orange-50/30' : ''}`}>
                            <div className="relative group flex items-center">
                              <input 
                                type="text" 
                                value={val ? formatNumber(val) : ''}
                                onChange={(e) => handleMonthChange(item.id, mIndex, e.target.value)}
                                readOnly={isActualCell && !isFinance}
                                className={`w-full border-slate-200 rounded-md shadow-sm text-xs py-1.5 text-right px-1 pr-4 ${
                                  isActualCell && !isFinance
                                    ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-transparent'
                                    : 'focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                                placeholder="0"
                              />
                              {!isActualCell && mIndex < 11 && (
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
                        );
                      })}
                      <td className="px-2 py-2 align-top text-center pt-3">
                        <button 
                          onClick={() => handleRemoveRow(item.id)}
                          disabled={isLockedByFinance}
                          className={`${isLockedByFinance ? 'text-slate-300 cursor-not-allowed' : 'text-red-400 hover:text-red-600 transition-colors'} p-1`}
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
                    <td colSpan={activeTab === 'deduction' ? 4 : 3} className="px-4 py-3 text-right font-bold text-slate-700">총계</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600 text-sm bg-slate-100/50">
                      {formatNumber(items.reduce((sum, item) => sum + item.months.reduce((s, v) => s + (v === '-' ? 0 : (v || 0)), 0), 0))}
                    </td>
                    {[0,1,2,3,4,5,6,7,8,9,10,11].map(mIndex => {
                      const monthTotal = items.reduce((sum, item) => sum + (item.months[mIndex] || 0), 0);
                      return (
                        <td key={mIndex} className="px-2 py-3 text-right font-bold text-slate-700 text-xs">
                          {formatNumber(monthTotal)}
                        </td>
                      );
                    })}
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
          {/* 상단 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* 판관비 */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
              <p className="text-xs font-medium text-slate-500 mb-1">{selectedYear}년 판관비 (SG&A)</p>
              <p className="text-lg font-bold text-slate-800">{formatNumber(totalSGA)}</p>
              <p className="text-[10px] text-slate-400 mt-1">원가성 비용 제외</p>
            </div>
            {/* 원가성 비용 */}
            <div className="bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-200 flex flex-col justify-center">
              <p className="text-xs font-medium text-amber-600 mb-1">원가성 비용 (COGS)</p>
              <p className="text-lg font-bold text-amber-800">{formatNumber(totalCOGS)}</p>
              <p className="text-[10px] text-amber-500 mt-1">판관비 미포함 별도 관리</p>
            </div>
            {/* 매출 차감 */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
              <p className="text-xs font-medium text-slate-500 mb-1">매출 차감 조정액</p>
              <p className="text-lg font-bold text-rose-600">{formatNumber(totalDeduction)}</p>
              <p className="text-[10px] text-slate-400 mt-1">재무팀 조정</p>
            </div>
            {/* 최종 판관비 Net */}
            <div className="bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100 flex flex-col justify-center">
              <p className="text-xs font-medium text-indigo-600 mb-1">최종 판관비 Net</p>
              <p className="text-lg font-bold text-indigo-900">{formatNumber(totalSGA + totalDeduction)}</p>
              <p className="text-[10px] text-indigo-400 mt-1">판관비 + 매출차감 조정</p>
            </div>
            {/* 제출 현황 */}
            <div className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-100 flex flex-col justify-center">
              <p className="text-xs font-medium text-emerald-600 mb-1">제출 완료 팀</p>
              <p className="text-lg font-bold text-emerald-900">
                {currentYearData.filter(d => selectedYear === 2026 ? d.hasEstimateData : d.items && d.items.length > 0).length} 
                <span className="text-sm font-normal text-emerald-700"> / {departments.filter(d => d !== '선택').length} 팀</span>
              </p>
            </div>
          </div>

          {/* 차트 영역 숨김 처리 (요청 사항)
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            ... 차트 영역 ...
          </div>
          */}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-slate-800">팀별 세부 현황 (단위: 원)</h3>
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
                         <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-900">{doc.team}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-indigo-600 text-right">{formatNumber(doc.totalAmount)}</td>
                         {categoryTotals.map(c => (
                           <td key={c.name} className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 text-right">
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
               <h3 className="font-bold text-slate-800">계정과목 및 세목별 월별 합산 현황 (단위: 원)</h3>
               <button
                 onClick={handleExportSummaryExcel}
                 className="flex items-center gap-2 bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors"
               >
                 <Download className="w-4 h-4" />
                 엑셀 다운로드
               </button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-[2000px] min-w-full divide-y divide-slate-200 table-fixed border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase w-[140px]">계정과목</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase w-[160px]">세목 (세부항목)</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-indigo-600 uppercase w-[150px] bg-slate-100/50">합계</th>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                        <th key={m} className="px-2 py-3 text-right text-xs font-medium text-slate-500 uppercase w-[120px]">{m}월</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {detailMonthlyTotals.map(row => {
                      const rowBg = row.isDeduction ? 'bg-rose-50/20' : row.isCOGS ? 'bg-amber-50/30' : '';
                      const textColor = row.isDeduction ? 'text-rose-500' : row.isCOGS ? 'text-amber-700' : 'text-slate-500';
                      const totalColor = row.isDeduction ? 'text-rose-600' : row.isCOGS ? 'text-amber-700 font-bold' : 'text-indigo-600';
                      return (
                        <tr key={`${row.category}_${row.detail}`} className={`hover:bg-slate-50 ${rowBg}`}>
                          <td className={`px-6 py-4 whitespace-nowrap text-xs font-medium ${row.isCOGS ? 'text-amber-800' : 'text-slate-900'}`}>
                            {row.category}
                            {row.isCOGS && <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-600 border border-amber-200 px-1 py-0.5 rounded font-normal">원가</span>}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-xs ${textColor}`}>{row.detail}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-xs font-bold text-right ${totalColor} bg-slate-50/50`}>{formatNumber(row.total)}</td>
                          {row.months.map((val, idx) => (
                            <td key={idx} className={`px-2 py-4 whitespace-nowrap text-xs text-right ${textColor}`}>{formatNumber(val)}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="px-6 py-3 text-left font-bold text-slate-700 text-sm">판관비 (SG&amp;A) 소계</td>
                      <td className="px-6 py-3 text-right font-bold text-indigo-700 text-sm bg-slate-100/50">
                        {formatNumber(detailMonthlyTotals.filter(c => !c.isCOGS && !c.isDeduction).reduce((sum, c) => sum + c.total, 0))}
                      </td>
                      {[0,1,2,3,4,5,6,7,8,9,10,11].map(mIndex => {
                        const sgaMonthTotal = detailMonthlyTotals.filter(c => !c.isCOGS && !c.isDeduction).reduce((sum, c) => sum + c.months[mIndex], 0);
                        return (
                          <td key={mIndex} className="px-2 py-3 text-right font-bold text-slate-700 text-xs">
                            {formatNumber(sgaMonthTotal)}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="bg-amber-50/40">
                      <td colSpan={2} className="px-6 py-3 text-left font-bold text-amber-700 text-sm">원가성 비용 (COGS) 소계</td>
                      <td className="px-6 py-3 text-right font-bold text-amber-800 text-sm bg-amber-100/30">
                        {formatNumber(detailMonthlyTotals.filter(c => c.isCOGS).reduce((sum, c) => sum + c.total, 0))}
                      </td>
                      {[0,1,2,3,4,5,6,7,8,9,10,11].map(mIndex => {
                        const cogsMonthTotal = detailMonthlyTotals.filter(c => c.isCOGS).reduce((sum, c) => sum + c.months[mIndex], 0);
                        return (
                          <td key={mIndex} className="px-2 py-3 text-right font-bold text-amber-700 text-xs">
                            {formatNumber(cogsMonthTotal)}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* 엑셀 업로드 탭 */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* 안내 배너 */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-orange-800 text-sm">{selectedYear}년도 예산 및 실적 엑셀 일괄 업로드</p>
              <p className="text-orange-700 text-xs mt-1">
                엑셀 템플릿을 다운로드 → 데이터 입력 → 파일 업로드 순서로 진행합니다. (일반 부서는 본인 부서 데이터만 업로드 가능)<br/>
                <span className="font-semibold text-orange-800 bg-orange-200 px-1 rounded inline-block mt-1">
                  {selectedYear === 2026 && !isFinance && '일반 부서가 업로드 시 1~8월 칸은 무시되고 9~12월(추정) 데이터만 반영됩니다. (재무팀 실적 데이터 보호)'}
                  {selectedYear === 2026 && isFinance && '재무팀이 업로드 시 1~8월(실적) 데이터로 덮어쓰기 됩니다.'}
                  {selectedYear !== 2026 && `선택하신 ${selectedYear}년도 1~12월 데이터로 전체 덮어쓰기 됩니다.`}
                </span>
              </p>
            </div>
          </div>

          {/* 액션 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* STEP 1: 템플릿 다운로드 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">1</div>
                <h3 className="font-bold text-slate-800">엑셀 템플릿 다운로드</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                조직명, 계정과목, 세목, 1~8월 금액 입력 양식이 포함된 템플릿입니다.<br/>
                <span className="text-blue-600 font-medium">작성안내 시트</span>에 조직 목록과 계정과목 기준이 안내되어 있습니다.
              </p>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 w-full justify-center bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                템플릿 다운로드 (.xlsx)
              </button>
            </div>

            {/* STEP 2: 파일 업로드 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">2</div>
                <h3 className="font-bold text-slate-800">실적 파일 업로드</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                작성한 엑셀 파일(.xlsx)을 업로드하면 내용을 미리보기로 확인한 후 저장됩니다.<br/>
                <span className="text-orange-600 font-medium">오류 행은 자동 감지</span>되어 정상 행만 저장됩니다.
              </p>
              <label className="flex items-center gap-2 w-full justify-center bg-orange-500 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-orange-600 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                파일 선택 및 업로드
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleUploadFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 업로드 완료 메시지 */}
          {uploadMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-2 font-medium text-sm">
              <CheckCircle className="w-5 h-5" />
              {uploadMessage}
            </div>
          )}
        </div>
      )}

      {/* 업로드 현황 탭 */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{selectedYear}년 업로드 현황</h3>
              {!isFinance && <span className="text-xs text-slate-500 font-medium">본인 부서 현황만 표시됩니다.</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">조직명</th>
                    {selectedYear === 2026 && <th className="px-4 py-3 text-center">실적(1~8월) 상태</th>}
                    <th className="px-4 py-3 text-center">{selectedYear === 2026 ? '추정(9~12월) 상태' : '예산(1~12월) 상태'}</th>
                    <th className="px-4 py-3 text-right">항목 수</th>
                    <th className="px-4 py-3 text-right">합계 (원)</th>
                    <th className="px-4 py-3 text-left">최종 수정</th>
                    <th className="px-4 py-3 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments
                    .filter(d => d && d !== '선택')
                    .filter(d => isFinance || d === user?.department)
                    .map(dept => {
                    const docData = budgetData.find(d => d.id === `${selectedYear}_${dept}`);
                    const is2026 = selectedYear === 2026;
                    
                    const targetItems = docData?.items || [];
                    const targetTotal = targetItems.reduce((s, i) => s + (i.rowTotal || 0), 0);
                    const isActualUploaded = docData?.hasActualData;
                    const isEstimateUploaded = docData?.hasEstimateData;

                    return (
                      <tr key={dept} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{dept}</td>
                        {is2026 && (
                          <td className="px-4 py-3 text-center">
                            {isActualUploaded
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"><CheckCircle className="w-3 h-3"/>업로드완료</span>
                              : <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-xs rounded-full">미업로드</span>}
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          {isEstimateUploaded
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium"><CheckCircle className="w-3 h-3"/>제출완료</span>
                            : <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-xs rounded-full">미제출</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">{targetItems.length > 0 ? `${targetItems.length}건` : '-'}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700">{targetTotal > 0 ? targetTotal.toLocaleString() : '-'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{docData?.updatedBy || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteDepartmentData(dept)}
                            disabled={!isActualUploaded && !isEstimateUploaded && !targetItems.length}
                            className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-white border border-red-200 text-red-600 text-xs rounded hover:bg-red-50 disabled:opacity-30 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            전체 삭제
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
      )}

      {/* 미리보기 확인 모달 */}
      {isPreviewModalOpen && uploadPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-orange-500" />
                  업로드 미리보기 확인
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  정상 <span className="text-emerald-600 font-bold">{uploadPreview.rows.filter(r => !r.hasError).length}건</span>
                  {' '} / 오류 <span className="text-red-500 font-bold">{uploadPreview.errors.length}건</span>
                  {' '} / 전체 {uploadPreview.rows.length}건
                </p>
              </div>
              <button onClick={() => { setIsPreviewModalOpen(false); setUploadPreview(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadPreview.errors.length > 0 && (
              <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-bold text-red-700 mb-1">⚠️ 오류 항목 — 해당 행은 저장되지 않습니다</p>
                <ul className="text-xs text-red-600 space-y-0.5">
                  {uploadPreview.errors.map((e, i) => (
                    <li key={i}>{e.rowNum}행: {e.msg}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="overflow-auto flex-1 p-4">
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase whitespace-nowrap">
                    <th className="px-3 py-2 text-left w-8">#</th>
                    <th className="px-3 py-2 text-left">조직명</th>
                    <th className="px-3 py-2 text-left">계정과목</th>
                    <th className="px-3 py-2 text-left">세목</th>
                    <th className="px-3 py-2 text-left">적요</th>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <th key={m} className={`px-2 py-2 text-right ${selectedYear === 2026 ? (m <= 8 ? 'text-blue-600' : 'text-orange-500') : 'text-slate-600'}`}>
                        {m}월
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right font-bold text-indigo-600">합계</th>
                    <th className="px-3 py-2 text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadPreview.rows.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 whitespace-nowrap ${row.hasError ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-3 py-1.5 text-slate-400">{row.rowNum}</td>
                      <td className="px-3 py-1.5 font-medium text-slate-800">{row.team}</td>
                      <td className="px-3 py-1.5 text-slate-600">{row.category}</td>
                      <td className="px-3 py-1.5 text-slate-600">{row.detail}</td>
                      <td className="px-3 py-1.5 text-slate-400">{row.description}</td>
                      {row.months.map((v, mi) => (
                        <td key={mi} className="px-2 py-1.5 text-right text-slate-700">{v ? v.toLocaleString() : ''}</td>
                      ))}
                      <td className="px-3 py-1.5 text-right font-bold text-indigo-600">
                        {row.months.reduce((s, v) => s + v, 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        {row.hasError
                          ? <span className="text-red-500 font-bold text-[10px]">오류</span>
                          : <span className="text-emerald-500 font-bold text-[10px]">✓정상</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between items-center">
              <p className="text-sm text-slate-500">
                정상 <strong className="text-emerald-600">{uploadPreview.rows.filter(r => !r.hasError).length}건</strong>만 저장됩니다.
                {uploadPreview.errors.length > 0 && <span className="text-red-400 ml-2">(오류 {uploadPreview.errors.length}건 제외)</span>}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setIsPreviewModalOpen(false); setUploadPreview(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={isUploading || uploadPreview.rows.filter(r => !r.hasError).length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {isUploading ? '저장 중...' : '확인 후 저장'}
                </button>
              </div>
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

      {/* 시스템 이용 가이드 모달 */}
      {isUsageGuideOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                시스템 이용 가이드 (사용자 매뉴얼)
              </h2>
              <button onClick={() => setIsUsageGuideOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">1</span>
                  기본 작성 규칙 (2026년 기준)
                </h3>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <div>
                      <strong className="text-slate-700">1월 ~ 8월 (실적):</strong> 재무팀에서 ERP 결산 데이터를 바탕으로 일괄 반영합니다. 
                      <span className="text-rose-500 font-medium ml-1">각 사업부서에서는 1~8월을 비워두시거나 아무 숫자나 넣으셔도 무시됩니다.</span>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <div>
                      <strong className="text-slate-700">9월 ~ 12월 (추정):</strong> 각 사업부서에서 예상되는 발생 비용을 입력합니다. 시스템에 엑셀을 업로드하면 <strong>스마트하게 9~12월 데이터만 발췌</strong>하여 저장됩니다.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">2</span>
                  특수 비용 처리 안내
                </h3>
                <div className="space-y-4">
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <h4 className="font-bold text-amber-800 mb-2">💰 원가성 비용 (COGS) 입력</h4>
                    <p className="text-sm text-amber-700">
                      교육팀의 '교육 상품'이나 가맹점 프로모션용 '원두 지원' 등은 판관비가 아닌 원가성 비용입니다. 
                      계정과목 선택 시 목록 맨 하단의 <strong>[원가성 비용]</strong> 대분류를 선택하신 후 세부 항목을 지정해 주세요.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-2">✂️ 매출 차감 거래 귀속분</h4>
                    <p className="text-sm text-slate-600">
                      광고선전비/판매촉진비/지급수수료 중 향후 매출 차감으로 귀속되어야 하는 거래건이라도, 
                      <strong>각 부서에서는 마이너스(-) 입력 없이 일반 비용(Gross)으로 기입</strong>해 주십시오. 차감 조정은 재무팀에서 일괄 진행합니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">3</span>
                  입력 방법 안내 (선택)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      엑셀 일괄 업로드 (권장)
                    </h4>
                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                      <li>상단 <strong>[엑셀 업로드]</strong> 탭 클릭</li>
                      <li>템플릿 다운로드 및 작성</li>
                      <li>파일 선택하여 업로드 (자동 저장)</li>
                    </ol>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-indigo-600" />
                      화면 내 직접 입력
                    </h4>
                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                      <li>상단 <strong>[부서별 예산 입력]</strong> 탭 클릭</li>
                      <li>'행 추가' 버튼으로 항목 생성</li>
                      <li>우측 <strong>'저장하기'</strong> 버튼 클릭 (필수)</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
              <button 
                onClick={() => setIsUsageGuideOpen(false)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                가이드 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetDashboard;
