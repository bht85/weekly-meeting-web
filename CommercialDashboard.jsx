import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { TrendingUp, MapPin, Users, AlertCircle, BarChart3, ChevronDown, CheckCircle2, FileText, X, Bike, Map, MessageCircle, Hash, Search, Download } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Store, TrendingDown } from 'lucide-react';

const REGION_DATA = {
    "서울": {
        "강남구": ["역삼1동", "역삼2동", "삼성동", "청담동", "논현동", "압구정동", "신사동"],
        "서초구": ["서초동", "방배동", "양재동", "반포동", "잠원동"],
        "송파구": ["잠실동", "문정동", "가락동", "방이동", "석촌동"],
        "마포구": ["서교동(홍대)", "연남동", "망원동", "상암동", "합정동"],
        "용산구": ["한남동", "이태원동", "이촌동", "보광동", "효창동"],
        "성동구": ["성수동", "옥수동", "왕십리동"],
        "영등포구": ["여의도동", "문래동", "당산동"]
    },
    "경기/인천": {
        "성남시 분당구": ["삼평동(판교)", "서현동", "정자동", "야탑동", "금곡동"],
        "수원시 팔달구": ["인계동", "우만동", "남창동", "행궁동"],
        "고양시 일산동구": ["장항동", "마두동", "백석동", "정발산동"],
        "용인시 수지구": ["풍덕천동", "죽전동", "상현동", "성복동"],
        "화성시": ["동탄1동", "동탄2동", "동탄3동", "향남읍", "봉담읍"],
        "안양시 동안구": ["범계동", "평촌동", "관양동"],
        "인천 연수구": ["송도동", "동춘동", "옥련동"],
        "인천 남동구": ["구월동", "간석동", "논현동"],
        "인천 부평구": ["부평동", "산곡동", "부개동"]
    },
    "부산/영남": {
        "부산 진구": ["부전동(서면)", "전포동", "범천동"],
        "부산 해운대구": ["우동", "중동", "좌동", "재송동", "송정동"],
        "부산 수영구": ["광안동", "망미동", "민락동", "남천동"],
        "부산 동래구": ["온천동", "명륜동", "사직동"],
        "대구 중구": ["동성로1가", "삼덕동", "대봉동"],
        "대구 수성구": ["범어동", "만촌동", "두산동"],
        "경북 포항시": ["상도동", "죽도동", "두호동"],
        "경남 창원시": ["상남동", "중앙동", "용호동"]
    },
    "기타 광역시/도": {
        "광주 동구": ["충장로1가", "금남로", "계림동"],
        "광주 서구": ["상무지구", "치평동", "풍암동"],
        "대전 서구": ["둔산동", "갈마동", "월평동"],
        "대전 유성구": ["봉명동", "궁동(충남대)", "상대동"],
        "세종시": ["나성동", "보람동", "도담동", "어진동"],
        "충남 천안시": ["불당동", "두정동", "신부동"],
        "충북 청주시": ["가경동", "복대동", "지동동"],
        "강원 춘천시": ["효자동", "석사동", "온의동"],
        "제주 제주시": ["노형동", "연동", "아라동"],
        "제주 서귀포시": ["중문동", "서귀동", "강정동"]
    }
};

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
    const [selectedRegion, setSelectedRegion] = useState("서울 강남구 역삼1동");
    const [salesData, setSalesData] = useState([]);
    const [demoData, setDemoData] = useState([]);
    const [weatherData, setWeatherData] = useState(null);
    const [storeSumData, setStoreSumData] = useState({ total: 0, open: 0, close: 0 });
    const [storeStatusData, setStoreStatusData] = useState([]);
    const [storeAgeData, setStoreAgeData] = useState([]);
    const [detailData, setDetailData] = useState(null);
    const [deliveryData, setDeliveryData] = useState(null);
    const [showDetailPopup, setShowDetailPopup] = useState(false);
    const [showSimpleAnalysisPopup, setShowSimpleAnalysisPopup] = useState(false);
    const reportRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);

    // PDF 다운로드 기능
    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        
        setIsExporting(true);
        const originalScroll = window.scrollY;
        
        // 캡처를 위해 최상단으로 이동
        window.scrollTo(0, 0);

        try {
            // 캡처 환경 최적화 (여유 있게 0.8초 대기하여 차트 및 정적 맵 렌더링 보장)
            await new Promise(resolve => setTimeout(resolve, 800));

            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 1.5,
                useCORS: true,
                logging: false,
                backgroundColor: '#f9fafb',
                width: element.offsetWidth,
                height: element.offsetHeight,
                scrollX: 0,
                scrollY: 0,
                windowWidth: element.offsetWidth,
                windowHeight: element.offsetHeight
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            
            // 비율 계산
            const imgWidth = pageWidth;
            const imgHeight = (canvasHeight * imgWidth) / canvasWidth;
            
            let heightLeft = imgHeight;
            let position = 0;

            // 첫 페이지 추가
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // 내용이 남았다면 페이지를 추가하며 나머지 이미지 부분을 그림
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`상권분석리포트_${selectedRegion.replace(/ /g, '_')}.pdf`);
        } catch (error) {
            console.error('PDF 생성 실패:', error);
            alert('PDF 생성 중 오류가 발생했습니다. 브라우저의 인쇄(Ctrl+P) 기능을 통해 PDF로 저장을 시도해 보세요.');
        } finally {
            setIsExporting(false);
            window.scrollTo(0, originalScroll);
        }
    };

    // 시도/구/동을 납작한 배열로 변환 (검색용)
    const allRegions = [];
    Object.entries(REGION_DATA).forEach(([sido, sigungus]) => {
        Object.entries(sigungus).forEach(([sigungu, dongs]) => {
            dongs.forEach(dong => {
                allRegions.push(`${sido} ${sigungu} ${dong}`);
            });
        });
    });

    const [searchInput, setSearchInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // 검색어 입력 시 필터링
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);
        if (value.trim().length > 0) {
            const filtered = allRegions.filter(r => r.replace(/\s+/g, '').includes(value.replace(/\s+/g, ''))).slice(0, 10);
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (region) => {
        setSearchInput(region);
        setSelectedRegion(region);
        setShowSuggestions(false);
    };

    // 외부 클릭 시 추천 목록 닫기
    useEffect(() => {
        const handleClickOutside = () => setShowSuggestions(false);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);
    
    const [mapViewMode, setMapViewMode] = useState('population'); // population | sales | competitor
    const [snsData, setSnsData] = useState(null);
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

                // SNS 분석 데이터 (Mock)
                const mockSns = {
                    sentiment: [
                        { name: '긍정', value: Math.floor(rand() * 40 + 40) },
                        { name: '중립', value: Math.floor(rand() * 20 + 10) },
                        { name: '부정', value: Math.floor(rand() * 15 + 5) }
                    ],
                    buzzTrend: [],
                    keywords: ['분위기좋은', '디저트맛집', '카공', '가성비', '데이트', '조용한', '주차편한', '뷰맛집', '신상카페', '인스타감성'].sort(() => 0.5 - rand()).slice(0, 6)
                };
                for(let i=5; i>=0; i--) {
                    mockSns.buzzTrend.push({
                        month: getRelativeMonth(i),
                        mentions: Math.floor(rand() * 10000 + 2000)
                    });
                }
                setSnsData(mockSns);
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

    const recentSales = salesData.length >= 2 ? salesData[salesData.length - 1].sales : 0;
    const prevSales = salesData.length >= 2 ? salesData[salesData.length - 2].sales : 1;
    const salesGrowth = ((recentSales - prevSales) / prevSales * 100).toFixed(1);
    const isGrowthPositive = salesGrowth >= 0;

    return (
        <div ref={reportRef} className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-xl font-sans text-slate-800 animate-in fade-in duration-300">
            {/* 상단 헤더 및 필터 영역 */}
            <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-gray-200 pb-5">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-indigo-600" /> <span className="text-indigo-600 font-black">[{selectedRegion}]</span> 상권 분석 리포트
                    </h2>
                    <p className="text-[13px] text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> 해당 상권의 실시간 데이터 및 AI 예측 분석 대시보드입니다.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-2.5 w-full xl:w-auto">
                    <button 
                        onClick={handleDownloadPDF}
                        disabled={isExporting}
                        className={`w-full md:w-auto px-4 py-2.5 ${isExporting ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm text-sm`}
                    >
                        {isExporting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        {isExporting ? 'PDF 생성 중...' : 'PDF 다운로드'}
                    </button>
                    
                    <button 
                        onClick={() => setShowSimpleAnalysisPopup(true)}
                        className="w-full md:w-auto px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm text-sm"
                    >
                        <Search className="w-4 h-4" />
                        간단 분석
                    </button>

                    <button 
                        onClick={() => setShowDetailPopup(true)}
                        className="w-full md:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm text-sm"
                    >
                        <FileText className="w-4 h-4" />
                        상세 분석
                    </button>
                    
                    {/* 주소 검색창 */}
                    <div className="relative w-full md:w-72 lg:w-80" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-indigo-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="동네 이름 검색 (예: 역삼동...)"
                            value={searchInput}
                            onChange={handleSearchChange}
                            onFocus={() => searchInput.trim().length > 0 && setShowSuggestions(true)}
                            className="block w-full pl-9 pr-8 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all text-sm"
                        />
                        {searchInput && (
                            <button 
                                onClick={() => {setSearchInput(""); setSuggestions([]);}}
                                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        
                        {/* 검색 추천 목록 */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-[100] mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    상권 추천 목록
                                </div>
                                {suggestions.map((region, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectSuggestion(region)}
                                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0"
                                    >
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">{region}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {showSuggestions && suggestions.length === 0 && searchInput.trim().length > 0 && (
                            <div className="absolute z-[100] mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-4 text-center animate-in fade-in duration-200">
                                <p className="text-sm text-slate-500 font-medium">검색 결과가 없습니다.</p>
                                <p className="text-[11px] text-slate-400 mt-1">지역명을 다시 확인해 주세요.</p>
                            </div>
                        )}
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
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-center gap-2 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 ${weatherData.bgClass} rounded-xl flex items-center justify-center shrink-0`}>
                                        <span className="text-2xl">{weatherData.status.split(' ')[0]}</span>
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-slate-500 mb-0.5">상권 창업기상도</p>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{weatherData.status.split(' ')[1]}</h3>
                                    </div>
                                </div>
                                <div>
                                    <p className={`text-xs font-semibold ${weatherData.subtitleStyle}`}>{weatherData.desc}</p>
                                </div>
                            </div>
                        )}

                        {/* 2. 6개월 평균 매출 */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                                <TrendingUp className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-500 mb-0.5">6개월 평균 매출 (추정치)</p>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">{formatCurrency(avgSales)} <span className="text-[12px] font-medium text-emerald-500 ml-1">상권 유망</span></h3>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-500 mb-0.5">일평균 유동인구 (예상)</p>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">{totalPop.toLocaleString()} <span className="text-sm font-normal text-slate-400">명</span></h3>
                            </div>
                        </div>
                    </div>

                    {/* 상단 2단 레이아웃: 상권 지도 & 매출 차트 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* 상권 지도 (히트맵 시각화) */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between z-10 bg-white">
                            <div>
                                <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                                    <Map className="w-5 h-5 text-indigo-500" /> 해당 상권 지도 및 히트맵
                                </h3>
                                <p className="text-[12px] text-slate-400 mt-0.5">선택하신 '{selectedRegion}' 지역의 인구 및 매출 밀집도 시각화</p>
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
                            {/* 실제 구글 맵 연동 바탕 (PDF 생성 시에는 정적 가이드 이미지 표시) */}
                            <div className="absolute inset-0 z-0">
                                {isExporting ? (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
                                        {/* 지도 느낌이 나는 배경 패턴/이미지 (실제 API 키가 없을 때의 WOW 포인트) */}
                                        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                                        <div className="text-center z-10 px-8">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <MapPin className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-400">"{selectedRegion}" 상권 중심지</p>
                                            <p className="text-[10px] text-slate-300 mt-1">지도는 보안 정책상 브라우저 인쇄 기능을 통해 전체 출력이 가능합니다.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <iframe 
                                        title="상권 지도"
                                        width="100%" 
                                        height="100%" 
                                        style={{ border: 0 }} 
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedRegion)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                        loading="lazy"
                                    />
                                )}
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

                        {/* 1. 집중 매출 동향 분석 차트 */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full relative overflow-hidden group hover:shadow-md transition-shadow">
                            {/* 배경 장식 */}
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
                                <BarChart3 className="w-32 h-32 text-indigo-900" />
                            </div>
                            
                            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 relative z-10">
                                <div>
                                    <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-indigo-500" /> 핵심 지표: 상권 매출 추이
                                    </h3>
                                    <p className="text-[12px] text-slate-400 mt-0.5">인증 기반 최근 6개월간 성장 흐름입니다.</p>
                                </div>
                                <div className="hidden sm:block text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 font-mono">
                                    인증키: 18294d...
                                </div>
                            </div>
                            
                            {/* 요약 KPI */}
                            <div className="flex flex-col xl:flex-row items-center gap-4 mb-6 relative z-10">
                                <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl p-4 flex-1 w-full border border-slate-100">
                                    <p className="text-sm font-bold text-slate-500 mb-1">최근 월 예상 매출액</p>
                                    <p className="text-2xl font-black text-slate-800">{formatCurrency(recentSales)}</p>
                                </div>
                                <div className={`rounded-xl p-4 flex-1 w-full border bg-opacity-50 backdrop-blur-sm ${isGrowthPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                    <p className={`text-sm font-bold mb-1 ${isGrowthPositive ? 'text-emerald-600' : 'text-rose-600'}`}>전월 대비 성장률 (MoM)</p>
                                    <p className={`text-2xl font-black flex items-center gap-1.5 ${isGrowthPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {isGrowthPositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                                        {Math.abs(salesGrowth)}% {isGrowthPositive ? '상승' : '하락'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 min-h-[220px] w-full relative z-10">
                                <ResponsiveContainer width="99%" height="100%">
                                    <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis 
                                            dataKey="month" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                            tickFormatter={(val) => `${val / 10000}만`}
                                        />
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [`${(value / 10000).toLocaleString()}만원`, '월 매출']}
                                            labelStyle={{ color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="sales" 
                                            stroke="#4f46e5" 
                                            strokeWidth={4}
                                            fill="url(#colorSales)"
                                            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#4f46e5' }}
                                        />
                                    </AreaChart>
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

                        {/* 배달 상권 현황 */}
                        {deliveryData && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mt-6 flex flex-col">
                                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                                    <div>
                                        <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                                            <Bike className="w-5 h-5 text-sky-500" /> 배달 수요 및 플랫폼 점유율 현황
                                        </h3>
                                        <p className="text-[12px] text-slate-400 mt-0.5">상권 내 카페 업종의 배달 매출 비중 및 주 이용 플랫폼 분석</p>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg font-bold text-[12.5px] bg-sky-50 text-sky-700 border border-sky-100 flex items-center gap-2">
                                        <span className="relative flex h-2.5 w-2.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                                        </span>
                                        배달 매출 비중: 약 {deliveryData.ratio}%
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-center flex-1">
                                    {/* 배달 플랫폼 점유율 파이 차트 */}
                                    <div className="xl:col-span-1 h-[250px] w-full bg-slate-50/50 rounded-xl border border-slate-100 p-4 flex flex-col justify-center items-center">
                                        <h4 className="flex-shrink-0 text-xs font-bold text-slate-700 mb-2">플랫폼별 일평균 주문 점유율</h4>
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
                                                            '배달의민족': '#2dd4bf', 
                                                            '쿠팡이츠': '#3b82f6', 
                                                            '요기요': '#ef4444'  
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
                                    <div className="xl:col-span-1 space-y-3 flex flex-col justify-center">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-3">
                                            <div className="bg-sky-50 rounded-xl p-4 border border-sky-100/50">
                                                <h4 className="text-[12px] font-bold text-slate-500 mb-0.5">평균 배달팁(추정)</h4>
                                                <div className="text-xl font-black text-sky-700">{deliveryData.avgDeliveryFee.toLocaleString()}원</div>
                                            </div>
                                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100/50">
                                                <h4 className="text-[12px] font-bold text-slate-500 mb-0.5">배달 피크 타임</h4>
                                                <div className="text-lg font-black text-indigo-700">
                                                    {deliveryData.avgOrderTime === 1 ? '점심 (11-13시)' : 
                                                     deliveryData.avgOrderTime === 2 ? '오후 (14-17시)' :
                                                     deliveryData.avgOrderTime === 3 ? '저녁 (18-20시)' : '야간 (21시~)'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white/60 rounded-xl text-[12.5px] text-slate-600 border border-slate-100 leading-relaxed">
                                            <strong>💡 배달 상권 전략: </strong> 
                                            배달 비중이 <strong>{deliveryData.ratio}%</strong>로 {deliveryData.ratio > 45 ? '높은 지역' : '안정적'}입니다. 
                                            <strong>{deliveryData.platforms[0].name}</strong> 의존도가 높으므로 맞춤형 쿠폰/광고 전략이 필수적입니다.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4. 커피 프랜차이즈 업소 현황 (경쟁 분석) */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mt-6">
                        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                                    <Store className="w-5 h-5 text-indigo-500" /> 카페 업종 현황 및 변동 추이 (경쟁 밀집도)
                                </h3>
                                <p className="text-[12px] text-slate-400 mt-0.5">최근 6개월간 해당 상권 내 커피전문점(프랜차이즈/개인)의 점포 변동 추이입니다.</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                            {/* 요약 카드 (복구됨) */}
                            <div className="lg:col-span-1 space-y-3">
                                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
                                    <h4 className="text-[11px] font-bold text-slate-500 mb-1">상권 내 총 점포 수</h4>
                                    <div className="text-2xl font-black text-indigo-700">{storeSumData.total}개</div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                                    <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/50">
                                        <h4 className="text-[11px] font-bold text-slate-500 mb-0.5 flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5 text-emerald-500"/> 누적 개업</h4>
                                        <div className="text-lg font-bold text-emerald-600">+{storeSumData.open}건</div>
                                    </div>
                                    <div className="bg-rose-50/50 rounded-xl p-3.5 border border-rose-100/50">
                                        <h4 className="text-[11px] font-bold text-slate-500 mb-0.5 flex items-center gap-1"><TrendingDown className="w-2.5 h-2.5 text-rose-500"/> 누적 폐업</h4>
                                        <div className="text-lg font-bold text-rose-600">-{storeSumData.close}건</div>
                                    </div>
                                </div>
                                <div className="mt-3 p-3.5 bg-slate-50/60 rounded-xl text-[12px] text-slate-600 border border-slate-100 leading-tight">
                                    <strong>💡 분석: </strong> 
                                    {storeSumData.open >= storeSumData.close ? '신규 유입 확대 중' : '폐업 우세로 생존경쟁 심화'}
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
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mt-6">
                            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-indigo-500" /> 소상공인365 창업기상도 상세 분석
                                    </h3>
                                    <p className="text-[12px] text-slate-400 mt-0.5">상권 안전성을 5대 지표(성장성, 안정성, 구매력, 영업력, 과밀도)로 분석</p>
                                </div>
                                <div className={`px-3 py-1.5 rounded-lg font-bold text-[12.5px] bg-white border shadow-sm ${weatherData.subtitleStyle.replace('text-', 'border-').replace('500', '200')}`}>
                                    현재 기상: {weatherData.status}
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

                    {/* 5. SNS 분석 영역 */}
                    {snsData && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mt-6">
                            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                                        <MessageCircle className="w-5 h-5 text-pink-500" /> SNS 소셜 분석 및 트렌드
                                    </h3>
                                    <p className="text-[12px] text-slate-400 mt-0.5">SNS 분석 API 연동: 블로그, 인스타 등 버즈량 및 평판 분석</p>
                                </div>
                                <div className="text-[10px] text-slate-300 font-mono">
                                    KEY: ebf145...
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                {/* 감성 분석 파이 플롯 */}
                                <div className="lg:col-span-1 h-[280px] w-full bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col items-center justify-center">
                                    <h4 className="flex-shrink-0 text-sm font-bold text-slate-700 mb-2">언급량 감성 긍부정 비율</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={snsData.sentiment}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {snsData.sentiment.map((entry, index) => {
                                                    const colors = {'긍정': '#10b981', '중립': '#94a3b8', '부정': '#f43f5e'};
                                                    return <Cell key={`cell-${index}`} fill={colors[entry.name]} />;
                                                })}
                                            </Pie>
                                            <RechartsTooltip formatter={(value) => [value + '%', '비중']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                
                                {/* 버즈량 추이 Area 플롯 */}
                                <div className="lg:col-span-2 flex flex-col gap-4">
                                    <div className="h-[200px] w-full">
                                        <h4 className="text-sm font-bold text-slate-700 mb-2">최근 6개월 소셜 버즈량(언급) 추이</h4>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={snsData.buzzTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorBuzz" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={5} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Area type="monotone" dataKey="mentions" name="언급량(건)" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorBuzz)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* 연관 키워드 */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                        <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-1">
                                            <Hash className="w-4 h-4 text-slate-400" /> 해당 상권 카페 연관 인기 키워드
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {snsData.keywords.map((kw, idx) => (
                                                <span key={idx} className="px-3 py-1.5 bg-pink-50 text-pink-600 border border-pink-100 rounded-full text-sm font-bold shadow-sm">
                                                    #{kw}
                                                </span>
                                            ))}
                                        </div>
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
            
            {/* 간단분석 팝업 */}
            {showSimpleAnalysisPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* 팝업 헤더 */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                                    <Search className="w-5 h-5 text-sky-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 tracking-tight">소상공인 365 간단분석</h2>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowSimpleAnalysisPopup(false)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        {/* iframe 영역 */}
                        <div className="flex-1 w-full bg-slate-50 relative">
                            <iframe 
                                src="https://bigdata.sbiz.or.kr/#/openApi/simple?certKey=8fd2a7bd4e9222e020eb7dec2d264e354840e9494eab7d6b8d8a4bbbc3c02a1f" 
                                className="absolute inset-0 w-full h-full border-0" 
                                title="소상공인 365 간단분석"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CommercialDashboard;
