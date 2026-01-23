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
    'Pending': '대기 (Pending)',
    'In_Progress': '진행중 (In Progress)',
    'Completed': '완료 (Completed)',
    'Rejected': '반려 (Rejected)'
};

const STATUS_COLORS = {
    'Pending': 'bg-amber-100 text-amber-700 ring-1 ring-amber-600/20',
    'In_Progress': 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20',
    'Completed': 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20',
    'Rejected': 'bg-red-100 text-red-700 ring-1 ring-red-600/20'
};

const PRIORITY_LABELS = {
    'High': '높음',
    'Medium': '보통',
    'Low': '낮음'
};

const PRIORITY_COLORS = {
    'High': 'text-red-700 bg-red-50 border border-red-200',
    'Medium': 'text-amber-700 bg-amber-50 border border-amber-200',
    'Low': 'text-emerald-700 bg-emerald-50 border border-emerald-200'
};

const CollaborationDashboard = ({ db, user, departments }) => {
    const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [myTeam, setMyTeam] = useState(departments[1]);

    // Filter states
    const [filterStatus, setFilterStatus] = useState('All');

    // --- Real-time Data Fetching ---
    useEffect(() => {
        if (!db || !user) return;

        setLoading(true);
        let q;
        const collectionRef = collection(db, 'collaboration_requests');

        if (activeTab === 'sent') {
            q = query(collectionRef, where('requesterTeam', '==', myTeam));
        } else {
            q = query(collectionRef, where('targetTeam', '==', myTeam));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
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
            if (!selectedRequest) return;
            const newComment = {
                id: Date.now().toString(),
                text,
                authorTeam: myTeam,
                createdAt: new Date().toISOString()
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
        <div className="bg-white min-h-screen p-6 rounded-xl shadow-sm border border-slate-200">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <User className="w-6 h-6 text-indigo-700" />
                        협업 요청 (Collaboration)
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        부서 간 업무 협조 및 자료 요청 히스토리 관리
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-xs font-bold text-slate-400 uppercase">My Team</span>
                        <select
                            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer hover:text-indigo-600"
                            value={myTeam}
                            onChange={(e) => setMyTeam(e.target.value)}
                        >
                            {departments.filter(d => d !== '선택').map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                        <PlusCircle className="w-4 h-4" /> 새 요청 작성
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('received')}
                    className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'received' ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    받은 요청 (Received)
                    {activeTab === 'received' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'sent' ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    보낸 요청 (Sent)
                    {activeTab === 'sent' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <div className="p-1.5 bg-slate-100 rounded text-slate-400 mr-2"><Filter className="w-4 h-4" /></div>
                {['All', 'Pending', 'In_Progress', 'Completed', 'Rejected'].map(st => (
                    <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filterStatus === st
                            ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                    >
                        {st === 'All' ? '전체' : STATUS_LABELS[st].split('(')[0]}
                    </button>
                ))}
            </div>

            {/* List - Card Layout */}
            {loading ? (
                <div className="py-20 text-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div><span className="text-slate-400 text-sm">로딩 중...</span></div>
            ) : filteredRequests.length === 0 ? (
                <div className="py-24 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <User className="w-8 h-8" />
                    </div>
                    <p className="text-slate-500 font-medium">요청 내역이 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredRequests.map(req => (
                        <div
                            key={req.id}
                            onClick={() => setSelectedRequest(req)}
                            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-200 cursor-pointer relative group card-hover-effect"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${PRIORITY_COLORS[req.priority]}`}>
                                        {PRIORITY_LABELS[req.priority]}
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                        {req.title}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 ${STATUS_COLORS[req.status]}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full bg-current opacity-60`}></div>
                                        {STATUS_LABELS[req.status]?.split('(')[0]}
                                    </span>
                                </div>
                            </div>

                            <p className="text-slate-600 text-sm mb-5 line-clamp-2 md:line-clamp-1 pr-10">
                                {req.description}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                        <span className="text-slate-400">{activeTab === 'received' ? 'From' : 'To'}</span>
                                        <span className="text-slate-700 font-bold">{activeTab === 'received' ? req.requesterTeam : req.targetTeam}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{req.dueDate} 마감</span>
                                    </div>
                                </div>

                                {req.comments?.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2 py-1 rounded-full text-xs">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span className="font-bold">{req.comments.length}</span>
                                    </div>
                                )}
                            </div>

                            <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 hidden md:block">
                                <ArrowRight className="w-5 h-5 text-indigo-400" />
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
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const targets = departments.filter(d => d !== '선택' && d !== myTeam);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.targetTeam) return alert('필수 항목을 입력해주세요.');
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                <div className="bg-slate-50 p-5 flex justify-between items-center border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-indigo-600" /> 새 협업 요청 작성
                    </h3>
                    <button onClick={onClose} className="bg-white p-1.5 rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">수신 부서 (Target)</label>
                        <div className="relative">
                            <select
                                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                value={formData.targetTeam}
                                onChange={e => setFormData({ ...formData, targetTeam: e.target.value })}
                            >
                                {targets.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">요청 제목</label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                            placeholder="요청 사항을 간결하게 요약해주세요"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">중요도</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="Low">Low (낮음)</option>
                                <option value="Medium">Medium (보통)</option>
                                <option value="High">High (높음)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">희망 마감일</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none text-slate-600"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">상세 요청 내용</label>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 h-32 text-sm font-medium resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="배경 설명 및 구체적인 필요 사항을 적어주세요."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">취소</button>
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
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-white sticky top-0 z-10">
                    <div className="pr-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md border ${PRIORITY_COLORS[request.priority]}`}>
                                {PRIORITY_LABELS[request.priority]}
                            </span>
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${STATUS_COLORS[request.status]}`}>
                                {STATUS_LABELS[request.status]?.split('(')[0]}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 leading-snug tracking-tight">{request.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50/30">
                    <div className="p-6 md:p-8 space-y-8">
                        {/* Meta Grid */}
                        <div className="grid grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
                                <div className="flex items-center gap-2 font-bold text-slate-700">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs">
                                        {request.requesterTeam[0]}
                                    </div>
                                    {request.requesterTeam}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 border-l border-slate-100 pl-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">To (담당)</span>
                                <div className="flex items-center gap-2 font-bold text-slate-700">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                                        {request.targetTeam[0]}
                                    </div>
                                    {request.targetTeam}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 border-l border-slate-100 pl-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Due Date</span>
                                <div className="flex items-center gap-2 font-bold text-red-600">
                                    <Calendar className="w-4 h-4" />
                                    {request.dueDate}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                                <FileText className="w-4 h-4 text-indigo-500" /> 상세 내용
                            </h4>
                            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-sm">
                                {request.description}
                            </div>
                        </div>

                        {/* Status Actions */}
                        {isReceived && request.status !== 'Completed' && request.status !== 'Rejected' && (
                            <div className="bg-white border border-indigo-100 p-5 rounded-2xl shadow-sm ring-1 ring-indigo-50">
                                <h4 className="text-sm font-bold text-indigo-900 mb-4">상태 업데이트</h4>
                                <div className="flex gap-3">
                                    {request.status === 'Pending' && (
                                        <button
                                            onClick={() => onUpdateStatus(request.id, 'In_Progress')}
                                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5"
                                        >
                                            접수 및 진행 (Start)
                                        </button>
                                    )}
                                    {(request.status === 'Pending' || request.status === 'In_Progress') && (
                                        <>
                                            <button
                                                onClick={() => onUpdateStatus(request.id, 'Completed')}
                                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5"
                                            >
                                                완료 처리 (Done)
                                            </button>
                                            <button
                                                onClick={() => onUpdateStatus(request.id, 'Rejected')}
                                                className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-colors"
                                            >
                                                반려
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                                <MessageSquare className="w-4 h-4 text-indigo-500" /> 히스토리 & 댓글 ({request.comments?.length || 0})
                            </h4>

                            <div className="space-y-4 mb-8">
                                {(request.comments || []).map((c, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-1">
                                            {c.authorTeam?.[0]}
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex-1 group-hover:border-indigo-200 transition-colors">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-slate-800">{c.authorTeam}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed">{c.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!request.comments || request.comments.length === 0) && (
                                    <p className="text-center text-slate-400 py-4 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        아직 작성된 댓글이 없습니다.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Input */}
                <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0">
                    <form onSubmit={handleCommentSubmit} className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="추가 문의사항이나 진행상황을 남겨주세요..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-5 pr-4 py-3.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!commentText.trim()}
                            className="p-3.5 bg-indigo-600 text-white rounded-full disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-105"
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
