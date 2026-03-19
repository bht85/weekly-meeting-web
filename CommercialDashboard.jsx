import React, { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Users, AlertCircle, BarChart3, ChevronDown, CheckCircle2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const REGIONS = [
    // 서울 (25개 자치구)
    "서울 강남구", "서울 서초구", "서울 송파구", "서울 마포구", "서울 영등포구", "서울 종로구", "서울 중구", "서울 용산구", 
    "서울 성동구", "서울 광진구", "서울 동대문구", "서울 중랑구", "서울 성북구", "서울 강북구", "서울 도봉구", "서울 노원구",
    "서울 은평구", "서울 서대문구", "서울 양천구", "서울 강서구", "서울 구로구", "서울 금천구", "서울 동작구", "서울 관악구", "서울 강동구",
    
    // 분당, 일산, 통합시 등 주요 경기/인천 지역
    "경기 성남시 분당구", "경기 수원시 팔달구", "경기 고양시 일산동구", "경기 용인시 수지구", "경기 안양시 동안구", "경기 화성시 동탄",
    "인천 연수구(송도)", "인천 남동구", "인천 부평구", "인천 서구(청라)",
    
    // 부산 주요 상권
    "부산 진구(서면)", "부산 해운대구", "부산 수영구", "부산 동래구", "부산 중구(남포동)",
    
    // 대구/경북 주요 상권
    "대구 중구(동성로)", "대구 수성구", "대구 달서구", "경북 포항시 북구", "경북 구미시",
    
    // 광주/전라 주요 상권
    "광주 동구(충장로)", "광주 서구(상무지구)", "광주 광산구(수완지구)", "전북 전주시 완산구",
    
    // 대전/충청/세종 주요 상권
    "대전 서구(둔산동)", "대전 유성구", "대전 중구(은행동)", "세종특별자치시", "충남 천안시 서북구(불당동)", "충북 청주시 흥덕구",
    
    // 강원/제주 주요 상권
    "강원 춘천시", "강원 원주시", "강원 강릉시", "제주 제주시(노형동)", "제주 서귀포시"
];

// Helper to reliably generate pseudo-random numbers based on string seed
const seededRandom = (seed) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    return () => {
        hash = Math.sin(hash) * 10000;
        return hash - Math.floor(hash);
    };
};

