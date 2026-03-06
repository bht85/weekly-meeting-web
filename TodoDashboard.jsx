import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, Plus, Trash2, Calendar, AlertCircle, Users,
    CheckSquare, Square, Filter, TrendingUp, Edit, X
} from 'lucide-react';
import {
    collection, addDoc, updateDoc, deleteDoc, doc,
    query, where, onSnapshot, serverTimestamp, orderBy
} from 'firebase/firestore';

// 월 옵션 생성 (당월 포함 최근 12개월)
const getMonthOptions = () => {
    const now = new Date();
    const options = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월${i === 0 ? ' (이번 달)' : ''}`;
        options.push({ value, label });
    }
    return options;
};

const MONTH_OPTIONS = getMonthOptions();

const TodoDashboard = ({ db, user, departments }) => {
    // State
    const [selectedDept, setSelectedDept] = useState(departments[0] || '전체');
    const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[0].value); // 당월 기본
    const [todos, setTodos] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingTodo, setEditingTodo] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // 월 필터링된 할 일 목록
    const filteredTodos = todos.filter(todo => {
        if (!selectedMonth || selectedMonth === 'all') return true;
        if (!todo.dueDate) return false;
        return todo.dueDate.startsWith(selectedMonth);
    });

    // Derived State for Statistics (필터링된 기준)
    const totalTasks = filteredTodos.length;
    const completedTasks = filteredTodos.filter(t => t.isCompleted).length;
    const progressRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // Auto-select department based on logged-in user
    useEffect(() => {
        if (user?.department && departments.includes(user.department)) {
            setSelectedDept(user.department);
        }
    }, [user, departments]);

    // Fetch Employees
    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, 'employees'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const emps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmployees(emps);
        });
        return () => unsubscribe();
    }, [db]);

    // Initial load & Real-time sync
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

    const handleCreateTodo = async (todoData) => {
        try {
            await addDoc(collection(db, 'dept_todos'), {
                department: todoData.department,
                task: todoData.task,
                description: todoData.description,
                isCompleted: false,
                priority: todoData.priority,
                dueDate: todoData.dueDate,
                assignees: todoData.assignees || [], // Array
                assigneeIds: todoData.assigneeIds || [], // Array of IDs
                // Backward compatibility
                assigneeId: todoData.assignees?.[0]?.id || '',
                assigneeName: todoData.assignees?.[0]?.name || '',
                assigneePosition: todoData.assignees?.[0]?.position || '',
                subTasks: [],
                createdAt: serverTimestamp(),
                createdBy: user?.email || 'unknown'
            });
            setIsFormOpen(false);
        } catch (error) {
            console.error("Error adding todo: ", error);
            alert("할 일을 추가하는 중 오류가 발생했습니다.");
        }
    };

    const handleUpdateTodo = async (id, updates) => {
        try {
            const todoRef = doc(db, 'dept_todos', id);
            await updateDoc(todoRef, updates);
            setEditingTodo(null);
        } catch (error) {
            console.error("Error updating todo: ", error);
            alert("수정 중 오류가 발생했습니다.");
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

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* 월 선택 */}
                        <div className="relative">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm text-sm"
                            >
                                {MONTH_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        {/* 부서 선택 */}
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

                        {/* New Task Button */}
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5"
                        >
                            <Plus className="w-4 h-4" /> 새 업무 작성
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-slate-400" />
                            {selectedDept} 업무 진행률
                            <span className="text-xs font-normal text-slate-400">
                                ({MONTH_OPTIONS.find(o => o.value === selectedMonth)?.label})
                            </span>
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
                ) : filteredTodos.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                        <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>해당 월에 등록된 업무가 없습니다.</p>
                        <p className="text-xs mt-1 text-slate-300">{MONTH_OPTIONS.find(o => o.value === selectedMonth)?.label} 기준</p>
                        <button onClick={() => setIsFormOpen(true)} className="text-indigo-600 font-bold mt-2 hover:underline">새 업무 등록하기</button>
                    </div>
                ) : (
                    filteredTodos.map(todo => (
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
                                        </span>
                                    )}
                                </div>
                                <p className={`text-base font-medium break-words ${todo.isCompleted ? 'text-slate-400 line-through decoration-slate-400' : 'text-slate-800'}`}>
                                    {todo.task}
                                </p>
                                {/* Description Sub-text */}
                                {todo.description && (
                                    <p className={`text-sm mt-1 line-clamp-2 ${todo.isCompleted ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {todo.description}
                                    </p>
                                )}

                                {/* Assignee Badge (Multiple) */}
                                {(todo.assignees && todo.assignees.length > 0) ? (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {todo.assignees.map(a => (
                                            <div key={a.id} className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-bold bg-indigo-50 w-fit px-2 py-0.5 rounded-full border border-indigo-100">
                                                <Users className="w-3 h-3" />
                                                {a.name}
                                            </div>
                                        ))}
                                    </div>
                                ) : todo.assigneeName ? (
                                    // Backward Compatibility for Single Assignee
                                    <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 font-bold bg-indigo-50 w-fit px-2 py-1 rounded-full border border-indigo-100">
                                        <Users className="w-3 h-3" />
                                        {todo.assigneeName} {todo.assigneePosition && <span className="text-indigo-400 font-normal">({todo.assigneePosition})</span>}
                                    </div>
                                ) : null}

                                {/* Sub-task Progress Indicator */}
                                {todo.subTasks && todo.subTasks.length > 0 && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <div className="flex-1 max-w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${Math.round((todo.subTasks.filter(st => st.isCompleted).length / todo.subTasks.length) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <span>
                                            {todo.subTasks.filter(st => st.isCompleted).length}/{todo.subTasks.length}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setEditingTodo(todo)}
                                className="text-slate-300 hover:text-indigo-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Edit className="w-5 h-5" />
                            </button>

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

            {/* Create Todo Modal */}
            {isFormOpen && (
                <TodoFormModal
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleCreateTodo}
                    departments={departments}
                    employees={employees}
                    initialDept={user?.department || (selectedDept === '전체' ? departments.find(d => d !== '전체' && d !== '선택') : selectedDept)}
                />
            )}

            {/* Detail/Edit Modal */}
            {editingTodo && (
                <TodoDetailModal
                    todo={editingTodo}
                    onClose={() => setEditingTodo(null)}
                    onUpdate={handleUpdateTodo}
                    departments={departments}
                    employees={employees}
                />
            )}
        </div>
    );
};

