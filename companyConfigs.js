import { 
    Coffee, TrendingUp, Scale, Newspaper, 
    Building2, Search, BookOpen, Utensils, 
    DollarSign, ShoppingBag, Code, Users, 
    RotateCcw, Archive, Layout, Target, Briefcase
} from 'lucide-react';

export const COMPANY_CONFIGS = {
    'composecoffee.co.kr': {
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
        baseDepts: ["선택", "재무팀", "재무기획팀", "인사총무팀", "법무팀", "IT지원팀", "조직혁신팀"],
        teamOrder: ["재무팀", "재무기획팀", "인사총무팀", "법무팀", "IT지원팀", "조직혁신팀"],
        feedbackTeams: [
            { id: 'finance', label: '재무팀' },
            { id: 'finance_plan', label: '재무기획팀' },
            { id: 'hr', label: '인사총무팀' },
            { id: 'legal', label: '법무팀' },
            { id: 'it', label: 'IT지원팀' },
            { id: 'org_innovation', label: '조직혁신팀' }
        ],
        departmentsMeta: [
            { id: 'finance_team', name: '재무팀', icon: 'dollar' },
            { id: 'finance_plan', name: '재무기획팀', icon: 'dollar' },
            { id: 'hr_ga', name: '인사총무팀', icon: 'users' },
            { id: 'legal_team', name: '법무팀', icon: 'legal' },
            { id: 'it_support', name: 'IT지원팀', icon: 'monitor' },
            { id: 'org_innovation', name: '조직혁신팀', icon: 'target' }
        ],
        newsCategories: [
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
        ],
        lunchTitle: "컴포즈 미식회",
        lunchSamples: [
            { name: '소문난성수감자탕', category: 'korean', rating: '4.6', comment: '백종원 3대천왕 맛집, 웨이팅 필수', url: 'https://map.naver.com/p/search/성수%20소문난감자탕' },
            { name: '할머니의 레시피', category: 'korean', rating: '4.3', comment: '속 편한 가정식 백반, 쌈밥 정식 추천', url: 'https://map.naver.com/p/search/성수%20할머니의레시피' },
            { name: '성수다락', category: 'western', rating: '4.5', comment: '오므라이스랑 파스타가 예쁜 곳', url: 'https://map.naver.com/p/search/성수다락' },
            { name: '대림국수 성수점', category: 'japanese', rating: '4.4', comment: '꼬치국수 온면이 진리', url: 'https://map.naver.com/p/search/성수%20대림국수' },
            { name: '중앙감속기', category: 'chinese', rating: '4.7', comment: '최현석 셰프의 퓨전 중식, 발사믹 꿔바로우', url: 'https://map.naver.com/p/search/성수%20중앙감속기' },
            { name: '다로베', category: 'western', rating: '4.4', comment: '화덕피자 대회 1등, 비스마르크 피자 추천', url: 'https://map.naver.com/p/search/성수%20다로베' },
            { name: '탐광', category: 'japanese', rating: '4.3', comment: '에비카츠동(새우튀김) 비주얼 끝판왕', url: 'https://map.naver.com/p/search/성수%20탐광' },
            { name: '칙피스', category: 'western', rating: '4.6', comment: '비건/다이어트 샐러드 맛집', url: 'https://map.naver.com/p/search/성수%20칙피스' },
            { name: '어니언 성수', category: 'cafe', rating: '4.6', comment: '공장 개조 카페, 팡도르 필수', url: 'https://map.naver.com/p/search/성수%20어니언' },
            { name: '대림창고', category: 'cafe', rating: '4.5', comment: '성수동 랜드마크, 갤러리 같은 분위기', url: 'https://map.naver.com/p/search/성수%20대림창고' }
        ]
    },
    'casagrande.co.kr': {
        name: '까사그랑데 센트로',
        nameEn: 'CASA GRANDE CENTRO',
        greeting: '까사그랑데 센트로 임직원 여러분, 환영합니다.',
        description: '가장 찬란한 순간을 만드는 까사그랑데 센트로,\n우리의 정성이 고객의 평생 기억이 됩니다.',
        accentColor: '#D4AF37',
        accentColorRgb: '212, 175, 55',
        bgColor: '#1A1C23',
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
        bgImageUrl: '/casagrande-bg.jpg',
        baseDepts: ["선택", "경영지원팀", "예약실", "연회부", "조리부", "진행팀", "시설관리팀"],
        teamOrder: ["경영지원팀", "예약실", "연회부", "조리부", "진행팀", "시설관리팀"],
        feedbackTeams: [
            { id: 'management', label: '경영지원팀' },
            { id: 'reservation', label: '예약실' },
            { id: 'banquet', label: '연회부' },
            { id: 'kitchen', label: '조리부' },
            { id: 'operation', label: '진행팀' },
            { id: 'facility', label: '시설관리팀' }
        ],
        departmentsMeta: [
            { id: 'management', name: '경영지원팀', icon: 'monitor' },
            { id: 'reservation', name: '예약실', icon: 'users' },
            { id: 'banquet', name: '연회부', icon: 'bag' },
            { id: 'kitchen', name: '조리부', icon: 'dollar' },
            { id: 'operation', name: '진행팀', icon: 'target' },
            { id: 'facility', name: '시설관리팀', icon: 'legal' }
        ],
        newsCategories: [
            {
                id: 'casagrande',
                label: '까사그랑데 센트로',
                icon: Building2,
                color: 'amber',
                query: '까사그랑데 센트로 웨딩',
                description: '까사그랑데 센트로 최신 소식 및 웨딩 특화 정보',
                keywords: ['건대 웨딩홀', '프리미엄 웨딩', '하우스웨딩', '호텔웨딩'],
                quickLinks: [
                    { label: '최신 리뷰', query: '까사그랑데 센트로 후기' },
                    { label: '웨딩 박람회', query: '서울 웨딩 박람회 일정' },
                    { label: '예식 트렌드', query: '프리미엄 하우스 웨딩 트렌드' },
                ],
            },
            {
                id: 'wedding_hall',
                label: '웨딩홀 동향',
                icon: TrendingUp,
                color: 'violet',
                query: '웨딩홀 산업 동향 현황',
                description: '국내 웨딩홀 및 예식장 산업 동향',
                keywords: ['웨딩홀', '예식장', '결혼식장', '스몰웨딩'],
                quickLinks: [
                    { label: '호텔 웨딩', query: '특급 호텔 웨딩 트렌드' },
                    { label: '하우스 웨딩', query: '하우스 웨딩 공간 추천' },
                    { label: '야외 예식', query: '야외 웨딩 공간 연출' },
                ],
            },
            {
                id: 'wedding_catering',
                label: '연회/뷔페 트렌드',
                icon: Search,
                color: 'emerald',
                query: '웨딩홀 뷔페 연회장 트렌드',
                description: '웨딩 연회장 및 파인다이닝 식품 동향',
                keywords: ['웨딩 뷔페', '코스 요리', '파인다이닝', '연회장'],
                quickLinks: [
                    { label: '호텔 뷔페', query: '특급호텔 웨딩 뷔페 신메뉴' },
                    { label: '케이터링', query: '프리미엄 웨딩 케이터링' },
                    { label: '식자재', query: '최고급 식자재 유통 트렌드' },
                ],
            },
            {
                id: 'wedding_market',
                label: '결혼 시장 동향',
                icon: Scale, 
                color: 'blue',
                query: '결혼 통계 정책 신혼부부',
                description: '혼인율, 웨딩산업 인구구조 변화 및 정책',
                keywords: ['혼인 통계', '신혼부부', '웨딩 산업', '결혼 정책'],
                quickLinks: [
                    { label: '혼인율 통계', query: '통계청 혼인 건수 동향' },
                    { label: '신혼 정책', query: '신혼부부 주거 지원 특공' },
                    { label: '웨딩 지원', query: '지자체 결혼 친화 정책' },
                ],
            },
        ],
        lunchTitle: "까사 미식회",
        lunchSamples: [
            { name: '송화산시도삭면', category: 'korean', rating: '4.7', comment: '줄 서서 먹는 도삭면과 딤섬 맛집', url: 'https://map.naver.com/p/search/건대%20송화산시도삭면' },
            { name: '매화반점', category: 'chinese', rating: '4.5', comment: '건대 양꼬치 거리의 원조격 맛집', url: 'https://map.naver.com/p/search/건대%20매화반점' },
            { name: '호야초밥', category: 'japanese', rating: '4.6', comment: '가성비와 퀄리티 다 잡은 건대 대표 초밥', url: 'https://map.naver.com/p/search/건대%20호야초밥' },
            { name: '해룡마라소룡포', category: 'chinese', rating: '4.6', comment: '마라룽샤와 꿔바로우가 예술인 곳', url: 'https://map.naver.com/p/search/건대%20해룡마라소룡포' },
            { name: '벨피아또', category: 'western', rating: '4.4', comment: '분위기 좋은 건대 스타시티 이탈리안', url: 'https://map.naver.com/p/search/건대%20벨피아또' },
            { name: '시게오', category: 'japanese', rating: '4.5', comment: '조용하고 정갈한 일본식 덮밥 전문점', url: 'https://map.naver.com/p/search/건대%20시게오' },
            { name: '최가커피', category: 'cafe', rating: '4.7', comment: '핸드드립과 비엔나 커피가 맛있는 전통의 카페', url: 'https://map.naver.com/p/search/건대%20최가커피' },
            { name: '개미집', category: 'korean', rating: '4.3', comment: '매콤한 불낙볶음이 맛있는 건대 노포', url: 'https://map.naver.com/p/search/건대%20개미집' },
            { name: '마초쉐프 건대점', category: 'western', rating: '4.5', comment: '불쇼 보며 즐기는 스테이크와 화덕피자', url: 'https://map.naver.com/p/search/건대%20마초쉐프' },
            { name: '카페 기글', category: 'cafe', rating: '4.6', comment: '성수동 감성 담은 예쁜 디저트 카페', url: 'https://map.naver.com/p/search/건대%20카페기글' }
        ]
    }
};

