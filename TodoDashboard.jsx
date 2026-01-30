import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, Plus, Trash2, Calendar, AlertCircle,
    CheckSquare, Square, Filter, TrendingUp
} from 'lucide-react';
import {
    collection, addDoc, updateDoc, deleteDoc, doc,
    query, where, onSnapshot, serverTimestamp, orderBy
} from 'firebase/firestore';

const TodoDashboard = ({ db, user, departments }) => {
    // State
    const [selectedDept, setSelectedDept] = useState(departments[0] || '전체');
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New Task State
    const [taskInput, setTaskInput] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');

    // Derived State for Statistics
    const totalTasks = todos.length;
    const completedTasks = todos.filter(t => t.isCompleted).length;
    const progressRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // Filtered Todos for Display
    // Currently we query by department if selectedDept is not '전체' or '선택'
    // But since we want to show statistics for the selected department, we can just fetch all for now or query based on selection.
    // To make it simple and responsive, let's fetch based on selection.

    useEffect(() => {
        setLoading(true);
        setError(null);
        let q;
        const collectionRef = collection(db, 'dept_todos');

        if (selectedDept === '전체' || selectedDept === '선택') {
            q = query(collectionRef, orderBy('createdAt', 'desc'));
        } else {
            q = query(collectionRef, where('department', '==', selectedDept), orderBy('createdAt', 'desc'));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTodos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTodos(fetchedTodos);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching todos:", err);
            setError("데이터를 불러오는데 실패했습니다. (권한 또는 인덱스 문제)");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, selectedDept]);

    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!taskInput.trim()) return;
        if (selectedDept === '전체' || selectedDept === '선택') {
            alert('업무를 추가할 구체적인 부서를 선택해주세요.');
            return;
        }

        try {
            await addDoc(collection(db, 'dept_todos'), {
                department: selectedDept,
                task: taskInput,
                isCompleted: false,
                priority: priority,
                dueDate: dueDate,
                createdAt: serverTimestamp()
            });
            setTaskInput('');
            setPriority('Medium');
            setDueDate('');
        } catch (error) {
            console.error("Error adding todo: ", error);
            alert("할 일을 추가하는 중 오류가 발생했습니다.");
        }
    };

    const handleToggleComplete = async (todo) => {
        try {
            const todoRef = doc(db, 'dept_todos', todo.id);
            await updateDoc(todoRef, {
                isCompleted: !todo.isCompleted
            });
        } catch (error) {
            console.error("Error toggling todo: ", error);
        }
    };

    const handleDeleteTodo = async (id) => {
        if (!window.confirm('이 업무를 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'dept_todos', id));
        } catch (error) {
            console.error("Error deleting todo: ", error);
        }
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'High': return 'bg-red-100 text-red-700 border-red-200';
            case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Low': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getProgressColor = (rate) => {
        if (rate >= 80) return 'bg-emerald-500';
        if (rate >= 50) return 'bg-blue-500';
        return 'bg-amber-500';
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 rounded-xl">
            {/* Header Section */}
            <div className="mb-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" /> 부서별 업무 관리
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">부서별 중요 업무 및 마감기한 관리</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative">
                            <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="appearance-none bg-slate-50 border border-slate-300 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm text-sm"
                            >
                                <option value="전체">전체 부서 보기</option>
                                {departments.filter(d => d !== '선택').map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-slate-400" />
                            {selectedDept} 업무 진행률
                        </span>
                        <span className="text-2xl font-bold text-slate-800">
                            {progressRate}% <span className="text-sm text-slate-400 font-normal">({completedTasks}/{totalTasks})</span>
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${getProgressColor(progressRate)}`}
                            style={{ width: `${progressRate}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAddTodo} className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">할 일 내용</label>
                    <input
                        type="text"
                        value={taskInput}
                        onChange={(e) => setTaskInput(e.target.value)}
                        placeholder="새로운 업무를 입력하세요..."
                        className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div className="w-full md:w-40">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">중요도</label>
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    >
                        <option value="High">High (높음)</option>
                        <option value="Medium">Medium (보통)</option>
                        <option value="Low">Low (낮음)</option>
                    </select>
                </div>
                <div className="w-full md:w-40">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">마감일</label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors min-w-[100px]"
                >
                    <Plus className="w-5 h-5" /> 추가
                </button>
            </form>

            {/* Todo List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="p-10 text-center text-slate-400">
                        <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full mx-auto mb-2"></div>
                        데이터를 불러오는 중...
                    </div>
                ) : error ? (
                    <div className="p-12 text-center bg-red-50 rounded-xl border border-red-200 text-red-600">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{error}</p>
                        <p className="text-xs mt-2 text-red-400">관리자에게 문의해주세요.</p>
                    </div>
                ) : todos.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                        <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>등록된 업무가 없습니다.</p>
                    </div>
                ) : (
                    todos.map(todo => (
                        <div
                            key={todo.id}
                            className={`bg-white p-4 rounded-xl border transition-all hover:shadow-md flex items-start gap-4 group ${todo.isCompleted ? 'border-slate-200 bg-slate-50' : 'border-slate-200'}`}
                        >
                            <button
                                onClick={() => handleToggleComplete(todo)}
                                className={`mt-1 flex-shrink-0 transition-colors ${todo.isCompleted ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'}`}
                            >
                                {todo.isCompleted ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                            </button>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                        {todo.department}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getPriorityColor(todo.priority)}`}>
                                        {todo.priority}
                                    </span>
                                    {todo.dueDate && (
                                        <span className={`text-xs flex items-center gap-1 ${todo.isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                                            <Calendar className="w-3 h-3" /> {todo.dueDate}
                                            {/* D-Day Logic Optional */}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-base font-medium break-words ${todo.isCompleted ? 'text-slate-400 line-through decoration-slate-400' : 'text-slate-800'}`}>
                                    {todo.task}
                                </p>
                            </div>

                            <button
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="text-slate-300 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TodoDashboard;
