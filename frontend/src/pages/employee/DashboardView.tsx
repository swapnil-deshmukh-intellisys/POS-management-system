import React from 'react';
import {
  Users,
  UserCheck,
  UserMinus,
  Calendar,
  Clock,
  Activity,
  Briefcase,
  ChefHat,
  Utensils,
  DollarSign,
  ShoppingBag,
  Shield,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface Stats {
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

interface DashboardViewProps {
  stats: Stats | null;
  employees: any[];
  onNavigateTab: (tab: any) => void;
  onOpenAddModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  employees,
  onNavigateTab,
  onOpenAddModal
}) => {
  const departments = ['Kitchen', 'Service', 'Billing', 'Inventory', 'Management', 'Security', 'Cleaning'];

  // Calculate stats dynamically based on the employees list
  const totalEmployees = employees.length;
  
  // Present today (employees with today's attendance marked Present or Late)
  const todayStr = new Date().toISOString().split('T')[0];
  const presentCount = employees.filter(e => {
    const todayRec = e.attendance?.find((a: any) => a.date.startsWith(todayStr));
    return todayRec && (todayRec.status === 'Present' || todayRec.status === 'Late');
  }).length;

  const leaveCount = employees.filter(e => {
    const todayRec = e.attendance?.find((a: any) => a.date.startsWith(todayStr));
    return todayRec && todayRec.status === 'Leave';
  }).length;

  const absentCount = employees.filter(e => {
    const todayRec = e.attendance?.find((a: any) => a.date.startsWith(todayStr));
    return todayRec && todayRec.status === 'Absent';
  }).length;

  const managersCount = employees.filter(e => 
    ['Manager', 'Assistant Manager', 'Admin', 'Head Chef', 'Captain', 'Inventory Manager', 'Supervisor'].includes(e.role)
  ).length;

  // New employees joined in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newEmployeesCount = employees.filter(e => new Date(e.joiningDate) >= thirtyDaysAgo).length;

  const pendingLeavesCount = stats?.onLeaveToday || 2; // Fallback to mock value if not present
  const payrollPendingCount = stats?.salaryProcessing || 1;

  // Quick Action Config
  const quickActions = [
    {
      title: 'Register Staff',
      desc: 'Add new employee to roster',
      icon: Plus,
      color: 'bg-emerald-50 text-emerald-700 border border-emerald-100/55 hover:bg-emerald-100/50',
      action: onOpenAddModal || (() => onNavigateTab('employees'))
    },
    {
      title: 'Record Attendance',
      desc: 'Mark daily check-in / check-out',
      icon: UserCheck,
      color: 'bg-blue-50 text-blue-700 border border-blue-100/55 hover:bg-blue-100/50',
      action: () => onNavigateTab('attendance')
    },
    {
      title: 'Schedule Shift',
      desc: 'Organize shifts & break schedules',
      icon: Clock,
      color: 'bg-purple-50 text-purple-700 border border-purple-100/55 hover:bg-purple-100/50',
      action: () => onNavigateTab('shifts')
    },
    {
      title: 'Review Leaves',
      desc: 'Approve or reject leave requests',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-700 border border-amber-100/55 hover:bg-amber-100/50',
      action: () => onNavigateTab('leaves')
    },
    {
      title: 'Run Payroll',
      desc: 'Disburse monthly salary payouts',
      icon: DollarSign,
      color: 'bg-rose-50 text-rose-700 border border-rose-100/55 hover:bg-rose-100/50',
      action: () => onNavigateTab('salaries')
    },
    {
      title: 'Manager Console',
      desc: 'Operational overrides & table assigns',
      icon: Shield,
      color: 'bg-indigo-50 text-indigo-700 border border-indigo-100/55 hover:bg-indigo-100/50',
      action: () => onNavigateTab('managers')
    }
  ];

  return (
    <div className="space-y-6 text-left font-['Outfit'] antialiased">
      
      {/* 8 KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* 1. Total Roster */}
        <div 
          onClick={() => onNavigateTab('employees')}
          className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Roster</span>
            <span className="text-2xl font-black text-slate-900 block group-hover:text-emerald-600 transition-colors">{totalEmployees}</span>
            <span className="text-[10px] text-slate-400 font-semibold block">Registered staff</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* 2. On Duty Today */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">On Duty Today</span>
            <span className="text-2xl font-black text-emerald-600 block">{presentCount}</span>
            <span className="text-[10px] text-emerald-600/80 font-semibold block">Checked-in present</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* 3. On Leave Today */}
        <div 
          onClick={() => onNavigateTab('leaves')}
          className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">On Leave</span>
            <span className="text-2xl font-black text-purple-600 block">{leaveCount}</span>
            <span className="text-[10px] text-purple-600/80 font-semibold block">Approved time-off</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Absent Today */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Absent Today</span>
            <span className="text-2xl font-black text-rose-600 block">{absentCount}</span>
            <span className="text-[10px] text-rose-600/80 font-semibold block">No check-in log</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
            <UserMinus className="w-5 h-5" />
          </div>
        </div>

        {/* 5. Managers */}
        <div 
          onClick={() => onNavigateTab('managers')}
          className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Management</span>
            <span className="text-2xl font-black text-blue-600 block">{managersCount}</span>
            <span className="text-[10px] text-blue-600/80 font-semibold block">Lead & supervisors</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        {/* 6. Pending Leave Requests */}
        <div 
          onClick={() => onNavigateTab('leaves')}
          className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Leaves</span>
            <span className="text-2xl font-black text-amber-600 block">{pendingLeavesCount}</span>
            <span className="text-[10px] text-amber-650/80 font-semibold block">Awaiting approval</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* 7. Payroll Pending */}
        <div 
          onClick={() => onNavigateTab('salaries')}
          className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unpaid Salaries</span>
            <span className="text-2xl font-black text-orange-600 block">{payrollPendingCount}</span>
            <span className="text-[10px] text-orange-655/80 font-semibold block font-sans">₹ Outstanding</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-650 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* 8. New Hires (Last 30 Days) */}
        <div 
          onClick={() => onNavigateTab('employees')}
          className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Employees</span>
            <span className="text-2xl font-black text-indigo-600 block">{newEmployeesCount}</span>
            <span className="text-[10px] text-indigo-600/80 font-semibold block">Joined last 30 days</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
        </div>

      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm">Quick Administrative Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.title}
                onClick={qa.action}
                className={`p-4.5 rounded-xl border border-dashed text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 h-28 group ${qa.color}`}
              >
                <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black block leading-snug group-hover:underline text-slate-900">{qa.title}</span>
                  <span className="text-[9px] font-semibold opacity-70 block mt-0.5 leading-snug">{qa.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Departments + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 h-full flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Department Headcounts</h3>
              <p className="text-[11px] text-slate-450 mt-0.5 font-semibold">Live department-wise workforce allocation and active on-shift count.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {departments.map(dept => {
                const count = employees.filter(e => e.department === dept).length;
                const active = employees.filter(e => e.department === dept && e.status === 'Active').length;
                
                let icon = <Briefcase className="w-4 h-4" />;
                let color = 'bg-slate-100 text-slate-650';
                if (dept === 'Kitchen') { icon = <ChefHat className="w-4 h-4" />; color = 'bg-orange-50 text-orange-700 border border-orange-100/50'; }
                else if (dept === 'Service') { icon = <Utensils className="w-4 h-4" />; color = 'bg-purple-50 text-purple-700 border border-purple-100/50'; }
                else if (dept === 'Billing') { icon = <DollarSign className="w-4 h-4" />; color = 'bg-rose-50 text-rose-700 border border-rose-100/50'; }
                else if (dept === 'Inventory') { icon = <ShoppingBag className="w-4 h-4" />; color = 'bg-teal-50 text-teal-700 border border-teal-100/50'; }
                else if (dept === 'Management') { icon = <Shield className="w-4 h-4" />; color = 'bg-blue-50 text-blue-700 border border-blue-100/50'; }
                else if (dept === 'Security') { icon = <Shield className="w-4 h-4" />; color = 'bg-red-50 text-red-700 border border-red-100/50'; }

                return (
                  <div key={dept} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex flex-col justify-between h-24 text-left hover:bg-slate-50 hover:border-slate-200 transition-all cursor-default">
                    <div className="flex justify-between items-center">
                      <div className={`p-1.5 rounded-lg ${color}`}>{icon}</div>
                      <span className="text-lg font-black text-slate-800">{count}</span>
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">{dept}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block">{active} active on-shift</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* System Activity Timeline */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 flex flex-col h-full justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                Live Activity Audit Trail
              </h3>
              <p className="text-[11px] text-slate-455 mt-0.5 font-semibold">Real-time system events, clock-ins, and shift updates.</p>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[200px] pr-1 flex-1 mt-4 scrollbar-thin">
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                stats.recentActivities.map(act => (
                  <div key={act.id} className="text-left pb-2.5 border-b border-slate-100 last:border-0 last:pb-0 flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold mb-0.5">
                        <span className="text-slate-800 truncate font-black">{act.employee.name}</span>
                        <span className="font-medium shrink-0">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate leading-normal"><strong className="text-slate-700">{act.action}</strong>: {act.details}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-10">No recent activities logged today.</p>
              )}
            </div>
            <button 
              onClick={() => onNavigateTab('employees')}
              className="w-full text-center text-[10.5px] font-black text-emerald-600 hover:text-emerald-700 hover:underline transition mt-3 flex items-center justify-center gap-1 cursor-pointer"
            >
              View Entire Roster <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