export const DEFAULT_COMPANY_CONFIG = {
    name: '우리 회사',
    nameEn: 'OUR COMPANY',
    greeting: '우리 회사 임직원 여러분, 환영합니다.',
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
    baseDepts: ["선택", "팀1", "팀2"],
    teamOrder: ["팀1", "팀2"],
    feedbackTeams: [],
    departmentsMeta: [],
    newsCategories: [],
    lunchTitle: "우리 회사 미식회",
    lunchSamples: []
};

export const getCompanyDomain = (userOrEmail) => {
    if (!userOrEmail) return 'composecoffee.co.kr';
    
    let email = '';
    let forcedDomain = null;
    
    if (typeof userOrEmail === 'string') {
        email = userOrEmail;
    } else {
        email = userOrEmail.email || '';
        forcedDomain = userOrEmail.forcedDomain || null;
    }
    
    if (forcedDomain) return forcedDomain;
    
    // 특수 계정 매핑
    if (email === 'wedding_life@naver.com') return 'casagrande.co.kr';
    
    const domain = email.split('@')[1];
    
    // 기본값 처리
    if (!domain || domain === 'naver.com' || domain === 'gmail.com') {
        // 만약 특정 이메일이 아닌데 대중적인 포털 메일이라면 기본값(컴포즈)으로 처리하거나 
        // 혹은 별도의 로직 필요. 여기서는 기존 로직 유지 위해 컴포즈커피 반환
        return 'composecoffee.co.kr';
    }
    
    return domain;
};

export const getCompanyConfig = (user) => {
    const domain = getCompanyDomain(user);
    return COMPANY_CONFIGS[domain] || DEFAULT_COMPANY_CONFIG;
};
