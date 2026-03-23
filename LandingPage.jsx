import React, { useMemo } from 'react';
import {
    ArrowRight, Users, BarChart3,
    CheckCircle2, Calendar, Zap, Shield, ChevronRight,
    Building2, Coffee, Briefcase
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
        @keyframes pulse-ring {
            0% { transform: scale(0.9); opacity: 0.8; }
            70% { transform: scale(1.1); opacity: 0; }
            100% { transform: scale(0.9); opacity: 0; }
        }

        .float-1 { animation: float 6s ease-in-out infinite; }
        .float-2 { animation: floatReverse 8s ease-in-out infinite 1s; }
        .float-3 { animation: float 7s ease-in-out infinite 2.5s; }

        .fade-in-up    { animation: fadeInUp 0.7s ease both; }
        .fade-in-up-d1 { animation: fadeInUp 0.7s ease 0.15s both; }
        .fade-in-up-d2 { animation: fadeInUp 0.7s ease 0.3s both; }
        .fade-in-up-d3 { animation: fadeInUp 0.7s ease 0.45s both; }
        .slide-in-right { animation: slideInRight 0.7s ease 0.2s both; }

        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 60px rgba(0,0,0,0.12); }

        .accent-glow { box-shadow: 0 0 40px var(--accent-glow), 0 0 80px var(--accent-glow-light); }
        .pulse-ring::before {
            content: '';
            position: absolute;
            inset: -8px;
            border-radius: inherit;
            border: 2px solid var(--accent-color);
            animation: pulse-ring 2s ease-out infinite;
        }
    `}</style>
);

// ────────────────────────────────────────────────────────────
// 회사 설정 로직 - 이메일 도메인 기반으로 회사 테마/정보 결정
// ────────────────────────────────────────────────────────────
const getCompanyConfig = (user) => {
    const email = user?.email || '';
    const domain = user?.forcedDomain || email.split('@')[1] || '';

    if (domain === 'composecoffee.co.kr') {
        return {
            name: '컴포즈커피',
            nameEn: 'COMPOSE COFFEE',
            greeting: '컴포즈커피 임직원 여러분, 환영합니다.',
            description: '매주 진행되는 주간 회의를 통해 우리의 목표를 점검하고\n더 나은 서비스를 만들어갑니다.',
            accentColor: '#FEE500',
            accentColorRgb: '254, 229, 0',
            bgColor: '#1A1A1A',
            textOnAccent: '#1A1A1A',
            icon: 'coffee',
            teams: [
                { name: '재무팀', emoji: '💰', desc: '예산 계획 및 회계 관리' },
                { name: '재무기획팀', emoji: '📈', desc: '재무 전략 및 분석' },
                { name: '인사총무팀', emoji: '👥', desc: '인재 관리 & 조직 운영' },
                { name: '법무팀', emoji: '⚖️', desc: '법무 검토 및 계약 관리' },
                { name: 'IT지원팀', emoji: '💻', desc: '시스템 운영 및 기술 지원' },
                { name: '조직혁신팀', emoji: '🎯', desc: '조직 문화 혁신 및 개선' },
            ],
            teamsTitle: '경영지원본부',
            teamsSubtitle: '6개 팀이 함께 만드는 더 나은 컴포즈커피',
        };
    }

    if (domain === 'casagrande.co.kr') {
        return {
            name: '까사그랑데 센트로',
            nameEn: 'CASA GRANDE CENTRO',
            greeting: '까사그랑데 센트로 임직원 여러분, 환영합니다.',
            description: '가장 찬란한 순간을 만드는 까사그랑데 센트로,\n우리의 정성이 고객의 평생 기억이 됩니다.',
            accentColor: '#D4AF37', // Champagne Gold
            accentColorRgb: '212, 175, 55',
            bgColor: '#1A1C23', // Elegant dark/charcoal background
            textOnAccent: '#1A1A1A',
            icon: 'building', 
            teams: [
                { name: '예약실', emoji: '💝', desc: '웨딩 상담 및 계약 진행' },
                { name: '연회부', emoji: '🍽️', desc: '최상의 다이닝 서비스 제공' },
                { name: '조리부', emoji: '👨‍🍳', desc: '프리미엄 뷔페 메뉴 조리' },
                { name: '진행팀', emoji: '✨', desc: '완벽한 예식 기획 및 연출' },
                { name: '시설관리팀', emoji: '⚙️', desc: '쾌적한 환경 및 안전 관리' },
                { name: '경영지원팀', emoji: '💼', desc: '인사/총무 및 전사 지원' },
            ],
            teamsTitle: '까사그랑데 부서',
            teamsSubtitle: '완벽한 웨딩을 완성하는 최고 전문가들',
            bgImageUrl: '/casagrande-bg.jpg', // 변경: 까사그랑데 메인 이미지 연동
        };
    }

    // 기타 회사 (도메인별로 추가 가능)
    const companyName = domain ? domain.split('.')[0].toUpperCase() : '우리 회사';
    return {
        name: companyName,
        nameEn: companyName,
        greeting: `${companyName} 임직원 여러분, 환영합니다.`,
        description: '매주 진행되는 주간 회의를 통해 우리의 목표를 점검하고\n팀의 성과를 함께 만들어갑니다.',
        accentColor: '#6366f1',
        accentColorRgb: '99, 102, 241',
        bgColor: '#0f172a',
        textOnAccent: '#ffffff',
        icon: 'building',
        teams: [
            { name: '영업팀', emoji: '🤝', desc: '고객 관계 및 매출 관리' },
            { name: '마케팅팀', emoji: '📣', desc: '브랜드 전략 및 홍보' },
            { name: '개발팀', emoji: '💻', desc: '제품 개발 및 기술 혁신' },
            { name: '인사팀', emoji: '👥', desc: '인재 채용 및 조직 문화' },
            { name: '재무팀', emoji: '💰', desc: '예산 관리 및 회계' },
            { name: '운영팀', emoji: '⚙️', desc: '비즈니스 운영 및 지원' },
        ],
        teamsTitle: '팀 구성',
        teamsSubtitle: '함께 성장하는 팀들',
    };
};

// ────────────────────────────────────────────────────────────
// 히어로 섹션 (회사별 테마 적용)
// ────────────────────────────────────────────────────────────
const Hero = ({ onEnter, config, user }) => {
    const firstName = user?.email?.split('@')[0] || '';
    const isCompose = config.icon === 'coffee';

    return (
        <section
            className="min-h-screen relative overflow-hidden flex items-center"
            style={{ background: config.bgColor }}
        >
            {/* 배경 이미지 연동 (존재할 경우) */}
            {config.bgImageUrl && (
                <>
                    <div 
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transition-opacity duration-1000"
                        style={{ backgroundImage: `url('${config.bgImageUrl}')`, opacity: 0.5 }}
                    />
                    <div 
                        className="absolute inset-0 z-0"
                        style={{ background: `linear-gradient(to right, ${config.bgColor} 20%, transparent 80%), linear-gradient(to top, ${config.bgColor} 5%, transparent 40%)` }}
                    />
                </>
            )}

            {/* 배경 글로우 */}
            <div
                className="absolute top-20 right-10 w-96 h-96 rounded-full blur-3xl pointer-events-none z-0"
                style={{ background: `rgba(${config.accentColorRgb}, 0.1)` }}
            />
            <div
                className="absolute bottom-20 left-10 w-72 h-72 rounded-full blur-2xl pointer-events-none z-0"
                style={{ background: `rgba(${config.accentColorRgb}, 0.05)` }}
            />

            {/* 플로팅 장식 */}
            <div className="absolute top-24 right-[15%] float-1 pointer-events-none z-0">
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: `rgba(${config.accentColorRgb}, 0.2)`, backdropFilter: 'blur(10px)' }}
                >
                    {isCompose
                        ? <Coffee size={28} style={{ color: config.accentColor }} />
                        : <Building2 size={28} style={{ color: config.accentColor }} />
                    }
                </div>
            </div>
            <div className="absolute top-56 right-[8%] float-2 pointer-events-none z-0">
                <div
                    className="w-10 h-10 rounded-full"
                    style={{ background: `rgba(${config.accentColorRgb}, 0.25)`, backdropFilter: 'blur(5px)' }}
                />
            </div>
            <div className="absolute bottom-36 right-[22%] float-3 pointer-events-none z-0">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm" />
            </div>

            <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-16 items-center w-full relative z-10">
                {/* 좌측 텍스트 */}
                <div className="space-y-8">
                    {/* 회사 배지 */}
                    <div className="fade-in-up">
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6"
                            style={{
                                background: `rgba(${config.accentColorRgb}, 0.15)`,
                                border: `1px solid rgba(${config.accentColorRgb}, 0.3)`,
                                color: config.accentColor
                            }}
                        >
                            {isCompose ? <Coffee size={14} /> : <Building2 size={14} />}
                            {config.nameEn}
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tighter text-white">
                            Weekly<br />
                            <span style={{ color: config.accentColor }}>Sync-up</span>
                        </h1>

                        <p className="text-lg mt-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                            {config.greeting}
                        </p>
                        <p className="text-base mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {config.description}
                        </p>
                    </div>

                    {/* 유저 환영 메시지 */}
                    <div className="fade-in-up-d1">
                        <div
                            className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderColor: 'rgba(255,255,255,0.1)'
                            }}
                        >
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                                style={{ background: config.accentColor, color: config.textOnAccent }}
                            >
                                {firstName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white/70 text-sm">
                                <span className="text-white font-bold">{firstName}</span>님, 환영합니다!
                            </span>
                        </div>
                    </div>

                    <div className="fade-in-up-d2">
                        <button
                            onClick={onEnter}
                            className="group px-10 py-4 rounded-full font-black text-base shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            style={{
                                background: config.accentColor,
                                color: config.textOnAccent,
                            }}
                        >
                            회의 입장하기
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="fade-in-up-d3 flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <Shield size={15} />
                        <span>허가된 임직원만 접근 가능한 전용 시스템입니다</span>
                    </div>
                </div>

                {/* 우측 카드 시각화 */}
                <div className="slide-in-right relative hidden md:flex items-center justify-center">
                    <div
                        className="relative w-full max-w-sm"
                        style={{
                            '--accent-color': config.accentColor,
                            '--accent-glow': `rgba(${config.accentColorRgb}, 0.4)`,
                            '--accent-glow-light': `rgba(${config.accentColorRgb}, 0.15)`,
                        }}
                    >
                        {/* 메인 카드 */}
                        <div
                            className="rounded-3xl p-8 shadow-2xl accent-glow relative"
                            style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)' }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm"
                                    style={{ background: config.accentColor, color: config.textOnAccent }}
                                >
                                    W
                                </div>
                                <div>
                                    <div className="font-bold text-white text-sm">Weekly Sync-up</div>
                                    <div className="text-white/40 text-xs">{config.name} 경영지원</div>
                                </div>
                                <div
                                    className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold"
                                    style={{ background: `rgba(${config.accentColorRgb}, 0.2)`, color: config.accentColor }}
                                >
                                    LIVE
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                {[
                                    { label: '주간회의록', value: '12건', icon: '📋' },
                                    { label: '진행 업무', value: '8건', icon: '⚡' },
                                    { label: 'KPI 달성률', value: '92%', icon: '📊' },
                                ].map(item => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between p-3 rounded-xl"
                                        style={{ background: 'rgba(255,255,255,0.05)' }}
                                    >
                                        <div className="flex items-center gap-2 text-white/70 text-sm">
                                            <span>{item.icon}</span>
                                            <span>{item.label}</span>
                                        </div>
                                        <span className="font-bold text-white text-sm">{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div
                                className="text-center py-3 rounded-2xl font-bold text-sm"
                                style={{ background: config.accentColor, color: config.textOnAccent }}
                            >
                                이번 주 회의 준비 완료 ✓
                            </div>
                        </div>

                        {/* 플로팅 배지 */}
                        <div
                            className="absolute -bottom-5 -left-5 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2"
                            style={{ background: config.bgColor, border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <CheckCircle2 size={16} style={{ color: config.accentColor }} />
                            <span className="text-sm font-bold text-white">{config.nameEn}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// ────────────────────────────────────────────────────────────
// 기능 카드 섹션
// ────────────────────────────────────────────────────────────
const Features = ({ config }) => {
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
            desc: '최신 업계 뉴스와 트렌드를 실시간으로 모니터링하여 전략 수립을 지원합니다.',
            color: '',
            tag: '인사이트',
            accentBg: true,
        },
    ];

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
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                        style={{
                            background: `rgba(${config.accentColorRgb}, 0.15)`,
                            border: `1px solid rgba(${config.accentColorRgb}, 0.3)`
                        }}
                    >
                        <Zap size={14} style={{ color: config.bgColor }} />
                        <span className="font-bold text-sm" style={{ color: config.bgColor }}>주요 기능</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter">
                        모든 것이 한 곳에
                    </h2>
                    <p className="text-gray-500 mt-4 text-lg max-w-lg mx-auto">
                        주간회의부터 KPI까지, 모든 업무를 하나의 플랫폼에서 관리하세요.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map(({ icon, title, desc, color, tag, accentBg }) => (
                        <div key={title} className="card-hover bg-white rounded-2xl p-7 border border-gray-100 group cursor-default">
                            <div className="flex items-start justify-between mb-5">
                                <div
                                    className={`${accentBg ? '' : color} p-3.5 rounded-2xl shadow-md`}
                                    style={accentBg ? { background: config.accentColor } : {}}
                                >
                                    {getIcon(icon, 22, accentBg ? (config.textOnAccent === '#1A1A1A' ? 'text-[#1A1A1A]' : 'text-white') : 'text-white')}
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
// 팀 소개 섹션 (회사별 팀 목록)
// ────────────────────────────────────────────────────────────
const Teams = ({ config }) => (
    <section id="teams" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                    style={{
                        background: `rgba(${config.accentColorRgb}, 0.15)`,
                        border: `1px solid rgba(${config.accentColorRgb}, 0.3)`
                    }}
                >
                    <Users size={14} style={{ color: config.bgColor }} />
                    <span className="font-bold text-sm" style={{ color: config.bgColor }}>참여 팀</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter">
                    {config.teamsTitle} <span style={{ color: config.accentColor === '#FEE500' ? '#1A1A1A' : config.accentColor }}>{config.teams.length}개 팀</span>
                </h2>
                <p className="text-gray-500 mt-4 text-lg">{config.teamsSubtitle}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-5">
                {config.teams.map(({ name, emoji, desc }) => (
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

// ────────────────────────────────────────────────────────────
// 푸터 (회사별)
// ────────────────────────────────────────────────────────────
const Footer = ({ config }) => (
    <footer className="py-10" style={{ background: config.bgColor }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div
                    className="p-1.5 rounded-full"
                    style={{ background: config.accentColor }}
                >
                    {config.icon === 'coffee'
                        ? <Coffee size={16} style={{ color: config.textOnAccent }} />
                        : <Building2 size={16} style={{ color: config.textOnAccent }} />
                    }
                </div>
                <span className="font-black text-white text-sm tracking-tighter">{config.nameEn}</span>
            </div>
            <p className="text-gray-600 text-xs text-center">
                © 2026 {config.name} 내부 시스템 — 임직원 전용
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
export default function LandingPage({ onEnter, user }) {
    const config = useMemo(() => getCompanyConfig(user), [user]);

    return (
        <div className="landing-root">
            <GlobalStyles />
            <Hero onEnter={onEnter} config={config} user={user} />
            <Features config={config} />
            <Teams config={config} />
            <Footer config={config} />
        </div>
    );
}
