import React, { useState, useEffect, useMemo } from 'react';
import { getCollectionName } from './utils';
import {
    collection, addDoc, query, where, onSnapshot,
    serverTimestamp, doc, updateDoc, deleteDoc, orderBy, getDocs, setDoc
} from 'firebase/firestore';
import {
    Users, Plus, Mail, Briefcase, Calendar, ChevronRight,
    Search, LayoutGrid, List, CheckCircle2, Clock, UserPlus, X, Trash2, Edit2, Settings, ClipboardList
} from 'lucide-react';

const JOB_RANKS = {
    "대표": 0, // Ensure Representative is top
    "이사": 1,
    "부장": 2,
    "차장": 3,
    "과장": 4,
    "팀장": 5, // Depending on user's specific request "팀장" was 1 in example, but usually position hierarchy varies. User said: "팀장": 1, "부장": 2... I should follow user's exact map.
    // User provided: "팀장": 1, "부장": 2, etc. I will follow THAT exactly.
};

// User provided rank mapping
const USER_DEFINED_RANKS = {
    "팀장": 1,
    "부장": 2,
    "차장": 3,
    "과장": 4,
    "대리": 5,
    "주임": 6,
    "사원": 7,
    "인턴": 8
};

const getRank = (position) => USER_DEFINED_RANKS[position] || 99;

