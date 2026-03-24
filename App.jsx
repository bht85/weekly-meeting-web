import React, { useState, useEffect, useMemo } from 'react';
import { getCollectionName, isCasagrande } from './utils';
import { getCompanyConfig, getCompanyDomain } from './companyConfigs';
import ReactDOM from 'react-dom/client';
import {
    Calendar, FileText, PlusCircle, Save, Users, Clock, Briefcase,
    MessageSquare, Layout, Filter, Download, Trash2, X, ExternalLink,
    RotateCcw, Archive, Megaphone, Menu, CheckCircle2, Loader2,
    BarChart3, Code, ShoppingBag, AlertCircle, ArrowLeft, Target,
    DollarSign, Plus, Edit2, Settings, Edit, Building2, Lock, Scale,
    ChevronDown, PieChart, TrendingUp, Calculator, Share2, Database, Monitor,
    CheckSquare, Utensils, StickyNote, HelpCircle
} from 'lucide-react';
import LunchDashboard from './LunchDashboard';
import CollaborationDashboard from './CollaborationDashboard';
import NewsDashboard from './NewsDashboard';
import TodoDashboard from './TodoDashboard';
import OrganizationDashboard from './OrganizationDashboard';
import CalendarDashboard from './CalendarDashboard';
import LandingPage from './LandingPage';
import CommercialDashboard from './CommercialDashboard'; // 새 항목 추가

// --- Firebase 라이브러리 ---
import { initializeApp } from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    query,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    getDocs,
    where
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from 'firebase/storage';

// --- [설정] 사용자분의 Firebase 키값 적용 ---
const firebaseConfig = {
    apiKey: "AIzaSyC7H0WiUxskczCLBn53CQANug3aHlDbpMc",
    authDomain: "my-weekly-meeting.firebaseapp.com",
    projectId: "my-weekly-meeting",
    storageBucket: "my-weekly-meeting.firebasestorage.app",
    messagingSenderId: "902190926046",
    appId: "1:902190926046:web:1dbb8dbfdc75c2c17c1a4f",
    measurementId: "G-ZYR53WCRRV"
};

// --- Firebase 초기화 ---
let app;
try {
    app = initializeApp(firebaseConfig);
} catch (error) {
    if (!/already exists/.test(error.message)) {
        console.error('Firebase initialization error', error.stack);
    }
}
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);



// --- 부서 메타데이터 (순서 및 아이콘 정의) ---
const NAV_ITEMS = [
    { id: 'news', label: '업계 동향', icon: Monitor },
    { id: 'commercial', label: '상권', icon: TrendingUp },
    { id: 'calendar', label: '캘린더', icon: Calendar },
    { id: 'meeting', label: '주간회의록', icon: FileText },
    { id: 'collaboration', label: '협업 요청', icon: Share2 },
    { id: 'todo', label: '업무 관리', icon: CheckCircle2 },
    { id: 'org', label: '조직/인사', icon: Users },
    { id: 'kpi', label: 'KPI', icon: BarChart3 },
    { id: 'lunch', label: '맛집/식단', icon: Utensils },
];

// --- [수정] 하드코딩된 이메일 목록 제거 (Firestore employees 컬렉션 참조) ---
// const ALLOWED_EMAILS = [ ... ];
// const USER_DEPT_MAP = { ... };


