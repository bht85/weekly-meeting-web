import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Newspaper, ExternalLink, Calendar, Loader2, Search, Coffee, TrendingUp, Scale, AlertCircle, X, Hash, BarChart3, Cloud } from 'lucide-react';

const NEWS_CATEGORIES = [
    { id: 'compose', label: '컴포즈커피', query: '컴포즈커피', icon: Coffee },
    { id: 'low_cost', label: '저가 커피 프랜차이즈', query: '저가 커피 프랜차이즈', icon: TrendingUp },
    { id: 'bean_price', label: '국제 원두 가격', query: '국제 원두 가격', icon: Scale },
    { id: 'legislation', label: '프랜차이즈 법안', query: '프랜차이즈 법안', icon: Newspaper },
];

const NewsDashboard = () => {
    const [activeTab, setActiveTab] = useState('compose');
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Market Radar State
    const [targetKeywords, setTargetKeywords] = useState(['메가커피', '컴포즈커피', '스타벅스', '이디야', '원두 가격']);
    const [newKeyword, setNewKeyword] = useState('');
    const [trendWords, setTrendWords] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Dummy Data Pool for Simulation
    const DUMMY_DATA_POOLS = [
        [
            { text: '가격 인상', value: 50 }, { text: '저가 커피', value: 30 }, { text: '신메뉴', value: 25 },
            { text: '폐점률', value: 15 }, { text: '배달비', value: 10 }, { text: 'MZ세대', value: 20 },
            { text: '친환경 빨대', value: 12 }, { text: '매장 확대', value: 35 }, { text: '로스팅', value: 8 },
            { text: '여름 시즌', value: 22 }
        ],
        [
            { text: '글로벌 진출', value: 45 }, { text: '원두 수입', value: 28 }, { text: '키오스크', value: 32 },
            { text: '인건비', value: 40 }, { text: '디카페인', value: 25 }, { text: '콜드브루', value: 18 },
            { text: '멤버십', value: 15 }, { text: '팝업 스토어', value: 20 }, { text: '경쟁 심화', value: 38 },
            { text: '스페셜티', value: 12 }
        ]
    ];

    const handleAddKeyword = () => {
        if (newKeyword.trim() && !targetKeywords.includes(newKeyword.trim())) {
            setTargetKeywords([...targetKeywords, newKeyword.trim()]);
            setNewKeyword('');
        }
    };

    const handleRemoveKeyword = (keyword) => {
        setTargetKeywords(targetKeywords.filter(k => k !== keyword));
    };

    const handleAnalyze = () => {
        setIsAnalyzing(true);
        setTrendWords(null); // Clear previous result
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * DUMMY_DATA_POOLS.length);
            setTrendWords(DUMMY_DATA_POOLS[randomIndex]);
            setIsAnalyzing(false);
        }, 1500);
    };

    const getWordStyle = (value) => {
        // Simple scaling logic
        let sizeClass = 'text-sm';
        let colorClass = 'text-slate-400';

        if (value >= 40) {
            sizeClass = 'text-3xl font-bold';
            colorClass = 'text-red-600';
        } else if (value >= 30) {
            sizeClass = 'text-2xl font-bold';
            colorClass = 'text-orange-500';
        } else if (value >= 20) {
            sizeClass = 'text-xl font-semibold';
            colorClass = 'text-blue-600';
        } else if (value >= 15) {
            sizeClass = 'text-lg font-medium';
            colorClass = 'text-slate-600';
        }

        return `${sizeClass} ${colorClass}`;
    };

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            setError(null);
            try {
                const category = NEWS_CATEGORIES.find(c => c.id === activeTab);
                const query = category ? category.query : '커피';
                // Google News RSS URL
                const googleRssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
                // RSS to JSON Converter (rss2json.com)
                const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(googleRssUrl)}`;

                const response = await axios.get(apiUrl);

                if (response.data.status === 'ok') {
                    setArticles(response.data.items);
                } else {
                    setError('뉴스를 불러오는데 실패했습니다.');
                }
            } catch (err) {
                console.error("News fetch error:", err);
                setError('네트워크 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [activeTab]);

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

            if (diffHours < 1) return '방금 전';
            if (diffHours < 24) return `${diffHours}시간 전`;
            return `${date.getMonth() + 1}월 ${date.getDate()}일`;
        } catch (e) {
            return dateString;
        }
    };

    // Helper to extract image or return default
    const getThumbnail = (item) => {
        // rss2json often returns enclosure within 'enclosure' object or description
        if (item.enclosure && item.enclosure.link) {
            return item.enclosure.link;
        }
        // Google News RSS descriptions often contain HTML with images, but rss2json might strip them or put them in content.
        // For simple Zero Cost version, we might fall back to icons if no image found.
        return null;
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 rounded-xl">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Newspaper className="w-6 h-6 text-blue-600" /> 업계 동향 (Industry News)
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">실시간 뉴스 모니터링 대시보드</p>
                </div>
            </div>

            {/* Market Radar Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" /> Market Radar (경쟁사 키워드 분석)
                </h3>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Panel: Keyword Management */}
                    <div className="lg:w-1/3 flex flex-col gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1 flex flex-col">
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">관심 키워드 관리</label>

                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                                    placeholder="키워드 입력"
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                                <button
                                    onClick={handleAddKeyword}
                                    className="px-3 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    추가
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4 content-start">
                                {targetKeywords.map(keyword => (
                                    <span key={keyword} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
                                        <Hash className="w-3 h-3 text-slate-400" />
                                        {keyword}
                                        <button
                                            onClick={() => handleRemoveKeyword(keyword)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            <div className="mt-auto">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing}
                                    className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> 분석 중...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4" /> AI 트렌드 분석 시작
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Word Cloud Visualization */}
                    <div className="lg:w-2/3">
                        <div className="bg-slate-50 rounded-xl border border-slate-100 h-64 lg:h-full min-h-[250px] relative overflow-hidden flex items-center justify-center p-6">
                            {!trendWords && !isAnalyzing && (
                                <div className="text-center text-slate-400">
                                    <Cloud className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">분석 시작 버튼을 눌러 주요 이슈를 확인하세요.</p>
                                </div>
                            )}

                            {isAnalyzing && (
                                <div className="flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                                    <p className="text-sm font-medium text-indigo-800 animate-pulse">AI가 뉴스를 분석 중입니다...</p>
                                </div>
                            )}

                            {trendWords && !isAnalyzing && (
                                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 w-full h-full content-center">
                                    {trendWords.map((word, idx) => (
                                        <span
                                            key={idx}
                                            className={`${getWordStyle(word.value)} transition-all duration-500 hover:scale-110 cursor-default`}
                                        >
                                            {word.text}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-hide mb-6">
                {NEWS_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                        <button
                            key={category.id}
                            onClick={() => setActiveTab(category.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === category.id
                                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200 ring-offset-1'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {category.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-slate-500 font-medium animate-pulse">최신 뉴스를 불러오는 중입니다...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-red-500">
                    <AlertCircle className="w-10 h-10 mb-2" />
                    <p>{error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {articles.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-slate-500">
                            관련된 최신 기사가 없습니다.
                        </div>
                    ) : (
                        [...articles]
                            .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
                            .slice(0, 8)
                            .map((item, index) => {
                                const thumbnail = getThumbnail(item);
                                return (
                                    <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                    {item.author || '뉴스'}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center shrink-0">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {formatDate(item.pubDate)}
                                                </span>
                                            </div>

                                            <h3 className="text-gray-900 font-bold text-lg leading-snug mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                <a href={item.link} target="_blank" rel="noopener noreferrer">
                                                    {item.title}
                                                </a>
                                            </h3>

                                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                                                <span className="text-xs text-slate-500 font-medium truncate max-w-[150px]">
                                                    {item.source?.title || 'Google News'}
                                                </span>
                                                <a
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center"
                                                >
                                                    원문 보기 <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                    )}
                </div>
            )}
        </div>
    );
};

export default NewsDashboard;
