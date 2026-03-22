import React, { useState, useEffect } from 'react';
import { getCollectionName } from './utils';
import {
    Utensils, MapPin, Star, Coffee, Plus, Search, Dices, X, ExternalLink,
    ThumbsUp, MessageCircle, Zap, Trash2
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';

const CATEGORIES = [
    { id: 'all', label: '전체', icon: Utensils },
    { id: 'korean', label: '한식', icon: Utensils },
    { id: 'chinese', label: '중식', icon: Utensils },
    { id: 'japanese', label: '일식', icon: Utensils },
    { id: 'western', label: '양식', icon: Utensils },
    { id: 'cafe', label: '카페', icon: Coffee }
];

const RATINGS = [5, 4.5, 4, 3.5, 3, 2, 1];

const LunchDashboard = ({ db, user }) => {
    const isCg = user?.email?.endsWith("@casagrande.co.kr");
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);

    // Random Pick State
    const [randomResult, setRandomResult] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Form State
    const [newRestaurant, setNewRestaurant] = useState({
        name: '',
        category: 'korean',
        rating: '5',
        comment: '',
        url: ''
    });

    useEffect(() => {
        const q = query(collection(db, getCollectionName('office_restaurants', user)), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRestaurants(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            await addDoc(collection(db, getCollectionName('office_restaurants', user)), {
                ...newRestaurant,
                rating: Number(newRestaurant.rating),
                createdAt: serverTimestamp()
            });
            setIsAddModalOpen(false);
            setNewRestaurant({
                name: '',
                category: 'korean',
                rating: '5',
                comment: '',
                url: ''
            });
            alert('맛집이 등록되었습니다!');
        } catch (error) {
            console.error("Error adding restaurant: ", error);
            alert('등록 중 오류가 발생했습니다.');
        }
    };

    const handleRandomPick = () => {
        const candidates = filter === 'all'
            ? restaurants
            : restaurants.filter(r => r.category === filter);

        if (candidates.length === 0) {
            alert('추천할 맛집 데이터가 없습니다.');
            return;
        }

        setIsRandomModalOpen(true);
        setIsAnimating(true);
        setRandomResult(null);

        // Animation logic
        let count = 0;
        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * candidates.length);
            setRandomResult(candidates[randomIndex]);
            count++;
            if (count > 20) { // Approx 2-3 seconds
                clearInterval(interval);
                setIsAnimating(false);
            }
        }, 100);
    };

    const handleAutoFill = async () => {

    const isCg = user?.email?.endsWith('@casagrande.co.kr');
    
    const COMPOSE_SAMPLES = [
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
    ];

    const CG_SAMPLES = [
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
    ];

    const sampleData = isCg ? CG_SAMPLES : COMPOSE_SAMPLES;

        if (!window.confirm('가상의 맛집 데이터 10개를 자동으로 추가하시겠습니까?')) return;

        

        try {
            for (const data of sampleData) {
                await addDoc(collection(db, getCollectionName('office_restaurants', user)), {
                    ...data,
                    rating: Number(data.rating),
                    createdAt: serverTimestamp()
                });
            }
            alert('샘플 데이터 10개가 추가되었습니다!');
        } catch (error) {
            console.error("Error adding sample data: ", error);
            alert('데이터 추가 중 오류가 발생했습니다.');
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('모든 맛집 데이터를 삭제하시겠습니까? \n이 작업은 되돌릴 수 없습니다.')) return;

        try {
            const querySnapshot = await getDocs(collection(db, getCollectionName('office_restaurants', user)));
            const deletePromises = querySnapshot.docs.map(document =>
                deleteDoc(doc(db, getCollectionName('office_restaurants', user), document.id))
            );
            await Promise.all(deletePromises);
            alert('초기화 완료! 다시 자동 채우기를 해주세요.');
        } catch (error) {
            console.error("Error clearing data: ", error);
            alert('데이터 삭제 중 오류가 발생했습니다.');
        }
    };

    const getCategoryLabel = (catId) => CATEGORIES.find(c => c.id === catId)?.label || catId;

    const filteredRestaurants = filter === 'all'
        ? restaurants
        : restaurants.filter(r => r.category === filter);

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-5 fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Utensils className="w-8 h-8 text-orange-500" /> {isCg ? "까사 미식회" : "컴포즈 미식회"}
                    </h2>
                    <p className="text-slate-500 mt-1">오늘 점심 뭐 먹지? 직원들이 직접 추천하는 찐맛집 컬렉션</p>
                </div>
                <div className="flex gap-3">
                    {/* Bulk Insert Button - Only visible when empty */}
                    {restaurants.length === 0 && (
                        <button
                            onClick={handleAutoFill}
                            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-bold shadow-md hover:bg-green-700 transition-all animate-pulse"
                        >
                            <Zap className="w-5 h-5" />
                            리스트 자동 채우기
                        </button>
                    )}
                    <button
                        onClick={handleClearAll}
                        className="flex items-center gap-2 px-3 py-2.5 bg-red-500 text-white rounded-lg font-bold shadow-md hover:bg-red-600 transition-all"
                        title="리스트 초기화"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleRandomPick}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg font-bold shadow-md hover:shadow-lg hover:brightness-110 transition-all"
                    >
                        <Dices className="w-5 h-5" />
                        오늘 뭐 먹지?
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg font-bold shadow-md hover:bg-slate-700 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        맛집 등록
                    </button>
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${filter === cat.id
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-500'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Restaurant Grid */}
            {loading ? (
                <div className="text-center py-20">
                    <p className="text-slate-400">맛집 정보를 불러오는 중입니다...</p>
                </div>
            ) : filteredRestaurants.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">등록된 맛집이 없습니다. 첫 번째 추천인이 되어주세요!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredRestaurants.map(restaurant => (
                        <div key={restaurant.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${restaurant.category === 'cafe' ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {getCategoryLabel(restaurant.category)}
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                                        <Star className="w-4 h-4 fill-amber-500" />
                                        {restaurant.rating}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2 truncate">{restaurant.name}</h3>
                                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-4 min-h-[60px]">
                                    "{restaurant.comment}"
                                </div>
                                <div className="flex items-center justify-end pt-3 border-t border-slate-100 text-xs">
                                    {restaurant.url && (
                                        <a
                                            href={restaurant.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-slate-500 hover:text-blue-600 font-medium transition-colors"
                                        >
                                            <MapPin className="w-3.5 h-3.5" />
                                            지도 보기
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Restaurant Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Plus className="w-5 h-5" /> 맛집 등록
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">상호명</label>
                                <input
                                    required
                                    value={newRestaurant.name}
                                    onChange={e => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                    placeholder="예: 맛있는 국밥집"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">카테고리</label>
                                    <select
                                        value={newRestaurant.category}
                                        onChange={e => setNewRestaurant({ ...newRestaurant, category: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                                    >
                                        {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">별점</label>
                                    <select
                                        value={newRestaurant.rating}
                                        onChange={e => setNewRestaurant({ ...newRestaurant, rating: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                                    >
                                        {RATINGS.map(r => (
                                            <option key={r} value={r}>⭐ {r}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">한줄평</label>
                                <input
                                    required
                                    value={newRestaurant.comment}
                                    onChange={e => setNewRestaurant({ ...newRestaurant, comment: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                                    placeholder="예: 김치찌개가 정말 맛있어요!"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">지도 링크 (URL)</label>
                                <input
                                    type="url"
                                    value={newRestaurant.url}
                                    onChange={e => setNewRestaurant({ ...newRestaurant, url: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                                    placeholder="네이버/카카오맵 URL 붙여넣기"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors mt-2"
                            >
                                등록하기
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Random Pick Modal */}
            {isRandomModalOpen && randomResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setIsRandomModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-8 text-white">
                            <Dices className={`w-16 h-16 mx-auto mb-4 ${isAnimating ? 'animate-bounce' : ''}`} />
                            <h3 className="text-xl font-bold opacity-90">오늘의 추천 메뉴는?</h3>
                        </div>

                        <div className="p-8">
                            <div className={`transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                                <div className="text-3xl font-bold text-slate-800 mb-2">
                                    {randomResult.name}
                                </div>
                                <div className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-bold mb-6">
                                    {getCategoryLabel(randomResult.category)}
                                </div>
                                <div className="bg-orange-50 p-4 rounded-xl mb-6">
                                    <p className="text-orange-800 font-medium">"{randomResult.comment}"</p>
                                </div>

                                {randomResult.url && !isAnimating && (
                                    <a
                                        href={randomResult.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                                    >
                                        지도로 바로가기
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LunchDashboard;
