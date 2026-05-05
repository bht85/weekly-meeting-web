import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getCollectionName } from './utils';
import {
    collection, addDoc, query, getDocs, onSnapshot,
    serverTimestamp, doc, updateDoc, deleteDoc, orderBy, writeBatch
} from 'firebase/firestore';
import {
    Users, Plus, Calendar, Target,
    CheckCircle2, Clock, X, Trash2, Edit2, Briefcase, PieChart,
    Search, UserPlus, MapPin, Upload, Network
} from 'lucide-react';

const HRDashboard = ({ db, user, isAdmin }) => {
    const allowedEmails = ['esc913@composecoffee.co.kr', 'choihy@composecoffee.co.kr'];
    const hasAccess = user && allowedEmails.includes(user.email);

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                <Network size={48} className="mb-4 opacity-20 text-red-500" />
                <h3 className="text-xl font-bold mb-2 text-slate-800">접근 권한이 없습니다</h3>
                <p>이 페이지는 보안 관계상 지정된 관리자만 접근할 수 있습니다.</p>
                <p className="text-sm mt-2 opacity-70">문의: 인사팀 관리자</p>
            </div>
        );
    }

    const [activeTab, setActiveTab] = useState('recruitment'); // 'recruitment' | 'onboarding' | 'roster'
    
    // Recruitment State
    const [recruits, setRecruits] = useState([]);
    const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false);
    const [editingRecruit, setEditingRecruit] = useState(null);

    // Onboarding State
    const [onboardings, setOnboardings] = useState([]);
    const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
    const [editingOnboard, setEditingOnboard] = useState(null);

    // Employee Roster State
    const [employees, setEmployees] = useState([]);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef(null);
    const onboardingFileInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    // 날짜 문자열 정규화 헬퍼
    const cleanDateString = (dateStr) => {
        if (!dateStr) return '';
        let str = String(dateStr).trim().replace(/\s+/g, '');
        if (str.includes('/')) {
            const parts = str.split('/');
            if (parts.length === 3) {
                let p1 = parts[0], p2 = parts[1], p3 = parts[2];
                let y, m, d;
                if (p1.length === 4) { y = p1; m = p2; d = p3; }
                else { m = p1; d = p2; y = p3; if (y.length === 2) y = '20' + y; }
                return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
        }
        if (str.includes('.')) {
            const parts = str.split('.').filter(p => p);
            if (parts.length >= 3) {
                let y = parts[0], m = parts[1], d = parts[2];
                if (y.length === 2) y = '20' + y;
                return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
        }
        return str;
    };

    // 1. 초기 로드 시 로컬 스토리지에서 캐시 데이터 불러오기
    useEffect(() => {
        const cachedRecruits = localStorage.getItem('hr_cache_recruits');
        const cachedOnboardings = localStorage.getItem('hr_cache_onboardings');
        const cachedEmployees = localStorage.getItem('hr_cache_employees');
        const cachedTime = localStorage.getItem('hr_cache_time');

        if (cachedRecruits) setRecruits(JSON.parse(cachedRecruits));
        if (cachedOnboardings) setOnboardings(JSON.parse(cachedOnboardings));
        if (cachedEmployees) setEmployees(JSON.parse(cachedEmployees));
        if (cachedTime) setLastUpdated(new Date(cachedTime));
    }, []);

    // 2. 데이터 수동 조회 함수 (효율성 개선)
    const fetchHRData = async () => {
        if (!db || !user) return;
        setLoading(true);
        console.log("Fetching HR Data (Manual)...");

        try {
            // 병렬로 데이터 조회
            const [recruitSnap, onboardSnap, employeeSnap] = await Promise.all([
                getDocs(query(collection(db, getCollectionName('hr_recruitment', user)), orderBy('createdAt', 'desc'))),
                getDocs(query(collection(db, getCollectionName('hr_onboarding', user)), orderBy('createdAt', 'desc'))),
                getDocs(collection(db, getCollectionName('employees', user)))
            ]);

            const newRecruits = recruitSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const newOnboardings = onboardSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const newEmployees = employeeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 상태 업데이트
            setRecruits(newRecruits);
            setOnboardings(newOnboardings);
            setEmployees(newEmployees);
            
            const now = new Date();
            setLastUpdated(now);

            // 로컬 스토리지 저장 (캐싱)
            localStorage.setItem('hr_cache_recruits', JSON.stringify(newRecruits));
            localStorage.setItem('hr_cache_onboardings', JSON.stringify(newOnboardings));
            localStorage.setItem('hr_cache_employees', JSON.stringify(newEmployees));
            localStorage.setItem('hr_cache_time', now.toISOString());

            setLoading(false);
        } catch (err) {
            console.error("HR data fetch error:", err);
            alert("데이터를 불러오는 중 오류가 발생했습니다.");
            setLoading(false);
        }
    };

    // 실시간 동기화가 필요한 경우에만 사용할 수 있도록 handleManualRefresh를 fetchHRData로 교체
    const handleManualRefresh = () => {
        fetchHRData();
    };


    // Save Data Handlers
    const handleSaveRecruit = async (data) => {
        try {
            if (editingRecruit) {
                await updateDoc(doc(db, getCollectionName('hr_recruitment', user), editingRecruit.id), { ...data, updatedAt: serverTimestamp() });
            } else {
                await addDoc(collection(db, getCollectionName('hr_recruitment', user)), { ...data, createdAt: serverTimestamp() });
            }
            setIsRecruitModalOpen(false);
            setEditingRecruit(null);
            fetchHRData(); // 데이터 반영을 위해 재조회
        } catch (error) { console.error(error); alert("저장 실패"); }
    };

    const handleSaveOnboard = async (data) => {
        try {
            if (editingOnboard) {
                await updateDoc(doc(db, getCollectionName('hr_onboarding', user), editingOnboard.id), { ...data, updatedAt: serverTimestamp() });
            } else {
                await addDoc(collection(db, getCollectionName('hr_onboarding', user)), { ...data, createdAt: serverTimestamp() });
            }

            // [자동 반영] 퇴사 기록 저장 시 → 재직현황 employees에 exitDate, status 동기화
            if (data.type === '퇴사' && data.exitDate && data.linkedEmployeeId) {
                const empRef = doc(db, getCollectionName('employees', user), data.linkedEmployeeId);
                await updateDoc(empRef, {
                    exitDate: data.exitDate,
                    status: '퇴사',
                    updatedAt: serverTimestamp()
                });
            }

            setIsOnboardModalOpen(false);
            setEditingOnboard(null);
            fetchHRData(); // 데이터 반영을 위해 재조회
        } catch (error) { console.error(error); alert("저장 실패"); }
    };

    const handleSaveEmployee = async (data) => {
        try {
            if (editingEmployee) {
                await updateDoc(doc(db, getCollectionName('employees', user), editingEmployee.id), { ...data, updatedAt: serverTimestamp() });
            } else {
                await addDoc(collection(db, getCollectionName('employees', user)), { ...data, createdAt: serverTimestamp() });
            }
            setIsEmployeeModalOpen(false);
            setEditingEmployee(null);
            fetchHRData(); // 데이터 반영을 위해 재조회
        } catch (error) { console.error(error); alert("저장 실패"); }
    };

    const handleDelete = async (collectionName, id) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deleteDoc(doc(db, getCollectionName(collectionName, user), id));
            fetchHRData(); // 데이터 반영을 위해 재조회
        } catch (error) { console.error(error); }
    };


    // Excel Upload Logic
    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Load XLSX library dynamically
            if (!window.XLSX) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
            }

            const reader = new FileReader();
            reader.onload = async (evt) => {
                const bstr = evt.target.result;
                const wb = window.XLSX.read(bstr, { type: 'binary' });
                // 우선 이름이 정확히 '인원현황'인 시트를 찾고, 없으면 포함하는 시트, 그래도 없으면 첫 번째 시트 사용
                const exactSheetName = wb.SheetNames.find(name => name.trim() === '인원현황');
                const targetSheetName = exactSheetName || wb.SheetNames.find(name => name.includes('인원현황')) || wb.SheetNames[0];
                const ws = wb.Sheets[targetSheetName];
                
                // 1. 배열 형태로 먼저 읽어서 '성명' 헤더가 있는 실제 행(Row) 찾기
                const rawArrayData = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
                let headerRowIndex = -1;
                
                for (let i = 0; i < rawArrayData.length; i++) {
                    const row = rawArrayData[i];
                    if (row && row.some(cell => typeof cell === 'string' && (cell.replace(/\s+/g, '') === '성명' || cell.replace(/\s+/g, '') === '이름'))) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    alert(`'${targetSheetName}' 시트에서 '성명' 열을 찾을 수 없습니다. 엑셀 양식을 확인해주세요.`);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }

                // 2. 찾은 헤더 행부터 다시 객체로 파싱 (raw: false를 추가하여 엑셀에 보이는 날짜 텍스트 그대로 가져옴)
                const rawData = window.XLSX.utils.sheet_to_json(ws, { range: headerRowIndex, defval: "", raw: false });

                const normalizeKey = (key) => key.replace(/\s+/g, '').replace(/\n/g, '');

                const parsedData = rawData.map(row => {
                    const normRow = {};
                    for (const key in row) {
                        normRow[normalizeKey(key)] = row[key];
                    }
                    return normRow;
                }).filter(row => row['성명'] || row['이름']);

                if (parsedData.length === 0) {
                    alert("업로드할 유효한 데이터가 없습니다.");
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }

                if (!window.confirm(`'${targetSheetName}' 시트에서 총 ${parsedData.length}건의 데이터를 찾았습니다. 기존 데이터에 추가 업로드 하시겠습니까?`)) {
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }

                const colRef = collection(db, getCollectionName('employees', user));
                const chunks = [];
                for (let i = 0; i < parsedData.length; i += 450) {
                    chunks.push(parsedData.slice(i, i + 450));
                }

                const _cleanDateString = cleanDateString;

                for (const chunk of chunks) {
                    const batch = writeBatch(db);
                    chunk.forEach((row, index) => {
                        const employeeData = {
                            order: row['순번'] || row['No'] || index,
                            name: row['성명'] || row['이름'] || '',
                            contractType: row['계약형태'] || '',
                            status: '재직', // 항상 재직으로 초기화 (데이터 자체가 재직자 명단이므로)
                            division: row['구분'] || row['본부'] || '', // 엑셀의 '구분'이 본부(Division)를 의미함
                            department: row['소속'] || '', // 엑셀의 '소속'이 큰 부서를 의미함
                            team: row['부서'] || row['팀'] || '', // 엑셀의 '부서'가 세부 팀을 의미함
                            location: row['현근무지'] || row['근무지'] || '',
                            bandCode: row['BandCode'] || row['밴드코드'] || '',
                            position: row['직위'] || row['직급'] || '',
                            phone: row['연락처'] || row['전화번호'] || '',
                            firstJoinDate: _cleanDateString(row['최초입사일']),
                            joinDate: _cleanDateString(row['입사일']),
                            contractEndDate: _cleanDateString(row['계약종료일수습종료일'] || row['계약종료일'] || row['수습종료일']),
                            notes: row['비고'] || '',
                            createdAt: serverTimestamp()
                        };
                        const newDocRef = doc(colRef);
                        batch.set(newDocRef, employeeData);
                    });
                    await batch.commit();
                }

                fetchHRData(); // 데이터 반영을 위해 재조회
                alert('업로드가 성공적으로 완료되었습니다!');
                if (fileInputRef.current) fileInputRef.current.value = '';
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            console.error(error);
            alert("엑셀 처리 중 오류가 발생했습니다. 파일을 확인해주세요.");
        }
    };

    const handleOnboardingExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            if (!window.XLSX) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
            }

            const reader = new FileReader();
            reader.onload = async (evt) => {
                const bstr = evt.target.result;
                const wb = window.XLSX.read(bstr, { type: 'binary' });
                
                // 입퇴사 현황 시트 
                const targetSheetName = wb.SheetNames.find(name => name.includes('입퇴사')) || wb.SheetNames[0];
                const ws = wb.Sheets[targetSheetName];
                
                const rawArrayData = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
                let headerRowIndex = -1;
                
                for (let i = 0; i < rawArrayData.length; i++) {
                    const row = rawArrayData[i];
                    if (row && row.some(cell => typeof cell === 'string' && cell.replace(/\s+/g, '') === '성명')) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    alert(`'${targetSheetName}' 시트에서 '성명' 열을 찾을 수 없습니다.`);
                    if (onboardingFileInputRef.current) onboardingFileInputRef.current.value = '';
                    return;
                }

                const rawData = window.XLSX.utils.sheet_to_json(ws, { range: headerRowIndex, defval: "", raw: false });

                const parsedData = rawData.map(row => {
                    const normalizedRow = {};
                    for (const key in row) {
                        normalizedRow[key.replace(/\s+/g, '').replace(/\n/g, '')] = row[key];
                    }
                    return normalizedRow;
                }).filter(row =>
                    row['성명'] &&
                    row['성명'] !== '성명' &&
                    row['성명'] !== '이름' &&
                    row['입사일'] !== '입사일' &&
                    row['퇴사일'] !== '퇴사일'
                );

                if (parsedData.length === 0) {
                    alert('업로드할 유효한 데이터가 없습니다.');
                    if (onboardingFileInputRef.current) onboardingFileInputRef.current.value = '';
                    return;
                }

                if (!window.confirm(`총 ${parsedData.length}건의 입퇴사 기록을 업로드하고 재직 현황 리스트에 자동 반영하시겠습니까?\n(퇴사자는 재직 현황에서 퇴사 처리되며, 신규 입사자는 새로 추가됩니다.)`)) {
                    if (onboardingFileInputRef.current) onboardingFileInputRef.current.value = '';
                    return;
                }

                const chunks = [];
                for (let i = 0; i < parsedData.length; i += 400) {
                    chunks.push(parsedData.slice(i, i + 400));
                }

                const onboardingColRef = collection(db, getCollectionName('hr_onboarding', user));
                const employeesColRef = collection(db, getCollectionName('employees', user));

                for (const chunk of chunks) {
                    const batch = writeBatch(db);
                    
                    for (const row of chunk) {
                        const isExit = (row['구분'] || '').includes('퇴사');
                        const isJoin = !isExit;
                        
                        const name = row['성명'] || '';
                        const joinDateStr = cleanDateString(row['입사일']);
                        const exitDateStr = cleanDateString(row['퇴사일']);
                        const department = row['소속'] || '';
                        const position = row['직위'] || '';
                        const typeStr = isExit ? '퇴사' : '입사';
                        const dateStr = isExit ? exitDateStr : joinDateStr;
                        const notes = row['비고'] || row['구분'] || '';

                        // 1. Add to hr_onboarding
                        const onboardingRef = doc(onboardingColRef);
                        batch.set(onboardingRef, {
                            name,
                            department,
                            type: typeStr,
                            date: dateStr,
                            notes,
                            createdAt: serverTimestamp()
                        });

                        // 2. Sync to employees
                        const existingEmp = employees.find(e => e.name === name);
                        
                        if (isExit) {
                            if (existingEmp) {
                                const empRef = doc(employeesColRef, existingEmp.id);
                                batch.update(empRef, {
                                    status: '퇴사',
                                    exitDate: dateStr,
                                    updatedAt: serverTimestamp()
                                });
                            }
                        } else {
                            // 신규 입사자는 자동 등록하지 않고, '인원 추가' 모달에서 수동으로 불러와 등록하도록 함.
                        }
                    }
                    await batch.commit();
                }

                fetchHRData(); // 데이터 반영을 위해 재조회
                alert('입퇴사 기록 업로드 및 재직 현황 자동 반영이 완료되었습니다!');
                if (onboardingFileInputRef.current) onboardingFileInputRef.current.value = '';

            };
            reader.readAsBinaryString(file);
        } catch (error) {
            console.error(error);
            alert('엑셀 파일을 읽는 중 오류가 발생했습니다.');
            if (onboardingFileInputRef.current) onboardingFileInputRef.current.value = '';
        }
    };


    const upcomingRecruits = React.useMemo(() => recruits.filter(r => r.status === '예정'), [recruits]);
    const pastRecruits = React.useMemo(() => recruits.filter(r => r.status !== '예정'), [recruits]);
    const onboardList = React.useMemo(() => onboardings.filter(o => o.type === '입사'), [onboardings]);
    const offboardList = React.useMemo(() => onboardings.filter(o => o.type === '퇴사'), [onboardings]);

    const filteredEmployees = React.useMemo(() => {
        return employees.filter(emp => 
            emp.name?.includes(searchTerm) || 
            emp.department?.includes(searchTerm) || 
            emp.division?.includes(searchTerm)
        ).sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
    }, [employees, searchTerm]);

    // 전체 삭제 기능
    const handleDeleteAllEmployees = async () => {
        if (!window.confirm("현재 등록된 모든 재직자 데이터를 정말 삭제하시겠습니까? (이 작업은 되돌릴 수 없습니다.)")) return;
        try {
            const chunks = [];
            for (let i = 0; i < employees.length; i += 450) {
                chunks.push(employees.slice(i, i + 450));
            }
            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach(emp => {
                    batch.delete(doc(db, getCollectionName('employees', user), emp.id));
                });
                await batch.commit();
            }
            fetchHRData(); // 데이터 반영을 위해 재조회
            alert("전체 데이터가 삭제되었습니다.");
        } catch (error) {
            console.error(error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const cleanupGarbageOnboarding = async () => {
        const HEADER_WORDS = ['성명', '이름', '입사일', '소속', '부서', '날짜'];
        const garbage = onboardings.filter(j =>
            HEADER_WORDS.includes((j.name || '').trim()) ||
            HEADER_WORDS.includes((j.date || '').trim()) ||
            (j.date && !/^\d{4}[-./]\d{1,2}/.test(j.date.trim()))
        );
        if (garbage.length === 0) { alert('잘못된 데이터가 없습니다.'); return; }
        if (!window.confirm(`"성명", "입사일" 등 헤더값으로 저장된 잘못된 레코드 ${garbage.length}건을 삭제하시겠습니까?`)) return;
        try {
            const colRef = collection(db, getCollectionName('hr_onboarding', user));
            const chunks = [];
            for (let i = 0; i < garbage.length; i += 450) chunks.push(garbage.slice(i, i + 450));
            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach(item => batch.delete(doc(colRef, item.id)));
                await batch.commit();
            }
            fetchHRData(); // 데이터 반영을 위해 재조회
            alert(`${garbage.length}건의 잘못된 데이터가 삭제되었습니다.`);
        } catch (e) { console.error(e); alert('삭제 실패: ' + e.message); }
    };

    return (
        <div className="bg-slate-50 min-h-screen p-4 rounded-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-200 gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <PieChart className="w-6 h-6 text-indigo-600" /> HR 대시보드
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">인사 관리의 효율을 높이는 통합 HR 솔루션</p>
                    </div>
                    <button 
                        onClick={handleManualRefresh} 
                        disabled={loading}
                        className={`ml-4 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold transition-all hover:bg-slate-50 shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : 'text-indigo-600 hover:border-indigo-200'}`}
                    >
                        <Clock className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? '데이터 조회 중...' : '데이터 조회/새로고침'}
                    </button>
                    {lastUpdated && (
                        <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                            업데이트: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
                    <button onClick={() => setActiveTab('recruitment')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'recruitment' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Target className="w-4 h-4" /> 채용 관리
                    </button>
                    <button onClick={() => setActiveTab('onboarding')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'onboarding' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Briefcase className="w-4 h-4" /> 입/퇴사 현황
                    </button>
                    <button onClick={() => setActiveTab('roster')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'roster' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Users className="w-4 h-4" /> 재직 현황
                    </button>
                    <button onClick={() => setActiveTab('orgchart')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'orgchart' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Network className="w-4 h-4" /> 조직도
                    </button>
                </div>
            </div>

            {activeTab === 'recruitment' && <RecruitmentTab upcomingRecruits={upcomingRecruits} pastRecruits={pastRecruits} onOpenModal={(r = null) => { setEditingRecruit(r); setIsRecruitModalOpen(true); }} onDelete={(id) => handleDelete('hr_recruitment', id)} />}
            {activeTab === 'onboarding' && (
                <OnboardingTab 
                    onboardList={onboardings.filter(o => o.type === '입사')} 
                    offboardList={onboardings.filter(o => o.type === '퇴사')} 
                    onOpenModal={(data = null) => { setEditingOnboard(data); setIsOnboardModalOpen(true); }}
                    onDelete={(id) => handleDelete('hr_onboarding', id)}
                    handleOnboardingExcelUpload={handleOnboardingExcelUpload}
                    onboardingFileInputRef={onboardingFileInputRef}
                    onCleanupGarbage={cleanupGarbageOnboarding}
                />
            )}
            {activeTab === 'roster' && (
                <EmployeeRosterTab 
                    employees={filteredEmployees} searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
                    onOpenModal={(e = null) => { setEditingEmployee(e); setIsEmployeeModalOpen(true); }} 
                    onDelete={(id) => handleDelete('employees', id)}
                    fileInputRef={fileInputRef} handleExcelUpload={handleExcelUpload}
                    handleDeleteAllEmployees={handleDeleteAllEmployees}
                />
            )}
            {activeTab === 'orgchart' && <OrganizationChartTab employees={filteredEmployees} />}

            {isRecruitModalOpen && <RecruitModal onClose={() => setIsRecruitModalOpen(false)} onSubmit={handleSaveRecruit} initialData={editingRecruit} />}
            {isOnboardModalOpen && <OnboardModal onClose={() => setIsOnboardModalOpen(false)} onSubmit={handleSaveOnboard} initialData={editingOnboard} employees={employees} />}
            {isEmployeeModalOpen && (
                <EmployeeModal 
                    onClose={() => setIsEmployeeModalOpen(false)} 
                    onSubmit={handleSaveEmployee} 
                    initialData={editingEmployee} 
                    pendingJoins={onboardings.filter(o => o.type === '입사' && !employees.some(e => e.name === o.name && e.status === '재직'))}
                />
            )}
        </div>
    );
};

// --- Employee Roster Tab Component ---
const EmployeeRosterTab = ({ employees, searchTerm, setSearchTerm, onOpenModal, onDelete, fileInputRef, handleExcelUpload, handleDeleteAllEmployees }) => {
    // 날짜 계산을 위한 상태 (기본값: 기준일자=오늘, 비교일자=7일 전)
    const [baseDate, setBaseDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    });
    const [compareDate, setCompareDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    });

    // 특정 일자 기준으로 재직 중인 인원인지 판별하는 헬퍼 함수 (메모이제이션 적용을 위해 외부나 useMemo 내부에서 활용)
    const isEmployedOnDate = React.useCallback((emp, dateStr) => {
        const toNum = (val) => {
            if (!val) return '';
            let d = val;
            if (typeof val.toDate === 'function') d = val.toDate(); // Firestore Timestamp
            if (d instanceof Date) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}${month}${day}`;
            }
            return String(val).replace(/[^0-9]/g, '');
        };
        
        const joined = toNum(emp.joinDate || emp.firstJoinDate);
        const exited = toNum(emp.exitDate);
        const target = toNum(dateStr);
        
        // 대표이사는 무조건 재직으로 간주
        const cleanName = (emp.name || '').replace(/\s+/g, '');
        if (cleanName === '김홍석' || emp.division?.includes('대표')) return true;

        if (!joined) return true; 
        
        const hasJoined = joined <= target;
        const notExited = !exited || exited > target;
        
        return hasJoined && notExited;
    }, []);

    // 모든 통계 데이터를 useMemo로 묶어서 처리 (효율성 극대화)
    const stats = React.useMemo(() => {
        const divisionStats = {};
        const locationStats = {};
        
        employees.forEach(emp => {
            // 본부별 통계 계산
            const cleanName = (emp.name || '').replace(/\s+/g, '');
            const cleanPos = (emp.position || '').replace(/\s+/g, '');
            const cleanDiv = (emp.division || '').replace(/\s+/g, '');
            const isCEO = cleanName === '김홍석' || cleanPos.includes('대표') || cleanDiv.includes('대표');
            const div = isCEO ? '대표이사' : (emp.division || '미지정');
            
            if (!divisionStats[div]) divisionStats[div] = { base: 0, compare: 0 };
            if (isEmployedOnDate(emp, baseDate)) divisionStats[div].base += 1;
            if (isEmployedOnDate(emp, compareDate)) divisionStats[div].compare += 1;

            // 근무지별 통계 계산
            const loc = emp.location || '미지정';
            if (!locationStats[loc]) locationStats[loc] = { base: 0, compare: 0 };
            if (isEmployedOnDate(emp, baseDate)) locationStats[loc].base += 1;
            if (isEmployedOnDate(emp, compareDate)) locationStats[loc].compare += 1;
        });

        const totalBase = employees.filter(e => isEmployedOnDate(e, baseDate)).length;
        const totalCompare = employees.filter(e => isEmployedOnDate(e, compareDate)).length;

        // 정렬된 리스트 생성
        const DIVISION_ORDER = ['대표이사', '운영본부', '점포개발본부', '마케팅본부', '전략기획본부', '경영지원본부'];
        const sortedDivisions = Object.keys(divisionStats).sort((a, b) => {
            if (a === '미지정') return 1;
            if (b === '미지정') return -1;
            const ia = DIVISION_ORDER.indexOf(a);
            const ib = DIVISION_ORDER.indexOf(b);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1;
            if (ib !== -1) return 1;
            return a.localeCompare(b);
        });

        const sortedLocations = Object.keys(locationStats).sort((a, b) => {
            if (a === '미지정') return 1;
            if (b === '미지정') return -1;
            return locationStats[b].base - locationStats[a].base;
        });

        return {
            divisionStats,
            locationStats,
            totalBase,
            totalCompare,
            divisionList: sortedDivisions,
            locationList: sortedLocations
        };
    }, [employees, baseDate, compareDate, isEmployedOnDate]);

    const locationAddressMap = {
        '서울센터': '서울 성동구 성수일로 12길 26, 코리아IT센터',
        '경상센터': '부산시 해운대구 센텀중앙로 48, 에이스하이테크21',
        '전라센터': '광주광역시 서구 상무연하로 112',
        '충청센터': '대전광역시 유성구 죽동로297번길 55',
        '제주센터': '제주특별자치도 제주시 월랑로8길1',
        '컴포즈커피랩': '부산광역시 기장군 장안읍 오리산단7로 4',
        '장애인선수단': '-'
    };


    return (
        <div className="space-y-6">
            {/* 날짜 설정 영역 */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <span className="font-bold text-slate-700 text-sm">증감 산출 기준일</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">기준일자:</span>
                        <input type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} className="border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <span className="text-slate-300 font-bold">|</span>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">비교일자:</span>
                        <input type="date" value={compareDate} onChange={(e) => setCompareDate(e.target.value)} className="border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* 본부별 인원 현황 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 border-b border-slate-200 p-3 text-center">
                        <h4 className="font-bold text-slate-800 text-sm">부서별 인원 현황 (구분 기준)</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-center">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="whitespace-nowrap">
                                    <th className="py-2 px-3 font-bold text-slate-700 border-r">구분(본부)</th>
                                    <th className="py-2 px-3 font-bold text-slate-700 border-r">인원(기준일)</th>
                                    <th className="py-2 px-3 font-bold text-slate-700 border-r text-indigo-600">인원(비교일)</th>
                                    <th className="py-2 px-3 font-bold text-slate-700">증감</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(() => {
                                    // 대표이사를 포함한 전체 리스트 보장
                                    const finalDivList = stats.divisionList.includes('대표이사') 
                                        ? stats.divisionList 
                                        : ['대표이사', ...stats.divisionList];
                                    
                                    return finalDivList.map(div => {
                                        const divData = stats.divisionStats[div] || { base: 0, compare: 0 };
                                        const diff = divData.base - divData.compare;
                                        return (
                                            <tr key={div} className="hover:bg-slate-50">
                                                <td className="py-2 font-bold text-slate-800 border-r bg-slate-50">{div}</td>
                                                <td className="py-2 border-r">{divData.base}</td>
                                                <td className="py-2 border-r text-indigo-600 bg-indigo-50/30">{divData.compare}</td>
                                                <td className={`py-2 font-bold ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                    {diff > 0 ? `+${diff}` : diff === 0 ? '-' : diff}
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}

                                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                    <td className="py-2 border-r">합계</td>
                                    <td className="py-2 border-r">{stats.totalBase}</td>
                                    <td className="py-2 border-r text-indigo-600">{stats.totalCompare}</td>
                                    <td className="py-2">{stats.totalBase - stats.totalCompare > 0 ? `+${stats.totalBase - stats.totalCompare}` : stats.totalBase - stats.totalCompare === 0 ? '-' : stats.totalBase - stats.totalCompare}</td>
                                </tr>

                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 근무지별 인원 현황 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 border-b border-slate-200 p-3 text-center">
                        <h4 className="font-bold text-slate-800 text-sm">근무지별 인원 현황</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-center">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="whitespace-nowrap">
                                    <th className="py-2 px-3 font-bold text-slate-700 border-r w-24">구분</th>
                                    <th className="py-2 px-3 font-bold text-slate-700 border-r w-24">인원(기준일)</th>
                                    <th className="py-2 px-3 font-bold text-slate-700 border-r w-24 text-indigo-600">인원(비교일)</th>
                                    <th className="py-2 px-3 font-bold text-slate-700 border-r w-16">증감</th>
                                    <th className="py-2 px-3 font-bold text-slate-700">주소</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.locationList.map(loc => {
                                    const diff = stats.locationStats[loc].base - stats.locationStats[loc].compare;
                                    return (
                                        <tr key={loc} className="hover:bg-slate-50">
                                            <td className="py-2 font-bold text-slate-800 border-r bg-slate-50">{loc}</td>
                                            <td className="py-2 border-r">{stats.locationStats[loc].base}</td>
                                            <td className="py-2 border-r text-indigo-600 bg-indigo-50/30">{stats.locationStats[loc].compare}</td>
                                            <td className={`py-2 border-r font-bold ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                {diff > 0 ? `+${diff}` : diff === 0 ? '-' : diff}
                                            </td>
                                            <td className="py-2 text-left px-3 text-slate-600 truncate max-w-[200px]" title={locationAddressMap[loc] || '-'}>{locationAddressMap[loc] || '-'}</td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                    <td className="py-2 border-r">합계</td>
                                    <td className="py-2 border-r">{stats.totalBase}</td>
                                    <td className="py-2 border-r text-indigo-600">{stats.totalCompare}</td>
                                    <td className="py-2 border-r">{stats.totalBase - stats.totalCompare > 0 ? `+${stats.totalBase - stats.totalCompare}` : stats.totalBase - stats.totalCompare === 0 ? '-' : stats.totalBase - stats.totalCompare}</td>
                                    <td className="py-2"></td>
                                </tr>

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" /> 전사 재직 인원 현황
                </h3>
                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="이름, 부서 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm" />
                    </div>
                    
                    {/* 엑셀 업로드 버튼 숨김 (데이터 비용 절감) */}
                    {/* 
                    <div className="relative">
                        <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} ref={fileInputRef} className="hidden" id="excel-upload" />
                        <label htmlFor="excel-upload" className="cursor-pointer bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-100 transition-colors whitespace-nowrap shadow-sm">
                            <Upload className="w-4 h-4" /> 엑셀 업로드
                        </label>
                    </div> 
                    */}

                    <button onClick={handleDeleteAllEmployees} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-100 shadow-sm whitespace-nowrap transition-colors">
                        <Trash2 className="w-4 h-4" /> 초기화
                    </button>

                    <button onClick={() => onOpenModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm whitespace-nowrap transition-colors">
                        <UserPlus className="w-4 h-4" /> 인원 추가
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] md:text-xs text-center whitespace-nowrap">
                        <thead className="bg-slate-100 text-slate-600 uppercase border-b border-slate-200">
                            <tr>
                                <th className="px-2 py-3 font-bold border-r">순번</th>
                                <th className="px-2 py-3 font-bold border-r">성명</th>
                                <th className="px-2 py-3 font-bold border-r">계약형태</th>
                                <th className="px-2 py-3 font-bold border-r">구분</th>
                                <th className="px-2 py-3 font-bold border-r">소속</th>
                                <th className="px-2 py-3 font-bold border-r">부서</th>
                                <th className="px-2 py-3 font-bold border-r">현 근무지</th>
                                <th className="px-2 py-3 font-bold border-r">Band Code</th>
                                <th className="px-2 py-3 font-bold border-r">직위</th>
                                <th className="px-2 py-3 font-bold border-r">연락처</th>
                                <th className="px-2 py-3 font-bold border-r">최초입사일</th>
                                <th className="px-2 py-3 font-bold border-r">입사일</th>
                                <th className="px-2 py-3 font-bold border-r">종료일</th>
                                <th className="px-2 py-3 font-bold border-r bg-red-50 text-red-600">퇴직일</th>
                                <th className="px-2 py-3 font-bold border-r">비고</th>
                                <th className="px-2 py-3 font-bold">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {employees.map((emp, idx) => (
                                <tr key={emp.id} className={`hover:bg-slate-50 transition-colors group ${emp.exitDate ? 'bg-red-50/30' : ''}`}>
                                    <td className="px-2 py-2 border-r text-slate-400">{emp.order || idx + 1}</td>
                                    <td className="px-2 py-2 border-r font-bold text-slate-900">{emp.name}</td>
                                    <td className="px-2 py-2 border-r">{emp.contractType || '-'}</td>
                                    <td className="px-2 py-2 border-r">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${emp.division?.includes('본부') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                            {emp.division || '-'}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 border-r font-medium text-slate-800">{emp.department || '-'}</td>
                                    <td className="px-2 py-2 border-r">{emp.team || emp.department || '-'}</td>
                                    <td className="px-2 py-2 border-r text-indigo-600 font-medium">{emp.location || '-'}</td>
                                    <td className="px-2 py-2 border-r text-slate-500">{emp.bandCode || '-'}</td>
                                    <td className="px-2 py-2 border-r">{emp.position || '-'}</td>
                                    <td className="px-2 py-2 border-r">{emp.phone || '-'}</td>
                                    <td className="px-2 py-2 border-r font-mono">{emp.firstJoinDate || '-'}</td>
                                    <td className="px-2 py-2 border-r font-mono text-emerald-600">{emp.joinDate || '-'}</td>
                                    <td className="px-2 py-2 border-r font-mono text-red-500">{emp.contractEndDate || '-'}</td>
                                    <td className="px-2 py-2 border-r font-mono font-bold text-red-600 bg-red-50/50">{emp.exitDate || '-'}</td>
                                    <td className="px-2 py-2 border-r max-w-[150px] truncate" title={emp.notes}>{emp.notes || '-'}</td>
                                    <td className="px-2 py-2 text-center">
                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onOpenModal(emp)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => onDelete(emp.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan="15" className="p-12 text-center text-slate-400">
                                        검색 결과가 없거나 등록된 인원이 없습니다. 엑셀을 업로드해주세요.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Pending Join Selector (입사 기록 불러오기 with 월별 필터) ---
const PendingJoinSelector = ({ pendingJoins, onSelect, registeredNames }) => {
    const HEADER_WORDS = ['성명', '이름', '입사일', '소속', '부서', '날짜', 'date', 'name'];
    const validJoins = (pendingJoins || [])
        .filter(j => {
            const name = (j.name || '').trim();
            const date = (j.date || j.exitDate || '').trim();
            if (!name || !date) return false;
            if (HEADER_WORDS.includes(name)) return false;
            if (HEADER_WORDS.includes(date)) return false;
            if (!/^\d{4}/.test(date)) return false;
            // 이미 재직현황에 등록된 이름은 제외
            if ((registeredNames || []).includes(name)) return false;
            return true;
        })
        .sort((a, b) => new Date(b.date || b.exitDate) - new Date(a.date || a.exitDate));

    const monthOptions = Array.from(new Set(validJoins.map(j => (j.date || j.exitDate || '').slice(0, 7))))
        .sort((a, b) => b.localeCompare(a));

    const [selectedMonth, setSelectedMonth] = useState(monthOptions[0] || '');

    const filtered = selectedMonth
        ? validJoins.filter(j => j.date.startsWith(selectedMonth))
        : validJoins;

    return (
        <div className="mb-6 bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-2">
            <label className="block text-sm font-bold text-emerald-800 flex items-center gap-2">
                <Upload className="w-4 h-4" /> 입사 기록에서 기본 정보 불러오기
            </label>
            {/* 월 필터 */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">조회 월:</span>
                <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="border border-emerald-200 rounded-lg px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-800"
                >
                    <option value="">전체</option>
                    {monthOptions.map(m => (
                        <option key={m} value={m}>{m.replace('-', '년 ')}월 ({validJoins.filter(j => j.date.startsWith(m)).length}명)</option>
                    ))}
                </select>
                <span className="text-xs text-emerald-600 ml-auto">{filtered.length}건</span>
            </div>
            {/* 인원 선택 드롭다운 */}
            <select
                className="w-full border border-emerald-200 p-2 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                onChange={e => {
                    if (!e.target.value) return;
                    const selected = filtered.find(j => j.id === e.target.value);
                    if (selected) onSelect(selected);
                }}
                defaultValue=""
            >
                <option value="">-- 신규 입사자 선택 (최신순) --</option>
                {filtered.map(j => (
                    <option key={j.id} value={j.id}>
                        [{j.date}] {j.name} / {j.department || '소속미정'}
                    </option>
                ))}
            </select>
        </div>
    );
};

// --- Employee Modal (Roster) ---
const EmployeeModal = ({ onClose, onSubmit, initialData, pendingJoins, registeredNames }) => {
    const [formData, setFormData] = useState(initialData || {
        order: '', name: '', contractType: '', status: '재직', division: '', department: '', team: '',
        location: '', bandCode: '', position: '', phone: '', firstJoinDate: '', joinDate: '', contractEndDate: '', exitDate: '', notes: ''
    });

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-xl flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-indigo-600" />
                        {initialData ? '인원 정보 수정' : '신규 인원 등록'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
                </div>

                {!initialData && pendingJoins && pendingJoins.filter(j => j.name && (j.date || j.exitDate)).length > 0 && (
                    <PendingJoinSelector pendingJoins={pendingJoins} registeredNames={registeredNames || []} onSelect={(selected) => {
                        setFormData(prev => ({
                            ...prev,
                            name: selected.name || '',
                            department: selected.department || '',
                            joinDate: selected.date || '',
                            firstJoinDate: selected.date || '',
                            notes: selected.notes || ''
                        }));
                    }} />
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">순번</label>
                            <input value={formData.order} onChange={e=>setFormData({...formData, order: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">성명</label>
                            <input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">계약형태</label>
                            <input value={formData.contractType} onChange={e=>setFormData({...formData, contractType: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="정규직, 계약직" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">구분(상태)</label>
                            <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full border p-2 rounded-lg text-sm">
                                <option value="재직">재직</option>
                                <option value="휴직">휴직</option>
                                <option value="퇴사">퇴사</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">구분(본부)</label>
                            <input value={formData.division} onChange={e=>setFormData({...formData, division: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">소속(부서)</label>
                            <input value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">부서(팀)</label>
                            <input value={formData.team} onChange={e=>setFormData({...formData, team: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">현 근무지</label>
                            <input value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">Band Code</label>
                            <input value={formData.bandCode} onChange={e=>setFormData({...formData, bandCode: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">직위</label>
                            <input value={formData.position} onChange={e=>setFormData({...formData, position: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">연락처</label>
                            <input value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">최초입사일</label>
                            <input type="date" value={formData.firstJoinDate} onChange={e=>setFormData({...formData, firstJoinDate: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">입사일</label>
                            <input type="date" value={formData.joinDate} onChange={e=>setFormData({...formData, joinDate: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1">종료일(수습/계약)</label>
                            <input type="date" value={formData.contractEndDate} onChange={e=>setFormData({...formData, contractEndDate: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-red-500 mb-1">🔴 퇴직일</label>
                            <input type="date" value={formData.exitDate || ''} onChange={e=>setFormData({...formData, exitDate: e.target.value, status: e.target.value ? '퇴사' : formData.status})} className="w-full border-2 border-red-200 p-2 rounded-lg text-sm font-bold text-red-600 focus:ring-2 focus:ring-red-400 outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-1">비고</label>
                        <input value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50">취소</button>
                        <button onClick={() => onSubmit(formData)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-md hover:bg-indigo-700">정보 저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Recruitment Tab Component ---
const RecruitmentTab = ({ upcomingRecruits, pastRecruits, onOpenModal, onDelete }) => {
    // (이전 코드 동일 유지 - RecruitmentTab 생략 방지를 위해 간략화 없이 전체 포함)
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" /> 면접 현황 관리
                </h3>
                <button onClick={() => onOpenModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm">
                    <Plus className="w-4 h-4" /> 면접자 등록
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-blue-50 border-b border-blue-100 p-4 flex justify-between items-center">
                        <h4 className="font-bold text-blue-800 flex items-center gap-2"><Clock className="w-4 h-4" /> 면접 예정</h4>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{upcomingRecruits.length}건</span>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                                <tr><th className="px-4 py-3">부서/포지션</th><th className="px-4 py-3">성명</th><th className="px-4 py-3">일정</th><th className="px-4 py-3 text-right">관리</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {upcomingRecruits.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">{r.department}</td><td className="px-4 py-3 font-bold">{r.name}</td>
                                        <td className="px-4 py-3 text-xs"><div>{r.date} {r.time}</div><div className="text-indigo-500">{r.location}</div></td>
                                        <td className="px-4 py-3 text-right"><button onClick={() => onOpenModal(r)} className="text-slate-400 mx-1"><Edit2 className="w-4 h-4" /></button><button onClick={() => onDelete(r.id)} className="text-slate-400"><Trash2 className="w-4 h-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 면접 결과</h4>
                        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{pastRecruits.length}건</span>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                                <tr><th className="px-4 py-3">부서</th><th className="px-4 py-3">성명</th><th className="px-4 py-3">결과</th><th className="px-4 py-3 text-right">관리</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pastRecruits.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">{r.department}</td><td className="px-4 py-3 font-bold">{r.name}</td>
                                        <td className="px-4 py-3">{r.status === '합격' ? <span className="text-emerald-600 bg-emerald-50 px-2 rounded">합격</span> : <span className="text-slate-500 bg-slate-100 px-2 rounded">불합격</span>}</td>
                                        <td className="px-4 py-3 text-right"><button onClick={() => onOpenModal(r)} className="text-slate-400 mx-1"><Edit2 className="w-4 h-4" /></button><button onClick={() => onDelete(r.id)} className="text-slate-400"><Trash2 className="w-4 h-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Onboarding Tab Component ---
const OnboardingTab = ({ onboardList, offboardList, onOpenModal, onDelete, handleOnboardingExcelUpload, onboardingFileInputRef, onCleanupGarbage }) => {
    // 기본 선택 월은 현재 달
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const allHistory = [...onboardList, ...offboardList].sort((a,b) => new Date(b.date) - new Date(a.date));

    // 선택된 월의 데이터 필터링
    const filteredHistory = allHistory.filter(item => {
        if (!item.date) return false;
        return item.date.startsWith(selectedMonth);
    });

    const joinCount = filteredHistory.filter(item => item.type === '입사').length;
    const exitCount = filteredHistory.filter(item => item.type === '퇴사').length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" /> 입퇴사자 기록
                </h3>
                <div className="flex gap-2">
                    <div>
                        <input type="file" accept=".xlsx, .xls" onChange={handleOnboardingExcelUpload} className="hidden" ref={onboardingFileInputRef} id="onboardingExcelUpload" />
                        <label htmlFor="onboardingExcelUpload" className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-100 shadow-sm cursor-pointer whitespace-nowrap transition-colors">
                            <Upload className="w-4 h-4" /> 엑셀 업로드
                        </label>
                    </div>
                    <button onClick={() => setIsCalendarOpen(true)} className="bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-100 shadow-sm transition-colors whitespace-nowrap">
                        <Calendar className="w-4 h-4 text-indigo-500" /> 달력 보기
                    </button>
                    {onCleanupGarbage && (
                        <button onClick={onCleanupGarbage} className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-amber-100 shadow-sm transition-colors whitespace-nowrap" title="헤더값으로 저장된 잘못된 데이터 정리">
                            <Trash2 className="w-4 h-4" /> 잡데이터 정리
                        </button>
                    )}
                    <button onClick={() => onOpenModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-colors whitespace-nowrap">
                        <Plus className="w-4 h-4" /> 내역 등록
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-slate-600">조회 월:</label>
                    <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border p-2 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                <div className="flex items-center gap-6">
                    <div className="text-sm flex items-center gap-2"><span className="font-bold text-slate-500">해당 월 입사:</span> <span className="font-black text-emerald-600 text-lg">{joinCount}명</span></div>
                    <div className="text-sm flex items-center gap-2"><span className="font-bold text-slate-500">해당 월 퇴사:</span> <span className="font-black text-red-600 text-lg">{exitCount}명</span></div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap">구분</th>
                            <th className="px-6 py-4 whitespace-nowrap">소속</th>
                            <th className="px-6 py-4 whitespace-nowrap">성명</th>
                            <th className="px-6 py-4 whitespace-nowrap">입사일</th>
                            <th className="px-6 py-4 whitespace-nowrap">퇴사일</th>
                            <th className="px-6 py-4 whitespace-nowrap">비고</th>
                            <th className="px-6 py-4 whitespace-nowrap text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredHistory.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-bold border whitespace-nowrap ${item.type === '입사' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{item.type}</span></td>
                                <td className="px-6 py-3">{item.department}</td>
                                <td className="px-6 py-3 font-bold">{item.name}</td>
                                <td className="px-6 py-3 text-slate-600 text-xs">{item.type === '입사' ? item.date : '-'}</td>
                                <td className="px-6 py-3 text-slate-600 text-xs">{item.type === '퇴사' ? item.date : '-'}</td>
                                <td className="px-6 py-3 text-slate-500 text-xs">{item.notes}</td>
                                <td className="px-6 py-3 text-right whitespace-nowrap"><button onClick={() => onOpenModal(item)} className="text-slate-400 mx-1 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button><button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isCalendarOpen && (
                <HistoryCalendarModal 
                    onClose={() => setIsCalendarOpen(false)} 
                    selectedMonth={selectedMonth} 
                    history={filteredHistory} 
                />
            )}
        </div>
    );
};

// --- History Calendar Modal ---
const HistoryCalendarModal = ({ onClose, selectedMonth, history }) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0(Sun) ~ 6(Sat)
    
    // 월요일부터 시작하도록 인덱스 조정 (1: 월 -> 0, 0: 일 -> 6)
    const startDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days = [];
    for (let i = 0; i < startDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl p-6 h-[85vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-xl flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-indigo-600" />
                        입퇴사 현황 ({selectedMonth.replace('-', '.')})
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-7 border-t border-l border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                        {['월', '화', '수', '목', '금', '토', '일'].map(day => (
                            <div key={day} className="py-2 text-center font-bold text-xs border-b border-r border-slate-300 bg-slate-200/50 text-slate-600">
                                {day}
                            </div>
                        ))}
                        {days.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} className="bg-slate-50 border-b border-r border-slate-300 min-h-[140px]"></div>;
                            
                            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayEvents = history.filter(h => h.date === dateStr);
                            
                            const isSaturday = (idx % 7) === 5;
                            const isSunday = (idx % 7) === 6;
                            
                            return (
                                <div key={dateStr} className="bg-white border-b border-r border-slate-300 min-h-[140px] flex flex-col hover:bg-slate-50 transition-colors">
                                    <div className={`text-right p-1 text-xs font-bold ${isSunday ? 'text-red-500 bg-red-50/30' : isSaturday ? 'text-blue-500 bg-blue-50/30' : 'text-slate-600 bg-slate-50/50'}`}>
                                        {day}
                                    </div>
                                    <div className="flex-1 p-1 space-y-1 overflow-y-auto scrollbar-hide">
                                        {dayEvents.map(ev => (
                                            <div key={ev.id} className="text-[10px] leading-tight flex items-start bg-slate-50 p-1 rounded border border-slate-100">
                                                <span className={`font-black shrink-0 mr-1 ${ev.type === '입사' ? 'text-emerald-600' : 'text-red-600'}`}>[{ev.type}]</span>
                                                <span className="text-slate-700 break-all">{ev.department}_{ev.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Recruit Modal ---
const RecruitModal = ({ onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState(initialData || { name: '', department: '', status: '예정', date: '', time: '', location: '', joinDate: '', notes: '' });
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg">{initialData ? '수정' : '등록'}</h3><button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button></div>
                <div className="space-y-4">
                    <input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="성명" className="w-full border p-2 rounded" />
                    <input value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} placeholder="부서" className="w-full border p-2 rounded" />
                    <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full border p-2 rounded"><option value="예정">예정</option><option value="합격">합격</option><option value="불합격">불합격</option></select>
                    <div className="flex gap-2 pt-2"><button onClick={onClose} className="flex-1 p-2 border rounded">취소</button><button onClick={() => onSubmit(formData)} className="flex-1 p-2 bg-indigo-600 text-white rounded">저장</button></div>
                </div>
            </div>
        </div>
    );
};

// --- Onboard Modal ---
const OnboardModal = ({ onClose, onSubmit, initialData, employees }) => {
    const [formData, setFormData] = useState(initialData || { name: '', department: '', type: '입사', date: '', exitDate: '', linkedEmployeeId: '', notes: '' });
    const uniqueDepartments = Array.from(new Set((employees || []).flatMap(e => [e.department, e.team]).filter(Boolean)));
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg">{initialData ? '수정' : '입퇴사 내역 등록'}</h3><button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button></div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">구분</label>
                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value, name: '', department: '', linkedEmployeeId: '', exitDate: '', date: '' })} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="입사">입사</option><option value="퇴사">퇴사</option>
                        </select>
                    </div>
                    {formData.type === '퇴사' ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                            <p className="text-xs font-bold text-red-700">🔴 재직현황에서 퇴사 인원을 선택하세요</p>
                            <select value={formData.linkedEmployeeId || ''} onChange={e => { const emp = (employees || []).find(em => em.id === e.target.value); if (emp) setFormData(prev => ({ ...prev, linkedEmployeeId: emp.id, name: emp.name, department: emp.department || emp.division || '' })); else setFormData(prev => ({ ...prev, linkedEmployeeId: '', name: '', department: '' })); }} className="w-full border border-red-200 p-2 rounded text-sm bg-white outline-none focus:ring-2 focus:ring-red-400">
                                <option value="">-- 퇴사 인원 선택 --</option>
                                {(employees || []).filter(em => !em.exitDate && em.status !== '퇴사').sort((a, b) => (a.division||'').localeCompare(b.division||'') || a.name.localeCompare(b.name)).map(em => <option key={em.id} value={em.id}>{em.name} ({em.division||''} / {em.team||em.department||''})</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-xs font-bold text-red-600 mb-1">성명</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-red-200 p-2 rounded text-sm" /></div>
                                <div><label className="block text-xs font-bold text-red-600 mb-1">소속</label><input value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full border border-red-200 p-2 rounded text-sm" /></div>
                            </div>
                            <div><label className="block text-xs font-bold text-red-600 mb-1">🔴 퇴직일 *</label><input type="date" value={formData.exitDate || ''} onChange={e => setFormData({ ...formData, exitDate: e.target.value, date: e.target.value })} className="w-full border-2 border-red-300 p-2 rounded text-sm font-bold text-red-700 focus:ring-2 focus:ring-red-400 outline-none" /></div>
                        </div>
                    ) : (
                        <>
                            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="성명" className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500" />
                            <div className="relative"><input list="dept-list" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="소속" className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500" /><datalist id="dept-list">{uniqueDepartments.map(d => <option key={d} value={d} />)}</datalist></div>
                            <div><label className="block text-xs font-bold text-slate-500 mb-1">입사일</label><input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                        </>
                    )}
                    <input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="비고" className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500" />
                    <div className="flex gap-2 pt-2">
                        <button onClick={onClose} className="flex-1 p-2 border rounded hover:bg-slate-50">취소</button>
                        <button onClick={() => { if (!formData.name) { alert('성명을 입력해주세요.'); return; } if (formData.type === '퇴사' && !formData.exitDate) { alert('퇴직일을 입력해주세요.'); return; } onSubmit(formData); }} className="flex-1 p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Organization Chart Tab ---
const OrgNode = ({ title, className, children }) => {
    const childArray = React.Children.toArray(children);
    return (
        <div className="flex flex-col items-center relative group">
            <div className={`z-10 relative ${className}`}>
                {title}
            </div>
            
            {childArray.length > 0 && (
                <div className="flex relative pt-8 mt-2 justify-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-300"></div>
                    
                    {childArray.map((child, i) => {
                        const isFirst = i === 0;
                        const isLast = i === childArray.length - 1;
                        const isOnly = childArray.length === 1;

                        return (
                            <div key={i} className="relative flex flex-col items-center px-0.5">
                                {!isOnly && (
                                    <>
                                        {!isFirst && <div className="absolute top-0 left-0 w-1/2 h-px bg-slate-300"></div>}
                                        {!isLast && <div className="absolute top-0 right-0 w-1/2 h-px bg-slate-300"></div>}
                                    </>
                                )}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-300"></div>
                                <div className="pt-8">
                                    {child}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const OrganizationChartContent = ({ employees, tree, compact = false }) => {
    // ── 콤팩트 모드 스타일 설정 ──
    const c = compact ? {
        rootPad:    'px-6 py-4',
        rootMinW:   'min-w-[150px]',
        ceoFontSz:  'text-base',
        ceoSubSz:   'text-xs',
        ceoPad:     'px-5 py-1.5 mt-2',
        ceoBorder:  'border-2',
        divFontSz:  'text-[13px]',
        divPad:     'min-h-[40px] pt-0.5 pb-2 px-4 min-w-[120px]',
        divRounded: 'rounded-2xl',
        leaderPad:  'px-3 min-h-[24px] pt-0.5 pb-2 text-[10px]',
        deptFontSz: 'text-[10px]',
        deptPad:    'min-h-[28px] pt-0.5 pb-2 px-3',
        teamW:      'w-[115px]',
        teamHeaderH: 'min-h-[36px] pt-0.5 pb-2',
        teamHeaderSz: 'text-[10px]',
        memberPad:  'px-0.5 pt-0.5 pb-2.5',
        memberSz:   'text-[9px]',
        memberBadgeSz: 'text-[8px]',
        sectionPad: 'p-0.5 gap-0',
        connH:      'h-1',
        wrapPad:    'p-2',
    } : {
        rootPad:    'px-12 py-8',
        rootMinW:   'min-w-[320px]',
        ceoFontSz:  'text-2xl',
        ceoSubSz:   'text-lg',
        ceoPad:     'px-10 py-3 mt-4',
        ceoBorder:  'border-4',
        divFontSz:  'text-base',
        divPad:     'h-14 px-8 min-w-[200px]',
        divRounded: 'rounded-[28px]',
        leaderPad:  'px-4 h-8 text-xs',
        deptFontSz: 'text-sm',
        deptPad:    'h-10 px-6',
        teamW:      'w-56',
        teamHeaderH: 'h-8',
        teamHeaderSz: 'text-xs',
        memberPad:  'p-1.5',
        memberSz:   'text-xs',
        memberBadgeSz: 'text-[10px]',
        sectionPad: 'p-1.5 gap-0.5',
        connH:      'h-6',
        wrapPad:    'p-12',
    };

    return (
    <div className={`flex justify-center min-w-max ${c.wrapPad}`}>
        <OrgNode 
            title={
                <div className="flex flex-col items-center">
                    <div className={`font-black ${c.ceoFontSz} text-slate-800 tracking-tight mb-1`}>
                        컴포즈커피 <span className={`${c.ceoSubSz} text-slate-500 font-bold`}>({employees.length}명)</span>
                    </div>
                    {tree.ceos.map(ceo => (
                        <div key={ceo.id} className={`bg-slate-800 text-white font-black ${c.ceoPad} rounded-full shadow-lg ${c.ceoBorder} border-slate-700 flex items-center gap-2`}>
                            <span className="text-emerald-400 relative -top-[3px]">CEO</span>
                            <span className={`${c.ceoSubSz === 'text-xs' ? 'text-sm' : 'text-lg'} relative -top-[3px]`}>{ceo.name}</span>
                            <span className={`font-medium text-slate-300 ${c.ceoSubSz} relative -top-[2.5px]`}>({ceo.position || '대표이사'})</span>
                        </div>
                    ))}
                </div>
            } 
            className={`bg-white border-4 border-slate-200 ${c.rootPad} rounded-3xl shadow-xl ${c.rootMinW} text-center relative z-20 flex flex-col items-center justify-center leading-tight`}
        >
            {Object.values(tree.divisions).sort((a, b) => {
                const order = ['운영본부', '점포개발본부', '마케팅본부', '전략기획본부', '경영지원본부'];
                const idxA = order.indexOf(a.name);
                const idxB = order.indexOf(b.name);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.name.localeCompare(b.name);
            }).map(div => (
                <OrgNode 
                    key={div.name}
                    title={
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className={`font-black ${c.divFontSz}`}>{div.name} <span className="opacity-70 font-bold" style={{fontSize:'0.85em'}}>({div.empCount})</span></div>
                            {div.leaders && div.leaders.length > 0 && (
                                <div className={`mt-1.5 flex flex-col ${compact ? 'gap-0.5' : 'gap-1.5'}`}>
                                    {div.leaders.map(leader => (
                                        <div key={leader.id} className={`bg-white border-2 border-indigo-200 text-indigo-700 font-bold ${c.leaderPad} rounded-full shadow-sm flex items-center justify-center gap-1.5 leading-tight`}>
                                            <span className="text-indigo-500 font-black relative -top-[3px]">Head</span>
                                            <span className="text-slate-800 relative -top-[3px]">{leader.name}</span>
                                            <span className="opacity-80 relative -top-[2.5px]" style={{fontSize:'0.85em'}}>({leader.position || '본부장'})</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    }
                    className={`bg-indigo-50 border-2 border-indigo-200 text-indigo-900 ${c.divPad} ${c.divRounded} shadow-sm whitespace-nowrap text-center flex flex-col items-center justify-center`}
                >
                    {Object.values(div.departments).sort((a, b) => {
                        const deptOrder = ['운영1팀', '운영2팀', '운영기획팀', '개설지원팀', '경상센터', '전라센터', '충청센터', '제주센터', '직영운영팀', '교육팀', 'QSC팀', 'gsc팀', '점포개발팀', '인테리어팀', '개발지원팀', '전략기획팀', '구매물류팀', '해외사업팀', 'IT지원팀', 'it지원팀', 'IT기획팀', '컴포즈커피랩', '마케팅팀', '디자인팀', 'R&D팀', '재무팀', '재무기획팀', '인사총무팀', '조직혁신팀', '법무팀'];
                        const idxA = deptOrder.findIndex(name => a.name.toLowerCase().includes(name.toLowerCase()));
                        const idxB = deptOrder.findIndex(name => b.name.toLowerCase().includes(name.toLowerCase()));
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        if (idxA !== -1) return -1;
                        if (idxB !== -1) return 1;
                        return a.name.localeCompare(b.name, undefined, { numeric: true });
                    }).map(dept => (
                        <OrgNode
                            key={dept.name}
                            title={<div className={`font-bold ${c.deptFontSz} relative -top-[1px]`}>{dept.name} <span className="opacity-70" style={{fontSize:'0.85em'}}>({dept.empCount})</span></div>}
                            className={`bg-white border-2 border-slate-200 text-slate-800 ${c.deptPad} rounded-lg shadow-sm whitespace-nowrap text-center flex flex-col items-center justify-center`}
                        >
                            <div className="flex flex-col items-center">
                                {Object.values(dept.teams).sort((a, b) => {
                                    const teamOrder = ['운영1팀', '운영2팀', '운영기획팀', '개설지원팀', '경상센터', '전라센터', '충청센터', '제주센터', '직영운영팀', '교육팀', 'QSC팀', 'gsc팀', '점포개발팀', '인테리어팀', '개발지원팀', '전략기획팀', '구매물류팀', '해외사업팀', 'IT지원팀', 'it지원팀', 'IT기획팀', '컴포즈커피랩', '마케팅팀', '디자인팀', 'R&D팀', '재무팀', '재무기획팀', '인사총무팀', '조직혁신팀', '법무팀'];
                                    const idxA = teamOrder.findIndex(name => a.name.toLowerCase().includes(name.toLowerCase()));
                                    const idxB = teamOrder.findIndex(name => b.name.toLowerCase().includes(name.toLowerCase()));
                                    
                                    if (idxA !== -1 && idxB !== -1) {
                                        if (idxA !== idxB) return idxA - idxB;
                                    } else if (idxA !== -1) {
                                        return -1;
                                    } else if (idxB !== -1) {
                                        return 1;
                                    }

                                    const getPriority = (t) => {
                                        if (t.members.some(m => m.position?.includes('팀장') || m.position?.includes('본부장') || m.position?.includes('이사') || m.position?.includes('대표'))) return 0;
                                        if (t.name.includes('센터') || t.members.some(m => m.position?.includes('센터장') || m.position?.includes('공장장'))) return 1;
                                        if (t.name.includes('팀')) return 2;
                                        if (t.name.includes('파트')) return 3;
                                        return 4;
                                    };
                                    const pA = getPriority(a);
                                    const pB = getPriority(b);
                                    if (pA !== pB) return pA - pB;
                                    return a.name.localeCompare(b.name, undefined, { numeric: true });
                                }).map((team, idx) => (
                                    <React.Fragment key={team.name}>
                                        {idx > 0 && <div className={`w-px ${c.connH} bg-slate-300`}></div>}
                                        <div className={`flex flex-col ${c.teamW} bg-white border-2 border-slate-700 rounded shadow-sm pb-1`}>
                                            <div className={`bg-white border-b-2 border-slate-700 flex flex-col items-center justify-center ${c.teamHeaderH} ${c.teamHeaderSz} font-black text-slate-800 leading-tight`}>
                                                <span className="relative -top-[3px]">{team.name}</span>
                                                <span className="opacity-70 text-[0.9em] relative -top-[3.5px]">({team.members.length}명)</span>
                                            </div>
                                            {(() => {
                                                const teamLeaders = team.members.filter(m => m.position && ['팀장', '파트장', '센터장', '공장장', '본부장', '이사', '대표'].some(p => m.position.includes(p)));
                                                const athletes = team.members.filter(m => m.position && m.position.includes('선수단'));
                                                const regularMembers = team.members.filter(m => {
                                                    const isLeader = m.position && ['팀장', '파트장', '센터장', '공장장', '본부장', '이사', '대표'].some(p => m.position.includes(p));
                                                    const isAthlete = m.position && m.position.includes('선수단');
                                                    return !isLeader && !isAthlete;
                                                });
                                                return (
                                                    <>
                                                        {teamLeaders.length > 0 && (
                                                            <div className={`flex flex-col ${c.sectionPad} bg-slate-50 border-b-2 border-slate-200`}>
                                                                {teamLeaders.map(m => (
                                                                    <div key={m.id} className={`${c.memberPad} rounded flex items-center justify-center gap-1 cursor-default relative -top-[3px]`}>
                                                                        <div className={`font-bold ${c.memberSz} tracking-tighter text-blue-600 whitespace-nowrap`} title={m.name}>{m.name}</div>
                                                                        <div className={`${c.memberBadgeSz} font-bold px-0.5 rounded whitespace-nowrap shrink-0 text-blue-600 bg-white shadow-sm border border-blue-100 flex items-center h-[1.2em] relative top-[1px]`}>
                                                                            {m.bandCode ? `${m.bandCode} ` : ''}({m.position})
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {regularMembers.length > 0 && (
                                                            <div className={`flex flex-col ${c.sectionPad} bg-white`}>
                                                                {regularMembers.map(m => (
                                                                    <div key={m.id} className={`${c.memberPad} rounded flex items-center justify-center gap-1 cursor-default relative -top-[3px]`}>
                                                                        <div className={`font-medium ${c.memberSz} tracking-tighter text-slate-700 whitespace-nowrap`} title={m.name}>{m.name}</div>
                                                                        <div className={`${c.memberBadgeSz} font-bold px-0.5 rounded whitespace-nowrap shrink-0 text-slate-500 bg-slate-50 flex items-center h-[1.2em] relative top-[1px]`}>
                                                                            {m.bandCode ? `${m.bandCode} ` : ''}{m.position ? `(${m.position})` : ''}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {athletes.length > 0 && (
                                                            <div className={`flex flex-col ${c.sectionPad} bg-slate-50 border-t-2 border-slate-200`}>
                                                                {athletes.map(m => (
                                                                    <div key={m.id} className={`${c.memberPad} rounded flex items-center justify-center gap-1 cursor-default opacity-80`}>
                                                                        <div className={`font-bold ${c.memberSz} tracking-tighter text-slate-600 whitespace-nowrap`} title={m.name}>{m.name}</div>
                                                                        <div className={`${c.memberBadgeSz} font-bold px-0.5 rounded whitespace-nowrap shrink-0 text-slate-500 bg-white shadow-sm border border-slate-200`}>
                                                                            {m.bandCode ? `${m.bandCode} ` : ''}({m.position})
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </OrgNode>
                    ))}
                </OrgNode>
            ))}
        </OrgNode>
    </div>
    );
};

const OrganizationChartTab = ({ employees }) => {
    const [isFullScreen, setIsFullScreen] = React.useState(false);
    const compactMode = true; // 콤팩트 모드로 단일화
    const [selectedDivision, setSelectedDivision] = React.useState('전체');

    // (기존 중복된 tree 메모 삭제 - 아래 filteredTree에서 처리함)

    const divisionsList = React.useMemo(() => {
        const set = new Set();
        employees.forEach(emp => {
            if (emp.division) set.add(emp.division);
        });
        return Array.from(set).sort();
    }, [employees]);

    // --- 기준일자 필터 ---
    const todayStr = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();
    const [baseDate, setBaseDate] = React.useState(todayStr);

    // baseDate 기준으로 재직 중인 직원만 필터
    const filteredByDate = React.useMemo(() => {
        if (!baseDate) return employees;
        const toNum = (d) => String(d || '').replace(/[^0-9]/g, '');
        const target = toNum(baseDate);
        return employees.filter(emp => {
            const joined = toNum(emp.joinDate || emp.firstJoinDate);
            const exited = toNum(emp.exitDate);
            
            const hasJoined = !joined || joined <= target;
            const notExited = !exited || exited > target;
            return hasJoined && notExited;
        });
    }, [employees, baseDate]);

    // filteredByDate 기반으로 tree 재계산
    const filteredTree = React.useMemo(() => {
        const root2 = { name: '컴포즈커피', divisions: {}, ceos: [] };
        filteredByDate.forEach(emp => {
            const isCEO = emp.position?.includes('대표') || emp.division?.includes('대표') || emp.name === '김홍석';
            if (isCEO) { root2.ceos.push(emp); return; }
            const divName = emp.division || '미지정본부';
            if (!root2.divisions[divName]) root2.divisions[divName] = { name: divName, departments: {}, empCount: 0, leaders: [] };
            const div = root2.divisions[divName];
            div.empCount++;
            const isDivLeader = emp.position?.includes('본부장') ||
                                ((emp.department === '-' || !emp.department) && (emp.team === '-' || !emp.team));
            if (isDivLeader) { div.leaders.push(emp); return; }
            let deptName = emp.department || '미지정소속';
            let teamName = emp.team || emp.department || '미지정부서';
            if ((deptName === divName || deptName === '-' || deptName === '미지정소속') && teamName && teamName !== '-' && teamName !== '미지정부서') {
                deptName = teamName;
            }
            if (!div.departments[deptName]) div.departments[deptName] = { name: deptName, teams: {}, empCount: 0 };
            const dept = div.departments[deptName];
            dept.empCount++;
            if (!dept.teams[teamName]) dept.teams[teamName] = { name: teamName, members: [] };
            dept.teams[teamName].members.push(emp);
        });
        Object.values(root2.divisions).forEach(div => {
            Object.values(div.departments).forEach(dept => {
                Object.values(dept.teams).forEach(team => {
                    team.members.sort((a, b) => {
                        const getRank = (pos) => ({ '대표':0,'이사':1,'본부장':2,'팀장':3,'파트장':4,'공장장':4,'센터장':4,'팀원':10,'매니저':10,'사원':10,'인턴':11 })[pos] ?? 99;
                        const rankDiff = getRank(a.position) - getRank(b.position);
                        if (rankDiff !== 0) return rankDiff;

                        // Band Code 내림차순 정렬 (숫자 추출)
                        const getBandNum = (code) => {
                            if (!code) return 0;
                            const num = parseInt(code.replace(/[^0-9]/g, ''));
                            return isNaN(num) ? 0 : num;
                        };
                        const bandDiff = getBandNum(b.bandCode) - getBandNum(a.bandCode);
                        if (bandDiff !== 0) return bandDiff;

                        return a.name.localeCompare(b.name);
                    });
                });
            });
        });

        // [추가] 본부별 필터링 적용
        if (selectedDivision !== '전체') {
            const filteredDivisions = {};
            if (root2.divisions[selectedDivision]) {
                filteredDivisions[selectedDivision] = root2.divisions[selectedDivision];
            }
            root2.divisions = filteredDivisions;
        }

        return root2;
    }, [filteredByDate, selectedDivision]);

    const orgChartRef = React.useRef(null);
    const [isExporting, setIsExporting] = React.useState(false);

    const handleExportPDF = async () => {
        if (!orgChartRef.current) return;
        setIsExporting(true);
        try {
            if (!window.html2canvas) {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                    s.onload = resolve; s.onerror = reject;
                    document.body.appendChild(s);
                });
            }
            if (!window.jspdf) {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    s.onload = resolve; s.onerror = reject;
                    document.body.appendChild(s);
                });
            }

            const el = orgChartRef.current;
            const canvas = await window.html2canvas(el, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                scrollX: 0,
                scrollY: 0,
                width: el.scrollWidth,
                height: el.scrollHeight,
                windowWidth: el.scrollWidth,
                windowHeight: el.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.92);
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });

            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 8;
            const availW = pageW - margin * 2;
            const availH = pageH - margin * 2;
            const ratio = Math.min(availW / canvas.width, availH / canvas.height);
            const drawW = canvas.width * ratio;
            const drawH = canvas.height * ratio;
            const offsetX = margin + (availW - drawW) / 2;
            const offsetY = margin + (availH - drawH) / 2;

            pdf.addImage(imgData, 'JPEG', offsetX, offsetY, drawW, drawH);

            // 파일명에 기준일 포함
            const fileDateStr = (baseDate || todayStr).replace(/-/g, '');
            pdf.save(`조직도_${fileDateStr}_A3.pdf`);
        } catch (err) {
            console.error('PDF 오류:', err);
            alert('PDF 생성 중 오류가 발생했습니다.\n' + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            {/* ── 날짜 필터 바 ── */}
            <div className="mb-4 flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-sm font-bold text-slate-700">기준 일자</span>
                <input
                    type="date"
                    value={baseDate}
                    onChange={e => setBaseDate(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    onClick={() => setBaseDate(todayStr)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                >
                    오늘로 초기화
                </button>

                <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

                <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold text-slate-700">조회 본부</span>
                    <select
                        value={selectedDivision}
                        onChange={e => setSelectedDivision(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="전체">전체 본부</option>
                        {divisionsList.map(div => (
                            <option key={div} value={div}>{div}</option>
                        ))}
                    </select>
                </div>
                <span className="ml-auto text-xs text-slate-500">
                    <span className="font-bold text-indigo-700">{filteredByDate.length}명</span> 재직 중 ({baseDate} 기준)
                </span>
            </div>

            {/* ── 미리보기 썸네일 ── */}
            <div className="relative bg-slate-50 rounded-xl border border-slate-200 h-[600px] overflow-hidden group">
                <div className="absolute inset-0 origin-top-left pointer-events-none opacity-40 blur-[1px] transition-all group-hover:blur-sm" style={{ transform: 'scale(0.35)', width: '280%', height: '280%' }}>
                    <OrganizationChartContent employees={filteredByDate} tree={filteredTree} compact={compactMode} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors cursor-pointer" onClick={() => setIsFullScreen(true)}>
                    <div className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 transform group-hover:scale-110 transition-transform">
                        <Search className="w-6 h-6" />
                        <span className="text-lg">조직도 크게 보기 (전체화면)</span>
                    </div>
                </div>
            </div>

            {isFullScreen && (
                <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col">
                    {/* 상단 툴바 */}
                    <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm flex justify-between items-center shrink-0 flex-wrap gap-3">
                        <h3 className="font-black text-xl flex items-center gap-2">
                            <Network className="w-6 h-6 text-indigo-600" /> 조직도 전체보기
                        </h3>
                        {/* 기준일자 선택 (모달 내) */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-bold text-slate-600">기준일자</span>
                            <input
                                type="date"
                                value={baseDate}
                                onChange={e => setBaseDate(e.target.value)}
                                className="text-sm font-bold text-slate-700 bg-transparent outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1"
                            />
                            <span className="text-xs text-indigo-600 font-bold ml-1">{filteredByDate.length}명</span>
                        </div>

                        {/* 본부 선택 (모달 내) */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                            <Network className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-bold text-slate-600">조회 본부</span>
                            <select
                                value={selectedDivision}
                                onChange={e => setSelectedDivision(e.target.value)}
                                className="text-sm font-bold text-slate-700 bg-transparent outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1"
                            >
                                <option value="전체">전체 본부</option>
                                {divisionsList.map(div => (
                                    <option key={div} value={div}>{div}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* 콤팩트 모드 단일화 적용됨 */}
                            <button
                                className={`px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${
                                    isExporting
                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                                onClick={handleExportPDF}
                                disabled={isExporting}
                            >
                                {isExporting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                                        PDF 생성 중...
                                    </>
                                ) : (
                                    `PDF 저장 (A3 가로)`
                                )}
                            </button>
                            <button
                                onClick={() => setIsFullScreen(false)}
                                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-bold shadow-md"
                            >
                                <X className="w-4 h-4" />
                                닫기
                            </button>
                        </div>
                    </div>

                    {/* 안내 배너 */}
                    <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2 text-xs text-indigo-700 font-medium flex items-center gap-2 shrink-0">
                        <span>💡</span>
                        <strong className="mr-1">{baseDate}</strong> 기준 재직자 <strong className="mx-1 text-indigo-900">{filteredByDate.length}명</strong>의 조직도입니다. &nbsp;|&nbsp; 오른쪽 상단 <strong className="mx-1">"PDF 저장 (A3 가로)"</strong> 버튼을 누르면 자동 다운로드 됩니다.
                    </div>

                    {/* 조직도 스크롤 영역 */}
                    <div className="flex-1 overflow-auto bg-slate-50 p-6">
                        {compactMode && (
                            <div className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-amber-700 text-xs font-bold">
                                <span>🗜️</span> 콤팩트 모드 활성화 — 팀 카드와 글자 크기가 줄어들어 A3 한 장에 더 많은 팀이 들어갑니다.
                            </div>
                        )}
                        <div ref={orgChartRef} className="inline-block min-w-max bg-white rounded-2xl shadow-lg p-8">
                            <OrganizationChartContent employees={filteredByDate} tree={filteredTree} compact={compactMode} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HRDashboard;