// --- Sub Components ---

// --- Sub Components ---

const TodoFormModal = ({ onClose, onSubmit, departments, employees, initialDept }) => {
    const [formData, setFormData] = useState({
        task: '',
        description: '',
        department: initialDept || departments[0],
        assignees: [], // Array of {id, name, position}
        priority: 'Medium',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.task.trim()) {
            return alert('할 일을 입력해주세요.');
        }
        onSubmit({
            ...formData,
            // Ensure we save both detailed array and ID array for easier querying
            assigneeIds: formData.assignees.map(a => a.id)
        });
    };

    const handleAddAssignee = (e) => {
        const empId = e.target.value;
        if (!empId) return;

        // Prevent duplicates
        if (formData.assignees.some(a => a.id === empId)) return;

        const emp = employees.find(e => e.id === empId);
        if (emp) {
            setFormData(prev => ({
                ...prev,
                assignees: [...prev.assignees, { id: emp.id, name: emp.name, position: emp.position }]
            }));
        }
    };

    const handleRemoveAssignee = (empId) => {
        setFormData(prev => ({
            ...prev,
            assignees: prev.assignees.filter(a => a.id !== empId)
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-indigo-600" /> 새 업무 작성
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">할 일 (Title) <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="업무 제목을 입력하세요"
                            value={formData.task}
                            onChange={e => setFormData({ ...formData, task: e.target.value })}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">상세 내용 (Description)</label>
                        <textarea
                            className="w-full border border-slate-300 rounded-xl p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="업무에 대한 상세 설명을 적어주세요..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">담당 부서</label>
                            <select
                                className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.department}
                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                            >
                                {departments.filter(d => d !== '선택' && d !== '전체').map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">중요도</label>
                            <select
                                className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="High">High (높음)</option>
                                <option value="Medium">Medium (보통)</option>
                                <option value="Low">Low (낮음)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">담당자 지정 (Assignees)</label>

                        {/* Selected Assignees Tags */}
                        {formData.assignees.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.assignees.map(assignee => (
                                    <span key={assignee.id} className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-full">
                                        <Users className="w-3 h-3" />
                                        {assignee.name} <span className="text-indigo-400 font-normal">({assignee.position})</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAssignee(assignee.id)}
                                            className="ml-1 hover:text-indigo-900 rounded-full p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <select
                            className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value=""
                            onChange={handleAddAssignee}
                        >
                            <option value="">담당자 추가...</option>
                            {employees
                                .filter(emp => emp.department === formData.department)
                                .filter(emp => !formData.assignees.some(a => a.id === emp.id)) // Filter out already selected
                                .map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                                ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">마감일</label>
                        <input
                            type="date"
                            className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.dueDate}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                    </div>
                </form>

                {/* Footer Section - Fixed Alignment */}
                <div className="p-5 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 bg-white flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">취소</button>
                    <button type="button" onClick={handleSubmit} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">업무 등록</button>
                </div>
            </div>
        </div>
    );
};

const TodoDetailModal = ({ todo, onClose, onUpdate, departments, employees }) => {
    const [task, setTask] = useState(todo.task);
    const [description, setDescription] = useState(todo.description || '');
    const [priority, setPriority] = useState(todo.priority);
    const [dueDate, setDueDate] = useState(todo.dueDate);

    // Initialize assignees with backward compatibility
    const [assignees, setAssignees] = useState(() => {
        if (todo.assignees && Array.isArray(todo.assignees)) return todo.assignees;
        if (todo.assigneeId) return [{ id: todo.assigneeId, name: todo.assigneeName, position: todo.assigneePosition }];
        return [];
    });

    const [subTasks, setSubTasks] = useState(todo.subTasks || []);
    const [newSubTask, setNewSubTask] = useState('');

    const handleSave = () => {
        onUpdate(todo.id, {
            task,
            description,
            priority,
            dueDate,
            assignees, // Save array
            assigneeIds: assignees.map(a => a.id), // Save ID array for query
            // Keep legacy fields for a while
            assigneeId: assignees.length > 0 ? assignees[0].id : '',
            assigneeName: assignees.length > 0 ? assignees[0].name : '',
            assigneePosition: assignees.length > 0 ? assignees[0].position : '',
            subTasks
        });
    };

    const handleAddSubTask = (e) => {
        e.preventDefault();
        if (!newSubTask.trim()) return;
        const newItem = {
            id: Date.now().toString(),
            content: newSubTask,
            isCompleted: false
        };
        setSubTasks([...subTasks, newItem]);
        setNewSubTask('');
    };

    const toggleSubTask = (id) => {
        setSubTasks(subTasks.map(st =>
            st.id === id ? { ...st, isCompleted: !st.isCompleted } : st
        ));
    };

    const deleteSubTask = (id) => {
        setSubTasks(subTasks.filter(st => st.id !== id));
    };

    const handleAddAssignee = (e) => {
        const empId = e.target.value;
        if (!empId) return;
        if (assignees.some(a => a.id === empId)) return;
        const emp = employees.find(e => e.id === empId);
        if (emp) {
            setAssignees([...assignees, { id: emp.id, name: emp.name, position: emp.position }]);
        }
    };

    const handleRemoveAssignee = (empId) => {
        setAssignees(assignees.filter(a => a.id !== empId));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Edit className="w-5 h-5 text-indigo-600" /> 업무 상세 및 수정
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Main Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">할 일 내용</label>
                            <input
                                type="text"
                                value={task}
                                onChange={e => setTask(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">상세 설명</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm resize-none h-20 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="상세 내용을 입력하세요..."
                            ></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">중요도</label>
                                <select
                                    value={priority}
                                    onChange={e => setPriority(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="High">High (높음)</option>
                                    <option value="Medium">Medium (보통)</option>
                                    <option value="Low">Low (낮음)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">마감일</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Assignee for Edit Modal */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">담당자 (Assignees)</label>

                        {/* Tags */}
                        {assignees.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {assignees.map(assignee => (
                                    <span key={assignee.id} className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-full">
                                        <Users className="w-3 h-3" />
                                        {assignee.name} <span className="text-indigo-400 font-normal">({assignee.position})</span>
                                        <button
                                            onClick={() => handleRemoveAssignee(assignee.id)}
                                            className="ml-1 hover:text-indigo-900 rounded-full p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <select
                            className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value=""
                            onChange={handleAddAssignee}
                        >
                            <option value="">담당자 추가...</option>
                            {employees
                                .filter(emp => emp.department === todo.department)
                                .filter(emp => !assignees.some(a => a.id === emp.id))
                                .map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                                ))}
                        </select>
                    </div>

                    <div className="border-t border-slate-100 my-2"></div>

                    {/* Sub-tasks Section */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">세부 할 일 (Sub-tasks)</label>

                        <div className="space-y-2 mb-4">
                            {subTasks.map(st => (
                                <div key={st.id} className="flex items-start gap-3 group">
                                    <button
                                        onClick={() => toggleSubTask(st.id)}
                                        className={`mt-0.5 ${st.isCompleted ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'}`}
                                    >
                                        {st.isCompleted ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                    </button>
                                    <span className={`flex-1 text-sm ${st.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                        {st.content}
                                    </span>
                                    <button
                                        onClick={() => deleteSubTask(st.id)}
                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {subTasks.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    세부 항목이 없습니다.
                                </p>
                            )}
                        </div>

                        {/* Fixed Sub-task Input Alignment */}
                        <form onSubmit={handleAddSubTask} className="flex w-full gap-2 items-center">
                            <input
                                type="text"
                                value={newSubTask}
                                onChange={e => setNewSubTask(e.target.value)}
                                placeholder="세부 할 일을 입력하세요"
                                className="flex-1 border border-slate-300 rounded-lg px-3 h-11 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button type="submit" className="bg-slate-100 hover:bg-slate-200 text-slate-600 w-11 h-11 rounded-lg transition-colors flex items-center justify-center flex-shrink-0">
                                <Plus className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Section - Fixed Alignment */}
                <div className="p-5 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 bg-white flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">취소</button>
                    <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-colors">저장 완료</button>
                </div>
            </div>
        </div>
    );
};

export default TodoDashboard;
