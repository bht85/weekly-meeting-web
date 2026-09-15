import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getCollectionName } from './utils';
import { Shield, CheckSquare, Square, Plus } from 'lucide-react';

const PermissionAdmin = ({ db, user, navItems, departments = [] }) => {
    const [employees, setEmployees] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [newEmail, setNewEmail] = useState('');
    
    useEffect(() => {
        if (!db) return;
        const fetchEmployees = async () => {
            try {
                const snap = await getDocs(collection(db, getCollectionName('employees', user)));
                const emps = snap.docs.map(d => d.data()).filter(e => e.email);
                
                // 중복 이메일 제거
                const uniqueEmps = [];
                const emailSet = new Set();
                emps.forEach(e => {
                    if (!emailSet.has(e.email)) {
                        emailSet.add(e.email);
                        uniqueEmps.push(e);
                    }
                });
                
                // 조직도(departments)에 존재하는 부서의 직원만 필터링 (조직도 기준 정렬)
                const activeEmps = uniqueEmps.filter(e => departments.includes(e.department));
                activeEmps.sort((a, b) => {
                    const deptA = departments.indexOf(a.department);
                    const deptB = departments.indexOf(b.department);
                    if (deptA !== deptB) return deptA - deptB;
                    return (a.name || '').localeCompare(b.name || '');
                });
                
                setEmployees(activeEmps);
            } catch (err) {
                console.error("Error fetching employees:", err);
            }
        };
        fetchEmployees();
    }, [db, user, departments]);

    useEffect(() => {
        if (!db) return;
        const unsub = onSnapshot(doc(db, 'system_config', 'tab_permissions'), (docSnap) => {
            if (docSnap.exists()) {
                setPermissions(docSnap.data());
            } else {
                setPermissions({});
            }
        });
        return () => unsub();
    }, [db]);

    const handleToggle = async (email, tabId, defaultState) => {
        const userPerms = permissions[email] || {};
        const currentState = userPerms[tabId] !== undefined ? userPerms[tabId] : defaultState;
        
        const newPerms = {
            ...permissions,
            [email]: {
                ...userPerms,
                [tabId]: !currentState
            }
        };
        
        setPermissions(newPerms); // Optimistic UI
        await setDoc(doc(db, 'system_config', 'tab_permissions'), newPerms);
    };

    const handleAddManualEmail = () => {
        if (!newEmail || !newEmail.includes('@')) return;
        setEmployees(prev => {
            if (prev.find(e => e.email === newEmail)) return prev;
            return [...prev, { name: '수동입력', department: '-', email: newEmail }];
        });
        setNewEmail('');
    };

    const defaultVisible = ['news', 'calendar', 'budget', 'lunch', 'franchise'];
    const adminEmails = ['choihy@composrcoffee.co.kr', 'choihy@composecoffee.co.kr'];
    
    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Shield className="w-6 h-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-slate-800">메뉴 권한 관리</h1>
            </div>
            <p className="text-sm text-slate-500 mb-6">각 사용자별로 노출할 탭을 켜고 끌 수 있습니다. (조직도에 등록된 이메일 기준)</p>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-slate-700">이름</th>
                                <th className="px-4 py-3 font-semibold text-slate-700">부서</th>
                                <th className="px-4 py-3 font-semibold text-slate-700">이메일</th>
                                {navItems.map(item => {
                                    if (item.id === 'permissions') return null;
                                    return (
                                        <th key={item.id} className="px-2 py-3 font-semibold text-slate-700 text-center">
                                            {item.label}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employees.map(emp => {
                                const isSuperAdmin = adminEmails.includes(emp.email);
                                return (
                                    <tr key={emp.email} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-800">{emp.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{emp.department}</td>
                                        <td className="px-4 py-3 text-slate-500">{emp.email}</td>
                                        {navItems.map(item => {
                                            if (item.id === 'permissions') return null;
                                            
                                            // Determine base permission if not explicitly set
                                            const isDefault = defaultVisible.includes(item.id);
                                            // By default, admin emails see everything. Others see default.
                                            const hasAdminAccess = adminEmails.includes(emp.email);
                                            const isDefaultState = hasAdminAccess ? true : isDefault;
                                            
                                            const userPerms = permissions[emp.email] || {};
                                            const isGranted = userPerms[item.id] !== undefined ? userPerms[item.id] : isDefaultState;
                                            
                                            return (
                                                <td key={item.id} className="px-2 py-3 text-center">
                                                    <button
                                                        onClick={() => handleToggle(emp.email, item.id, isDefaultState)}
                                                        disabled={isSuperAdmin}
                                                        className={`p-1 rounded ${isSuperAdmin ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}
                                                    >
                                                        {isGranted ? (
                                                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-slate-300" />
                                                        )}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {/* Manual Email Add */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
                    <input 
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="목록에 없는 이메일 수동 추가..."
                        className="px-3 py-1.5 border border-slate-300 rounded text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                        onClick={handleAddManualEmail}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700"
                    >
                        <Plus className="w-4 h-4" /> 추가
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermissionAdmin;
