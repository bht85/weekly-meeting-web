import React from 'react';
import {
    Coffee, ArrowRight, Users, BarChart3,
    CheckCircle2, Calendar, Zap, Shield, ChevronRight
} from 'lucide-react';

const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        .landing-root { font-family: 'Outfit', 'Pretendard', sans-serif; }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-16px); }
        }
        @keyframes floatReverse {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(16px); }
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(40px); }
            to   { opacity: 1; transform: translateX(0); }
        }

        .float-1 { animation: float 6s ease-in-out infinite; }
        .float-2 { animation: floatReverse 8s ease-in-out infinite 1s; }
        .float-3 { animation: float 7s ease-in-out infinite 2.5s; }

        .fade-in-up    { animation: fadeInUp 0.7s ease both; }
        .fade-in-up-d1 { animation: fadeInUp 0.7s ease 0.15s both; }
        .fade-in-up-d2 { animation: fadeInUp 0.7s ease 0.3s both; }
        .slide-in-right { animation: slideInRight 0.7s ease 0.2s both; }

        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 60px rgba(0,0,0,0.12); }

        .yellow-glow { box-shadow: 0 0 40px rgba(254,229,0,0.4), 0 0 80px rgba(254,229,0,0.15); }
    `}</style>
);

// ────────────────────────────────────────────────────────────
// 히어로 섹션
// ────────────────────────────────────────────────────────────
const Hero = ({ onEnter }) => (
    <section className="min-h-screen bg-[#1A1A1A] relative overflow-hidden flex items-center">
        {/* 배경 글로우 */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-[#FEE500]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-[#FEE500]/5 rounded-full blur-2xl pointer-events-none" />

        {/* 플로팅 장식 */}
        <div className="absolute top-24 right-[15%] float-1 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-[#FEE500]/20 flex items-center justify-center">
                <Coffee size={28} className="text-[#FEE500]" />
            </div>
        </div>
        <div className="absolute top-56 right-[8%] float-2 pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-[#FEE500]/25" />
        </div>
        <div className="absolute bottom-36 right-[22%] float-3 pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-white/10" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-16 items-center w-full">
            {/* 좌측 텍스트 */}
            <div className="space-y-8">
                <div className="fade-in-up">
                    <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tighter text-white">
                        Weekly<br />
                        <span className="text-[#FEE500]">Sync-up</span>
                    </h1>
                    <p className="text-lg text-gray-400 max-w-md mt-6 leading-relaxed">
                        컴포즈커피 임직원 여러분, 환영합니다.<br />
                        매주 진행되는 주간 회의를 통해 우리의 목표를 점검하고
                        더 나은 서비스를 만들어갑니다.
                    </p>
                </div>

                <div className="fade-in-up-d1">
                    <button
                        onClick={onEnter}
                        className="group bg-[#FEE500] text-[#1A1A1A] px-10 py-4 rounded-full font-black text-base shadow-lg hover:shadow-[0_0_30px_rgba(254,229,0,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        회의 입장하기
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="fade-in-up-d2 flex items-center gap-2 text-gray-600 text-sm">
                    <Shield size={15} />
                    <span>허가된 임직원만 접근 가능한 전용 시스템입니다</span>
                </div>
            </div>

            {/* 우측 모델 이미지 */}
            <div className="slide-in-right relative hidden md:block">
                <div className="absolute inset-0 bg-[#FEE500] rounded-[2.5rem] translate-x-6 translate-y-6 -z-10" />
                <img
                    src="/model.png"
                    alt="컴포즈커피 모델"
                    className="rounded-[2.5rem] w-full h-[580px] object-cover shadow-2xl yellow-glow"
                />
                <div className="absolute -bottom-5 -left-5 bg-[#1A1A1A] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FEE500]" />
                    <span className="text-sm font-bold">COMPOSE COFFEE</span>
                </div>
            </div>
        </div>
    </section>
);

// ────────────────────────────────────────────────────────────
// 기능 카드 섹션
// ────────────────────────────────────────────────────────────
const Features = () => {
    const features = [
        {
            icon: 'FileText',
            title: '주간회의록',
            desc: '부서별 보고사항, 진행업무, 협의업무를 체계적으로 기록하고 지난주 내용 불러오기 기능으로 효율적으로 작성하세요.',
            color: 'bg-blue-500',
            tag: '핵심',
        },
        {
            icon: 'BarChart3',
            title: 'KPI 현황판',
            desc: '전사 공통 지표와 부서별 KPI를 분기별로 관리하고 달성률을 실시간으로 모니터링합니다.',
            color: 'bg-green-500',
            tag: '성과관리',
        },
        {
            icon: 'Users',
            title: '협업 요청',
            desc: '부서 간 협업이 필요한 업무를 쉽게 요청하고 진행 상황을 추적할 수 있습니다.',
            color: 'bg-purple-500',
            tag: '협업',
        },
        {
            icon: 'CheckCircle2',
            title: '업무 관리',
            desc: '이번 달 처리해야 할 할 일 목록을 팀원별로 관리하고 완료 현황을 한눈에 파악하세요.',
            color: 'bg-orange-500',
            tag: '생산성',
        },
        {
            icon: 'Calendar',
            title: '캘린더',
            desc: '팀 내 일정과 중요한 마감일을 공유하고 월별 뷰로 업무 흐름을 관리합니다.',
            color: 'bg-red-500',
            tag: '일정',
        },
        {
            icon: 'Zap',
            title: '업계 동향',
            desc: '카페·외식 업계의 최신 뉴스와 트렌드를 실시간으로 모니터링하여 전략 수립을 지원합니다.',
            color: 'bg-[#FEE500]',
            tag: '인사이트',
            textDark: true,
        },
    ];

    // 아이콘 컴포넌트 매핑
    const icons = { BarChart3, Users, CheckCircle2, Calendar, Zap };
    const FileTextIcon = ({ size, className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
        </svg>
    );

    const getIcon = (name, size, className) => {
        if (name === 'FileText') return <FileTextIcon size={size} className={className} />;
        const Comp = icons[name];
        return Comp ? <Comp size={size} className={className} /> : null;
    };

    return (
        <section id="features" className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-[#FEE500]/20 border border-[#FEE500]/40 px-4 py-2 rounded-full mb-4">
                        <Zap size={14} className="text-[#1A1A1A]" />
                        <span className="font-bold text-sm text-[#1A1A1A]">주요 기능</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter">
                        모든 것이 한 곳에
                    </h2>
                    <p className="text-gray-500 mt-4 text-lg max-w-lg mx-auto">
                        주간회의부터 KPI까지, 경영지원본부 업무의 모든 것을 하나의 플랫폼에서 관리하세요.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map(({ icon, title, desc, color, tag, textDark }) => (
                        <div key={title} className="card-hover bg-white rounded-2xl p-7 border border-gray-100 group cursor-default">
                            <div className="flex items-start justify-between mb-5">
                                <div className={`${color} p-3.5 rounded-2xl shadow-md`}>
                                    {getIcon(icon, 22, textDark ? 'text-[#1A1A1A]' : 'text-white')}
                                </div>
                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{tag}</span>
                            </div>
                            <h3 className="font-black text-[#1A1A1A] text-xl mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-gray-400 group-hover:text-blue-500 transition-colors">
                                더 알아보기 <ChevronRight size={14} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ────────────────────────────────────────────────────────────
// 팀 소개 섹션
// ────────────────────────────────────────────────────────────
const Teams = () => {
    const teams = [
        { name: '재무팀', emoji: '💰', desc: '예산 계획 및 회계 관리' },
        { name: '재무기획팀', emoji: '📈', desc: '재무 전략 및 분석' },
        { name: '인사총무팀', emoji: '👥', desc: '인재 관리 & 조직 운영' },
        { name: '법무팀', emoji: '⚖️', desc: '법무 검토 및 계약 관리' },
        { name: 'IT지원팀', emoji: '💻', desc: '시스템 운영 및 기술 지원' },
    ];

    return (
        <section id="teams" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-[#FEE500]/20 border border-[#FEE500]/40 px-4 py-2 rounded-full mb-4">
                        <Users size={14} className="text-[#1A1A1A]" />
                        <span className="font-bold text-sm text-[#1A1A1A]">참여 팀</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter">
                        경영지원본부 <span className="text-[#FEE500]">5개 팀</span>
                    </h2>
                    <p className="text-gray-500 mt-4 text-lg">각 팀이 함께 만드는 더 나은 컴포즈커피</p>
                </div>
                <div className="flex flex-wrap justify-center gap-5">
                    {teams.map(({ name, emoji, desc }) => (
                        <div key={name} className="card-hover bg-gray-50 border border-gray-100 rounded-2xl px-8 py-7 text-center group min-w-[160px] flex-1 max-w-[210px]">
                            <div className="text-4xl mb-3">{emoji}</div>
                            <div className="font-black text-[#1A1A1A] text-base group-hover:text-blue-600 transition-colors">{name}</div>
                            <div className="text-gray-400 text-xs mt-1.5 leading-relaxed">{desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ────────────────────────────────────────────────────────────
// 푸터
// ────────────────────────────────────────────────────────────
const Footer = () => (
    <footer className="bg-[#1A1A1A] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-[#FEE500] p-1.5 rounded-full">
                    <Coffee size={16} className="text-[#1A1A1A]" />
                </div>
                <span className="font-black text-white text-sm tracking-tighter">COMPOSE COFFEE</span>
            </div>
            <p className="text-gray-600 text-xs text-center">
                © 2026 Compose Coffee Corp. 경영지원본부 내부 시스템 — 임직원 전용
            </p>
            <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                <Shield size={13} />
                <span>Firebase 보안 인증</span>
            </div>
        </div>
    </footer>
);

// ────────────────────────────────────────────────────────────
// 메인 랜딩 페이지
// ────────────────────────────────────────────────────────────
export default function LandingPage({ onEnter }) {
    return (
        <div className="landing-root">
            <GlobalStyles />
            <Hero onEnter={onEnter} />
            <Features />
            <Teams />
            <Footer />
        </div>
    );
}