const LoginView = ({ onLogin, onSignup }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (isSignUp) {
            onSignup(email, password);
        } else {
            onLogin(email, password);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-slate-100">
                <div className="bg-indigo-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-indigo-200 shadow-lg">
                    <Layout className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">주간회의 시스템</h1>
                <p className="text-slate-500 mb-8">{isSignUp ? '새 계정 만들기' : '로그인하여 시작하세요'}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="이메일 주소"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="비밀번호 (6자리 이상)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
                    >
                        {isSignUp ? '회원가입' : '로그인'}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100">
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                        className="text-sm text-slate-500 hover:text-indigo-600 font-medium"
                    >
                        {isSignUp ? '이미 계정이 있으신가요? 로그인하기' : '계정이 없으신가요? 회원가입하기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const UnauthorizedView = ({ email, onLogout }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-red-100">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">접근 권한이 없습니다</h2>
            <p className="text-slate-500 mb-6 break-all">
                계정 <span className="font-bold text-slate-800">{email}</span>은(는)<br />허용된 사용자가 아닙니다.
            </p>
            <button
                onClick={onLogout}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
                로그아웃
            </button>
        </div>
    </div>
);






// --- 재무제표 항목 정의 ---
const YEARS = ['2024', '2025', '2026', '2027'];
const PERIODS = [
    { id: '1H', label: '상반기 (1H)' },
    { id: '2H', label: '하반기 (2H)' }
];

// ==========================================
// ==========================================
// [KPI 대시보드 컴포넌트] (Firestore 연동 - 기간별)
// ==========================================

// 아이콘 매핑 헬퍼 함수
const getIconComponent = (iconName) => {
    switch (iconName) {
        case 'dollar': return <DollarSign className="w-5 h-5" />;
        case 'bag': return <ShoppingBag className="w-5 h-5" />;
        case 'code': return <Code className="w-5 h-5" />;
        case 'users': return <Users className="w-5 h-5" />;
        case 'global': return <RotateCcw className="w-5 h-5" />;
        case 'truck': return <Archive className="w-5 h-5" />;
        case 'monitor': return <Layout className="w-5 h-5" />;
        case 'legal': return <Scale className="w-5 h-5" />;
        default: return <Briefcase className="w-5 h-5" />;
    }
};

const KPIDashboard = ({ user, isAdmin }) => {
    const config = getCompanyConfig(user);
    const DEPARTMENTS_META = config.departmentsMeta;

    const [selectedDeptId, setSelectedDeptId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isCommonKpiModalOpen, setIsCommonKpiModalOpen] = useState(false);
    const [isCommonFormOpen, setIsCommonFormOpen] = useState(false);

    // 기간 상태 관리: Default 2026
    const [currentYear, setCurrentYear] = useState('2026');
    const [currentPeriod, setCurrentPeriod] = useState('1H');

    const [editingKpi, setEditingKpi] = useState(null);
    const [deptDataMap, setDeptDataMap] = useState({});
    const [commonKpis, setCommonKpis] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter departments for display
    const visibleDepts = useMemo(() => {
        if (isAdmin) return DEPARTMENTS_META;
        return DEPARTMENTS_META.filter(d => d.name === user?.department);
    }, [isAdmin, user]);

    // 1. 데이터 구독
    useEffect(() => {
        setLoading(true);

        const q = query(
            collection(db, getCollectionName('kpi_records', user)),
            where('year', '==', currentYear),
            where('period', '==', currentPeriod)
        );

        const unsubRecords = onSnapshot(q, (snapshot) => {
            const newDataMap = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                newDataMap[data.deptId] = data;
            });
            setDeptDataMap(newDataMap);
            setLoading(false);
        });

        const commonDocId = `${currentYear}_${currentPeriod}`;
        const unsubCommon = onSnapshot(doc(db, getCollectionName('kpi_commons', user), commonDocId), (docSnap) => {
            if (docSnap.exists()) {
                setCommonKpis(docSnap.data().kpis || []);
            } else {
                setCommonKpis([]);
            }
        });

        return () => {
            unsubRecords();
            unsubCommon();
        };
    }, [currentYear, currentPeriod]);

    // --- Firestore 업데이트 함수들 ---
    const getRecordDocId = (deptId) => `${currentYear}_${currentPeriod}_${deptId}`;
    const getCommonDocId = () => `${currentYear}_${currentPeriod}`;

    const handleUpdateKPIValue = async (deptId, kpiId, newValue) => {
        const docId = getRecordDocId(deptId);
        const currentData = deptDataMap[deptId];
        if (!currentData) return;
        const newKpis = currentData.kpis.map(k => k.id === kpiId ? { ...k, current: Number(newValue) } : k);
        await updateDoc(doc(db, getCollectionName('kpi_records', user), docId), { kpis: newKpis });
    };

    const handleDeleteKPI = async (deptId, kpiId) => {
        if (!window.confirm('삭제하시겠습니까?')) return;
        const docId = getRecordDocId(deptId);
        const currentData = deptDataMap[deptId];
        if (!currentData) return;
        const newKpis = currentData.kpis.filter(k => k.id !== kpiId);
        await updateDoc(doc(db, getCollectionName('kpi_records', user), docId), { kpis: newKpis });
    };

    const handleSaveKPI = async (deptId, kpiData) => {
        const docId = getRecordDocId(deptId);
        const currentData = deptDataMap[deptId];
        let newKpis = currentData ? [...currentData.kpis] : [];

        if (kpiData.id) {
            newKpis = newKpis.map(k => k.id === kpiData.id ? {
                ...kpiData,
                current: Number(kpiData.current),
                target: Number(kpiData.target),
                weight: Number(kpiData.weight)
            } : k);
        } else {
            newKpis.push({
                ...kpiData,
                id: Date.now().toString(),
                current: Number(kpiData.current),
                target: Number(kpiData.target),
                weight: Number(kpiData.weight)
            });
        }

        await setDoc(doc(db, getCollectionName('kpi_records', user), docId), {
            deptId: deptId,
            year: currentYear,
            period: currentPeriod,
            kpis: newKpis,
            updatedAt: serverTimestamp()
        }, { merge: true });

        setIsModalOpen(false);
    };

    const handleSaveCommonKPI = async (kpiData) => {
        const docId = getCommonDocId();
        let newCommonKpis = [...commonKpis];
        if (kpiData.id) {
            newCommonKpis = newCommonKpis.map(k => k.id === kpiData.id ? {
                ...kpiData,
                current: Number(kpiData.current),
                target: Number(kpiData.target),
                weight: Number(kpiData.weight)
            } : k);
        } else {
            newCommonKpis.push({
                ...kpiData,
                id: `common_${Date.now()}`,
                current: Number(kpiData.current),
                target: Number(kpiData.target),
                weight: Number(kpiData.weight),
                isCommon: true
            });
        }
        await setDoc(doc(db, getCollectionName('kpi_commons', user), docId), {
            year: currentYear,
            period: currentPeriod,
            kpis: newCommonKpis
        }, { merge: true });
        setIsCommonFormOpen(false);
    };

    const handleDeleteCommonKPI = async (kpiId) => {
        if (!window.confirm('전사 공통 KPI를 삭제하시겠습니까?')) return;
        const docId = getCommonDocId();
        const newCommonKpis = commonKpis.filter(k => k.id !== kpiId);
        await updateDoc(doc(db, getCollectionName('kpi_commons', user), docId), { kpis: newCommonKpis });
    };

    // --- 계산 로직 ---
    const calculateAchievement = (target, current, lowerIsBetter = false) => {
        if (lowerIsBetter) {
            if (current <= target) return 100;
            return Math.max(0, ((2 * target - current) / target) * 100);
        }
        if (target === 0) return 0;
        return Math.min(100, (current / target) * 100);
    };

    const getDeptScore = (deptKpis) => {
        const allKpis = [...(deptKpis || []), ...commonKpis];
        if (allKpis.length === 0) return 0;
        let totalScore = 0; let totalWeight = 0;
        allKpis.forEach(kpi => {
            totalScore += calculateAchievement(kpi.target, kpi.current, kpi.lowerIsBetter) * kpi.weight;
            totalWeight += kpi.weight;
        });
        return totalWeight === 0 ? 0 : Math.round(totalScore / totalWeight);
    };

    const getStatusColor = (score) => {
        if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getProgressBarColor = (score) => {
        if (score >= 90) return 'bg-green-500';
        if (score >= 70) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const selectedDeptKpis = selectedDeptId ? (deptDataMap?.[selectedDeptId]?.kpis || []) : [];
    const selectedDeptMeta = DEPARTMENTS_META.find(d => d.id === selectedDeptId);

    if (loading) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;

    return (
        <div className="bg-gray-50 min-h-screen p-4 rounded-xl">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-indigo-600" /> KPI 현황판
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">부서별 성과 + 전사 공통 지표 (연도/반기별 관리)</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <select
                            value={currentYear}
                            onChange={(e) => setCurrentYear(e.target.value)}
                            className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-4 pr-8 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                        >
                            {YEARS.map(y => <option key={y} value={y}>{y}년</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select
                            value={currentPeriod}
                            onChange={(e) => setCurrentPeriod(e.target.value)}
                            className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-4 pr-8 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                        >
                            {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="w-px h-6 bg-slate-300 mx-1 hidden md:block"></div>
                    {isAdmin && (
                        <button
                            onClick={() => setIsCommonKpiModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 shadow-sm transition-colors"
                        >
                            <Building2 className="w-4 h-4" /> 전사 지표 관리
                        </button>
                    )}
                </div>
            </div>

            {selectedDeptId === null ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {visibleDepts.map((dept) => {
                        const deptRecord = deptDataMap?.[dept.id] || { kpis: [] };
                        const score = getDeptScore(deptRecord.kpis);
                        return (
                            <div key={dept.id} onClick={() => setSelectedDeptId(dept.id)}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 right-0 h-1 ${score >= 90 ? 'bg-green-500' : score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-lg bg-indigo-50 text-indigo-600`}>
                                            {getIconComponent(dept.icon)}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600">{dept.name}</h2>
                                            <p className="text-xs text-slate-500">개별 {deptRecord.kpis.length}건 / 공통 {commonKpis.length}건</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(score)}`}>
                                        {score >= 90 ? '우수' : score >= 70 ? '보통' : '위험'}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1 text-slate-600">
                                        <span className="font-semibold">종합 달성률</span>
                                        <span className="font-bold">{score}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className={`h-full rounded-full transition-all duration-700 ${getProgressBarColor(score)}`} style={{ width: `${score}%` }}></div>
                                    </div>
                                </div>
                                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                    {commonKpis.slice(0, 1).map(kpi => (
                                        <div key={kpi.id} className="flex justify-between text-xs text-slate-500">
                                            <span className="flex items-center gap-1 text-slate-400"><Building2 className="w-3 h-3" /> {kpi.name}</span>
                                            <span>{Math.round(calculateAchievement(kpi.target, kpi.current, kpi.lowerIsBetter))}%</span>
                                        </div>
                                    ))}
                                    {deptRecord?.kpis && (deptRecord.kpis || []).slice(0, commonKpis.length > 0 ? 1 : 2).map(kpi => (
                                        <div key={kpi.id} className="flex justify-between text-xs text-slate-500">
                                            <span>{kpi.name}</span>
                                            <span>{Math.round(calculateAchievement(kpi.target, kpi.current, kpi.lowerIsBetter))}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                selectedDeptMeta && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden min-h-[500px]">
                        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button onClick={() => setSelectedDeptId(null)} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-slate-300">
                                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                                </button>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100">{getIconComponent(selectedDeptMeta.icon)}</div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">{selectedDeptMeta.name}</h2>
                                        <p className="text-xs text-slate-500 font-medium">{currentYear}년 {PERIODS.find(p => p.id === currentPeriod)?.label}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <div className="text-right mr-2">
                                    <span className="text-xs text-slate-500 block">종합 점수</span>
                                    <span className={`text-2xl font-bold ${getDeptScore(selectedDeptKpis) >= 70 ? 'text-indigo-600' : 'text-red-500'}`}>
                                        {getDeptScore(selectedDeptKpis)}점
                                    </span>
                                </div>
                                <button onClick={() => { setEditingKpi(null); setIsModalOpen(true); }} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm shadow-sm">
                                    <Plus className="w-4 h-4" /> 팀 지표 추가
                                </button>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {commonKpis.length > 0 && (
                                <div className="bg-slate-50/50">
                                    {(commonKpis || []).map((kpi) => {
                                        const achievement = calculateAchievement(kpi.target, kpi.current, kpi.lowerIsBetter);
                                        return (
                                            <div key={kpi.id} className="p-4 border-l-4 border-slate-300 bg-slate-50">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300">전사공통</span>
                                                            <h3 className="font-bold text-slate-800">{kpi.name}</h3>
                                                            {kpi.lowerIsBetter && <span className="text-[10px] bg-white px-1 rounded border border-slate-200">낮을수록 좋음</span>}
                                                        </div>
                                                        <div className="text-xs text-slate-500 space-x-2">
                                                            <span>목표: {kpi.target.toLocaleString()}{kpi.unit}</span>
                                                            <span>비중: {kpi.weight * 100}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase">현재 실적</div>
                                                            <div className="font-bold text-slate-700 text-lg">
                                                                {kpi.current.toLocaleString()} <span className="text-xs font-normal text-slate-500">{kpi.unit}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400" title="전사 공통 지표는 관리 메뉴에서 수정 가능">
                                                            <Lock className="w-4 h-4" />
                                                        </div>
                                                        <div className="w-24 text-right hidden md:block">
                                                            <div className={`font-bold text-sm ${achievement < 70 ? 'text-red-500' : 'text-green-600'}`}>{Math.round(achievement)}%</div>
                                                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                                                                <div className={`h-full rounded-full ${achievement < 70 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(achievement, 100)}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {selectedDeptKpis.length === 0 && commonKpis.length === 0 && (
                                <div className="p-12 text-center text-slate-400">
                                    <p>{currentYear}년 {currentPeriod} 지표가 없습니다.</p>
                                    <p className="text-sm mt-2">상단의 '팀 지표 추가' 버튼을 눌러보세요.</p>
                                </div>
                            )}
                            {(selectedDeptKpis || []).map((kpi) => {
                                const achievement = calculateAchievement(kpi.target, kpi.current, kpi.lowerIsBetter);
                                return (
                                    <div key={kpi.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Target className="w-4 h-4 text-indigo-500" />
                                                    <h3 className="font-bold text-slate-800">{kpi.name}</h3>
                                                    {kpi.lowerIsBetter && <span className="text-[10px] bg-slate-100 px-1 rounded border">낮을수록 좋음</span>}
                                                </div>
                                                <div className="text-xs text-slate-500 space-x-2">
                                                    <span>목표: {kpi.target.toLocaleString()}{kpi.unit}</span>
                                                    <span>비중: {kpi.weight * 100}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">실적</div>
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <input type="number" value={kpi.current}
                                                            onChange={(e) => handleUpdateKPIValue(selectedDeptId, kpi.id, e.target.value)}
                                                            className="w-20 text-right font-bold border-b border-indigo-200 focus:border-indigo-500 outline-none bg-transparent"
                                                        />
                                                        <span className="text-xs text-slate-500">{kpi.unit}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 border-l pl-3 border-slate-200">
                                                    <button onClick={() => { setEditingKpi(kpi); setIsModalOpen(true); }} className="text-slate-400 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleDeleteKPI(selectedDeptId, kpi.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                                <div className="w-24 text-right hidden md:block">
                                                    <div className={`font-bold text-sm ${achievement < 70 ? 'text-red-500' : 'text-green-600'}`}>{Math.round(achievement)}%</div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                                        <div className={`h-full rounded-full ${achievement < 70 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(achievement, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                );
                            })}
                        </div>
                    </div>
                )
            )}

            {/* 부서 개별 KPI Modal */}
            {
                isModalOpen && (
                    <KPIFormModal
                        kpi={editingKpi}
                        title={editingKpi ? "팀 지표 수정" : "새 팀 지표 추가"}
                        onClose={() => setIsModalOpen(false)}
                        onSave={(data) => handleSaveKPI(selectedDeptId, data)}
                    />
                )
            }

            {/* 전사 공통 KPI 관리 Modal */}
            {
                isCommonKpiModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-indigo-600" /> 전사 공통 지표 관리
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">{currentYear}년 {currentPeriod} 기준 (모든 부서에 공통 적용)</p>
                                </div>
                                <button onClick={() => setIsCommonKpiModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-sm text-slate-700">등록된 공통 지표 ({commonKpis.length})</span>
                                    <button
                                        onClick={() => { setEditingKpi(null); setIsCommonFormOpen(true); }}
                                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> 지표 추가
                                    </button>
                                </div>

                                {/* 리스트 표시 */}
                                <div className="space-y-3">
                                    {commonKpis.map(kpi => (
                                        <div key={kpi.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-center bg-white">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{kpi.name}</h4>
                                                <div className="text-xs text-slate-500 mt-1 flex gap-3">
                                                    <span>목표: {kpi.target.toLocaleString()}{kpi.unit}</span>
                                                    <span>현재: <strong>{kpi.current.toLocaleString()}</strong></span>
                                                    <span>비중: {kpi.weight * 100}%</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingKpi(kpi); setIsCommonFormOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteCommonKPI(kpi.id)} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {commonKpis.length === 0 && <p className="text-center text-sm text-slate-400 py-4">이 기간에 등록된 전사 공통 지표가 없습니다.</p>}
                                </div>
                            </div>

                            {/* 중첩 모달: 공통 KPI 폼 */}
                            {isCommonFormOpen && (
                                <KPIFormModal
                                    kpi={editingKpi}
                                    title={editingKpi ? "공통 지표 수정" : "새 공통 지표 추가"}
                                    onClose={() => setIsCommonFormOpen(false)}
                                    onSave={handleSaveCommonKPI}
                                    isCommon={true}
                                />
                            )}
                        </div>
                    </div>
                )
            }

            {/* Department Manager Modal */}
            {
                isManageModalOpen && (
                    <TeamManagerModal
                        onClose={() => setIsManageModalOpen(false)}
                    />
                )
            }


        </div >
    );
};

// KPI 입력/수정 폼 컴포넌트
const KPIFormModal = ({ kpi, title, onClose, onSave, isCommon = false }) => {
    const [formData, setFormData] = useState(kpi || { name: '', target: '', current: 0, unit: '', weight: 0.1, lowerIsBetter: false });
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[90] backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    {isCommon ? <Building2 className="w-5 h-5 text-indigo-600" /> : <Target className="w-5 h-5 text-indigo-600" />}
                    {title}
                </h3>
                {isCommon && <div className="bg-indigo-50 p-2 rounded text-xs text-indigo-700">전사 공통 지표는 모든 부서의 점수에 합산됩니다.</div>}
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">지표명</label>
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="예: 매출액" className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">목표값</label>
                            <input name="target" type="number" value={formData.target} onChange={handleChange} className="w-full border border-slate-300 p-2 rounded-lg" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">단위</label>
                            <input name="unit" value={formData.unit} onChange={handleChange} placeholder="원, %" className="w-full border border-slate-300 p-2 rounded-lg" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">가중치 (0~1.0)</label>
                            <input name="weight" type="number" step="0.1" value={formData.weight} onChange={handleChange} placeholder="0.1" className="w-full border border-slate-300 p-2 rounded-lg" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">현재 실적</label>
                            <input name="current" type="number" value={formData.current} onChange={handleChange} className="w-full border border-slate-300 p-2 rounded-lg font-bold text-slate-700" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-slate-50">
                        <input type="checkbox" id="lib" name="lowerIsBetter" checked={formData.lowerIsBetter} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded" />
                        <label htmlFor="lib" className="text-sm text-slate-600">낮을수록 좋은 지표 (예: 불량률)</label>
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">취소</button>
                    <button onClick={() => onSave(formData)} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors">저장</button>
                </div>
            </div>
        </div>
    );
};

const TeamManagerModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[80] backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-600" /> 부서 관리</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-center text-slate-500 py-4">부서 관리 기능은 현재 코드 상수로 고정되어 있습니다.</p>
        </div>
    </div>
);


// --- 메인 앱 컴포넌트 ---
function App() {
    const [user, setUser] = useState(null);
    const config = getCompanyConfig(user);
    const domain = getCompanyDomain(user);
    const isCg = domain === 'casagrande.co.kr';
    const [customDepartments, setCustomDepartments] = useState([]);

    useEffect(() => {
        if (!user) {
            setCustomDepartments([]);
            return;
        }
        const unsub = onSnapshot(collection(db, getCollectionName('departments', user)), (snapshot) => {
            const depts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            depts.sort((a, b) => (a.order || 99) - (b.order || 99));
            setCustomDepartments(depts);
        });
        return () => unsub();
    }, [user]);

    const baseDepts = config.baseDepts;
    const DEPARTMENTS = useMemo(() => {
        const customNames = customDepartments.map(d => d.name).filter(Boolean);
        return Array.from(new Set([...baseDepts, ...customNames]));
    }, [baseDepts, customDepartments]);
    const TEAM_ORDER = config.teamOrder;
    const FEEDBACK_TEAMS = config.feedbackTeams;

    const isAdmin = useMemo(() =>
        user?.email === "daisy@composecoffee.co.kr" ||
        user?.email === "choihy@composecoffee.co.kr" ||
        user?.email === "admin@casagrande.co.kr" ||
        user?.email === "wedding_life@naver.com",
    [user]);
    const [appMode, setAppMode] = useState('news');
    // 랜딩 페이지 표시 여부 (로그인 후 회사별 랜딩 표시 → 버튼 클릭 시 false)
    const [showLanding, setShowLanding] = useState(false);

    // --- Meeting States ---
    const [minutes, setMinutes] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('minutes');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('recent');
    const [selectedDept, setSelectedDept] = useState('전체');
    const [inputDate, setInputDate] = useState('');
    const [inputDept, setInputDept] = useState(DEPARTMENTS[0]);
    const [inputData, setInputData] = useState({ report: '', progress: '', discussion: '' });
    const [feedbackInputDate, setFeedbackInputDate] = useState('');
    const [feedbackInputData, setFeedbackInputData] = useState({
        finance: '', finance_plan: '', hr: '', legal: '', it: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingFeedbackId, setEditingFeedbackId] = useState(null);
    const [showImageGuideModal, setShowImageGuideModal] = useState(false);
    // --- 이미지 첨부 전용 상태 ---
    const [reportImages, setReportImages] = useState([]);
    const [progressImages, setProgressImages] = useState([]);
    const [discussionImages, setDiscussionImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    // --- Image Viewer States ---
    const [imageViewerUrl, setImageViewerUrl] = useState(null);
    const [imageViewerTitle, setImageViewerTitle] = useState('');

    // --- Memo States ---
    const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
    const [memoTargetId, setMemoTargetId] = useState(null); // Document ID of the minute
    const [memoInput, setMemoInput] = useState('');
    const [editingMemoId, setEditingMemoId] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Firestore에서 사용자 정보(부서 등) 가져오기
                try {
                    // [기업 매핑 조회] 외부 메일 사용 시 어느 회사 소속인지 확인
                    let effectiveDomain = currentUser.email.split('@')[1];
                    const mappingRef = doc(db, 'company_registry', currentUser.email);
                    const mappingSnap = await getDocs(query(collection(db, 'company_registry'), where('email', '==', currentUser.email)));
                    
                    if (!mappingSnap.empty) {
                        effectiveDomain = mappingSnap.docs[0].data().domain;
                    } else if (currentUser.email === 'wedding_life@naver.com') {
                        effectiveDomain = 'casagrande.co.kr';
                    }

                    const contextUser = { ...currentUser, forcedDomain: effectiveDomain };
                    const q = query(collection(db, getCollectionName('employees', contextUser)), where('email', '==', currentUser.email));
                    let querySnapshot = await getDocs(q);
                    
                    // [추가] 외부 메일 사용 시 이미 등록된 직원 정보를 바탕으로 도메인 자동 보정 (Fallback)
                    if (querySnapshot.empty && ['naver.com', 'gmail.com', 'kakao.com', 'outlook.com', 'nate.com'].includes(effectiveDomain)) {
                        const cgQ = query(collection(db, 'employees_casagrande_co_kr'), where('email', '==', currentUser.email));
                        const cgSnap = await getDocs(cgQ);
                        if (!cgSnap.empty) {
                            querySnapshot = cgSnap;
                            effectiveDomain = 'casagrande.co.kr';
                        }
                    }

                    let dept = '기타';
                    let userData = {};

                    if (!querySnapshot.empty) {
                        const empDoc = querySnapshot.docs[0].data();
                        dept = empDoc.department || '기타';
                        userData = empDoc;
                    } else if (
                        currentUser.email === "daisy@composecoffee.co.kr" ||
                        currentUser.email === "choihy@composecoffee.co.kr" ||
                        isCasagrande(currentUser)
                    ) {
                        // 관리자 및 까사그랑데 예외 처리
                        dept = "경영지원본부";
                    } else if (currentUser.email === "it@composecoffee.co.kr") {
                        // IT 팀장 예외 처리 (접속 허용 + 부서 지정)
                        dept = "IT지원팀";
                    }

                    const userWithDept = {
                        ...currentUser,
                        department: dept,
                        forcedDomain: effectiveDomain,
                        ...userData
                    };
                    setUser(userWithDept);
                    // 로그인 성공 시 랜딩 페이지 표시
                    setShowLanding(true);

                    if (DEPARTMENTS.includes(dept)) {
                        setInputDept(dept);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUser(currentUser);
                    setShowLanding(true);
                }
            } else {
                setUser(null);
                setShowLanding(false);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Login Failed:", error);
            let msg = "로그인 중 오류가 발생했습니다.";
            switch (error.code) {
                case 'auth/invalid-email': msg = "이메일 형식이 올바르지 않습니다."; break;
                case 'auth/user-not-found': msg = "가입되지 않은 이메일입니다."; break;
                case 'auth/wrong-password':
                case 'auth/invalid-credential': msg = "이메일 또는 비밀번호가 틀렸습니다. 다시 확인해 주세요."; break;
                case 'auth/too-many-requests': msg = "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요."; break;
                default: msg = `로그인 오류: ${error.code}`;
            }
            alert(msg);
        }
    };

    const handleSignup = async (email, password) => {
        if (password.length < 6) {
            alert("보안을 위해 비밀번호는 6자 이상 입력해 주세요.");
            return;
        }

        // 1. 등록된 직원인지 확인
        try {
            const q = query(collection(db, getCollectionName('employees', email)), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (
                querySnapshot.empty &&
                email !== "daisy@composecoffee.co.kr" &&
                email !== "it@composecoffee.co.kr" &&
                !isCasagrande(email)
            ) {
                alert("등록된 직원이 아닙니다. 관리자에게 문의하세요.");
                return;
            }

            // 2. 가입 진행
            await createUserWithEmailAndPassword(auth, email, password);
            alert("회원가입이 완료되었습니다.");
        } catch (error) {
            console.error("Signup Failed:", error);
            let msg = "회원가입 중 오류가 발생했습니다.";
            switch (error.code) {
                case 'auth/email-already-in-use': msg = "이미 가입된 이메일입니다. 로그인해 주세요."; break;
                case 'auth/weak-password': msg = "비밀번호는 최소 6자 이상이어야 합니다."; break;
                case 'auth/invalid-email': msg = "이메일 형식이 올바르지 않습니다."; break;
                default: msg = `가입 오류: ${error.code}`;
            }
            alert(msg);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Logout Failed:", error);
        }
    };

    // --- 10분 자동 로그아웃 (비활동 시) ---
    useEffect(() => {
        let timeoutId;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (user) {
                // 10분(1000 * 60 * 10 밀리초) 후 자동 로그아웃
                timeoutId = setTimeout(() => {
                    handleLogout();
                    alert("10분 동안 활동이 없어 자동 로그아웃 되었습니다.");
                }, 10 * 60 * 1000);
            }
        };

        const handleActivity = () => {
            resetTimer();
        };

        // 감지할 사용자 활동 이벤트 목록
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        if (user) {
            resetTimer();
            events.forEach(event => window.addEventListener(event, handleActivity));
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [user]);

    useEffect(() => {
        const q1 = query(collection(db, getCollectionName('weekly_minutes', user)));
        const unsub1 = onSnapshot(q1, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            loaded.sort((a, b) => {
                if (a.date !== b.date) return b.date.localeCompare(a.date);
                return DEPARTMENTS.indexOf(a.department) - DEPARTMENTS.indexOf(b.department);
            });
            setMinutes(loaded);
        });

        const q2 = query(collection(db, getCollectionName('management_feedbacks', user)));
        const unsub2 = onSnapshot(q2, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            loaded.sort((a, b) => b.date.localeCompare(a.date));
            setFeedbacks(loaded);
            setLoading(false);
        });
        return () => { unsub1(); unsub2(); };
    }, [user]);

    // --- Helpers ---
    const validateDate = (dateStr) => {
        if (!dateStr) { alert("날짜를 선택해주세요."); return false; }
        const dateObj = new Date(dateStr);
        if (dateObj.getDay() !== 1) {
            alert("주간회의는 '월요일' 일자만 선택 가능합니다.");
            return false;
        }
        return true;
    };

    const processText = (text) => text ? text.replace(/\s+$/, '') || '     - 특이사항 없음' : '     - 특이사항 없음';

    const autoFormat = (val, setFunc, field, e) => {
        if (e.nativeEvent.isComposing) return;
        const { selectionStart, selectionEnd } = e.target;

        // --- 엔터 키: 이전 줄의 들여쓰기를 상속함 ---
        if (e.key === 'Enter') {
            e.preventDefault();
            const lines = val.substring(0, selectionStart).split('\n');
            const currentLine = lines[lines.length - 1];
            const leadingSpaces = currentLine.match(/^\s*/)[0];
            const hasBullet = currentLine.trim().startsWith('-');
            
            const insertText = '\n' + leadingSpaces + (hasBullet ? '- ' : '');
            const newVal = val.substring(0, selectionStart) + insertText + val.substring(selectionEnd);
            
            setFunc(prev => ({ ...prev, [field]: newVal }));
            setTimeout(() => {
                const newPos = selectionStart + insertText.length;
                e.target.setSelectionRange(newPos, newPos);
            }, 0);
        }

        // --- 탭 키: 들여쓰기 (4칸 추가) ---
        if (e.key === 'Tab') {
            e.preventDefault();
            const startOfLine = val.lastIndexOf('\n', selectionStart - 1) + 1;
            const newVal = val.substring(0, startOfLine) + '    ' + val.substring(startOfLine);
            
            setFunc(prev => ({ ...prev, [field]: newVal }));
            setTimeout(() => {
                e.target.setSelectionRange(selectionStart + 4, selectionStart + 4);
            }, 0);
        }

        // --- 쉬프트+탭 키: 내어쓰기 (4칸 제거) ---
        if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            // 쉬프트 탭 로직은 위에서 override 되므로 한 번에 처리
        }
    };

    // 탭 키 핸들러 별도 분리 (Tab/Shift+Tab)
    const handleTabKey = (val, setFunc, field, e) => {
        if (e.key !== 'Tab') return;
        e.preventDefault();
        const { selectionStart } = e.target;
        const startOfLine = val.lastIndexOf('\n', selectionStart - 1) + 1;
        const lineContent = val.substring(startOfLine);

        if (e.shiftKey) {
            // 내어쓰기 (앞에 공백 4칸이 있으면 제거)
            if (lineContent.startsWith('    ')) {
                const newVal = val.substring(0, startOfLine) + val.substring(startOfLine + 4);
                setFunc(prev => ({ ...prev, [field]: newVal }));
                setTimeout(() => {
                    const nextPos = Math.max(startOfLine, selectionStart - 4);
                    e.target.setSelectionRange(nextPos, nextPos);
                }, 0);
            }
        } else {
            // 들여쓰기 (앞에 공백 4칸 추가)
            const newVal = val.substring(0, startOfLine) + '    ' + val.substring(startOfLine);
            setFunc(prev => ({ ...prev, [field]: newVal }));
            setTimeout(() => {
                e.target.setSelectionRange(selectionStart + 4, selectionStart + 4);
            }, 0);
        }
    };

    const autoFocus = (val, setFunc, field) => {
        if (!val || val.trim() === '') {
            setFunc(prev => ({ ...prev, [field]: '- ' }));
        }
    };

    const handleLoadLastWeek = () => {
        if (inputDept === '선택') { alert('부서를 먼저 선택해주세요.'); return; }
        const prev = minutes
            .filter(m => m.department === inputDept && (!inputDate || m.date < inputDate))
            .sort((a, b) => b.date.localeCompare(a.date));

        if (prev.length > 0) {
            const lastDoc = prev[0];
            if (window.confirm(`${lastDoc.date}일자 (${lastDoc.department}) 내용을 불러오시겠습니까?\n현재 작성 중인 내용은 덮어씌워집니다.`)) {
                setInputData({
                    report: lastDoc.report || '',
                    progress: lastDoc.progress || '',
                    discussion: lastDoc.discussion || ''
                });
            }
        } else {
            alert('이전 회의록 내역이 없습니다.');
        }
    };

    const handleMinuteSubmit = async (e) => {
        e.preventDefault();
        if (!validateDate(inputDate)) return;
        if (inputDept === "선택") { alert("부서를 선택해주세요."); return; }
        if (!user) { alert("서버 연결 중입니다."); return; }

        setIsSubmitting(true);

        const payload = {
            date: inputDate,
            department: inputDept,
            report: processText(inputData.report),
            progress: processText(inputData.progress),
            discussion: processText(inputData.discussion),
            reportImages: reportImages,
            progressImages: progressImages,
            discussionImages: discussionImages,
            authorId: user.uid,
            createdAt: serverTimestamp()
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, getCollectionName('weekly_minutes', user), editingId), { ...payload, updatedAt: serverTimestamp() });
                alert('수정되었습니다.');
            } else {
                await addDoc(collection(db, getCollectionName('weekly_minutes', user)), payload);
                alert('등록되었습니다.');
            }
            handleCloseModal();
        } catch (error) {
            console.error("저장 오류:", error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!validateDate(feedbackInputDate)) return;
        if (!user) { alert("서버 연결 중입니다."); return; }

        setIsSubmitting(true);
        const payload = {
            date: feedbackInputDate,
            finance: processText(feedbackInputData.finance),
            finance_plan: processText(feedbackInputData.finance_plan),
            hr: processText(feedbackInputData.hr),
            legal: processText(feedbackInputData.legal),
            it: processText(feedbackInputData.it),
            authorId: user.uid,
            createdAt: serverTimestamp()
        };

        try {
            if (editingFeedbackId) {
                await updateDoc(doc(db, getCollectionName('management_feedbacks', user), editingFeedbackId), { ...payload, updatedAt: serverTimestamp() });
                alert('수정되었습니다.');
            } else {
                await addDoc(collection(db, getCollectionName('management_feedbacks', user)), payload);
                alert('등록되었습니다.');
            }
            handleCloseFeedbackModal();
        } catch (error) {
            console.error("저장 오류:", error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setEditingId(null);
        setInputData({ report: '', progress: '', discussion: '' });
        setReportImages([]);
        setProgressImages([]);
        setDiscussionImages([]);
        setInputDate(''); setInputDept(DEPARTMENTS[0]);
        setIsModalOpen(false);
    };

    // 기존 데이터를 items 배열로 변환 (편집 시)
    const textToItems = (text) => {
        if (!text) return [{ id: Date.now().toString(), text: '     - ', imageUrl: null, uploading: false }];
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length === 0) return [{ id: Date.now().toString(), text: '     - ', imageUrl: null, uploading: false }];
        return lines.map((l, i) => ({ id: `${Date.now()}_${i}`, text: l, imageUrl: null, uploading: false }));
    };

    // --- Memo Functions ---
    const handleOpenMemoModal = (minuteId, memoId = null, existingText = '') => {
        setMemoTargetId(minuteId);
        setEditingMemoId(memoId);
        setMemoInput(existingText);
        setIsMemoModalOpen(true);
    };

    const handleCloseMemoModal = () => {
        setMemoTargetId(null);
        setEditingMemoId(null);
        setMemoInput('');
        setIsMemoModalOpen(false);
    };

    const handleMemoSubmit = async (e) => {
        e.preventDefault();
        if (!memoInput.trim()) {
            alert('메모 내용을 입력해 주세요.');
            return;
        }

        const targetMinute = minutes.find(m => m.id === memoTargetId);
        if (!targetMinute) return;

        const currentMemos = targetMinute.memos || [];
        let newMemos;

        if (editingMemoId) {
            newMemos = currentMemos.map(m => m.id === editingMemoId ? { ...m, text: memoInput, updatedAt: new Date().toISOString() } : m);
        } else {
            newMemos = [...currentMemos, {
                id: Date.now().toString(),
                text: memoInput,
                author: user.email.split('@')[0],
                createdAt: new Date().toISOString()
            }];
        }

        try {
            await updateDoc(doc(db, getCollectionName('weekly_minutes', user), memoTargetId), {
                memos: newMemos,
                hasMemo: newMemos.length > 0
            });
            handleCloseMemoModal();
        } catch (error) {
            console.error("Memo save error:", error);
            alert('메모 저장 중 오류가 발생했습니다.');
        }
    };

    const handleDeleteMemo = async (minuteId, memoId) => {
        if (!window.confirm("메모를 삭제하시겠습니까?")) return;

        const targetMinute = minutes.find(m => m.id === minuteId);
        if (!targetMinute) return;

        const newMemos = (targetMinute.memos || []).filter(m => m.id !== memoId);

        try {
            await updateDoc(doc(db, getCollectionName('weekly_minutes', user), minuteId), {
                memos: newMemos,
                hasMemo: newMemos.length > 0
            });
        } catch (error) {
            console.error("Memo delete error:", error);
            alert('메모 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleCloseFeedbackModal = () => {
        setEditingFeedbackId(null);
        setFeedbackInputData({ finance: '', finance_plan: '', hr: '', legal: '', it: '' });
        setFeedbackInputDate('');
        setIsFeedbackModalOpen(false);
    };

    const handleExportCSV = () => {
        let csvContent = "\uFEFF";
        const allDates = [...new Set([...minutes.map(m => m.date), ...feedbacks.map(f => f.date)])].sort((a, b) => b.localeCompare(a));
        const targetDates = selectedDate === 'recent' ? allDates.slice(0, 2) : (selectedDate ? [selectedDate] : allDates);

        const clean = (t) => t ? `"${t.replace(/"/g, '""')}"` : "";
        const format = (t) => t ? t.split('\n').map(l => l.includes('- ') ? `     ${l.trim()}` : `     - ${l.trim()}`).join('\n') : "";

        if (currentView === 'minutes') {
            csvContent += "날짜,부서,구분,내용\n";
            targetDates.forEach(d => {
                minutes.filter(m => m.date === d && (selectedDept === '전체' || m.department === selectedDept)).forEach(m => {
                    if (m.report) csvContent += `${m.date},${m.department},보고사항,${clean(format(m.report))}\n`;
                    if (m.progress) csvContent += `${m.date},${m.department},진행업무,${clean(format(m.progress))}\n`;
                    if (m.discussion) csvContent += `${m.date},${m.department},협의업무,${clean(format(m.discussion))}\n`;
                });
            });
        } else {
            csvContent += "날짜,재무팀,재무기획팀,인사총무팀,법무팀,IT지원팀\n";
            targetDates.forEach(d => {
                feedbacks.filter(f => f.date === d).forEach(f => {
                    csvContent += `${f.date},${clean(format(f.finance))},${clean(format(f.finance_plan))},${clean(format(f.hr))},${clean(format(f.legal))},${clean(format(f.it))}\n`;
                });
            });
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `주간회의록_${currentView}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderText = (text, images = []) => {
        if (!text) return <span className="text-gray-400">-</span>;

        return text.split('\n').map((line, i) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return null;

            // Analyze indentation based on leading spaces (heuristic)
            const leadingSpaces = line.search(/\S|$/);
            const indentLevel = Math.floor(leadingSpaces / 4);

            // Check if it's a bullet point
            const isBullet = trimmedLine.startsWith('-') || trimmedLine.startsWith('•');
            const content = isBullet ? trimmedLine.substring(1).trim() : trimmedLine;

            const isMainItem = indentLevel === 0;
            const containerStyle = isMainItem
                ? "flex items-start gap-2.5 py-1 text-slate-800"
                : "flex items-start gap-2.5 py-0.5 text-slate-600 text-[0.95em]";

            const paddingLeft = indentLevel === 0 ? 0 : (indentLevel * 1.5) + 'rem';

            // [표1], [표2] 등을 실제 버튼으로 변환
            const renderContentWithImages = (txt) => {
                const parts = txt.split(/(\[표\d+\])/g);
                return parts.map((part, pidx) => {
                    const match = part.match(/\[표(\d+)\]/);
                    if (match) {
                        const imgIdx = parseInt(match[1]) - 1;
                        const url = images[imgIdx];
                        if (url) {
                            return (
                                <button
                                    key={pidx}
                                    onClick={(e) => { e.stopPropagation(); setImageViewerUrl(url); setImageViewerTitle(`표 ${imgIdx + 1}`); }}
                                    className="inline-flex items-center gap-0.5 mx-1 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-200 transition-colors"
                                >
                                    📊 표{imgIdx + 1}
                                </button>
                            );
                        }
                    }
                    return part;
                });
            };

            return (
                <div key={i} className={containerStyle} style={{ paddingLeft }}>
                    <div className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300">
                        <div className={`w-full h-full rounded-full ${isMainItem ? 'bg-indigo-500' : 'bg-slate-400'}`}></div>
                    </div>
                    <div className="leading-relaxed break-words flex-1">
                        {isMainItem ? <strong className="font-semibold text-slate-900">{renderContentWithImages(content)}</strong> : renderContentWithImages(content)}
                    </div>
                </div>
            );
        });
    };

    const handlePaste = async (sectionId, e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        console.log('Paste detected:', items.length, 'items');

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                // 이미지가 포함된 경우
                const blob = items[i].getAsFile();
                if (!blob) continue;

                console.log('Image found in paste! Size:', blob.size);

                // 현재 섹션의 이미지 개수 파악하여 [표N] 태그 생성
                const currentImages = sectionId === 'report' ? reportImages : (sectionId === 'progress' ? progressImages : discussionImages);
                const tag = `[표${currentImages.length + 1}]`;

                // 커서 위치에 태그 삽입
                const { selectionStart, selectionEnd } = e.target;
                const text = inputData[sectionId] || '';
                const newText = text.substring(0, selectionStart) + tag + text.substring(selectionEnd);
                
                setInputData(prev => ({ ...prev, [sectionId]: newText }));
                
                // 업로드 시작
                handleImageUpload(sectionId, blob);
            }
        }
    };

    const GAS_URL = "https://script.google.com/macros/s/AKfycby2-RDoKVedpp5Lljv41sKaU656rIRavEDlyIXSHpjl0L8-i3MpdWlp1HpnaXtp62kA/exec";
    const GAS_TOKEN = "WAGE_DIGNITY_SECURE_TOKEN_2026";

    const handleImageUpload = async (sectionId, file) => {
        if (!file || !file.type.startsWith('image/')) return;
        setIsUploading(true);
        console.log('GAS Upload Start for section:', sectionId, 'File:', file.name || 'PastedImage');

        try {
            // --- 이미지 압축 및 리사이징 (브라우저 내 처리) ---
            const resizeImage = (file) => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = (e) => {
                        const img = new Image();
                        img.src = e.target.result;
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let width = img.width;
                            let height = img.height;
                            const MAX_SIZE = 1600;

                            if (width > height) {
                                if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                            } else {
                                if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                            }
                            canvas.width = width; canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            // quality 0.85로 균형 있게 압축
                            resolve(canvas.toDataURL('image/jpeg', 0.85));
                        };
                    };
                });
            };

            const base64WithPrefix = await resizeImage(file);
            const base64Content = base64WithPrefix.split(',')[1];

            // --- GAS(Google Apps Script) 전송 ---
            // 구글 앱스 스크립트로 POST 요청
            const response = await fetch(GAS_URL, {
                method: 'POST',
                body: JSON.stringify({
                    token: GAS_TOKEN,
                    base64Content: base64Content,
                    mimeType: 'image/jpeg',
                    fileName: `meeting_${Date.now()}.jpg`
                })
            });
            
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const result = await response.json();

            if (result.success) {
                console.log('GAS Upload Success! FileId:', result.fileId);
                // 구글 드라이브 최고 직접 보기 링크 (가로 세로 렌더링에 가장 안정적)
                const directUrl = `https://lh3.googleusercontent.com/d/${result.fileId}`;
                
                if (sectionId === 'report') setReportImages(prev => [...prev, directUrl]);
                else if (sectionId === 'progress') setProgressImages(prev => [...prev, directUrl]);
                else if (sectionId === 'discussion') setDiscussionImages(prev => [...prev, directUrl]);
            } else {
                throw new Error(result.error || 'GAS 내부 처리 실패');
            }

        } catch (err) {
            console.error('GAS 업로드 에러 상세:', err);
            alert(`이미지 업로드에 실패했습니다.\n사유: ${err.message}\n(GAS가 최신으로 배포되었는지, CORS 권한이 있는지 확인해 주세요.)`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = (sectionId, index) => {
        if (sectionId === 'report') setReportImages(prev => prev.filter((_, i) => i !== index));
        else if (sectionId === 'progress') setProgressImages(prev => prev.filter((_, i) => i !== index));
        else if (sectionId === 'discussion') setDiscussionImages(prev => prev.filter((_, i) => i !== index));
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500">데이터를 불러오는 중입니다...</p>
        </div>
    );

    // 1. 비로그인 상태 → 로그인 화면
    if (!user) {
        return <LoginView onLogin={handleLogin} onSignup={handleSignup} />;
    }

    // 2. 로그인 상태지만 등록된 직원이 아님 → 권한 없음 화면
    // (daisy@... 또는 choihy@... 제외)
    if (user &&
        user.email !== "daisy@composecoffee.co.kr" &&
        user.email !== "choihy@composecoffee.co.kr" &&
        user.email !== "it@composecoffee.co.kr" &&
        !isCasagrande(user) &&
        user.department === '기타') {
        return <UnauthorizedView email={user.email} onLogout={handleLogout} />;
    }

    // 3. 로그인 성공 → 회사별 랜딩 페이지 (입장 버튼 누르면 메인으로)
    if (showLanding) {
        return <LandingPage user={user} onEnter={() => setShowLanding(false)} />;
    }

    // --- [복구] 날짜 데이터 계산 로직 ---
    const allDates = [...new Set([...(minutes?.map(m => m.date) || []), ...(feedbacks?.map(f => f.date) || [])])].sort((a, b) => b.localeCompare(a));
    const filteredDates = selectedDate === 'recent' ? allDates.slice(0, 2) : (selectedDate ? [selectedDate] : allDates);

    // 3. 정상 접속
    return (
        <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 pb-20">
            {/* 상단 네비게이션 (헤더) */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-14 items-center">
                        {/* 좌측: 로고 + 네비 메뉴 */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center text-slate-800 font-bold text-base cursor-pointer shrink-0" onClick={() => setAppMode('news')}>
                                <Layout className="w-5 h-5 mr-1.5 text-indigo-600" />
                                <span className="hidden lg:inline">{isCg ? "까사그랑데 센트로" : "컴포즈커피"}</span>
                            </div>

                            <div className="hidden md:flex items-center gap-0.5 bg-slate-100 p-1 rounded-lg">
                                {NAV_ITEMS.filter(item => !['commercial'].includes(item.id) || user?.email?.includes('choihy')).map(item => {
                                    const IconComponent = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setAppMode(item.id)}
                                            title={item.label}
                                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${appMode === item.id
                                                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                                                }`}
                                        >
                                            <IconComponent className="w-3.5 h-3.5 shrink-0" />
                                            <span className="hidden lg:inline">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 우측: 사용자 정보 + 로그아웃 + 모바일 메뉴 */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-slate-400 text-xs hidden xl:block truncate max-w-[120px]">{user.email.split('@')[0]}님</span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-medium transition-all"
                                title="로그아웃"
                            >
                                <Lock className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">로그아웃</span>
                            </button>

                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-1.5 text-gray-500">
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {
                    isMobileMenuOpen && (
                        <div className="md:hidden bg-white border-t border-gray-200">
                            <div className="p-2 space-y-1">
                                <p className="px-4 py-2 text-xs font-bold text-gray-400">메뉴 이동</p>
                                {NAV_ITEMS.filter(item => !['commercial'].includes(item.id) || user?.email?.includes('choihy')).map(item => {
                                    const IconComponent = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => { setAppMode(item.id); setIsMobileMenuOpen(false); }}
                                            className={`w-full text-left px-4 py-2 rounded-md flex items-center ${appMode === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}
                                        >
                                            <IconComponent className="w-5 h-5 mr-3" /> {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )
                }
            </nav >

            {/* ======================= */}
            {/* 메인 컨텐츠 영역     */}
            {/* ======================= */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* [MODE 1] KPI 대시보드 */}
                {appMode === 'kpi' && <KPIDashboard user={user} isAdmin={isAdmin} />}

                {/* [MODE 2] 재무 관리 */}
                {/* [MODE 8] 캘린더 (New) */}
                {appMode === 'calendar' && <CalendarDashboard db={db} departments={DEPARTMENTS} user={user} isAdmin={isAdmin} />}

                {appMode === 'news' && <NewsDashboard user={user} />}

                {/* [MODE 10] 상권 분석 */}
                {appMode === 'commercial' && <CommercialDashboard />}

                {/* [MODE 9] 맛집/식단 (New) */}
                {appMode === 'lunch' && <LunchDashboard db={db} user={user} />}

                {/* [MODE 4] 협업 요청 */}
                {appMode === 'collaboration' && (
                    <CollaborationDashboard
                        db={db}
                        user={user}
                        departments={DEPARTMENTS}
                        isAdmin={isAdmin}
                    />
                )}

                {/* [MODE 6] 업무 관리 (To-Do) */}
                {appMode === 'todo' && (
                    <TodoDashboard
                        db={db}
                        user={user}
                        departments={DEPARTMENTS}
                        isAdmin={isAdmin}
                    />
                )}

                {/* [MODE 7] 조직/인사 */}
                {appMode === 'org' && (
                    <OrganizationDashboard
                        db={db}
                        departments={DEPARTMENTS}
                        user={user}
                        isAdmin={isAdmin}
                    />
                )}

                {/* [MODE 3] 회의록 시스템 */}
                {appMode === 'meeting' && (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-200 mb-6 gap-4">
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setCurrentView('minutes')}
                                    className={`pb-3 text-sm font-medium transition-colors flex items-center border-b-2 ${currentView === 'minutes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Users className="w-4 h-4 mr-2" />부서 회의록
                                </button>
                                {/* <button
                                    onClick={() => setCurrentView('management')}
                                    className={`pb-3 text-sm font-medium transition-colors flex items-center border-b-2 ${currentView === 'management' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Megaphone className="w-4 h-4 mr-2" />경영본부 회의
                                </button> */}
                            </div>
                            <div className="flex items-center space-x-2 pb-2">
                                <button
                                    onClick={() => currentView === 'minutes' ? setIsModalOpen(true) : setIsFeedbackModalOpen(true)}
                                    className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors flex items-center"
                                >
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    {currentView === 'minutes' ? '회의록 작성' : '의견 작성'}
                                </button>
                            </div>
                        </div>

                        {currentView === 'minutes' && (
                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
                                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                                        <Filter className="w-4 h-4 text-gray-500" />
                                        <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="text-sm border-gray-300 rounded-md shadow-sm p-1.5 border">
                                            <option value="recent">최근 2주</option>
                                            <option value="">전체 날짜</option>
                                            {allDates?.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                        {isAdmin ? (
                                            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="text-sm border-gray-300 rounded-md shadow-sm p-1.5 border">
                                                <option value="전체">전체 부서</option>
                                                {DEPARTMENTS.filter(d => d !== '선택').map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        ) : (
                                            <div className="text-sm font-bold text-slate-700 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md">
                                                {user?.department}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={handleExportCSV} className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md shadow-sm">
                                        <Download className="w-4 h-4 mr-2" /> 엑셀 다운로드
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {(!filteredDates || filteredDates.length === 0) ? (
                                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">등록된 회의록이 없습니다.</p>
                                        </div>
                                    ) : filteredDates.map(date => {
                                        const daysMinutes = minutes?.filter(m => m.date === date && (selectedDept === '전체' || m.department === selectedDept));
                                        if (!daysMinutes || daysMinutes.length === 0) return null;

                                        return (
                                            <div key={date} className="space-y-4">
                                                <div className="flex items-center space-x-3">
                                                    <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" /> {date}
                                                    </span>
                                                    <div className="h-px bg-gray-300 flex-1"></div>
                                                </div>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {daysMinutes.map(minute => (
                                                        <div key={minute.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group">
                                                            <div className="p-5">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                                                        <span className="w-1.5 h-6 bg-blue-500 rounded-sm mr-2"></span>
                                                                        {minute.department}
                                                                    </h3>
                                                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button onClick={() => {
                                                                            setEditingId(minute.id); setInputDate(minute.date); setInputDept(minute.department);
                                                                            setInputData({ report: minute.report, progress: minute.progress, discussion: minute.discussion });
                                                                            setReportImages(minute.reportImages || []);
                                                                            setProgressImages(minute.progressImages || []);
                                                                            setDiscussionImages(minute.discussionImages || []);
                                                                            setIsModalOpen(true);
                                                                        }} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                                                                            <button onClick={() => handleOpenMemoModal(minute.id)} className="p-1.5 text-gray-400 hover:text-yellow-600 bg-gray-50 hover:bg-yellow-50 rounded" title="ë©ëª¨ ì¶ê°"><StickyNote className="w-4 h-4" /></button>
                                                                        <button onClick={async () => {
                                                                            if (window.confirm("삭제하시겠습니까?")) await deleteDoc(doc(db, getCollectionName('weekly_minutes', user), minute.id));
                                                                        }} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-3 text-sm">
                                                                    <div className="bg-blue-50 p-3 rounded-lg"><div className="font-bold text-blue-800 text-xs mb-1">가. 보고사항</div><div className="text-gray-700">{renderText(minute.report, minute.reportImages)}</div></div>
                                                                    <div className="bg-emerald-50 p-3 rounded-lg"><div className="font-bold text-emerald-800 text-xs mb-1">나. 진행업무</div><div className="text-gray-700">{renderText(minute.progress, minute.progressImages)}</div></div>
                                                                    <div className="bg-amber-50 p-3 rounded-lg"><div className="font-bold text-amber-800 text-xs mb-1">다. 협의업무</div><div className="text-gray-700">{renderText(minute.discussion, minute.discussionImages)}</div></div>

                                                                {/* Memos Display */}
                                                                {minute.memos && minute.memos.length > 0 && (
                                                                    <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                                                                        <div className="flex items-center gap-1.5 mb-2 text-yellow-700 font-bold text-xs">
                                                                            <StickyNote className="w-3.5 h-3.5" /> 의견 및 보완사항
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {minute.memos.map(memo => (
                                                                                <div key={memo.id} className="relative bg-yellow-100 p-3 rounded-lg shadow-sm border border-yellow-200 max-w-full min-w-[120px] group/memo">
                                                                                    <div className="text-xs text-slate-800 leading-normal pr-4">{memo.text}</div>
                                                                                    <div className="mt-2 text-[10px] text-yellow-700/70 flex justify-between items-center">
                                                                                        <span>{memo.author} · {new Date(memo.createdAt).toLocaleDateString()}</span>
                                                                                        <div className="hidden group-hover/memo:flex gap-1">
                                                                                            <button onClick={() => handleOpenMemoModal(minute.id, memo.id, memo.text)} className="hover:text-blue-600"><Edit2 className="w-2.5 h-2.5" /></button>
                                                                                            <button onClick={() => handleDeleteMemo(minute.id, memo.id)} className="hover:text-red-600"><X className="w-2.5 h-2.5" /></button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {currentView === 'management' && (
                            <div className="space-y-8">
                                <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold flex items-center mb-1"><Megaphone className="w-6 h-6 mr-2" />경영지원본부 주간회의</h2>
                                        <p className="text-indigo-200 text-sm">본부 주관 회의에서 결정된 각 팀별 지시사항 및 협의 내용입니다.</p>
                                    </div>
                                    <button onClick={handleExportCSV} className="hidden sm:flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-md text-sm font-medium transition-colors">
                                        <Download className="w-4 h-4 mr-2" />전체 다운로드
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {(!feedbacks || feedbacks.length === 0) ? (
                                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-indigo-200">
                                            <Megaphone className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
                                            <p className="text-gray-500">등록된 경영본부 회의록이 없습니다.</p>
                                        </div>
                                    ) : feedbacks?.map(fb => (
                                        <div key={fb.id} className="bg-white rounded-xl shadow-md border border-indigo-100 overflow-hidden">
                                            <div className="bg-indigo-50 px-6 py-4 flex justify-between items-center border-b border-indigo-100">
                                                <h3 className="text-lg font-bold text-indigo-900 flex items-center">
                                                    <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                                                    {fb.date} 회의록
                                                </h3>
                                                <div className="flex space-x-2">
                                                    <button onClick={() => {
                                                        setEditingFeedbackId(fb.id); setFeedbackInputDate(fb.date);
                                                        setFeedbackInputData({
                                                            finance: fb.finance, finance_plan: fb.finance_plan, hr: fb.hr,
                                                            legal: fb.legal, it: fb.it
                                                        });
                                                        setIsFeedbackModalOpen(true);
                                                    }} className="px-3 py-1 bg-white border border-indigo-200 text-indigo-600 rounded text-xs hover:bg-indigo-50">수정</button>
                                                    <button onClick={async () => {
                                                        if (window.confirm("삭제하시겠습니까?")) await deleteDoc(doc(db, getCollectionName('management_feedbacks', user), fb.id));
                                                    }} className="px-3 py-1 bg-white border border-red-200 text-red-600 rounded text-xs hover:bg-red-50">삭제</button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:gap-px bg-indigo-50 border-t border-indigo-100">
                                                {FEEDBACK_TEAMS.map(team => (
                                                    <div key={team.id} className="p-5 bg-white hover:bg-gray-50 h-full">
                                                        <h4 className="font-bold text-indigo-900 mb-2 text-sm border-b-2 border-indigo-100 inline-block pb-1">{team.label}</h4>
                                                        <div className="text-sm text-gray-700 min-h-[60px]">{renderText(fb[team.id])}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* 모달 1: 부서 회의록 */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="bg-blue-600 p-4 flex justify-between items-center sticky top-0 z-10">
                                <h3 className="text-white font-bold text-lg flex items-center">
                                    {editingId ? <Edit className="w-5 h-5 mr-2" /> : <PlusCircle className="w-5 h-5 mr-2" />}
                                    {editingId ? '회의록 수정' : '주간회의록 작성'}
                                </h3>
                                <button onClick={handleCloseModal} className="text-blue-100 hover:text-white"><X className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleMinuteSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">날짜 (월요일)</label>
                                        <input type="date" required value={inputDate} onChange={e => setInputDate(e.target.value)} className="w-full border-gray-300 rounded-md p-2 border" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">부서</label>
                                        {isAdmin ? (
                                            <select value={inputDept} onChange={e => setInputDept(e.target.value)} className="w-full border-gray-300 rounded-md p-2 border">
                                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        ) : (
                                            <div className="w-full bg-slate-100 border-gray-300 rounded-md p-2 border text-sm font-bold text-slate-700">
                                                {inputDept}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleLoadLastWeek}
                                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-1.5" /> 지난주 내용 불러오기
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {SECTIONS.map(s => {
                                        const currentImages = s.id === 'report' ? reportImages : (s.id === 'progress' ? progressImages : discussionImages);
                                        return (
                                            <div key={s.id} className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                                <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                                                    <s.icon className="w-4 h-4 mr-2 text-blue-600" />{s.label}
                                                </label>
                                                <textarea
                                                    value={inputData[s.id]}
                                                    onChange={e => setInputData({ ...inputData, [s.id]: e.target.value })}
                                                    onFocus={() => autoFocus(inputData[s.id], setInputData, s.id)}
                                                    onKeyDown={(e) => {
                                                        autoFormat(inputData[s.id], setInputData, s.id, e);
                                                        handleTabKey(inputData[s.id], setInputData, s.id, e);
                                                    }}
                                                    onPaste={(e) => handlePaste(s.id, e)}
                                                    placeholder={s.placeholder}
                                                    className="w-full border-gray-300 rounded-md text-sm p-3 border h-64 focus:ring-2 focus:ring-blue-500 outline-none font-mono leading-relaxed"
                                                    style={{ tabSize: 4 }}
                                                />
                                                
                                                {/* 이미지 첨부 영역 */}
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[11px] text-gray-500 font-medium">
                                                            * 본문에 <span className="text-blue-600 font-bold">[표1], [표2]</span> 문구를 넣으면 해당 위치에 표시됩니다. (이미지 <span className="text-indigo-600 font-bold">붙여넣기(Ctrl+V)</span> 지원)
                                                            <button 
                                                                type="button"
                                                                onClick={() => setShowImageGuideModal(true)}
                                                                className="ml-2 text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded hover:bg-indigo-100 transition-colors border border-indigo-100 font-bold"
                                                            >
                                                                사용법 가이드
                                                            </button>
                                                        </span>
                                                        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-colors cursor-pointer ${isUploading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}>
                                                            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                                            표 이미지 첨부
                                                            <input 
                                                                type="file" 
                                                                className="hidden" 
                                                                accept="image/*" 
                                                                disabled={isUploading}
                                                                onChange={(e) => {
                                                                    if (e.target.files && e.target.files[0]) handleImageUpload(s.id, e.target.files[0]);
                                                                    e.target.value = '';
                                                                }} 
                                                            />
                                                        </label>
                                                    </div>
                                                    
                                                    {currentImages.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 p-2 bg-white rounded border border-gray-100">
                                                            {currentImages.map((url, idx) => (
                                                                <div key={idx} className="group relative w-16 h-16 rounded border border-gray-200 overflow-hidden bg-gray-50">
                                                                    <img src={url} alt={`표 ${idx+1}`} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                        <button type="button" onClick={() => handleRemoveImage(s.id, idx)} className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="absolute bottom-0 left-0 right-0 bg-indigo-600 text-[9px] text-white text-center font-bold">
                                                                        표{idx + 1}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-end pt-4 border-t border-gray-100">
                                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-600 mr-2 hover:bg-gray-100 rounded-md">취소</button>
                                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold">{isSubmitting ? '저장 중...' : '저장하기'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* 모달 2: 경영본부 회의록 */}
            {
                isFeedbackModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="bg-indigo-600 p-4 flex justify-between items-center sticky top-0 z-10">
                                <h3 className="text-white font-bold text-lg flex items-center">
                                    <Megaphone className="w-5 h-5 mr-2" /> 경영본부 의견 작성
                                </h3>
                                <button onClick={handleCloseFeedbackModal} className="text-indigo-100 hover:text-white"><X className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleFeedbackSubmit} className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">회의 날짜 (월요일)</label>
                                    <input type="date" required value={feedbackInputDate} onChange={e => setFeedbackInputDate(e.target.value)} className="w-full max-w-xs border-gray-300 rounded-md p-2 border" />
                                </div>

                                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                                    <p className="text-indigo-800 font-bold mb-4 flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-2" /> 각 팀별 지시사항 및 협의 내용을 입력하세요.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {FEEDBACK_TEAMS.map(team => (
                                            <div key={team.id} className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                                                <label className="block text-sm font-bold text-indigo-900 mb-2 border-b border-indigo-50 pb-1">{team.label}</label>
                                                <textarea
                                                    value={feedbackInputData[team.id]}
                                                    onChange={e => setFeedbackInputData({ ...feedbackInputData, [team.id]: e.target.value })}
                                                    onFocus={() => autoFocus(feedbackInputData[team.id], setFeedbackInputData, team.id)}
                                                    onKeyDown={(e) => autoFormat(feedbackInputData[team.id], setFeedbackInputData, team.id, e)}
                                                    placeholder={`${team.label} 의견 입력`}
                                                    className="w-full border-gray-200 rounded-md text-sm p-3 border h-24"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-gray-100">
                                    <button type="button" onClick={handleCloseFeedbackModal} className="px-4 py-2 text-gray-600 mr-2 hover:bg-gray-100 rounded-md">취소</button>
                                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-bold">{isSubmitting ? '저장 중...' : '저장하기'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }


            {isMemoModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <div className="bg-[#fff9c4] w-full max-w-md rounded-lg shadow-2xl overflow-hidden transform transition-all border-l-8 border-yellow-400">
                        <div className="p-4 border-b border-yellow-200 flex justify-between items-center bg-[#fff59d]">
                            <h3 className="text-lg font-bold text-yellow-900 flex items-center">
                                <StickyNote className="w-5 h-5 mr-2" /> 
                                {editingMemoId ? '메모 수정' : '보완 및 질문 사항 추가'}
                            </h3>
                            <button onClick={handleCloseMemoModal} className="text-yellow-700 hover:text-yellow-900"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleMemoSubmit} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-yellow-800 mb-2">포스트잇 메모 내용</label>
                                <textarea
                                    value={memoInput}
                                    onChange={e => setMemoInput(e.target.value)}
                                    placeholder="여기에 질문이나 보완 사항을 적어주세요..."
                                    className="w-full border-yellow-200 bg-yellow-50/50 rounded-lg text-sm p-4 h-40 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all outline-none"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={handleCloseMemoModal} className="px-4 py-2 text-yellow-800 hover:bg-yellow-200 rounded-md text-sm font-medium transition-colors">취소</button>
                                <button type="submit" className="px-6 py-2 bg-yellow-400 text-yellow-900 rounded-md hover:bg-yellow-500 font-bold shadow-md transition-all active:scale-95">
                                    {editingMemoId ? '수정완료' : '메모 남기기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 이미지 뷰어 팝업 */}
            {imageViewerUrl && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setImageViewerUrl(null)}>
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-2 px-2">
                            <h3 className="text-white font-bold text-lg">{imageViewerTitle}</h3>
                            <button onClick={() => setImageViewerUrl(null)} className="text-white/70 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-md">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="bg-white rounded-lg overflow-auto shadow-2xl relative border border-white/20">
                            <img src={imageViewerUrl} alt="표 이미지" className="max-w-full h-auto object-contain mx-auto" />
                        </div>
                    </div>
                </div>
            )}


            {/* --- 이미지 사용 가이드 모달 --- */}
            {showImageGuideModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowImageGuideModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-indigo-100" />
                                표/이미지 사용 가이드
                            </h3>
                            <button onClick={() => setShowImageGuideModal(false)} className="hover:bg-indigo-500 p-1 rounded transition-colors text-white/80">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                                    <div className="w-1 h-3.5 bg-indigo-500 rounded-full"></div>
                                    1. 캡처해서 붙여넣기
                                </h4>
                                <p className="text-[11px] text-slate-600 leading-relaxed pl-2.5">
                                    엑셀 표나 문서 일부를 <span className="font-bold text-indigo-600 underline decoration-indigo-200">Win + Shift + S</span>로 캡처한 뒤, 
                                    글을 쓰는 칸에 바로 <span className="font-bold text-indigo-600">Ctrl + V</span> 하세요.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                                    <div className="w-1 h-3.5 bg-indigo-500 rounded-full"></div>
                                    2. 이미지 배치 원리
                                </h4>
                                <p className="text-[11px] text-slate-600 leading-relaxed pl-2.5">
                                    업로드된 이미지는 자동으로 <span className="font-bold text-blue-600">[표1]</span> 태그가 붙습니다. <br/>
                                    이 문구를 원하는 문단 사이에 옮겨주면 그 위치에 <span className="font-bold">📊 표 버튼</span>이 생깁니다.
                                </p>
                            </div>
                            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 mt-2">
                                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                    💡 팁: 파일을 직접 선택해서 올리고 싶다면 [+ 표 이미지 첨부] 버튼을 누르세요.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowImageGuideModal(false)}
                                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-shadow shadow-md active:scale-[0.98] transition-transform"
                            >
                                알겠습니다
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

const rootElement = document.getElementById('root');
if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
}

export default App;
