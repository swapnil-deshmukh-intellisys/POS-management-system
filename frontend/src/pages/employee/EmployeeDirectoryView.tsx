import React, { useState } from 'react';
import {
  Search,
  Grid,
  List,
  Mail,
  Phone,
  Calendar,
  Clock,
  MoreVertical,
  User,
  MapPin,
  Lock,
  UserX,
  UserCheck,
  Edit,
  Activity,
  DollarSign,
  Utensils,
  Eye
} from 'lucide-react';

import { Employee } from '../EmployeeManagement';

interface EmployeeDirectoryViewProps {
  employees: Employee[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  deptFilter: string;
  setDeptFilter: (dept: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  viewMode: 'card' | 'table';
  setViewMode: (mode: 'card' | 'table') => void;
  onOpenEditModal: (emp: Employee) => void;
  onViewProfile: (emp: Employee) => void;
  onMarkAttendance: (emp: Employee) => void;
  onProcessSalary: (emp: Employee) => void;
  onAssignTable: (emp: Employee) => void;
}

export const EmployeeDirectoryView: React.FC<EmployeeDirectoryViewProps> = ({
  employees,
  searchQuery,
  setSearchQuery,
  deptFilter,
  setDeptFilter,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  onOpenEditModal,
  onViewProfile,
  onMarkAttendance,
  onProcessSalary,
  onAssignTable
}) => {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const defaultAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80";

  // Filter logic
  const filtered = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter ? emp.department === deptFilter : true;
    const matchesStatus = statusFilter ? emp.status === statusFilter : true;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleActionClick = (actionName: string, empName: string) => {
    alert(`[Admin Action] "${actionName}" triggered successfully for ${empName}.`);
    setActiveDropdownId(null);
  };

  const departments = ['Kitchen', 'Service', 'Billing', 'Inventory', 'Management', 'Security', 'Cleaning'];

  return (
    <div className="space-y-6 text-left font-['Outfit'] antialiased">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Left: Search input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, role or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600 bg-slate-50/30 focus:bg-white transition"
          />
        </div>

        {/* Middle: Select filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 bg-white cursor-pointer focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 bg-white cursor-pointer focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Suspended">Suspended</option>
            <option value="Terminated">Terminated</option>
          </select>

          {/* Toggle View mode */}
          <div className="border border-slate-200 rounded-xl p-1 flex items-center gap-1 bg-slate-50/50 ml-auto md:ml-0">
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'card' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              title="Card View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Roster View */}
      {filtered.length > 0 ? (
        viewMode === 'card' ? (
          /* Premium Card Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(emp => {
              const isWaiter = ['Waiter', 'Senior Waiter', 'Captain'].includes(emp.role);
              const managerName = emp.department === 'Kitchen' ? 'Chef Vikas Khanna' : emp.department === 'Service' ? 'Vikram Malhotra' : 'Ananya Roy';
              const branchName = 'Central Diner - Downtown';

              return (
                <div 
                  key={emp.id}
                  className="bg-white rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between space-y-4 relative group"
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 inset-x-0 h-1 rounded-t-2xl ${
                    emp.status === 'Active' ? 'bg-emerald-500' :
                    emp.status === 'On Leave' ? 'bg-purple-500' :
                    emp.status === 'Suspended' ? 'bg-amber-500' : 'bg-slate-300'
                  }`} />

                  {/* Top Profile Header */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={() => onViewProfile(emp)}
                        className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shrink-0 cursor-pointer bg-slate-50 hover:opacity-90 transition"
                      >
                        <img 
                          src={emp.photo || defaultAvatar} 
                          alt={emp.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 
                          onClick={() => onViewProfile(emp)}
                          className="font-black text-sm text-slate-900 leading-snug hover:text-emerald-600 cursor-pointer transition truncate"
                        >
                          {emp.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{emp.employeeId} • {emp.employmentType}</span>
                      </div>
                    </div>

                    {/* More actions dropdown trigger */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveDropdownId(activeDropdownId === emp.id ? null : emp.id)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdownId === emp.id && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200/80 z-20 py-1.5 text-xs font-semibold text-slate-650 animate-fade-in">
                          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] text-slate-400 uppercase font-black">Roster Operations</div>
                          <button onClick={() => { onOpenEditShiftModal(emp); setActiveDropdownId(null); }} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-purple-650" /> Change Work Shift
                          </button>
                          <button onClick={() => handleActionClick('Change Manager', emp.name)} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-blue-600" /> Change Manager
                          </button>
                          <button onClick={() => handleActionClick('Assign Branch', emp.name)} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-orange-600" /> Assign Branch
                          </button>
                          
                          <div className="px-3 py-1.5 border-t border-b border-slate-100 text-[10px] text-slate-400 uppercase font-black mt-1">Credentials & Login</div>
                          <button onClick={() => handleActionClick('Reset Password', emp.name)} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-slate-500" /> Reset Password
                          </button>
                          <button onClick={() => handleActionClick('Disable Login', emp.name)} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                            <UserX className="w-3.5 h-3.5 text-rose-600" /> Disable Login
                          </button>
                          <button onClick={() => handleActionClick('Unlock Account', emp.name)} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Unlock Account
                          </button>
                          <button onClick={() => handleActionClick('Send Welcome Email', emp.name)} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-indigo-600" /> Send Welcome Email
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Attributes */}
                  <div className="grid grid-cols-2 gap-3 py-2 text-xs font-semibold text-slate-500 border-t border-b border-slate-100/70">
                    <div className="space-y-0.5">
                      <span className="text-[9.5px] text-slate-400 uppercase font-bold block">Department / Role</span>
                      <span className="text-slate-800 font-bold truncate block">{emp.department} • {emp.role}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9.5px] text-slate-400 uppercase font-bold block">Shift Slot</span>
                      <span className="text-slate-800 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {emp.shift}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9.5px] text-slate-400 uppercase font-bold block">Manager</span>
                      <span className="text-slate-700 font-bold truncate block">{managerName}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9.5px] text-slate-400 uppercase font-bold block">Branch Location</span>
                      <span className="text-slate-700 font-bold truncate block">{branchName}</span>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1 text-[11px] text-slate-500 font-medium font-mono">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>+91 {emp.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="truncate">{emp.email || 'No email registered'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>Joined {new Date(emp.joiningDate).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <button
                      onClick={() => onViewProfile(emp)}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-[10.5px] font-bold transition flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Profile
                    </button>
                    <button
                      onClick={() => onOpenEditModal(emp)}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-[10.5px] font-bold transition flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => onMarkAttendance(emp)}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-[10.5px] font-bold transition flex items-center gap-1"
                    >
                      <Activity className="w-3 h-3" /> Attd
                    </button>
                    <button
                      onClick={() => onProcessSalary(emp)}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-[10.5px] font-bold transition flex items-center gap-1"
                    >
                      <DollarSign className="w-3 h-3" /> Pay
                    </button>
                    {isWaiter && (
                      <button
                        onClick={() => onAssignTable(emp)}
                        className="bg-emerald-55 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-[10.5px] font-black transition flex items-center gap-1"
                      >
                        <Utensils className="w-3 h-3" /> Tables
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Premium Table View */
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                    <th className="py-3.5 px-4 text-left">Staff Member</th>
                    <th className="py-3.5 px-4 text-left">ID & Dept</th>
                    <th className="py-3.5 px-4 text-left">Role</th>
                    <th className="py-3.5 px-4 text-left">Shift Slot</th>
                    <th className="py-3.5 px-4 text-left">Contact Info</th>
                    <th className="py-3.5 px-4 text-left">Manager</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650 font-semibold">
                  {filtered.map(emp => {
                    const isWaiter = ['Waiter', 'Senior Waiter', 'Captain'].includes(emp.role);
                    const managerName = emp.department === 'Kitchen' ? 'Chef Vikas Khanna' : emp.department === 'Service' ? 'Vikram Malhotra' : 'Ananya Roy';

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/20 group/row">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={emp.photo || defaultAvatar}
                              alt={emp.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-100"
                            />
                            <div>
                              <span className="font-extrabold text-slate-900 block">{emp.name}</span>
                              <span className="text-[9.5px] text-slate-400 block mt-0.5">Joined {new Date(emp.joiningDate).toLocaleDateString([], { month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-800 block">{emp.employeeId}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{emp.department}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-850 font-bold">{emp.role}</td>
                        <td className="py-3 px-4 text-slate-700">{emp.shift}</td>
                        <td className="py-3 px-4 text-left">
                          <span className="block text-slate-800 font-mono">+91 {emp.phone}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[150px]">{emp.email || '-'}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{managerName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            emp.status === 'On Leave' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onViewProfile(emp)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-450 hover:text-slate-700 transition"
                              title="View Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenEditModal(emp)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-450 hover:text-slate-700 transition"
                              title="Edit Profile"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {isWaiter && (
                              <button
                                onClick={() => onAssignTable(emp)}
                                className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition"
                                title="Assign Dining Tables"
                              >
                                <Utensils className="w-3.5 h-3.5" />
                              </button>
                            )}
                            
                            {/* More Actions trigger */}
                            <div className="relative">
                              <button
                                onClick={() => setActiveDropdownId(activeDropdownId === emp.id ? null : emp.id)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {activeDropdownId === emp.id && (
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200/80 z-20 py-1.5 text-xs font-semibold text-slate-650 animate-fade-in">
                                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] text-slate-400 uppercase font-black">Roster Operations</div>
                                  <button onClick={() => handleActionClick('Change Shift', emp.name)} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-purple-650" /> Change Work Shift
                                  </button>
                                  <button onClick={() => handleActionClick('Change Manager', emp.name)} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-blue-600" /> Change Manager
                                  </button>
                                  <button onClick={() => handleActionClick('Assign Branch', emp.name)} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-orange-600" /> Assign Branch
                                  </button>

                                  <div className="px-3 py-1.5 border-t border-b border-slate-100 text-[10px] text-slate-400 uppercase font-black mt-1">Credentials & Login</div>
                                  <button onClick={() => handleActionClick('Reset Password', emp.name)} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                                    <Lock className="w-3.5 h-3.5 text-slate-500" /> Reset Password
                                  </button>
                                  <button onClick={() => handleActionClick('Disable Login', emp.name)} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                                    <UserX className="w-3.5 h-3.5 text-rose-650" /> Disable Login
                                  </button>
                                  <button onClick={() => handleActionClick('Unlock Account', emp.name)} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Unlock Account
                                  </button>
                                  <button onClick={() => handleActionClick('Send Welcome Email', emp.name)} className="w-full px-3 py-2 hover:bg-slate-50 text-left flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-indigo-600" /> Send Welcome Email
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white border border-slate-200/50 rounded-2xl p-12 text-center text-slate-400 italic text-xs">
          No staff members found matching the selected filters.
        </div>
      )}
    </div>
  );

  function onOpenEditShiftModal(emp: Employee) {
    alert(`[Roster Action] Shift schedule change console opened for ${emp.name}.`);
  }
};
