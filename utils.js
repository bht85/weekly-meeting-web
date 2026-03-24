import { getCompanyDomain } from './companyConfigs';

export const getCollectionName = (baseName, userOrEmail) => {
    const domain = getCompanyDomain(userOrEmail);
    
    // 컴포즈커피 및 빈 도메인 예외 처리 (기본 콜렉션 사용)
    if (!domain || domain === 'composecoffee.co.kr') {
        return baseName;
    }

    // 다른 도메인은 도메인별 콜렉션 사용 (예: weekly_minutes_casagrande_co_kr)
    const safeDomain = domain.replace(/\./g, '_');
    return `${baseName}_${safeDomain}`;
};

export const isCasagrande = (user) => {
    const domain = getCompanyDomain(user);
    return domain === 'casagrande.co.kr';
};
