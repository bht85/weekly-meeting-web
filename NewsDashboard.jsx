import React, { useState, useEffect, useCallback } from 'react';
import {
    Newspaper, ExternalLink, Calendar, Loader2, Search,
    Coffee, TrendingUp, Scale, AlertCircle, X, Hash,
    BarChart3, Cloud, RefreshCw
} from 'lucide-react';

// ─── 뉴스 카테고리 & 키워드 ────────────────────────────────────
const NEWS_CATEGORIES = [
    {
        id: 'compose', label: '컴포즈커피', icon: Coffee, color: 'blue',
        keywords: ['컴포즈', '컴포즈커피'],
    },
    {
        id: 'low_cost', label: '저가 커피 프랜차이즈', icon: TrendingUp, color: 'emerald',
        keywords: ['저가 커피', '저가커피', '메가커피', '빽다방', '이디야', '더벤티', '커피 프랜차이즈', '커피전문점'],
    },
    {
        id: 'bean_price', label: '국제 원두 가격', icon: Scale, color: 'amber',
        keywords: ['원두', '원두 가격', '커피 원두', '아라비카', '로부스타', '커피 가격'],
    },
    {
        id: 'legislation', label: '프랜차이즈 법안', icon: Newspaper, color: 'violet',
        keywords: ['프랜차이즈', '가맹점', '가맹사업', '공정위', '가맹법'],
    },
];

// ─── RSS 소스 (allorigins.win 경유로 CORS 우회) ──────────────
const RSS_SOURCES = [
    { name: '매일경제', url: 'https://www.mk.co.kr/rss/40300001/' },
    { name: '한국경제', url: 'https://www.hankyung.com/feed/economy' },
    { name: '아이뉴스24', url: 'https://www.inews24.com/rss/allnews.xml' },
];

