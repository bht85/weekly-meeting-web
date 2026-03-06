import React, { useState } from 'react';
import {
    Newspaper, ExternalLink, Search, Coffee, TrendingUp,
    Scale, BarChart3, Hash, X, Cloud, Loader2, ArrowUpRight,
    Globe, BookOpen, Zap
} from 'lucide-react';

// ─── 뉴스 카테고리 설정 ───────────────────────────────────────
const NEWS_CATEGORIES = [
    {
        id: 'compose',
        label: '컴포즈커피',
        icon: Coffee,
        color: 'blue',
        query: '컴포즈커피',
        description: '컴포즈커피 최신 소식 및 동향',
        keywords: ['신메뉴', '매장 오픈', '프로모션', '브랜드'],
        quickLinks: [
            { label: '최신 뉴스', query: '컴포즈커피' },
            { label: '매장 현황', query: '컴포즈커피 매장' },
            { label: '메뉴 신제품', query: '컴포즈커피 신메뉴' },
        ],
    },
    {
        id: 'low_cost',
        label: '저가 커피 프랜차이즈',
        icon: TrendingUp,
        color: 'emerald',
        query: '저가 커피 프랜차이즈',
        description: '메가커피·빽다방·이디야 등 경쟁사 동향',
        keywords: ['메가커피', '빽다방', '이디야', '더벤티'],
        quickLinks: [
            { label: '업계 동향', query: '저가커피 프랜차이즈 동향' },
            { label: '메가커피', query: '메가커피 최신' },
            { label: '빽다방', query: '빽다방 최신' },
        ],
    },
    {
        id: 'bean_price',
        label: '국제 원두 가격',
        icon: Scale,
        color: 'amber',
        query: '국제 원두 가격',
        description: '아라비카·로부스타 원두 가격 동향',
        keywords: ['아라비카', '로부스타', '원자재', '수입'],
        quickLinks: [
            { label: '원두 시세', query: '커피 원두 가격 동향' },
            { label: '아라비카', query: '아라비카 원두 가격' },
            { label: '수입 현황', query: '커피 원두 수입' },
        ],
    },
    {
        id: 'legislation',
        label: '프랜차이즈 법안',
        icon: Newspaper,
        color: 'violet',
        query: '프랜차이즈 법안',
        description: '가맹사업·공정거래 관련 법안 및 정책',
        keywords: ['가맹점', '공정위', '가맹법', '정책'],
        quickLinks: [
            { label: '최신 법안', query: '프랜차이즈 법안 가맹' },
            { label: '공정거래', query: '가맹 공정거래위원회' },
            { label: '가맹점 정책', query: '가맹점 정책 2026' },
        ],
    },
];

// ─── 색상 설정 ────────────────────────────────────────────────
const COLORS = {
    blue: {
        bg: 'bg-blue-600',
        bgLight: 'bg-blue-50',
        bgHover: 'hover:bg-blue-700',
        text: 'text-blue-600',
        textDark: 'text-blue-700',
        textLight: 'text-blue-100',
        border: 'border-blue-200',
        ring: 'ring-blue-200',
        badge: 'bg-blue-100 text-blue-700',
        tab: 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200 ring-offset-1',
        gradient: 'from-blue-600 to-blue-700',
        glow: 'shadow-blue-100',
        linkHover: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300',
    },
    emerald: {
        bg: 'bg-emerald-600',
        bgLight: 'bg-emerald-50',
        bgHover: 'hover:bg-emerald-700',
        text: 'text-emerald-600',
        textDark: 'text-emerald-700',
        textLight: 'text-emerald-100',
        border: 'border-emerald-200',
        ring: 'ring-emerald-200',
        badge: 'bg-emerald-100 text-emerald-700',
        tab: 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200 ring-offset-1',
        gradient: 'from-emerald-600 to-emerald-700',
        glow: 'shadow-emerald-100',
        linkHover: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300',
    },
    amber: {
        bg: 'bg-amber-500',
        bgLight: 'bg-amber-50',
        bgHover: 'hover:bg-amber-600',
        text: 'text-amber-600',
        textDark: 'text-amber-700',
        textLight: 'text-amber-100',
        border: 'border-amber-200',
        ring: 'ring-amber-200',
        badge: 'bg-amber-100 text-amber-700',
        tab: 'bg-amber-500 text-white shadow-md ring-2 ring-amber-200 ring-offset-1',
        gradient: 'from-amber-500 to-amber-600',
        glow: 'shadow-amber-100',
        linkHover: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300',
    },
    violet: {
        bg: 'bg-violet-600',
        bgLight: 'bg-violet-50',
        bgHover: 'hover:bg-violet-700',
        text: 'text-violet-600',
        textDark: 'text-violet-700',
        textLight: 'text-violet-100',
        border: 'border-violet-200',
        ring: 'ring-violet-200',
        badge: 'bg-violet-100 text-violet-700',
        tab: 'bg-violet-600 text-white shadow-md ring-2 ring-violet-200 ring-offset-1',
        gradient: 'from-violet-600 to-violet-700',
        glow: 'shadow-violet-100',
        linkHover: 'hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300',
    },
};