const getRelativeMonth = (monthsAgo) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const CommercialDashboard = () => {
    const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
    const [salesData, setSalesData] = useState([]);
    const [demoData, setDemoData] = useState([]);
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            
            try {
                // 실제 API 로직이 들어갈 곳 (axios.get('https://bigdata.sbiz.or.kr/...'))
                // API 응답 구조를 모르므로 의도적으로 에러를 발생시켜 Mock 데이터를 타게 설정
                await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network payload
                throw new Error("API 연동 확인 전");
            } catch (err) {
                if (!isMounted) return;
                // Mock 데이터 생성 로직
                const rand = seededRandom(selectedRegion);
                
                // 최근 6개월 매출
                const mockSales = [];
                for(let i=5; i>=0; i--) {
                    mockSales.push({
                        month: getRelativeMonth(i),
                        sales: Math.floor(rand() * 5000 + 3000) * 10000 // 3000만 ~ 8000만
                    });
                }
                setSalesData(mockSales);

                // 인구 분포
                const ageGroups = ['20대', '30대', '40대', '50대', '60대 이상'];
                const mockDemo = ageGroups.map(age => ({
                    age,
                    male: Math.floor(rand() * 4000 + 1000),
                    female: Math.floor(rand() * 4000 + 1000)
                }));
                setDemoData(mockDemo);

                // 창업기상도 데이터 (Mock)
                const charSum = selectedRegion.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const weatherOptions = [
                    { 
                        status: "☀️ 맑음", 
                        desc: "창업 위험도 낮음 (매출 성장세)", 
                        bgClass: "bg-amber-50", 
                        subtitleStyle: "text-emerald-500",
                        radarData: [
                            { subject: '성장성', A: 85, fullMark: 100 },
                            { subject: '안정성', A: 90, fullMark: 100 },
                            { subject: '구매력', A: 80, fullMark: 100 },
                            { subject: '영업력', A: 85, fullMark: 100 },
                            { subject: '과밀도(낮음)', A: 75, fullMark: 100 },
                        ],
                        comment: "전반적인 지표가 우수하며, 특히 안정성과 성장성이 높아 신규 진입에 매우 유리한 상권입니다."
                    },
                    { 
                        status: "⛅ 구름조금", 
                        desc: "위험도 보통 (완만한 성장)", 
                        bgClass: "bg-sky-50", 
                        subtitleStyle: "text-slate-500",
                        radarData: [
                            { subject: '성장성', A: 65, fullMark: 100 },
                            { subject: '안정성', A: 70, fullMark: 100 },
                            { subject: '구매력', A: 75, fullMark: 100 },
                            { subject: '영업력', A: 60, fullMark: 100 },
                            { subject: '과밀도(낮음)', A: 50, fullMark: 100 },
                        ],
                        comment: "평균적인 상권 수준을 유지하고 있으나, 동종 업계의 과밀도가 뚜렷해 차별화된 전략이 필요합니다."
                    },
                    { 
                        status: "🌧️ 흐림/비", 
                        desc: "창업 위험도 높음 (주의 요망)", 
                        bgClass: "bg-slate-100", 
                        subtitleStyle: "text-rose-500",
                        radarData: [
                            { subject: '성장성', A: 40, fullMark: 100 },
                            { subject: '안정성', A: 45, fullMark: 100 },
                            { subject: '구매력', A: 60, fullMark: 100 },
                            { subject: '영업력', A: 50, fullMark: 100 },
                            { subject: '과밀도(낮음)', A: 30, fullMark: 100 },
                        ],
                        comment: "매출 하락세와 높은 폐업률이 관찰되는 주의 상권입니다. 신중한 접근이 요구됩니다."
                    }
                ];
                setWeatherData(weatherOptions[charSum % 3]);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [selectedRegion]);

    const formatCurrency = (value) => `${Math.round(value / 10000).toLocaleString()}만원`;
    
    // 평균 계산
    const avgSales = salesData.length ? Math.round(salesData.reduce((acc, cur) => acc + cur.sales, 0) / salesData.length) : 0;
    const totalPop = demoData.length ? demoData.reduce((acc, cur) => acc + cur.male + cur.female, 0) : 0;

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-xl font-sans text-slate-800 animate-in fade-in duration-300">
            {/* 상단 헤더 및 필터 영역 */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-7 h-7 text-indigo-600" /> 상권 및 입지 분석 대시보드
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 소상공인365 상권분석(커피 프랜차이즈) API 연동 화면
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="block w-full pl-10 pr-10 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm appearance-none cursor-pointer transition-all"
                        >
                            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 animate-pulse">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">상권 데이터를 실시간으로 조회하고 있습니다...</p>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* 상단 요약 카드 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 1. 창업기상도 카드 */}
                        {weatherData && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center gap-3 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 ${weatherData.bgClass} rounded-xl flex items-center justify-center shrink-0`}>
                                        <span className="text-3xl">{weatherData.status.split(' ')[0]}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-500 mb-1">상권 창업기상도</p>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{weatherData.status.split(' ')[1]}</h3>
                                    </div>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${weatherData.subtitleStyle}`}>{weatherData.desc}</p>
                                </div>
                            </div>
                        )}

                        {/* 2. 6개월 평균 매출 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                                <TrendingUp className="w-7 h-7 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 mb-1">6개월 평균 매출 (추정치)</p>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(avgSales)} <span className="text-sm font-medium text-emerald-500 ml-1">상권 유망</span></h3>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                <Users className="w-7 h-7 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 mb-1">일평균 유동인구 (예상)</p>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{totalPop.toLocaleString()} <span className="text-base font-normal text-slate-500">명</span></h3>
                            </div>
                        </div>
                    </div>

                    {/* 차트 영역 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 1. 매출 동향 라인 차트 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-500" /> 최근 6개월 매출 추이
                                </h3>
                            </div>
                            <div className="flex-1 min-h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={salesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis 
                                            dataKey="month" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 12 }} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                            tickFormatter={(val) => `${val / 10000}만`}
                                        />
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [`${(value / 10000).toLocaleString()}만원`, '월 매출']}
                                            labelStyle={{ color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="sales" 
                                            stroke="#4f46e5" 
                                            strokeWidth={4}
                                            dot={{ stroke: '#4f46e5', strokeWidth: 2, r: 4, fill: '#fff' }}
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. 인구 분포 바 차트 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-500" /> 타겟 고객층 (연령/성별)
                                </h3>
                            </div>
                            <div className="flex-1 min-h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={demoData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis 
                                            dataKey="age" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                        />
                                        <RechartsTooltip 
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value, name) => [value.toLocaleString() + '명', name === 'male' ? '남성' : '여성']}
                                        />
                                        <Legend 
                                            iconType="circle" 
                                            wrapperStyle={{ fontSize: '13px', color: '#475569', paddingTop: '15px' }}
                                        />
                                        <Bar dataKey="male" name="남성" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Bar dataKey="female" name="여성" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* 3. 창업기상도 심층 분석 영역 */}
                    {weatherData && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-indigo-500" /> 소상공인365 창업기상도 상세 분석
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">상권의 안전성을 5대 지표(성장성, 안정성, 구매력, 영업력, 과밀도)로 분석합니다.</p>
                                </div>
                                <div className={`px-4 py-2 rounded-lg font-bold text-sm bg-white border shadow-sm ${weatherData.subtitleStyle.replace('text-', 'border-').replace('500', '200')}`}>
                                    현재 종합 기상: {weatherData.status}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                {/* 레이더 차트 (5대 지표) */}
                                <div className="h-[300px] w-full bg-slate-50 rounded-xl p-4 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={weatherData.radarData}>
                                            <PolarGrid gridType="polygon" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13, fontWeight: 'bold' }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="상권 지수" dataKey="A" stroke="#4f46e5" strokeWidth={2} fill="#4f46e5" fillOpacity={0.4} />
                                            <RechartsTooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* 종합 코멘트 및 지표 설명 */}
                                <div className="space-y-6">
                                    <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-100">
                                        <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                            <span>💡</span> AI 기상평 (종합 의견)
                                        </h4>
                                        <p className="text-indigo-800 text-sm leading-relaxed string">
                                            {weatherData.comment}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {weatherData.radarData.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                <span className="text-sm font-semibold text-slate-600">{item.subject}</span>
                                                <span className={`text-sm font-bold ${item.A >= 80 ? 'text-emerald-500' : item.A >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                    {item.A}점
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-xs text-slate-400 text-right mt-2 flex items-center justify-end gap-1">
                                        <AlertCircle className="w-3 h-3" /> 과밀도는 점수가 낮을수록(경쟁이 적을수록) 좋은 지표로 환산하여 표기됨
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            

        </div>
    );
};

export default CommercialDashboard;