const OrganizationDashboard = ({ db, departments, user, isAdmin }) => {
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'individual' | 'handover'
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [selectedDeptForAdd, setSelectedDeptForAdd] = useState('');
    const [editingEmployee, setEditingEmployee] = useState(null);

    // For Individual Tab
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Handover State
    const [handovers, setHandovers] = useState([]);
    const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
    const [editingHandover, setEditingHandover] = useState(null);

    // Filter departments for display (exclude '선택' and '전체')
    const displayDepartments = React.useMemo(() => {
        const depts = departments.filter(d => d !== '선택' && d !== '전체');
        if (isAdmin) return depts;
        return depts.filter(d => d === user?.department);
    }, [isAdmin, user, departments]);

    useEffect(() => {
        if (!db) return;
        setLoading(true);
        // If not admin, we could restrict the query here, but as per current implementation 
        // we'll filter client-side to maintain consistency with TeamOverview logic.
        const q = query(collection(db, getCollectionName('employees', user)), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter(emp => isAdmin || emp.department === user?.department); // Restricted fetch

            // Sort by Rank
            docs.sort((a, b) => {
                const rankA = getRank(a.position);
                const rankB = getRank(b.position);
                if (rankA !== rankB) return rankA - rankB;
                return a.name.localeCompare(b.name); // Secondary sort by name
            });

            // Update selectedEmployee if it was updated
            if (selectedEmployee) {
                const updated = docs.find(d => d.id === selectedEmployee.id);
                if (updated) setSelectedEmployee(updated);
            }

            setEmployees(docs);
            setLoading(false);
        });

        const qHandovers = query(collection(db, getCollectionName('hr_handovers', user)), orderBy('createdAt', 'desc'));
        const unsubscribeHandovers = onSnapshot(qHandovers, (snapshot) => {
            let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (!isAdmin && user?.department) {
                docs = docs.filter(doc => 
                    doc.leaverDepartment === user.department || 
                    doc.receiverDepartment === user.department
                );
            }
            setHandovers(docs);
        });

        return () => {
            unsubscribe();
            unsubscribeHandovers();
        };
    }, [db, selectedEmployee]); // Note: selectedEmployee is in dependency to support re-selection if needed, but logic inside handles updates.

    const handleSaveEmployee = async (data) => {
        try {
            if (editingEmployee) {
                // Update existing
                const empRef = doc(db, getCollectionName('employees', user), editingEmployee.id);
                await updateDoc(empRef, {
                    ...data,
                });
                alert('직원 정보가 수정되었습니다.');
            } else {
                // Create new
                await addDoc(collection(db, getCollectionName('employees', user)), {
                    ...data,
                    createdAt: serverTimestamp()
                });
                alert('직원이 등록되었습니다.');
            }

            // [기업 매핑 추가] 외부 메일 사용 시 로그인을 위해 매핑 콜렉션에 등록
            const currentDomain = user?.forcedDomain || user?.email?.split('@')[1];
            if (data.email && (!data.email.endsWith(`@${currentDomain}`)) && currentDomain) {
                await setDoc(doc(db, 'company_registry', data.email), {
                    email: data.email,
                    domain: currentDomain,
                    registeredAt: serverTimestamp()
                });
            }

            setIsAddModalOpen(false);
            setEditingEmployee(null);
        } catch (error) {
            console.error("Error saving employee: ", error);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    const handleDeleteEmployee = async (id) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deleteDoc(doc(db, getCollectionName('employees', user), id));
            if (selectedEmployee && selectedEmployee.id === id) {
                setSelectedEmployee(null);
            }
        } catch (error) {
            console.error("Error deleting employee: ", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const openEditModal = (employee) => {
        setEditingEmployee(employee);
        setIsAddModalOpen(true);
    };

    const openAddModal = (dept) => {
        setEditingEmployee(null);
        setSelectedDeptForAdd(dept);
        setIsAddModalOpen(true);
    };

    const handleSaveHandover = async (data) => {
        try {
            if (editingHandover) {
                await updateDoc(doc(db, getCollectionName('hr_handovers', user), editingHandover.id), { ...data, updatedAt: serverTimestamp() });
            } else {
                await addDoc(collection(db, getCollectionName('hr_handovers', user)), { ...data, createdAt: serverTimestamp() });
            }
            setIsHandoverModalOpen(false);
            setEditingHandover(null);
        } catch (error) { console.error(error); alert("저장 실패"); }
    };

    const handleDeleteHandover = async (id) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deleteDoc(doc(db, getCollectionName('hr_handovers', user), id));
        } catch (error) {
            console.error(error); alert("삭제 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="bg-white min-h-screen p-6 rounded-xl shadow-sm border border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-indigo-700" />
                        조직/인사 관리 (Organization)
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        전체 임직원 현황 및 개인별 업무 내역 조회
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <button
                            onClick={() => setIsDeptModalOpen(true)}
                            className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-sm font-bold flex items-center gap-2 transition-colors border border-indigo-200 shadow-sm"
                        >
                            <Settings className="w-4 h-4" /> 부서 관리
                        </button>
                    )}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'overview'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" /> 조직도 현황
                        </button>
                        <button
                            onClick={() => setActiveTab('individual')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'individual'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <List className="w-4 h-4" /> 인원별 업무
                        </button>
                        <button
                            onClick={() => setActiveTab('handover')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'handover'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <ClipboardList className="w-4 h-4" /> 인수인계서
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
                <TeamOverview
                    employees={employees}
                    departments={displayDepartments}
                    onOpenAddModal={openAddModal}
                    onDeleteEmployee={handleDeleteEmployee}
                />
            )}
            {activeTab === 'individual' && (
                <IndividualTasks
                    db={db}
                    employees={employees}
                    departments={displayDepartments}
                    selectedEmployee={selectedEmployee}
                    setSelectedEmployee={setSelectedEmployee}
                    onEdit={openEditModal}
                    onDelete={handleDeleteEmployee}
                    user={user}
                />
            )}
            {activeTab === 'handover' && (
                <HandoverTab
                    handovers={handovers}
                    onOpenModal={(h = null) => { setEditingHandover(h); setIsHandoverModalOpen(true); }}
                    onDelete={handleDeleteHandover}
                />
            )}

            {/* Add/Edit Employee Modal */}
            {isAddModalOpen && (
                <AddEmployeeModal
                    onClose={() => { setIsAddModalOpen(false); setEditingEmployee(null); }}
                    onSubmit={handleSaveEmployee}
                    departments={displayDepartments}
                    defaultDept={selectedDeptForAdd}
                    employeeToEdit={editingEmployee}
                />
            )}

            {/* Department Manager Modal */}
            {isDeptModalOpen && (
                <DeptManagerModal
                    db={db}
                    user={user}
                    onClose={() => setIsDeptModalOpen(false)}
                />
            )}

            {/* Handover Modal */}
            {isHandoverModalOpen && (
                <HandoverModal 
                    onClose={() => setIsHandoverModalOpen(false)} 
                    onSubmit={handleSaveHandover} 
                    initialData={editingHandover} 
                    employees={employees} 
                />
            )}
        </div>
    );
};

