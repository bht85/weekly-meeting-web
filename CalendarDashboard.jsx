import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Briefcase, Share2 } from 'lucide-react';

const CalendarDashboard = ({ db, departments }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [todos, setTodos] = useState([]);
    const [collabs, setCollabs] = useState([]);
    const [filterDept, setFilterDept] = useState('전체');
    const [events, setEvents] = useState([]);

    // --- Data Fetching ---
    useEffect(() => {
        // 1. Fetch Todos (status: progress or pending)
        const todoQuery = query(
            collection(db, 'dept_todos'),
            where('status', 'in', ['progress', 'pending'])
        );
        const unsubTodo = onSnapshot(todoQuery, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTodos(loaded);
        });

        // 2. Fetch Collaboration Requests (all)
        const collabQuery = query(collection(db, 'collaboration_requests'));
        const unsubCollab = onSnapshot(collabQuery, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCollabs(loaded);
        });

        return () => { unsubTodo(); unsubCollab(); };
    }, [db]);

    // --- Data Merging & Filtering ---
    useEffect(() => {
        let merged = [];

        // Map Todos -> Events
        todos.forEach(todo => {
            if (todo.dueDate && (filterDept === '전체' || todo.department === filterDept)) {
                merged.push({
                    id: `todo-${todo.id}`,
                    type: 'task',
                    title: todo.task,
                    date: todo.dueDate,
                    dept: todo.department,
                    description: todo.description
                });
            }
        });

        // Map Collabs -> Events
        collabs.forEach(collab => {
            if (collab.dueDate && (filterDept === '전체' || collab.fromDept === filterDept || collab.toDept === filterDept)) {
                merged.push({
                    id: `collab-${collab.id}`,
                    type: 'collab',
                    title: collab.title,
                    date: collab.dueDate,
                    dept: `${collab.fromDept} → ${collab.toDept}`,
                    description: collab.content
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
        // Empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            grid.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border-b border-r border-slate-100"></div>);
        }

        // Days of the month
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
                                className={`text-xs px-1.5 py-1 rounded border shadow-sm truncate cursor-pointer transition-transform hover:scale-[1.02] ${event.type === 'task'
                                    ? 'bg-blue-50 border-blue-100 text-blue-700'
                                    : 'bg-purple-50 border-purple-100 text-purple-700'
                                    }`}
                                title={`[${event.dept}] ${event.title}\n${event.description || ''}`}
                            >
                                <div className="flex items-center gap-1">
                                    {event.type === 'task' ? <Briefcase className="w-3 h-3 flex-shrink-0" /> : <Share2 className="w-3 h-3 flex-shrink-0" />}
                                    <span className="truncate flex-1">{event.title}</span>
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
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
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                        <div key={day} className={`py-3 text-center text-sm font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-600'}`}>
                            {day}
                        </div>
                    ))}
                </div>
                {/* Days */}
                <div className="grid grid-cols-7 bg-slate-100 gap-px border-l border-t border-slate-100">
                    {renderCalendarGrid()}
                </div>
            </div>
        </div>
    );
};

export default CalendarDashboard;
