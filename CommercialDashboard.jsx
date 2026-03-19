import React, { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Users, AlertCircle, BarChart3, ChevronDown, CheckCircle2, FileText, X, Bike, Map } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Store, TrendingDown } from 'lucide-react';

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
    const [storeSumData, setStoreSumData] = useState({ total: 0, open: 0, close: 0 });
    const [storeStatusData, setStoreStatusData] = useState([]);
    const [storeAgeData, setStoreAgeData] = useState([]);
    const [detailData, setDetailData] = useState(null);
    const [deliveryData, setDeliveryData] = useState(null);
    const [showDetailPopup, setShowDetailPopup] = useState(false);
    const [mapViewMode, setMapViewMode] = useState('population'); // population | sales | competitor
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

                // 업소 현황 (커피 프랜차이즈 기준)
                const mockStoreStatus = [];
                let baseTotal = Math.floor(rand() * 150 + 50); // 기본 점포 수 50~200개
                let totalOpen = 0, totalClose = 0;
                
                for(let i=5; i>=0; i--) {
                    const openCount = Math.floor(rand() * 8); // 월별 0~7개 오픈
                    const closeCount = Math.floor(rand() * 5); // 월별 0~4개 폐업
                    totalOpen += openCount;
                    totalClose += closeCount;
                    baseTotal = baseTotal + openCount - closeCount;
                    
                    mockStoreStatus.push({
                        month: getRelativeMonth(i),
                        total: baseTotal,
                        openCount,
                        closeCount
                    });
                }
                setStoreStatusData(mockStoreStatus);
                setStoreSumData({ total: baseTotal, open: totalOpen, close: totalClose });

                // 업력 현황 (Business Age)
                const mockAgeData = [
                    { name: '1년 미만', value: Math.floor(rand() * 20 + 5) },
                    { name: '1~2년', value: Math.floor(rand() * 25 + 10) },
                    { name: '2~3년', value: Math.floor(rand() * 20 + 10) },
                    { name: '3~5년', value: Math.floor(rand() * 30 + 15) },
                    { name: '5년 이상', value: Math.floor(rand() * 40 + 20) }
                ];
                setStoreAgeData(mockAgeData);

                // 상세 분석 (Detail Analysis Popup Data)
                const mockDetail = {
                    hourlyPop: [
                        { time: '06-11시', value: Math.floor(rand() * 20 + 5) },
                        { time: '11-14시', value: Math.floor(rand() * 40 + 30) }, // 점심 피크
                        { time: '14-17시', value: Math.floor(rand() * 25 + 15) },
                        { time: '17-21시', value: Math.floor(rand() * 30 + 20) }, // 퇴근 피크
                        { time: '21-24시', value: Math.floor(rand() * 10 + 2) }
                    ],
                    weeklySales: [
                        { day: '월', value: Math.floor(rand() * 15 + 10) },
                        { day: '화', value: Math.floor(rand() * 15 + 10) },
                        { day: '수', value: Math.floor(rand() * 15 + 10) },
                        { day: '목', value: Math.floor(rand() * 15 + 10) },
                        { day: '금', value: Math.floor(rand() * 20 + 15) },
                        { day: '토', value: Math.floor(rand() * 25 + 20) },
                        { day: '일', value: Math.floor(rand() * 25 + 20) }
                    ],
                    competitors: [
                        { name: '메가MGC커피', dist: '50m', type: '저가형' },
                        { name: '빽다방', dist: '120m', type: '저가형' },
                        { name: '스타벅스', dist: '200m', type: '대형/복합' },
                        { name: '이디야커피', dist: '250m', type: '중저가' }
                    ],
                    summary: "주말 및 점심시간대(11~14시) 유동인구 비율이 압도적으로 높으며, 반경 200m 내 저가형 커피 프랜차이즈가 다수 밀집해 있는 '경쟁 치열/고수요' 입지입니다."
                };
                setDetailData(mockDetail);

                // 배달 현황 (Delivery Status)
                const mockDelivery = {
                    ratio: Math.floor(rand() * 25 + 35), // 35~60% 배달 비중
                    platforms: [
                        { name: '배달의민족', value: Math.floor(rand() * 20 + 55) }, // 55~75%
                        { name: '쿠팡이츠', value: Math.floor(rand() * 15 + 20) }, // 20~35%
                        { name: '요기요', value: Math.floor(rand() * 10 + 5) } // 5~15%
                    ],
                    avgOrderTime: Math.floor(rand() * 3 + 1), // 1: 점심, 2: 오후, 3: 저녁, 4: 야간
                    avgDeliveryFee: Math.floor(rand() * 1000 + 2000) // 2000~3000원
                };
                setDeliveryData(mockDelivery);

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

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <button 
                        onClick={() => setShowDetailPopup(true)}
                        className="w-full md:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-indigo-200"
                    >
                        <FileText className="w-5 h-5" />
                        상세 분석 보고서 보기
                    </button>
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

                    {/* 상단 2단 레이아웃: 상권 지도 & 매출 차트 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* 상권 지도 (히트맵 시각화) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between z-10 bg-white">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Map className="w-6 h-6 text-indigo-500" /> 해당 상권 지도 및 히트맵
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">선택하신 '{selectedRegion}' 지역의 유동인구 및 매출 밀집도를 시각화합니다.</p>
                            </div>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <button 
                                    onClick={() => setMapViewMode('population')} 
                                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${mapViewMode === 'population' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    인구 밀집도
                                </button>
                                <button 
                                    onClick={() => setMapViewMode('sales')} 
                                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${mapViewMode === 'sales' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    매출 히트맵
                                </button>
                                <button 
                                    onClick={() => setMapViewMode('competitor')} 
                                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${mapViewMode === 'competitor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    경쟁점 분포
                                </button>
                            </div>
                        </div>
                        {/* Mock Map Viewport (Fixed height) */}
                        <div className="relative w-full h-[250px] bg-slate-100 overflow-hidden">
                            {/* 실제 구글 맵 연동 바탕 */}
                            <div className="absolute inset-0 z-0">
                                <iframe 
                                    title="상권 지도"
                                    width="100%" 
                                    height="100%" 
                                    style={{ border: 0 }} 
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedRegion)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                    loading="lazy"
                                />
                            </div>
                            
                            {/* 지도 위에 약간의 반투명 오버레이를 깔아서 히트맵이 더 잘 보이도록 함 (클릭 투과) */}
                            <div className="absolute inset-0 bg-white/40 pointer-events-none z-0"></div>
                            
                            {/* 히트맵 효과 (Blur Circles) - 마우스 이벤트 투과(pointer-events-none) 처리 */}
                            {mapViewMode === 'sales' && (
                                <>
                                    <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-rose-500/60 rounded-full mix-blend-multiply filter blur-3xl animate-pulse pointer-events-none z-10"></div>
                                    <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-amber-500/60 rounded-full mix-blend-multiply filter blur-3xl animate-pulse pointer-events-none z-10" style={{ animationDelay: '1s' }}></div>
                                </>
                            )}
                            
                            {mapViewMode === 'population' && (
                                <>
                                    <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-emerald-500/50 rounded-full mix-blend-multiply filter blur-3xl animate-pulse pointer-events-none z-10" style={{ animationDelay: '1.5s' }}></div>
                                    <div className="absolute bottom-1/3 left-1/3 w-40 h-40 bg-indigo-500/50 rounded-full mix-blend-multiply filter blur-2xl animate-pulse pointer-events-none z-10" style={{ animationDelay: '0.5s' }}></div>
                                </>
                            )}

                            {/* 맵 마커 (항상 고정) */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-20">
                                <div className="bg-indigo-600/90 backdrop-blur text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg mb-1 relative w-auto whitespace-nowrap">
                                    {selectedRegion} 중심상권
                                    <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-indigo-600/90 rotate-45"></div>
                                </div>
                                <div className="w-5 h-5 bg-indigo-500 border-2 border-white rounded-full shadow-lg animate-bounce"></div>
                            </div>
                            
                            {/* 경쟁점 마커들 (경쟁점 분포 모드일 때만 활성화) */}
                            <div className={`transition-opacity duration-300 ${mapViewMode === 'competitor' ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-rose-500 border-2 border-white rounded-full shadow-md pointer-events-none z-20"></div>
                                <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-rose-500 border-2 border-white rounded-full shadow-md pointer-events-none z-20"></div>
                                <div className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-amber-500 border-2 border-white rounded-full shadow-md pointer-events-none z-20"></div>
                                <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-sky-500 border-2 border-white rounded-full shadow-md pointer-events-none z-20"></div>
                                <div className="absolute bottom-1/4 left-1/2 w-4 h-4 bg-rose-500 border-2 border-white rounded-full shadow-md pointer-events-none z-20"></div>
                            </div>
                            
                            {/* 안내 문구 (좌측 하단) */}
                            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur text-slate-700 px-4 py-2 rounded-lg shadow-sm border border-slate-200 pointer-events-none z-30 transition-all">
                                <p className="text-xs font-bold flex items-center gap-1">
                                    <AlertCircle className={`w-4 h-4 ${mapViewMode === 'competitor' ? 'text-indigo-500' : 'text-rose-500'}`} />
                                    {mapViewMode === 'sales' && '색상이 붉을수록 매출 밀집도가 높은 핵심 구역입니다.'}
                                    {mapViewMode === 'population' && '색상이 푸를수록 유동인구 통행량이 많은 구역입니다.'}
                                    {mapViewMode === 'competitor' && '주요 프랜차이즈 경쟁점들의 위치가 표시됩니다.'}
                                </p>
                            </div>
                        </div>
                    </div>

                        {/* 1. 매출 동향 라인 차트 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-500" /> 최근 6개월 매출 추이
                                </h3>
                            </div>
                            <div className="flex-1 min-h-[300px] w-full">
                                <ResponsiveContainer width="99%" height="100%">
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
                    </div>

                    {/* 중단 2단 레이아웃: 인구 분포 & 배달 현황 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* 2. 인구 분포 바 차트 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
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

                        {/* 배달 상권 현황 (새로 추가) */}
                        {deliveryData && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <Bike className="w-6 h-6 text-sky-500" /> 배달 수요 및 플랫폼 점유율 현황
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">해당 상권 내 카페 업종의 배달 매출 비중 및 주 이용 배달 플랫폼 분석입니다.</p>
                                </div>
                                <div className="px-4 py-2 rounded-lg font-bold text-sm bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                                    </span>
                                    배달 매출 비중: 약 {deliveryData.ratio}%
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-center flex-1 mt-4">
                                {/* 배달 플랫폼 점유율 파이 차트 */}
                                <div className="xl:col-span-1 h-[250px] w-full bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col justify-center items-center">
                                    <h4 className="flex-shrink-0 text-sm font-bold text-slate-700 mb-2">플랫폼별 일평균 주문 점유율</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={deliveryData.platforms}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {deliveryData.platforms.map((entry, index) => {
                                                    const platformColors = {
                                                        '배달의민족': '#2dd4bf', // 민트
                                                        '쿠팡이츠': '#3b82f6', // 블루
                                                        '요기요': '#ef4444'  // 레드
                                                    };
                                                    return <Cell key={`cell-${index}`} fill={platformColors[entry.name] || '#94a3b8'} />;
                                                })}
                                            </Pie>
                                            <RechartsTooltip 
                                                formatter={(value) => [value + '%', '점유율']}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* 배달 분석 요약 */}
                                <div className="xl:col-span-1 space-y-4 flex flex-col justify-center">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4">
                                        <div className="bg-sky-50 rounded-xl p-5 border border-sky-100">
                                            <h4 className="text-sm font-bold text-slate-500 mb-1">고객 평균 배달팁(추정)</h4>
                                            <div className="text-2xl font-black text-sky-700">{deliveryData.avgDeliveryFee.toLocaleString()}원</div>
                                        </div>
                                        <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                                            <h4 className="text-sm font-bold text-slate-500 mb-1">배달 피크 타임</h4>
                                            <div className="text-2xl font-black text-indigo-700">
                                                {deliveryData.avgOrderTime === 1 ? '점심 (11시~13시)' : 
                                                 deliveryData.avgOrderTime === 2 ? '오후 (14시~17시)' :
                                                 deliveryData.avgOrderTime === 3 ? '저녁 (18시~20시)' : '야간 (21시 이후)'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white rounded-xl text-sm text-slate-600 border border-slate-200">
                                        <strong>💡 배달 상권 공략 팁: </strong> 
                                        현재 상권은 배달 매출 비중이 <strong>{deliveryData.ratio}%</strong>로 {deliveryData.ratio > 45 ? '상당히 높은 편' : '안정적인 수준'}입니다. 
                                        특히 <strong>{deliveryData.platforms[0].name}</strong> 플랫폼 집중도가 높으므로 해당 플랫폼 앱 내 광고 노출도와 깃발 꽂기 전략이 매출에 큰 영향을 미칩니다. 
                                        {deliveryData.avgOrderTime === 2 && ' 직장인/학생들의 오후 디저트, 음료 주문 수요가 높은 편입니다.'}
                                    </div>
                                </div>
                            </div>
                            </div>
                        )}
                    </div>

                    {/* 4. 커피 프랜차이즈 업소 현황 (경쟁 분석) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">
                        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Store className="w-5 h-5 text-indigo-500" /> 카페 업종 현황 및 변동 추이 (경쟁 밀집도)
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">최근 6개월간 해당 상권 내 커피전문점(프랜차이즈/개인)의 개업 및 폐업, 총 점포 수 추이입니다.</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                            {/* 요약 카드 (복구됨) */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100">
                                    <h4 className="text-xs font-bold text-slate-500 mb-1">현재 상권 내 카페 총 점포 수</h4>
                                    <div className="text-3xl font-black text-indigo-700">{storeSumData.total}개</div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                                        <h4 className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500"/> 6개월 누적 개업</h4>
                                        <div className="text-xl font-bold text-emerald-600">+{storeSumData.open}건</div>
                                    </div>
                                    <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-100">
                                        <h4 className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-rose-500"/> 6개월 누적 폐업</h4>
                                        <div className="text-xl font-bold text-rose-600">-{storeSumData.close}건</div>
                                    </div>
                                </div>
                                <div className="mt-4 p-4 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-200">
                                    <strong>💡 전략 시사점: </strong> 
                                    6개월간 {storeSumData.open >= storeSumData.close ? '개업이 폐업보다 많아 카페 시장 유입 확대' : '폐업 우세로 생존 경쟁 치열'}
                                </div>
                            </div>

                            {/* 업력 현황 파이 차트 */}
                            <div className="lg:col-span-1 h-[300px] w-full bg-slate-50 rounded-xl border border-slate-100 p-2 flex flex-col items-center">
                                <h4 className="text-sm font-bold text-slate-700 mb-2 mt-2 px-2 text-center flex-shrink-0">점포 업력 분포</h4>
                                <div className="flex-1 w-full min-h-0 relative -mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={storeAgeData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={0}
                                                outerRadius={55}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {storeAgeData.map((entry, index) => {
                                                    const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#818cf8'];
                                                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                                })}
                                            </Pie>
                                            <RechartsTooltip 
                                                formatter={(value) => [value + '개', '점포 수']}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" align="center" layout="horizontal" wrapperStyle={{ fontSize: '10px', bottom: 5, width: '100%' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* 추이 차트 */}
                            <div className="lg:col-span-3 h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={storeStatusData} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '15px' }} />
                                        <Bar yAxisId="left" dataKey="openCount" name="월별 개업 수" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar yAxisId="left" dataKey="closeCount" name="월별 폐업 수" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Line yAxisId="right" type="monotone" dataKey="total" name="총 카페 점포 수" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                                    </ComposedChart>
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

            {/* 상세 분석 (팝업/모달) */}
            {showDetailPopup && detailData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white/95 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* 팝업 헤더 */}
                        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-white relative z-10 shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                    <FileText className="w-6 h-6 text-indigo-600" />
                                    [{selectedRegion}] 상권 상세 분석 리포트
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">소상공인365 '상세분석' API 데이터를 기반으로 한 심층 분석 자료입니다.</p>
                            </div>
                            <button 
                                onClick={() => setShowDetailPopup(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {/* 팝업 본문 스크롤 영역 */}
                        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
                            <div className="space-y-6">
                                {/* AI 종합 분석 의견 */}
                                <div className="bg-indigo-600 text-white rounded-xl p-6 shadow-md border border-indigo-700">
                                    <h3 className="font-bold flex items-center gap-2 mb-2 text-indigo-100">
                                        💡 AI 입지 상세 평판
                                    </h3>
                                    <p className="text-lg font-medium leading-relaxed">"{detailData.summary}"</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* 시간대별 유동인구 */}
                                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-emerald-500" /> 시간대별 유동인구 집중도
                                        </h3>
                                        <div className="h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={detailData.hourlyPop} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                                                    <Bar dataKey="value" name="비율(%)" fill="#38bdf8" radius={[4,4,0,0]} barSize={30} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* 요일별 매출 비중 */}
                                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-indigo-500" /> 요일별 매출 비중
                                        </h3>
                                        <div className="h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={detailData.weeklySales} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                                                    <Bar dataKey="value" name="비중(%)" fill="#a78bfa" radius={[4,4,0,0]} barSize={30} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* 주요 반경 내 경쟁점 현황 (리스트) */}
                                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <Store className="w-4 h-4 text-rose-500" /> 500m 반경 내 주요 프랜차이즈 경쟁점
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        {detailData.competitors.map((comp, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col">
                                                <span className="text-xs font-bold text-indigo-500 mb-1">{comp.type}</span>
                                                <strong className="text-lg text-slate-800">{comp.name}</strong>
                                                <span className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> 반경 {comp.dist}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* 팝업 하단 여백 및 닫기 힌트 */}
                        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
                            <button 
                                onClick={() => setShowDetailPopup(false)}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-colors shadow-sm"
                            >
                                리포트 닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default CommercialDashboard;