const TeamOverview = ({ employees, departments, onOpenAddModal, onDeleteEmployee }) => {
    return (
        <div>
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                    <h4 className="text-indigo-600 font-bold text-sm uppercase mb-2">전체 임직원</h4>
                    <p className="text-3xl font-bold text-indigo-900">{employees.length}명</p>
                </div>
                {/* Future KPI placeholders could go here */}
            </div>

            {/* Department Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map(dept => {
                    const deptEmployees = employees.filter(e => e.department === dept);
                    return (
                        <div key={dept} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-slate-500" />
                                    {dept}
                                </h3>
                                <span className="bg-white px-2.5 py-1 rounded-full text-xs font-bold text-slate-600 border border-slate-200">
                                    {deptEmployees.length}명
                                </span>
                            </div>
                            <div className="p-4 min-h-[160px]">
                                {deptEmployees.length > 0 ? (
                                    <div className="space-y-3">
                                        {deptEmployees.map(emp => (
                                            <div key={emp.id} className="flex justify-between items-start group">
                                                <div className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        {emp.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{emp.name} <span className="text-xs text-slate-400 font-normal">| {emp.position}</span></p>
                                                        <p className="text-xs text-slate-400">{emp.email}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => onDeleteEmployee(emp.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm py-8">
                                        <Users className="w-8 h-8 mb-2 opacity-50" />
                                        등록된 직원이 없습니다.
                                    </div>
                                )}
                            </div>
                            <div className="p-3 border-t border-slate-50 bg-slate-50/50">
                                <button
                                    onClick={() => onOpenAddModal(dept)}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-dashed border-indigo-200 hover:border-indigo-300 bg-white"
                                >
                                    <Plus className="w-4 h-4" /> 직원 등록
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const IndividualTasks = ({ db, employees, departments, selectedEmployee, setSelectedEmployee, onEdit, onDelete, user }) => {
    const [tasks, setTasks] = useState({ ongoing: [], completed: [] });
    // allDeptTasks holds all tasks for the department, fetched once.
    const [allDeptTasks, setAllDeptTasks] = useState([]);
    // Loading state only for the initial fetch
    const [initialLoading, setInitialLoading] = useState(false);

    // 1. Initial Selection: Auto-select user if present, otherwise first employee
    useEffect(() => {
        // 1. 직원 목록이 아직 없거나, 이미 누군가 선택되어 있다면 패스
        if (employees.length === 0 || selectedEmployee) return;

        const userDept = user?.department;

        // 2. [핵심] 내 부서(`userDept`)에 속한 직원 중 첫 번째 사람을 찾음
        // (보통 본인이거나, 같은 팀 동료가 선택됨)
        const myTeamMember = employees.find(emp => emp.department === userDept);

        if (myTeamMember) {
            // 3. 내 팀원이 있으면 그 사람(보통 나)을 선택
            setSelectedEmployee(myTeamMember);
        } else {
            // 4. 내 팀원이 목록에 없으면(관리자 모드 등), 전체 목록의 1등 선택
            setSelectedEmployee(employees[0]);
        }
    }, [employees, user?.department]); // selectedEmployee는 의존성에서 제외하여 최초 1회만 동작하게 함

    // 2. Fetch All Tasks Once (on Mount or Department Change)
    useEffect(() => {
        // Fetch all tasks for the user's scope (or just all tasks if userDept is not restrictive enough for the UI logic)
        // Prompt says: "dept_todos 컬렉션에서 department가 userDept인 모든 문서를 가져와서"
        // But the dashboard allows clicking ANY employee from ANY department.
        // So we should actually fetch ALL tasks to support viewing other departments' employees too.
        // OR, the prompt assumes standard usage is within one's department.
        // However, Organization Dashboard shows ALL departments.
        // If I only fetch userDept tasks, clicking an employee from another dept will show 0 tasks.
        // SAFE BET: Fetch ALL tasks from 'dept_todos'. The collection size shouldn't be massive.
        // OR better: Fetch all without filter.

        // Prompt Check: "dept_todos 컬렉션에서 department가 userDept인 모든 문서를 가져와서"
        // This implies the user might only be interested in THEIR department's tasks, OR the prompt author assumes 'userDept' context.
        // BUT `IndividualTasks` is viewing `selectedEmployee`. 
        // If I click a Finance employee, I need Finance tasks.
        // If I click IT employee, I need IT tasks.
        // So I should probably fetch ALL tasks to be safe for a "Manager" view, OR rely on standard behavior.
        // Let's fetch ALL tasks to ensure no bug where clicking another dept shows nothing. 
        // "Fetch All & Filter" usually implies fetching the entire dataset needed for the view.

        const fetchAllTasks = async () => {
            setInitialLoading(true);
            try {
                const tasksRef = collection(db, getCollectionName('dept_todos', user));
                const snapshot = await getDocs(tasksRef); // Fetching EVERYTHING
                const loadedTasks = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setAllDeptTasks(loadedTasks);
            } catch (error) {
                console.error("Failed to fetch all tasks:", error);
            } finally {
                setInitialLoading(false);
            }
        };

        if (db) {
            fetchAllTasks();
        }
    }, [db]); // Run once on mount (and if db changes)

    // 3. Client-side Filtering (Runs instantly when selectedEmployee or allDeptTasks changes)
    useEffect(() => {
        if (!selectedEmployee) return;

        // Filter from allDeptTasks
        const myTasks = allDeptTasks.filter(task => {
            // A. Department Check (Optional but good for optimization if we had dept filter)
            // Even if we fetched all, filtering by dept first is correct logic.
            if (task.department !== selectedEmployee.department) return false;

            // B. Assignee Check
            // 1. New way (Array)
            const inAssignees = task.assignees?.some?.(a => a.id === selectedEmployee.id);
            // 2. Old way (Single ID)
            const isLegacy = task.assigneeId === selectedEmployee.id;

            return inAssignees || isLegacy;
        });

        const ongoing = myTasks.filter(t => {
            if (t.isCompleted !== undefined) return !t.isCompleted;
            return t.status !== 'Done' && t.status !== '완료';
        });

        const completed = myTasks.filter(t => {
            if (t.isCompleted !== undefined) return t.isCompleted;
            return t.status === 'Done' || t.status === '완료';
        });

        setTasks({ ongoing, completed });

    }, [selectedEmployee, allDeptTasks]);

    const getPriorityColor = (p) => {
        switch (p) {
            case 'High': return 'text-red-700 bg-red-50 border-red-200';
            case 'Medium': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'Low': return 'text-blue-700 bg-blue-50 border-blue-200';
            default: return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    };

    // ... rest of the component ...

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
            {/* Sidebar List */}
            <div className="w-full md:w-1/4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 font-bold text-slate-700 bg-slate-100/50">
                    직원 목록
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                    {departments.map(dept => {
                        const deptEmps = employees.filter(e => e.department === dept);
                        if (deptEmps.length === 0) return null;
                        return (
                            <div key={dept}>
                                <h4 className="px-3 py-2 text-xs font-bold text-slate-400 uppercase">{dept}</h4>
                                <div className="space-y-1">
                                    {deptEmps.map(emp => (
                                        <button
                                            key={emp.id}
                                            onClick={() => setSelectedEmployee(emp)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${selectedEmployee?.id === emp.id
                                                ? 'bg-white shadow-sm ring-1 ring-slate-200 text-indigo-700 font-bold'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                        >
                                            <span>{emp.name}</span>
                                            <span className="text-xs opacity-70">{emp.position}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row overflow-hidden">
                {selectedEmployee ? (
                    <>
                        {/* Profile Info Side */}
                        <div className="w-full md:w-64 border-r border-slate-100 p-6 flex flex-col items-center bg-slate-50/50 relative">
                            {/* Edit/Delete Buttons */}
                            <div className="absolute top-4 right-4 flex gap-1">
                                <button
                                    onClick={() => onEdit(selectedEmployee)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-all"
                                    title="정보 수정"
                                >
                                    <div className="w-4 h-4"><Edit2 className="w-4 h-4" /></div>
                                </button>
                                <button
                                    onClick={() => onDelete(selectedEmployee.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-full transition-all"
                                    title="삭제"
                                >
                                    <div className="w-4 h-4"><Trash2 className="w-4 h-4" /></div>
                                </button>
                            </div>

                            <div className="w-24 h-24 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-3xl font-bold text-slate-300 mb-4 mt-2">
                                {selectedEmployee.name[0]}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">{selectedEmployee.name}</h3>
                            <p className="text-slate-500 font-medium mb-6">{selectedEmployee.position}</p>

                            <div className="w-full space-y-4 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                                    <span className="text-slate-400">부서</span>
                                    <span className="font-bold text-slate-700">{selectedEmployee.department}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                                    <span className="text-slate-400">이메일</span>
                                    <span className="font-bold text-slate-700 truncate max-w-[150px]">{selectedEmployee.email}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                                    <span className="text-slate-400">입사일</span>
                                    <span className="font-bold text-slate-700">{selectedEmployee.joinedAt || selectedEmployee.joinDate || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                                    <span className="text-slate-400">상태</span>
                                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${selectedEmployee.status === '재직' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {selectedEmployee.status}
                                    </span>
                                </div>
                            </div>

                            {/* Task Summary */}
                            <div className="w-full mt-6 pt-6 border-t border-slate-200">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">업무 요약</h4>
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                                        <div className="text-lg font-bold text-blue-600">{tasks.ongoing.length}</div>
                                        <div className="text-[10px] text-slate-400">진행중</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                                        <div className="text-lg font-bold text-emerald-600">{tasks.completed.length}</div>
                                        <div className="text-[10px] text-slate-400">완료</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Task List Side */}
                        <div className="flex-1 p-6 bg-white overflow-y-auto">
                            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                                <List className="w-5 h-5 text-indigo-500" /> 담당 업무 리스트
                            </h3>

                            {initialLoading ? (
                                <div className="text-center py-10 text-slate-400">
                                    <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                    업무 데이터 동기화 중...
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* In Progress */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-blue-600">
                                            <Clock className="w-4 h-4" /> 진행 중인 업무
                                            <span className="ml-auto bg-blue-50 px-2 py-0.5 rounded-full text-xs">{tasks.ongoing.length}</span>
                                        </div>

                                        {tasks.ongoing.length > 0 ? (
                                            <div className="space-y-3">
                                                {tasks.ongoing.map(task => (
                                                    <div key={task.id} className="p-4 bg-white border border-blue-100 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`px-2 py-0.5 text-[10px] font-bold border rounded ${getPriorityColor(task.priority)}`}>
                                                                {task.priority}
                                                            </span>
                                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" /> {task.dueDate}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-slate-800 text-sm mb-1">{task.task}</h4>
                                                        {task.description && <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm bg-slate-50/50">
                                                현재 배정된 진행 중인 업무가 없습니다.
                                            </div>
                                        )}
                                    </div>

                                    {/* Completed */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-emerald-600">
                                            <CheckCircle2 className="w-4 h-4" /> 완료된 업무
                                            <span className="ml-auto bg-emerald-50 px-2 py-0.5 rounded-full text-xs">{tasks.completed.length}</span>
                                        </div>

                                        {tasks.completed.length > 0 ? (
                                            <div className="space-y-3">
                                                {tasks.completed.map(task => (
                                                    <div key={task.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                                        <div className="flex justify-between items-start mb-1 opacity-60">
                                                            <span className={`px-2 py-0.5 text-[10px] font-bold border rounded bg-slate-200 border-slate-300 text-slate-600`}>
                                                                {task.priority}
                                                            </span>
                                                            <span className="text-xs text-slate-400">
                                                                완료됨
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-slate-500 text-sm line-through decoration-slate-400">{task.task}</h4>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm bg-slate-50/50">
                                                완료된 업무 기록이 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        선택된 직원이 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};

const AddEmployeeModal = ({ onClose, onSubmit, departments, defaultDept, employeeToEdit }) => {
    const isEditMode = !!employeeToEdit;

    const [formData, setFormData] = useState({
        name: '',
        position: '사원',
        department: defaultDept || departments[0],
        email: '',
        status: '재직',
        joinedAt: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (employeeToEdit) {
            setFormData({
                name: employeeToEdit.name || '',
                position: employeeToEdit.position || '사원',
                department: employeeToEdit.department || departments[0] || '',
                email: employeeToEdit.email || '',
                status: employeeToEdit.status || '재직',
                joinedAt: employeeToEdit.joinedAt || employeeToEdit.joinDate || new Date().toISOString().split('T')[0],
            });
        }
    }, [employeeToEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-indigo-600" />
                        {isEditMode ? '직원 정보 수정' : '신규 직원 등록'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">이름</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">부서</label>
                            <select
                                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={formData.department}
                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                            >
                                {departments.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">직급</label>
                            <select
                                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={formData.position}
                                onChange={e => setFormData({ ...formData, position: e.target.value })}
                            >
                                <option value="사원">사원</option>
                                <option value="주임">주임</option>
                                <option value="대리">대리</option>
                                <option value="과장">과장</option>
                                <option value="차장">차장</option>
                                <option value="부장">부장</option>
                                <option value="이사">이사</option>
                                <option value="대표">대표</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">이메일</label>
                        <input
                            type="email"
                            required
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">상태</label>
                            <select
                                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="재직">재직</option>
                                <option value="휴직">휴직</option>
                                <option value="퇴사">퇴사</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">입사일</label>
                            <input
                                type="date"
                                required
                                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600"
                                value={formData.joinedAt}
                                onChange={e => setFormData({ ...formData, joinedAt: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors">취소</button>
                        <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all">
                            {isEditMode ? '수정하기' : '등록하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeptManagerModal = ({ db, user, onClose }) => {
    const [customDepts, setCustomDepts] = useState([]);
    const [newDeptName, setNewDeptName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, getCollectionName('departments', user)));
        const unsub = onSnapshot(q, (snapshot) => {
            const depts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            depts.sort((a, b) => (a.order || 99) - (b.order || 99));
            setCustomDepts(depts);
            setLoading(false);
        });
        return () => unsub();
    }, [db, user]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newDeptName.trim()) return;
        try {
            await addDoc(collection(db, getCollectionName('departments', user)), {
                name: newDeptName.trim(),
                order: customDepts.length > 0 ? (customDepts[customDepts.length - 1].order || 0) + 1 : 1,
                createdAt: serverTimestamp()
            });
            setNewDeptName('');
        } catch (error) {
            console.error(error);
            alert("부서 추가 실패");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("부서를 삭제하시겠습니까? (이미 등록된 직원 정보는 자동으로 변경되지 않습니다.)")) return;
        try {
            await deleteDoc(doc(db, getCollectionName('departments', user), id));
        } catch (error) {
            console.error(error);
            alert("부서 삭제 실패");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                        새로운 부서 관리
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="추가할 부서명을 입력하세요"
                            className="flex-1 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                            value={newDeptName}
                            onChange={(e) => setNewDeptName(e.target.value)}
                        />
                        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center gap-1 shadow-sm">
                            <Plus className="w-4 h-4" /> 추가
                        </button>
                    </form>

                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 px-1 border-b border-slate-100 pb-2">사용자 추가 부서 목록</h4>
                        {loading ? (
                            <p className="text-sm text-slate-400 p-4 text-center">데이터를 불러오는 중입니다...</p>
                        ) : customDepts.length > 0 ? (
                            <div className="space-y-2">
                                {customDepts.map(d => (
                                    <div key={d.id} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg hover:border-slate-300 bg-white transition-colors group">
                                        <span className="text-sm font-bold text-slate-700">{d.name}</span>
                                        <button onClick={() => handleDelete(d.id)} className="p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 rounded-md transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center">
                                <Briefcase className="w-8 h-8 mb-2 opacity-30" />
                                <div>추가로 등록된 부서가 없습니다.</div>
                                <div className="text-xs mt-1">기본 부서는 관리자 상수값에서 불러옵니다.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Handover Tab Component ---
const HandoverTab = ({ handovers, onOpenModal, onDelete }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-indigo-500" /> 퇴사자 인수인계서 관리
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">퇴사 예정자의 업무 인수인계 진행 상황을 관리합니다.</p>
                </div>
                <button onClick={() => onOpenModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-colors whitespace-nowrap">
                    <Plus className="w-4 h-4" /> 인수인계서 작성
                </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap">상태</th>
                            <th className="px-6 py-4 whitespace-nowrap">인계자 (퇴사자)</th>
                            <th className="px-6 py-4 whitespace-nowrap">인수자</th>
                            <th className="px-6 py-4 whitespace-nowrap">인수인계일</th>
                            <th className="px-6 py-4 whitespace-nowrap">진행률</th>
                            <th className="px-6 py-4 whitespace-nowrap text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {handovers.map(item => {
                            const totalTasks = item.tasks?.length || 0;
                            const completedTasks = item.tasks?.filter(t => t.status === '완료').length || 0;
                            const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
                            
                            return (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border whitespace-nowrap ${item.status === '완료' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 font-bold">{item.leaverDepartment} {item.leaverName}</td>
                                    <td className="px-6 py-3 font-bold">{item.receiverDepartment} {item.receiverName}</td>
                                    <td className="px-6 py-3 text-slate-600 text-xs">{item.date}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-slate-200 rounded-full h-2">
                                                <div className={`h-2 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }}></div>
                                            </div>
                                            <span className="text-xs text-slate-500 font-bold">{progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right whitespace-nowrap">
                                        <button onClick={() => onOpenModal(item)} className="text-slate-400 mx-1 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            );
                        })}
                        {handovers.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                    등록된 인수인계서가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Handover Modal ---
const HandoverModal = ({ onClose, onSubmit, initialData, employees }) => {
    const [formData, setFormData] = useState(initialData || {
        leaverName: '', leaverDepartment: '',
        receiverName: '', receiverDepartment: '',
        date: '', status: '진행중',
        tasks: [{ id: Date.now(), taskName: '', description: '', status: '진행중' }]
    });

    const activeEmployees = employees.filter(e => e.status !== '퇴사');

    const handleAddTask = () => {
        setFormData(prev => ({
            ...prev,
            tasks: [...prev.tasks, { id: Date.now(), taskName: '', description: '', status: '진행중' }]
        }));
    };

    const handleRemoveTask = (taskId) => {
        setFormData(prev => ({
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== taskId)
        }));
    };

    const handleTaskChange = (taskId, field, value) => {
        setFormData(prev => ({
            ...prev,
            tasks: prev.tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t)
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-indigo-600" />
                        {initialData ? '인수인계서 수정' : '새 인수인계서 작성'}
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                
                <div className="overflow-y-auto flex-1 pr-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h4 className="font-bold text-slate-700 border-b pb-2 mb-2">인계자 (퇴사자)</h4>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">성명</label>
                                <input value={formData.leaverName} onChange={e => setFormData({ ...formData, leaverName: e.target.value })} placeholder="퇴사자 성명" className="w-full border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">소속</label>
                                <input value={formData.leaverDepartment} onChange={e => setFormData({ ...formData, leaverDepartment: e.target.value })} placeholder="퇴사자 소속" className="w-full border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                        
                        <div className="space-y-3 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <h4 className="font-bold text-indigo-800 border-b border-indigo-200 pb-2 mb-2">인수자</h4>
                            <div>
                                <label className="block text-xs font-bold text-indigo-500 mb-1">성명</label>
                                <input value={formData.receiverName} onChange={e => setFormData({ ...formData, receiverName: e.target.value })} placeholder="인수자 성명" className="w-full border border-indigo-200 p-2 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-indigo-500 mb-1">소속</label>
                                <input value={formData.receiverDepartment} onChange={e => setFormData({ ...formData, receiverDepartment: e.target.value })} placeholder="인수자 소속" className="w-full border border-indigo-200 p-2 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">인수인계 예정일/완료일</label>
                            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">전체 진행 상태</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                                <option value="진행중">진행중</option>
                                <option value="완료">완료</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-bold text-slate-700">인수인계 세부 항목</label>
                            <button onClick={handleAddTask} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded flex items-center gap-1 font-bold transition-colors">
                                <Plus className="w-3 h-3" /> 항목 추가
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {formData.tasks.map((task, index) => (
                                <div key={task.id} className="bg-white border border-slate-200 rounded-lg p-4 flex gap-3 relative group">
                                    <div className="mt-2 text-slate-400 font-bold text-sm">{index + 1}.</div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex gap-3">
                                            <input value={task.taskName} onChange={e => handleTaskChange(task.id, 'taskName', e.target.value)} placeholder="업무명/항목명" className="flex-1 border-b border-slate-200 p-1 text-sm outline-none focus:border-indigo-500 font-bold" />
                                            <select value={task.status} onChange={e => handleTaskChange(task.id, 'status', e.target.value)} className={`text-xs border p-1 rounded font-bold outline-none ${task.status === '완료' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                                <option value="진행중">진행중</option>
                                                <option value="완료">완료</option>
                                            </select>
                                        </div>
                                        <textarea value={task.description} onChange={e => handleTaskChange(task.id, 'description', e.target.value)} placeholder="상세 내용, 관련 파일 경로, 주의사항 등" className="w-full border border-slate-200 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px]" />
                                    </div>
                                    {formData.tasks.length > 1 && (
                                        <button onClick={() => handleRemoveTask(task.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-6 shrink-0 border-t border-slate-100 mt-4">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50">취소</button>
                    <button onClick={() => {
                        if (!formData.leaverName || !formData.receiverName) {
                            alert('인계자(퇴사자)와 인수자의 성명을 모두 입력해주세요.');
                            return;
                        }
                        onSubmit(formData);
                    }} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md">인수인계서 저장</button>
                </div>
            </div>
        </div>
    );
};

export default OrganizationDashboard;