const toProxyUrl = (rssUrl) =>
    `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;

// ─── XML → 기사 배열 파싱 ────────────────────────────────────
const parseRssXml = (xmlText, sourceName) => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const items = Array.from(doc.querySelectorAll('item'));
        return items.map(item => {
            const getText = (tag) => {
                const el = item.querySelector(tag);
                if (!el) return '';
                return el.textContent || el.innerHTML || '';
            };
            return {
                title: getText('title').replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
                url: getText('link').replace(/<!\[CDATA\[|\]\]>/g, '').trim()
                    || item.querySelector('guid')?.textContent?.trim() || '#',
                date: getText('pubDate'),
                _source: sourceName,
            };
        }).filter(a => a.title);
    } catch (e) {
        console.warn('XML 파싱 오류:', e);
        return [];
    }
};

// ─── 날짜 포맷 ────────────────────────────────────────────────
const formatDate = (dateString) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date)) return '';
        const diffH = Math.floor((Date.now() - date) / 3600000);
        if (diffH < 1) return '방금 전';
        if (diffH < 24) return `${diffH}시간 전`;
        const diffD = Math.floor(diffH / 24);
        if (diffD < 7) return `${diffD}일 전`;
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    } catch { return ''; }
};

// ─── 색상 설정 ────────────────────────────────────────────────
const COLOR_MAP = {
    blue: { active: 'bg-blue-600 text-white ring-blue-200', badge: 'bg-blue-50 text-blue-700', bar: 'bg-blue-500', cnt: 'bg-white/25' },
    emerald: { active: 'bg-emerald-600 text-white ring-emerald-200', badge: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500', cnt: 'bg-white/25' },
    amber: { active: 'bg-amber-500 text-white ring-amber-200', badge: 'bg-amber-50 text-amber-700', bar: 'bg-amber-500', cnt: 'bg-white/25' },
    violet: { active: 'bg-violet-600 text-white ring-violet-200', badge: 'bg-violet-50 text-violet-700', bar: 'bg-violet-500', cnt: 'bg-white/25' },
};

// ─── Market Radar 더미 ────────────────────────────────────────
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
    const [allArticles, setAllArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Market Radar
    const [targetKeywords, setTargetKeywords] = useState(['메가커피', '컴포즈커피', '스타벅스', '이디야', '원두 가격']);
    const [newKeyword, setNewKeyword] = useState('');
    const [trendWords, setTrendWords] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // ── RSS 병렬 수집 ──
    const fetchAllNews = useCallback(async () => {
        setLoading(true);
        setError(null);

        const results = await Promise.allSettled(
            RSS_SOURCES.map(({ name, url }) =>
                fetch(toProxyUrl(url), { signal: AbortSignal.timeout(12000) })
                    .then(r => {
                        if (!r.ok) throw new Error(`HTTP ${r.status}`);
                        return r.text();
                    })
                    .then(xml => parseRssXml(xml, name))
            )
        );

        const merged = results
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => r.value);

        if (merged.length === 0) {
            setError('뉴스를 불러오지 못했습니다. 잠시 후 새로 고침을 눌러 주세요.');
        } else {
            // 제목 기준 중복 제거 & 최신순
            const seen = new Set();
            const unique = merged
                .filter(a => { if (seen.has(a.title)) return false; seen.add(a.title); return true; })
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            setAllArticles(unique);
            setLastUpdated(new Date());
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchAllNews(); }, [fetchAllNews]);

    // ── 탭 필터 ──
    const getCatArticles = (catId) => {
        const cat = NEWS_CATEGORIES.find(c => c.id === catId);
        if (!cat) return [];
        return allArticles
            .filter(a => cat.keywords.some(kw => a.title.includes(kw)))
            .slice(0, 12);
    };
    const filteredArticles = getCatArticles(activeTab);
    const activeCat = NEWS_CATEGORIES.find(c => c.id === activeTab);
    const colors = COLOR_MAP[activeCat?.color || 'blue'];

    // Market Radar
    const handleAnalyze = () => {
        setIsAnalyzing(true); setTrendWords(null);
        setTimeout(() => {
            setTrendWords(DUMMY_POOLS[Math.floor(Math.random() * DUMMY_POOLS.length)]);
            setIsAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 rounded-xl">

            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Newspaper className="w-6 h-6 text-blue-600" /> 업계 동향 (Industry News)
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        매일경제 · 한국경제 · 아이뉴스24 실시간 수집
                        {lastUpdated && <span className="ml-2 text-slate-400">· {formatDate(lastUpdated.toISOString())}</span>}
                    </p>
                </div>
                <button onClick={fetchAllNews} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600 shadow-sm transition-colors disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    새로 고침
                </button>
            </div>

            {/* Market Radar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" /> Market Radar (경쟁사 키워드 분석)
                </h3>
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-1/3 flex flex-col gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1 flex flex-col">
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">관심 키워드 관리</label>
                            <div className="flex gap-2 mb-3">
                                <input type="text" value={newKeyword}
                                    onChange={e => setNewKeyword(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && targetKeywords.includes(newKeyword.trim()) === false && newKeyword.trim() && setTargetKeywords([...targetKeywords, newKeyword.trim()]) && setNewKeyword('')}
                                    placeholder="키워드 입력"
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                                <button onClick={() => { if (newKeyword.trim() && !targetKeywords.includes(newKeyword.trim())) { setTargetKeywords([...targetKeywords, newKeyword.trim()]); setNewKeyword(''); } }}
                                    className="px-3 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700">추가</button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {targetKeywords.map(kw => (
                                    <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
                                        <Hash className="w-3 h-3 text-slate-400" />{kw}
                                        <button onClick={() => setTargetKeywords(targetKeywords.filter(k => k !== kw))} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="mt-auto">
                                <button onClick={handleAnalyze} disabled={isAnalyzing}
                                    className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" />분석 중...</> : <><Search className="w-4 h-4" />AI 트렌드 분석 시작</>}
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
                                    <p className="text-sm font-medium text-indigo-800 animate-pulse">AI가 뉴스를 분석 중입니다...</p>
                                </div>
                            )}
                            {trendWords && !isAnalyzing && (
                                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 w-full content-center">
                                    {trendWords.map((w, i) => (
                                        <span key={i} className={`${getWordStyle(w.value)} transition-all duration-500 hover:scale-110 cursor-default`}>{w.text}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto pb-3 gap-2 mb-6">
                {NEWS_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isActive = activeTab === cat.id;
                    const c = COLOR_MAP[cat.color];
                    const count = getCatArticles(cat.id).length;
                    return (
                        <button key={cat.id} onClick={() => setActiveTab(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${isActive ? `${c.active} shadow-md ring-2 ring-offset-1` : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                }`}>
                            <Icon className="w-4 h-4" />
                            {cat.label}
                            {!loading && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-slate-500 font-medium animate-pulse">뉴스를 수집하고 있습니다...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-red-500">
                    <AlertCircle className="w-10 h-10 mb-3" />
                    <p className="font-medium mb-3">{error}</p>
                    <button onClick={fetchAllNews}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium">
                        <RefreshCw className="w-4 h-4" /> 다시 시도
                    </button>
                </div>
            ) : filteredArticles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Newspaper className="w-12 h-12 mb-3 opacity-30" />
                    <p className="font-medium">관련 기사가 없습니다</p>
                    <p className="text-sm mt-1">수집된 기사 중 해당 키워드 뉴스가 없습니다.</p>
                    <button onClick={fetchAllNews}
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium">
                        <RefreshCw className="w-4 h-4" /> 새로 고침
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredArticles.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                            <div className={`h-1 ${colors.bar}`} />
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                                        {item._source}
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center shrink-0">
                                        <Calendar className="w-3 h-3 mr-1" />{formatDate(item.date)}
                                    </span>
                                </div>
                                <h3 className="text-gray-900 font-bold text-sm leading-snug mb-3 line-clamp-3 group-hover:text-blue-600 transition-colors flex-1">
                                    <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
                                </h3>
                                <div className="pt-3 border-t border-slate-100">
                                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                        원문 보기 <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NewsDashboard;
