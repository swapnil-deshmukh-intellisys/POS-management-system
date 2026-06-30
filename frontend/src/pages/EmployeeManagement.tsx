import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Calendar,
  Clock,
  Briefcase,
  Shield,
  DollarSign,
  Loader2,
  Plus,
  LayoutDashboard
} from 'lucide-react';

// Subcomponents imports
import { DashboardView } from './employee/DashboardView';
import { EmployeeDirectoryView } from './employee/EmployeeDirectoryView';
import { EmployeeProfileDrawer } from './employee/EmployeeProfileDrawer';
import { AttendanceView } from './employee/AttendanceView';
import { ShiftView } from './employee/ShiftView';
import { LeaveView } from './employee/LeaveView';
import { SalaryView } from './employee/SalaryView';
import { ManagersView } from './employee/ManagersView';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  email: string | null;
  department: string;
  role: string;
  joiningDate: string;
  shift: string;
  employmentType: string;
  salary: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  waiterProfile?: {
    id: string;
    ordersServed: number;
    salesHandled: number;
    tableAssignments?: {
      id: string;
      tableNumber: string;
    }[];
  } | null;
  photo?: string | null;
  attendance?: any[];
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakTime: string;
  applicableRoles: string[];
  restaurantId: string;
}

export interface Leave {
  id: string;
  employeeId: string;
  leaveType: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  employee?: {
    name: string;
    role: string;
    employeeId: string;
  };
}

export interface Salary {
  id: string;
  employeeId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  bonus: number;
  netSalary: number;
  paymentStatus: string;
  paymentDate: string | null;
  createdAt: string;
  employee?: {
    name: string;
    role: string;
    employeeId: string;
    department: string;
  };
}

export interface TableInfo {
  id: string;
  tableNumber: string;
  seatingCapacity: number;
  status: string;
}

export interface Stats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  onLeaveToday: number;
  salaryProcessing: number;
  recentActivities: {
    id: string;
    action: string;
    details: string | null;
    timestamp: string;
    employee: {
      name: string;
      role: string;
    };
  }[];
}

// Bi-directional Department ↔ Role Mapping
const DEPARTMENT_ROLES_MAP: Record<string, string[]> = {
  Kitchen: ['Head Chef', 'Sous Chef', 'Chef', 'Kitchen Staff', 'Helper'],
  Service: ['Waiter', 'Senior Waiter', 'Captain'],
  Billing: ['Cashier', 'Billing Executive'],
  Inventory: ['Inventory Manager', 'Store Keeper'],
  Management: ['Manager', 'Assistant Manager', 'Admin'],
  Security: ['Security Guard', 'Supervisor'],
  Cleaning: ['Housekeeping', 'Cleaner']
};

const getDeptFromRole = (role: string): string => {
  for (const [dept, roles] of Object.entries(DEPARTMENT_ROLES_MAP)) {
    if (roles.includes(role)) return dept;
  }
  return 'Others';
};