// Google News 검색 URL 생성
const toGoogleNewsUrl = (query) =>
    `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;

// Market Radar 더미 데이터
const DUMMY_POOLS = [
    [
        { text: '가격 인상', value: 50 }, { text: '저가 커피', value: 30 }, { text: '신메뉴', value: 25 },
        { text: '폐점률', value: 15 }, { text: '배달비', value: 10 }, { text: 'MZ세대', value: 20 },
        { text: '친환경 빨대', value: 12 }, { text: '매장 확대', value: 35 }, { text: '로스팅', value: 8 },
        { text: '여름 시즌', value: 22 },
    ],
    [
        { text: '글로벌 진출', value: 45 }, { text: '원두 수입', value: 28 }, { text: '키오스크', value: 32 },
        { text: '인건비', value: 40 }, { text: '디카페인', value: 25 }, { text: '콜드브루', value: 18 },
        { text: '멤버십', value: 15 }, { text: '팝업 스토어', value: 20 }, { text: '경쟁 심화', value: 38 },
        { text: '스페셜티', value: 12 },
    ],
];
const getWordStyle = (v) => {
    if (v >= 40) return 'text-3xl font-bold text-red-600';
    if (v >= 30) return 'text-2xl font-bold text-orange-500';
    if (v >= 20) return 'text-xl font-semibold text-blue-600';
    if (v >= 15) return 'text-lg font-medium text-slate-600';
    return 'text-sm text-slate-400';
};

// ─── 메인 컴포넌트 ────────────────────────────────────────────
const NewsDashboard = () => {
    const [activeTab, setActiveTab] = useState('compose');
    const [customQuery, setCustomQuery] = useState('');

    // Market Radar
    const [targetKeywords, setTargetKeywords] = useState(['메가커피', '컴포즈커피', '스타벅스', '이디야', '원두 가격']);
    const [newKeyword, setNewKeyword] = useState('');
    const [trendWords, setTrendWords] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const activeCat = NEWS_CATEGORIES.find(c => c.id === activeTab);
    const C = COLORS[activeCat?.color || 'blue'];

    const handleAnalyze = () => {
        setIsAnalyzing(true); setTrendWords(null);
        setTimeout(() => {
            setTrendWords(DUMMY_POOLS[Math.floor(Math.random() * DUMMY_POOLS.length)]);
            setIsAnalyzing(false);
        }, 1500);
    };

    const handleAddKeyword = () => {
        const kw = newKeyword.trim();
        if (kw && !targetKeywords.includes(kw)) {
            setTargetKeywords([...targetKeywords, kw]);
            setNewKeyword('');
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 rounded-xl">

            {/* ── Header ── */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Newspaper className="w-6 h-6 text-blue-600" /> 업계 동향 (Industry News)
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Google 뉴스 실시간 검색 연동
                    </p>
                </div>
                {/* 직접 검색 */}
                <div className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        value={customQuery}
                        onChange={e => setCustomQuery(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && customQuery.trim() && window.open(toGoogleNewsUrl(customQuery.trim()), '_blank')}
                        placeholder="직접 검색어 입력..."
                        className="flex-1 md:w-56 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
                    />
                    <button
                        onClick={() => customQuery.trim() && window.open(toGoogleNewsUrl(customQuery.trim()), '_blank')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
                    >
                        <Search className="w-4 h-4" /> 검색
                    </button>
                </div>
            </div>

            {/* ── Market Radar ── */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" /> Market Radar (경쟁사 키워드 분석)
                </h3>
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-1/3">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 h-full flex flex-col">
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">관심 키워드 관리</label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text" value={newKeyword}
                                    onChange={e => setNewKeyword(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleAddKeyword()}
                                    placeholder="키워드 입력"
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                                />
                                <button onClick={handleAddKeyword}
                                    className="px-3 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors">
                                    추가
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {targetKeywords.map(kw => (
                                    <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
                                        <Hash className="w-3 h-3 text-slate-400" />{kw}
                                        <button onClick={() => setTargetKeywords(targetKeywords.filter(k => k !== kw))}
                                            className="text-slate-400 hover:text-red-500 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="mt-auto">
                                <button onClick={handleAnalyze} disabled={isAnalyzing}
                                    className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm">
                                    {isAnalyzing
                                        ? <><Loader2 className="w-4 h-4 animate-spin" />분석 중...</>
                                        : <><Zap className="w-4 h-4" />AI 트렌드 분석 시작</>}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="lg:w-2/3">
                        <div className="bg-slate-50 rounded-xl border border-slate-100 h-64 lg:h-full min-h-[250px] flex items-center justify-center p-6">
                            {!trendWords && !isAnalyzing && (
                                <div className="text-center text-slate-400">
                                    <Cloud className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">분석 시작 버튼을 눌러 주요 이슈를 확인하세요.</p>
                                </div>
                            )}
                            {isAnalyzing && (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                                    <p className="text-sm font-medium text-indigo-800 animate-pulse">트렌드를 분석 중입니다...</p>
                                </div>
                            )}
                            {trendWords && !isAnalyzing && (
                                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 w-full content-center">
                                    {trendWords.map((w, i) => (
                                        <span key={i}
                                            onClick={() => window.open(toGoogleNewsUrl(w.text + ' 커피'), '_blank')}
                                            className={`${getWordStyle(w.value)} cursor-pointer transition-all duration-300 hover:scale-110 hover:opacity-80`}
                                            title={`"${w.text}" 뉴스 검색`}>
                                            {w.text}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex overflow-x-auto pb-3 gap-2 mb-6">
                {NEWS_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isActive = activeTab === cat.id;
                    const c = COLORS[cat.color];
                    return (
                        <button key={cat.id} onClick={() => setActiveTab(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${isActive ? c.tab : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                }`}>
                            <Icon className="w-4 h-4" />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* ── 메인 카드: 현재 탭 ── */}
            {activeCat && (
                <div className="space-y-6">

                    {/* 메인 검색 배너 */}
                    <div className={`bg-gradient-to-br ${C.gradient} rounded-2xl p-8 text-white shadow-xl ${C.glow} shadow-lg`}>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    {React.createElement(activeCat.icon, { className: 'w-8 h-8 opacity-90' })}
                                    <h3 className="text-2xl font-bold">{activeCat.label}</h3>
                                </div>
                                <p className={`${C.textLight} text-sm mb-4`}>{activeCat.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {activeCat.keywords.map(kw => (
                                        <span key={kw} className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                                            #{kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <a
                                href={toGoogleNewsUrl(activeCat.query)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 flex items-center gap-2 px-6 py-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-md"
                            >
                                <Globe className="w-5 h-5" />
                                Google 뉴스에서 보기
                                <ArrowUpRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* 빠른 검색 링크 */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> 세부 검색
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {activeCat.quickLinks.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={toGoogleNewsUrl(link.query)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all group ${C.linkHover}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 ${C.bgLight} rounded-lg flex items-center justify-center`}>
                                            <Search className={`w-4 h-4 ${C.text}`} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm group-hover:text-current">{link.label}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{link.query}</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className={`w-4 h-4 text-slate-300 group-hover:${C.text} transition-colors shrink-0`} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* 전체 카테고리 빠른 접근 */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Newspaper className="w-4 h-4" /> 다른 카테고리 바로 검색
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {NEWS_CATEGORIES.filter(c => c.id !== activeTab).map(cat => {
                                const Icon = cat.icon;
                                const cc = COLORS[cat.color];
                                return (
                                    <a
                                        key={cat.id}
                                        href={toGoogleNewsUrl(cat.query)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all group text-center"
                                    >
                                        <div className={`w-10 h-10 ${cc.bgLight} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <Icon className={`w-5 h-5 ${cc.text}`} />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-600 leading-tight">{cat.label}</span>
                                        <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default NewsDashboard;
