import React, { useState, useEffect } from 'react';
import {
    collection, addDoc, query, where, onSnapshot,
    serverTimestamp, doc, updateDoc, deleteDoc, orderBy
} from 'firebase/firestore';
import {
    MessageSquare, PlusCircle, CheckCircle2, Clock,
    AlertCircle, X, Send, Calendar, User, ArrowRight,
    Filter, MoreHorizontal, FileText, Ban
} from 'lucide-react';

// Enum-like constants
const STATUS_LABELS = {
    'Pending': '대기',
    'In_Progress': '진행중',
    'Completed': '완료',
    'Rejected': '반려'
};

const STATUS_COLORS = {
    'Pending': 'bg-gray-100 text-gray-600',
    'In_Progress': 'bg-blue-100 text-blue-600',
    'Completed': 'bg-green-100 text-green-600',
    'Rejected': 'bg-red-100 text-red-600'
};

const PRIORITY_LABELS = {
    'High': '높음',
    'Medium': '보통',
    'Low': '낮음'
};

const PRIORITY_COLORS = {
    'High': 'text-red-600 bg-red-50 border-red-200',
    'Medium': 'text-amber-600 bg-amber-50 border-amber-200',
    'Low': 'text-green-600 bg-green-50 border-green-200'
};

const CollaborationDashboard = ({ db, user, departments }) => {
    const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [myTeam, setMyTeam] = useState(departments[1]); // Default to first valid team for demo if not set

    // Filter states
    const [filterStatus, setFilterStatus] = useState('All');

    // --- Real-time Data Fetching ---
    useEffect(() => {
        if (!db || !user) return;

        setLoading(true);
        // Fetch all requests related to my team (either as requester or target)
        // Note: Firestore OR queries can be tricky, so for simplicity we might fetch based on the active tab
        // or fetch all relevant docs and filter client-side if the dataset is small.
        // Given the requirements, let's try to be specific.

        let q;
        const collectionRef = collection(db, 'collaboration_requests');

        if (activeTab === 'sent') {
            // I am the requester
            // In a real app with auth, we might store 'requesterId' or 'requesterTeam'
            // effectively mapping user -> team is needed. For now we use the selected 'myTeam' dropdown or prop.
            q = query(
                collectionRef,
                where('requesterTeam', '==', myTeam)
            );
        } else {
            // I am the target
            q = query(
                collectionRef,
                where('targetTeam', '==', myTeam)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Client-side sort by createdAt desc (or use Firestore orderBy if index exists)
            docs.sort((a, b) => {
                const tA = a.updatedAt?.toMillis() || 0;
                const tB = b.updatedAt?.toMillis() || 0;
                return tB - tA;
            });
            setRequests(docs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, user, activeTab, myTeam]);

    // --- Handlers ---
    const handleCreate = async (data) => {
        try {
            await addDoc(collection(db, 'collaboration_requests'), {
                ...data,
                requesterTeam: myTeam,
                requesterId: user.uid,
                status: 'Pending',
                comments: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            setIsFormOpen(false);
            alert('요청이 등록되었습니다.');
        } catch (e) {
            console.error(e);
            alert('오류가 발생했습니다.');
        }
    };

    const handleStatusUpdate = async (reqId, newStatus) => {
        try {
            await updateDoc(doc(db, 'collaboration_requests', reqId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            // Close modal or update local state if needed (snapshot handles it)
            if (selectedRequest) {
                setSelectedRequest(prev => ({ ...prev, status: newStatus }));
            }
        } catch (e) {
            console.error(e);
            alert('상태 변경 실패');
        }
    };

    const handleAddComment = async (reqId, text) => {
        if (!text.trim()) return;
        try {
            // We can use arrayUnion, but let's just read-update for simplicity with array of objects
            if (!selectedRequest) return;

            const newComment = {
                id: Date.now().toString(),
                text,
                authorTeam: myTeam, // Simplified "User Name"
                createdAt: new Date().toISOString() // Store ISO string for simplicity in array
            };

            const updatedComments = [...(selectedRequest.comments || []), newComment];

            await updateDoc(doc(db, 'collaboration_requests', reqId), {
                comments: updatedComments,
                updatedAt: serverTimestamp()
            });

            setSelectedRequest(prev => ({ ...prev, comments: updatedComments }));
        } catch (e) {
            console.error(e);
            alert('댓글 등록 실패');
        }
    };

    const filteredRequests = requests.filter(r =>
        filterStatus === 'All' ? true : r.status === filterStatus
    );

    return (
        <div className="bg-white min-h-screen p-4 rounded-xl shadow-sm border border-gray-100">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <User className="w-6 h-6 text-indigo-600" />
                        협업 요청 (Collaboration)
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        현재 <strong>{myTeam}</strong> 기준으로 데이터를 조회합니다.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Team Selector (For Demo/MVP flexibility) */}
                    <select
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                        value={myTeam}
                        onChange={(e) => setMyTeam(e.target.value)}
                    >
                        {departments.filter(d => d !== '선택').map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    >
                        <PlusCircle className="w-4 h-4" /> 새 요청 작성
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('received')}
                    className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'received' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    받은 요청 (Received)
                    {activeTab === 'received' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'sent' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    보낸 요청 (Sent)
                    {activeTab === 'sent' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>}
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                <Filter className="w-4 h-4 text-slate-400" />
                {['All', 'Pending', 'In_Progress', 'Completed', 'Rejected'].map(st => (
                    <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${filterStatus === st
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {st === 'All' ? '전체' : STATUS_LABELS[st]}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="py-20 text-center text-slate-400">로딩 중...</div>
            ) : filteredRequests.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                    <p className="text-slate-500">요청 내역이 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredRequests.map(req => (
                        <div
                            key={req.id}
                            onClick={() => setSelectedRequest(req)}
                            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${PRIORITY_COLORS[req.priority]}`}>
                                        {PRIORITY_LABELS[req.priority]}
                                    </span>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${STATUS_COLORS[req.status]}`}>
                                        {STATUS_LABELS[req.status]}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {req.dueDate} 마감
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                                {req.title}
                            </h3>

                            <div className="flex items-center justify-between mt-4 border-t border-slate-50 pt-3">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">
                                        {activeTab === 'received' ? `From. ${req.requesterTeam}` : `To. ${req.targetTeam}`}
                                    </span>
                                    {req.comments?.length > 0 && (
                                        <span className="flex items-center gap-1 text-slate-400">
                                            <MessageSquare className="w-3 h-3" /> {req.comments.length}
                                        </span>
                                    )}
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            {isFormOpen && (
                <RequestFormModal
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleCreate}
                    departments={departments}
                    myTeam={myTeam}
                />
            )}

            {/* Detail Modal */}
            {selectedRequest && (
                <RequestDetailModal
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onUpdateStatus={handleStatusUpdate}
                    onAddComment={handleAddComment}
                    isReceived={activeTab === 'received'}
                />
            )}
        </div>
    );
};

// --- Sub Components ---

const RequestFormModal = ({ onClose, onSubmit, departments, myTeam }) => {
    const [formData, setFormData] = useState({
        targetTeam: departments.find(d => d !== '선택' && d !== myTeam) || '',
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default 1 week later
    });

    // Filter out my team from target list
    const targets = departments.filter(d => d !== '선택' && d !== myTeam);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.targetTeam) return alert('필수 항목을 입력해주세요.');
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold flex items-center gap-2">
                        <PlusCircle className="w-5 h-5" /> 새 협업 요청
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 opacity-70 hover:opacity-100" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">수신 부서</label>
                        <select
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.targetTeam}
                            onChange={e => setFormData({ ...formData, targetTeam: e.target.value })}
                        >
                            {targets.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">제목</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="요청 사항을 요약해주세요"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">중요도</label>
                            <select
                                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="Low">Low (낮음)</option>
                                <option value="Medium">Medium (보통)</option>
                                <option value="High">High (높음)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">희망 마감일</label>
                            <input
                                type="date"
                                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">상세 내용</label>
                        <textarea
                            className="w-full border border-slate-300 rounded-lg p-3 h-32 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="구체적인 요청 내용과 배경을 설명해주세요."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">취소</button>
                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">요청 보내기</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RequestDetailModal = ({ request, onClose, onUpdateStatus, onAddComment, isReceived }) => {
    const [commentText, setCommentText] = useState('');

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        onAddComment(request.id, commentText);
        setCommentText('');
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                    <div className="pr-8">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${PRIORITY_COLORS[request.priority]}`}>
                                {PRIORITY_LABELS[request.priority]} Priority
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${STATUS_COLORS[request.status]}`}>
                                {STATUS_LABELS[request.status]}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 leading-snug">{request.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"><X className="w-5 h-5" /></button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-0">
                    <div className="p-6 space-y-6">
                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>요청자: <strong>{request.requesterTeam}</strong></span>
                            </div>
                            <div className="w-px h-4 bg-slate-300"></div>
                            <div className="flex items-center gap-2">
                                <ArrowRight className="w-4 h-4" />
                                <span>담당: <strong>{request.targetTeam}</strong></span>
                            </div>
                            <div className="w-px h-4 bg-slate-300"></div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>마감: <strong>{request.dueDate}</strong></span>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-500" /> 상세 내용
                            </h4>
                            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-white border border-slate-100 p-4 rounded-lg">
                                {request.description}
                            </div>
                        </div>

                        {/* Status Actions (Only for receiver) */}
                        {isReceived && request.status !== 'Completed' && request.status !== 'Rejected' && (
                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                                <h4 className="text-sm font-bold text-indigo-900 mb-3">상태 변경</h4>
                                <div className="flex gap-2">
                                    {request.status === 'Pending' && (
                                        <button
                                            onClick={() => onUpdateStatus(request.id, 'In_Progress')}
                                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm"
                                        >
                                            접수 및 진행 (In Progress)
                                        </button>
                                    )}
                                    {(request.status === 'Pending' || request.status === 'In_Progress') && (
                                        <>
                                            <button
                                                onClick={() => onUpdateStatus(request.id, 'Completed')}
                                                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm"
                                            >
                                                완료 처리 (Complete)
                                            </button>
                                            <button
                                                onClick={() => onUpdateStatus(request.id, 'Rejected')}
                                                className="py-2 px-4 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50"
                                            >
                                                반려
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Comments Section */}
                        <div className="border-t border-slate-200 pt-6">
                            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-indigo-500" /> 히스토리 & 댓글 ({request.comments?.length || 0})
                            </h4>

                            <div className="space-y-4 mb-6">
                                {(request.comments || []).map((c, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                                            {c.authorTeam?.[0]}
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg rounded-tl-none border border-slate-200 flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-slate-700">{c.authorTeam}</span>
                                                <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-slate-600">{c.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comment Input (Fixed bottom) */}
                <div className="p-4 border-t border-slate-200 bg-white">
                    <form onSubmit={handleCommentSubmit} className="relative">
                        <input
                            type="text"
                            placeholder="댓글을 입력하세요..."
                            className="w-full bg-slate-100 border-0 rounded-full pl-5 pr-12 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!commentText.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-full disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CollaborationDashboard;
