export const getCollectionName = (baseName, userOrEmail) => {
    let email = '';
    let forcedDomain = null;
    
    if (typeof userOrEmail === 'string') {
        email = userOrEmail;
    } else if (userOrEmail && typeof userOrEmail === 'object') {
        email = userOrEmail.email || '';
        forcedDomain = userOrEmail.forcedDomain || null;
    }

    if (!email) return baseName;

    // 만약 객체에 강제 도메인(forcedDomain)이 지정되어 있다면 우선적으로 사용
    let domain = forcedDomain || email.split('@')[1];
    
    // [특수 계정 매핑] 도메인이 naver.com 등 외부 메일인 경우에도 특정 기업 콜렉션에 연결 (강제 도메인이 없을 때만)
    const SPECIAL_EMAILS = {
        'wedding_life@naver.com': 'casagrande.co.kr'
    };
    
    if (!forcedDomain && SPECIAL_EMAILS[email]) {
        domain = SPECIAL_EMAILS[email];
    }

    // 컴포즈커피 및 빈 도메인 예외 처리
    if (!domain || domain === 'composecoffee.co.kr') {
        return baseName;
    }

    // 다른 도메인은 도메인별 콜렉션 사용 (예: weekly_minutes_casagrande_co_kr)
    const safeDomain = domain.replace(/\./g, '_');
    return `${baseName}_${safeDomain}`;
};
