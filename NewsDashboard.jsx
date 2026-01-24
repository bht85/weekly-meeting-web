import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Newspaper, ExternalLink, Calendar, Loader2, Search, Coffee, TrendingUp, Scale, AlertCircle } from 'lucide-react';

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
                        articles.map((item, index) => {
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

                                        {/* Description Snippet (optional, html stripped) */}
                                        {/* <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">
                                            {item.description.replace(/<[^>]+>/g, '')}
                                        </p> */}

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