export const EmployeeManagement: React.FC = () => {
  const { user, apiRequest } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'attendance' | 'shifts' | 'leaves' | 'salaries' | 'managers'>('dashboard');
  const [directoryViewMode, setDirectoryViewMode] = useState<'card' | 'table'>('card');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Core Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter State (Passed to directory subview)
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Add/Edit Shift Form Modal
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftName, setShiftName] = useState('');
  const [shiftStart, setShiftStart] = useState('09:00 AM');
  const [shiftEnd, setShiftEnd] = useState('05:00 PM');
  const [shiftBreak, setShiftBreak] = useState('30 mins');
  const [shiftRoles, setShiftRoles] = useState<string[]>([]);

  // Form States (Add/Edit Employee)
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDept, setFormDept] = useState('Service');
  const [formRole, setFormRole] = useState('Waiter');
  const [formJoinDate, setFormJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [formShift, setFormShift] = useState('General');
  const [formEmpType, setFormEmpType] = useState('Full-time');
  const [formSalary, setFormSalary] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCreateLogin, setFormCreateLogin] = useState(false);
  const [formPassword, setFormPassword] = useState('');
  const [formPhoto, setFormPhoto] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('Image size should be less than 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormPhoto(null);
  };

  const [selectedWaiterId, setSelectedWaiterId] = useState<string>('');
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const loadData = async () => {
    setLoading(true);
    const restId = user?.restaurantId || 'mock-id';

    const fetchResource = async (url: string, setter: (data: any) => void, errorMsg: string) => {
      try {
        const data = await apiRequest(url);
        setter(data);
      } catch (err: any) {
        console.error(`${errorMsg}:`, err);
        if (url.includes('/employees?')) {
          addToast(`Failed to load employee directory: ${err.message}`, 'error');
        }
      }
    };

    await Promise.allSettled([
      fetchResource(`/restaurant/employees?restaurantId=${restId}`, setEmployees, 'Failed to load employees'),
      fetchResource(`/restaurant/employees/stats?restaurantId=${restId}`, setStats, 'Failed to load statistics'),
      fetchResource(`/restaurant/shifts?restaurantId=${restId}`, setShifts, 'Failed to load shifts'),
      fetchResource(`/restaurant/leaves?restaurantId=${restId}`, setLeaves, 'Failed to load leave requests'),
      fetchResource(`/restaurant/salaries?restaurantId=${restId}`, setSalaries, 'Failed to load salaries'),
      fetchResource(`/restaurant/tables?restaurantId=${restId}`, (data) => setTables(data.filter((t: any) => t.status !== 'DEACTIVATED')), 'Failed to load tables')
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeptChange = (dept: string) => {
    setFormDept(dept);
    const availableRoles = DEPARTMENT_ROLES_MAP[dept] || [];
    if (availableRoles.length > 0 && !availableRoles.includes(formRole)) {
      setFormRole(availableRoles[0]);
    }
  };

  const handleRoleChange = (role: string) => {
    setFormRole(role);
    const matchingDept = getDeptFromRole(role);
    if (matchingDept !== 'Others') {
      setFormDept(matchingDept);
    }
  };

  // --- CRUD HANDLERS ---
  const handleOpenAddModal = () => {
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormDept('Service');
    setFormRole('Waiter');
    setFormJoinDate(new Date().toISOString().split('T')[0]);
    setFormShift('General');
    setFormEmpType('Full-time');
    setFormSalary('');
    setFormNotes('');
    setFormCreateLogin(false);
    setFormPassword('');
    setFormPhoto(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormName(emp.name);
    setFormPhone(emp.phone);
    setFormEmail(emp.email || '');
    setFormDept(emp.department);
    setFormRole(emp.role);
    setFormJoinDate(new Date(emp.joiningDate).toISOString().split('T')[0]);
    setFormShift(emp.shift);
    setFormEmpType(emp.employmentType);
    setFormSalary(emp.salary ? String(emp.salary) : '');
    setFormNotes(emp.notes || '');
    setFormPhoto(emp.photo || null);
    setShowEditModal(true);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || formPhone.length !== 10) {
      addToast('Please fill all required fields correctly (Phone must be 10 digits).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/restaurant/employees', {
        method: 'POST',
        body: JSON.stringify({
          restaurantId: user?.restaurantId || 'mock-id',
          name: formName,
          phone: formPhone,
          email: formEmail || undefined,
          department: formDept,
          role: formRole,
          joiningDate: formJoinDate,
          shift: formShift,
          employmentType: formEmpType,
          salary: formSalary ? parseFloat(formSalary) : undefined,
          notes: formNotes || undefined,
          createLogin: formCreateLogin,
          password: formCreateLogin ? formPassword : undefined,
          photo: formPhoto || undefined
        })
      });
      addToast('Employee registered successfully!', 'success');
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to register employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !formName || formPhone.length !== 10) {
      addToast('Please fill all required fields correctly (Phone must be 10 digits).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(`/restaurant/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formName,
          phone: formPhone,
          email: formEmail || undefined,
          department: formDept,
          role: formRole,
          joiningDate: formJoinDate,
          shift: formShift,
          employmentType: formEmpType,
          salary: formSalary ? parseFloat(formSalary) : undefined,
          status: selectedEmployee.status,
          notes: formNotes || undefined,
          photo: formPhoto || null
        })
      });
      addToast('Employee profile updated successfully!', 'success');
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to update employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // --- ATTENDANCE HANDLERS ---
  const handleUpdateAttendance = async (employeeId: string, attendanceData: any) => {
    try {
      await apiRequest(`/restaurant/employees/${employeeId}/attendance`, {
        method: 'POST',
        body: JSON.stringify(attendanceData)
      });
      addToast('Attendance updated successfully', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to log attendance', 'error');
    }
  };

  // --- SHIFTS HANDLERS ---
  const handleOpenAddShift = () => {
    setEditingShift(null);
    setShiftName('');
    setShiftStart('09:00 AM');
    setShiftEnd('05:00 PM');
    setShiftBreak('30 mins');
    setShiftRoles([]);
    setShowShiftModal(true);
  };

  const handleOpenEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setShiftName(shift.name);
    setShiftStart(shift.startTime);
    setShiftEnd(shift.endTime);
    setShiftBreak(shift.breakTime);
    setShiftRoles(shift.applicableRoles);
    setShowShiftModal(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName || !shiftStart || !shiftEnd) {
      addToast('Please fill all required shift fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingShift) {
        await apiRequest(`/restaurant/shifts/${editingShift.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: shiftName,
            startTime: shiftStart,
            endTime: shiftEnd,
            breakTime: shiftBreak,
            applicableRoles: shiftRoles
          })
        });
        addToast('Shift configuration updated successfully', 'success');
      } else {
        await apiRequest('/restaurant/shifts', {
          method: 'POST',
          body: JSON.stringify({
            name: shiftName,
            startTime: shiftStart,
            endTime: shiftEnd,
            breakTime: shiftBreak,
            applicableRoles: shiftRoles,
            restaurantId: user?.restaurantId || 'mock-id'
          })
        });
        addToast('New shift created successfully', 'success');
      }
      setShowShiftModal(false);
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to save shift', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shift schedule?')) return;
    try {
      await apiRequest(`/restaurant/shifts/${id}`, { method: 'DELETE' });
      addToast('Shift schedule deleted', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete shift', 'error');
    }
  };

  const toggleRoleInShift = (role: string) => {
    setShiftRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  // --- LEAVE HANDLERS ---
  const handleCreateLeave = async (leaveData: any) => {
    try {
      await apiRequest('/restaurant/leaves', {
        method: 'POST',
        body: JSON.stringify({
          ...leaveData,
          restaurantId: user?.restaurantId || 'mock-id'
        })
      });
      addToast('Leave request filed successfully', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to file leave request', 'error');
    }
  };

  const handleUpdateLeaveStatus = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      await apiRequest(`/restaurant/leaves/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      addToast(`Leave request ${newStatus.toLowerCase()} successfully`, 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to update leave status', 'error');
    }
  };

  // --- SALARY PAYROLL HANDLERS ---
  const handleProcessSalary = async (salaryData: any) => {
    try {
      await apiRequest('/restaurant/salaries/process', {
        method: 'POST',
        body: JSON.stringify({
          ...salaryData,
          restaurantId: user?.restaurantId || 'mock-id'
        })
      });
      addToast('Payroll slip processed successfully', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to process payroll', 'error');
    }
  };

  const handleUpdateSalaryStatus = async (id: string, newStatus: 'Paid' | 'Unpaid') => {
    try {
      await apiRequest(`/restaurant/salaries/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ paymentStatus: newStatus })
      });
      addToast(`Salary payment status marked as ${newStatus}`, 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to update salary status', 'error');
    }
  };

  // --- TABLE ASSIGNMENTS HANDLERS ---
  const handleToggleTableAssignment = async (tableNum: string, isAssigned: boolean) => {
    if (!selectedWaiterId) return;
    const waiterObj = employees.find(e => e.id === selectedWaiterId);
    if (!waiterObj || !waiterObj.waiterProfile) return;

    const waiterId = waiterObj.waiterProfile.id;
    const endpoint = isAssigned ? '/restaurant/waiters/unassign' : '/restaurant/waiters/assign';

    try {
      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          waiterId,
          tableNumber: tableNum,
          restaurantId: user?.restaurantId || 'mock-id'
        })
      });
      addToast(`Table ${tableNum} ${isAssigned ? 'unassigned' : 'assigned'} successfully`, 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to update table assignment', 'error');
    }
  };

  const handleClearAllAssignments = async (emp: Employee) => {
    if (!emp.waiterProfile || !emp.waiterProfile.tableAssignments || emp.waiterProfile.tableAssignments.length === 0) {
      addToast('No assigned tables to clear', 'success');
      return;
    }
    const waiterId = emp.waiterProfile.id;
    try {
      for (const assignment of emp.waiterProfile.tableAssignments) {
        await apiRequest('/restaurant/waiters/unassign', {
          method: 'POST',
          body: JSON.stringify({
            waiterId,
            tableNumber: assignment.tableNumber,
            restaurantId: user?.restaurantId || 'mock-id'
          })
        });
      }
      addToast(`Cleared all table assignments for ${emp.name}`, 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to clear assignments', 'error');
    }
  };



  if (loading && employees.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-['Outfit']">
        <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
        <span className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">Loading Staff ERP Core...</span>
      </div>
    );
  }

  const getEffectiveRoleLocal = (u: any) => {
    if (!u) return 'ADMIN';
    if (u.employee?.role) {
      const r = u.employee.role.toLowerCase();
      if (r.includes('admin')) return 'ADMIN';
      if (r.includes('manager')) return 'MANAGER';
      if (r.includes('waiter') || r.includes('captain')) return 'WAITER';
      if (r.includes('chef')) return 'CHEF';
      if (r.includes('kitchen') || r.includes('helper')) return 'KITCHEN';
      if (r.includes('inventory') || r.includes('keeper')) return 'INVENTORY';
      if (r.includes('cashier') || r.includes('billing')) return 'CASHIER';
      return 'EMPLOYEE';
    }
    return u.role;
  };

  const role = getEffectiveRoleLocal(user);
  const isManagerOrAdmin = role === 'ADMIN' || role === 'MANAGER';
  const employeeId = user?.employee?.id;

  const filteredEmployees = isManagerOrAdmin 
    ? employees 
    : employees.filter(e => e.id === employeeId);

  const filteredLeaves = isManagerOrAdmin 
    ? leaves 
    : leaves.filter(l => l.employeeId === employeeId);

  const filteredSalaries = isManagerOrAdmin 
    ? salaries 
    : salaries.filter(s => s.employeeId === employeeId);

  const shiftsList = shifts.map(s => s.name);
  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary'];

  const allTabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
    { id: 'employees', label: 'Staff Directory', icon: Users, roles: ['ADMIN', 'MANAGER'] },
    { id: 'attendance', label: isManagerOrAdmin ? 'Attendance Console' : 'My Attendance', icon: Calendar, roles: ['ADMIN', 'MANAGER', 'WAITER', 'CHEF', 'KITCHEN', 'INVENTORY', 'CASHIER', 'EMPLOYEE'] },
    { id: 'shifts', label: isManagerOrAdmin ? 'Shifts & Timelines' : 'My Shifts', icon: Clock, roles: ['ADMIN', 'MANAGER', 'WAITER', 'CHEF', 'KITCHEN', 'INVENTORY', 'CASHIER', 'EMPLOYEE'] },
    { id: 'leaves', label: isManagerOrAdmin ? 'Leave Approvals' : 'My Leaves', icon: Briefcase, roles: ['ADMIN', 'MANAGER', 'WAITER', 'CHEF', 'KITCHEN', 'INVENTORY', 'CASHIER', 'EMPLOYEE'] },
    { id: 'salaries', label: isManagerOrAdmin ? 'Salary Ledger' : 'My Salaries', icon: DollarSign, roles: ['ADMIN', 'MANAGER', 'WAITER', 'CHEF', 'KITCHEN', 'INVENTORY', 'CASHIER', 'EMPLOYEE'] },
    { id: 'managers', label: 'Manager Panel', icon: Shield, roles: ['ADMIN', 'MANAGER'] }
  ];

  const visibleTabs = allTabs.filter(t => t.roles.includes(role));

  return (
    <div className="min-h-screen bg-slate-50 font-['Outfit'] pb-12 antialiased text-left">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
          <h1 className="text-lg font-black text-slate-900 tracking-tight">
            {isManagerOrAdmin ? 'Employee Management' : 'Staff Self-Service Portal'}
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            {isManagerOrAdmin 
              ? 'Centralized roster controls, shifts, payroll matrix, and attendance registers.'
              : `Welcome, ${user?.employee?.name || user?.name || 'Employee'}. View your attendance, shifts, leave requests, and salary slips.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isManagerOrAdmin && user?.employee?.id && (
            <button
              onClick={() => setSelectedProfileId(user.employee!.id)}
              className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4 text-emerald-600" /> View My Full Profile
            </button>
          )}

          {isManagerOrAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Staff Member
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="px-6 py-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 flex flex-wrap gap-1.5 shadow-xs max-w-4xl">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedProfileId(null);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition select-none cursor-pointer ${
                  active 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6">
        {activeTab === 'dashboard' && isManagerOrAdmin && (
          <DashboardView 
            stats={stats} 
            employees={filteredEmployees} 
            onNavigateTab={(tab) => setActiveTab(tab)} 
          />
        )}

        {activeTab === 'employees' && isManagerOrAdmin && (
          <EmployeeDirectoryView
            employees={filteredEmployees}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            deptFilter={deptFilter}
            setDeptFilter={setDeptFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            viewMode={directoryViewMode}
            setViewMode={setDirectoryViewMode}
            onOpenEditModal={handleOpenEditModal}
            onViewProfile={(emp) => setSelectedProfileId(emp.id)}
            onMarkAttendance={(emp) => {
              setSelectedWaiterId(emp.id);
              setActiveTab('attendance');
            }}
            onProcessSalary={() => {
              setActiveTab('salaries');
            }}
            onAssignTable={(emp) => {
              setSelectedWaiterId(emp.id);
              setActiveTab('managers');
            }}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView
            employees={filteredEmployees}
            leaves={filteredLeaves}
            shifts={shifts}
            onUpdateAttendance={handleUpdateAttendance}
            userRole={role}
          />
        )}

        {activeTab === 'shifts' && (
          <ShiftView
            shifts={shifts}
            employees={filteredEmployees}
            onOpenAddShiftModal={handleOpenAddShift}
            onOpenEditShiftModal={handleOpenEditShift}
            onDeleteShift={handleDeleteShift}
            userRole={role}
          />
        )}

        {activeTab === 'leaves' && (
          <LeaveView
            leaves={filteredLeaves}
            employees={filteredEmployees}
            onCreateLeave={handleCreateLeave}
            onUpdateLeaveStatus={handleUpdateLeaveStatus}
            userRole={role}
          />
        )}

        {activeTab === 'salaries' && (
          <SalaryView
            salaries={filteredSalaries}
            employees={filteredEmployees}
            onProcessSalary={handleProcessSalary}
            onUpdateSalaryStatus={handleUpdateSalaryStatus}
            userRole={role}
          />
        )}

        {activeTab === 'managers' && isManagerOrAdmin && (
          <ManagersView
            employees={employees}
            tables={tables}
            onToggleTableAssignment={handleToggleTableAssignment}
            onClearAllAssignments={handleClearAllAssignments}
            selectedWaiterId={selectedWaiterId}
            setSelectedWaiterId={setSelectedWaiterId}
          />
        )}
      </div>

      {/* Side Profile Drawer */}
      {selectedProfileId && (
        <EmployeeProfileDrawer 
          employeeId={selectedProfileId} 
          onClose={() => setSelectedProfileId(null)} 
        />
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto scrollbar-none text-left font-['Outfit']">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider">
                Register New Employee
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4 text-xs font-normal text-slate-650">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition font-bold"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="10-digit number"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition font-bold"
                  />
                  {formPhone !== '' && formPhone.length !== 10 && (
                    <span className="text-rose-600 text-[9px] font-medium block mt-1">Phone number must be exactly 10 digits.</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. john@restaurant.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Joining Date *</label>
                  <input
                    type="date"
                    required
                    value={formJoinDate}
                    onChange={(e) => setFormJoinDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Department *</label>
                  <select
                    value={formDept}
                    onChange={(e) => handleDeptChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-600 transition cursor-pointer font-bold"
                  >
                    {Object.keys(DEPARTMENT_ROLES_MAP).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Role *</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-600 transition cursor-pointer font-bold"
                  >
                    {(DEPARTMENT_ROLES_MAP[formDept] || ['Other']).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Work Shift *</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-600 transition cursor-pointer font-bold"
                  >
                    {shiftsList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Employment *</label>
                  <select
                    value={formEmpType}
                    onChange={(e) => setFormEmpType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-600 transition cursor-pointer font-bold"
                  >
                    {employmentTypes.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Employee Photo (Optional)</label>
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  {formPhoto ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={formPhoto} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute inset-0 bg-black/55 text-white flex items-center justify-center text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-200/50 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="employee-photo-upload-add"
                    />
                    <label
                      htmlFor="employee-photo-upload-add"
                      className="inline-block bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold shadow-xs cursor-pointer transition select-none"
                    >
                      {formPhoto ? 'Change Image' : 'Upload Image'}
                    </label>
                    <p className="text-[9px] text-slate-400 font-semibold mt-1">PNG, JPG, or WEBP. Max 2MB.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Additional Notes</label>
                <textarea
                  placeholder="Employee bio, address, emergency contact, etc."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition resize-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-750 text-xs select-none">
                  <input
                    type="checkbox"
                    checked={formCreateLogin}
                    onChange={(e) => setFormCreateLogin(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-650 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  Configure System Login Credentials
                </label>

                {formCreateLogin && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/65 space-y-3">
                    <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                      This will create a linked User account. Email will be used as username. Waiter role maps to Cashier permissions.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Login Email *</label>
                        <input
                          type="email"
                          required={formCreateLogin}
                          placeholder="john@restaurant.com"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-white transition font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Password *</label>
                        <input
                          type="password"
                          required={formCreateLogin}
                          placeholder="Min 6 characters"
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-white transition font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting || formPhone.length !== 10}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Staff'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto scrollbar-none text-left font-['Outfit']">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider">
                Edit Employee Profile
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleEditEmployee} className="space-y-4 text-xs font-normal text-slate-650">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition font-bold"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition font-bold"
                  />
                  {formPhone !== '' && formPhone.length !== 10 && (
                    <span className="text-rose-650 text-[9px] font-medium block mt-1">Phone number must be exactly 10 digits.</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition font-semibold"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Joining Date *</label>
                  <input
                    type="date"
                    required
                    value={formJoinDate}
                    onChange={(e) => setFormJoinDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Department *</label>
                  <select
                    value={formDept}
                    onChange={(e) => handleDeptChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-600 transition cursor-pointer font-bold"
                  >
                    {Object.keys(DEPARTMENT_ROLES_MAP).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Role *</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-600 transition cursor-pointer font-bold"
                  >
                    {(DEPARTMENT_ROLES_MAP[formDept] || ['Other']).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Work Shift *</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-705 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-600 transition cursor-pointer font-bold"
                  >
                    {shiftsList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Employment *</label>
                  <select
                    value={formEmpType}
                    onChange={(e) => setFormEmpType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-705 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-600 transition cursor-pointer font-bold"
                  >
                    {employmentTypes.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Employee Photo (Optional)</label>
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  {formPhoto ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={formPhoto} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute inset-0 bg-black/55 text-white flex items-center justify-center text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-200/50 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="employee-photo-upload-edit"
                    />
                    <label
                      htmlFor="employee-photo-upload-edit"
                      className="inline-block bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold shadow-xs cursor-pointer transition select-none"
                    >
                      {formPhoto ? 'Change Image' : 'Upload Image'}
                    </label>
                    <p className="text-[9px] text-slate-400 font-semibold mt-1">PNG, JPG, or WEBP. Max 2MB.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Additional Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting || formPhone.length !== 10}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-['Outfit']">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 text-left border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingShift ? 'Edit Shift Schedule' : 'Create New Shift Schedule'}
              </h3>
              <button onClick={() => setShowShiftModal(false)} className="text-slate-450 hover:text-slate-700 cursor-pointer">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-4 text-xs font-semibold text-slate-500">
              <div className="space-y-1">
                <label className="block">Shift Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning, Evening, Night Shift..."
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block">Start Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:00 AM"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block">End Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 05:00 PM"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block">Break Interval Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 30 mins, 1 hour"
                  value={shiftBreak}
                  onChange={(e) => setShiftBreak(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="block">Applicable Staff Roles</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 border border-slate-100 rounded-lg">
                  {Object.values(DEPARTMENT_ROLES_MAP).flat().map(role => {
                    const selected = shiftRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRoleInShift(role)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                          selected 
                            ? 'bg-emerald-600 border-emerald-700 text-white' 
                            : 'bg-white text-slate-500 border-slate-250 hover:bg-slate-50'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl"
                >
                  {submitting ? 'Saving...' : 'Save Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert Popups */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`border-l-4 p-4 rounded-xl shadow-md flex items-center justify-between gap-3 border bg-white ${
              toast.type === 'success' ? 'border-emerald-500 text-emerald-805 bg-emerald-50/50' : 'border-rose-500 text-rose-805 bg-rose-50/50'
            }`}
          >
            <div className="flex-1 text-xs font-semibold">{toast.message}</div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-neutral-400 hover:text-neutral-700 text-sm font-bold"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
