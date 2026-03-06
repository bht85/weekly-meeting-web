import React, { useState } from 'react';
import {
    Newspaper, ExternalLink, Search, Coffee, TrendingUp,
    Scale, ArrowUpRight, Globe, BookOpen
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



// ─── 메인 컴포넌트 ────────────────────────────────────────────
const NewsDashboard = () => {
    const [activeTab, setActiveTab] = useState('compose');
    const [customQuery, setCustomQuery] = useState('');

    const activeCat = NEWS_CATEGORIES.find(c => c.id === activeTab);
    const C = COLORS[activeCat?.color || 'blue'];

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
