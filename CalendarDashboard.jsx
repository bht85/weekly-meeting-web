import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Briefcase, Share2, X, Clock, CheckCircle2 } from 'lucide-react';

const CalendarDashboard = ({ db, departments }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [todos, setTodos] = useState([]);
    const [collabs, setCollabs] = useState([]);
    const [filterDept, setFilterDept] = useState('전체');
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null); // 모달 상태

    // --- Data Fetching ---
    useEffect(() => {
        // 1. Fetch Todos (status: progress or pending) - dueDate 필수 확인
        const todoQuery = query(
            collection(db, 'dept_todos'),
            where('status', 'in', ['progress', 'pending'])
        );
        const unsubTodo = onSnapshot(todoQuery, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // dueDate가 있는 항목만 필터링 (DB 쿼리로도 가능하지만 안전장치)
            setTodos(loaded.filter(t => t.dueDate));
        });

        // 2. Fetch Collaboration Requests (all) - 반려 제외
        const collabQuery = query(collection(db, 'collaboration_requests'));
        const unsubCollab = onSnapshot(collabQuery, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // 반려(rejected) 상태 제외 및 dueDate 있는 항목만
            setCollabs(loaded.filter(c => c.status !== '반려' && c.dueDate));
        });

        return () => { unsubTodo(); unsubCollab(); };
    }, [db]);

    // --- Data Merging & Filtering ---
    useEffect(() => {
        let merged = [];

        // Map Todos -> Events
        todos.forEach(todo => {
            if (filterDept === '전체' || todo.department === filterDept) {
                merged.push({
                    id: `todo-${todo.id}`,
                    type: 'task',
                    title: todo.task,
                    date: todo.dueDate,
                    dept: todo.department,
                    description: todo.description,
                    status: todo.status, // progress, pending
                    manager: todo.manager || '미지정'
                });
            }
        });

        // Map Collabs -> Events
        collabs.forEach(collab => {
            if (filterDept === '전체' || collab.fromDept === filterDept || collab.toDept === filterDept) {
                merged.push({
                    id: `collab-${collab.id}`,
                    type: 'collab',
                    title: collab.title,
                    date: collab.dueDate,
                    dept: `${collab.fromDept} → ${collab.toDept}`,
                    description: collab.content,
                    status: collab.status, // 대기, 진행, 완료 등
                    from: collab.fromDept,
                    to: collab.toDept
                });
            }
        });

        setEvents(merged);
    }, [todos, collabs, filterDept]);

    // --- Calendar Logic ---
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Generate Calendar Grid
    const renderCalendarGrid = () => {
        const grid = [];
        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            grid.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border-b border-r border-slate-100"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            grid.push(
                <div key={day} className={`h-32 border-b border-r border-slate-100 p-1 relative hover:bg-slate-50 transition-colors group overflow-y-auto ${isToday ? 'bg-indigo-50/30' : 'bg-white'}`}>
                    <div className={`text-sm font-medium mb-1 pl-1 ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {day} {isToday && <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full ml-1">Today</span>}
                    </div>
                    <div className="space-y-1">
                        {dayEvents.map(event => (
                            <div
                                key={event.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                className={`text-xs px-1.5 py-1 rounded border shadow-sm truncate cursor-pointer transition-all hover:scale-[1.02] hover:opacity-80 active:scale-95 ${event.type === 'task'
                                    ? 'bg-blue-50 border-blue-100 text-blue-700'
                                    : 'bg-purple-50 border-purple-100 text-purple-700'
                                    }`}
                                title="클릭하여 상세 정보 보기"
                            >
                                <div className="flex items-center gap-1">
                                    {event.type === 'task' ? <Briefcase className="w-3 h-3 flex-shrink-0" /> : <Share2 className="w-3 h-3 flex-shrink-0" />}
                                    <span className="truncate flex-1 font-medium">{event.title}</span>
                                </div>
                                <div className="text-[10px] opacity-75 truncate mt-0.5">{event.dept}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return grid;
    };

    // Helper: Badge Style for Status
    const getStatusBadge = (status) => {
        const styles = {
            'progress': 'bg-blue-100 text-blue-800',
            'pending': 'bg-gray-100 text-gray-800',
            '완료': 'bg-green-100 text-green-800',
            '대기': 'bg-yellow-100 text-yellow-800',
            '진행': 'bg-blue-100 text-blue-800'
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-indigo-600" />
                        {year}년 {month + 1}월
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 bg-indigo-50 rounded-lg">
                        이번 달
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs text-slate-600">업무</span>
                        <div className="w-3 h-3 rounded-full bg-purple-500 ml-2"></div><span className="text-xs text-slate-600">협업</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                        className="text-sm border-none bg-transparent font-medium text-slate-600 focus:ring-0 cursor-pointer"
                    >
                        <option value="전체">전체 부서 일정</option>
                        {departments.filter(d => d !== '선택').map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                        <div key={day} className={`py-3 text-center text-sm font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-600'}`}>
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 bg-slate-100 gap-px border-l border-t border-slate-100">
                    {renderCalendarGrid()}
                </div>
            </div>

            {/* --- Detail Modal --- */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className={`p-4 flex justify-between items-center ${selectedEvent.type === 'task' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                            <div className="flex items-center gap-2 text-white">
                                {selectedEvent.type === 'task' ? <Briefcase className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                                <h3 className="font-bold text-lg">
                                    {selectedEvent.type === 'task' ? '업무 상세 정보' : '협업 요청 상세'}
                                </h3>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="text-white/80 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="text-xl font-bold text-gray-900 mb-1">{selectedEvent.title}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock className="w-4 h-4" /> 마감일: <span className="font-medium text-gray-700">{selectedEvent.date}</span>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 mb-1">상태 (Status)</div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(selectedEvent.status)} border border-black/5`}>
                                        {selectedEvent.status || '상태 없음'}
                                    </span>
                                </div>
                                <div className="w-px bg-gray-200"></div>
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 mb-1">
                                        {selectedEvent.type === 'task' ? '담당 부서' : '요청 흐름'}
                                    </div>
                                    <div className="text-sm font-semibold text-gray-700">
                                        {selectedEvent.dept}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">상세 내용</label>
                                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-200 h-32 overflow-y-auto">
                                    {selectedEvent.description || '(내용 없음)'}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarDashboard;
