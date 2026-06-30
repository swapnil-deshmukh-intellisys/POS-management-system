import React, { useEffect, useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Briefcase,
  Utensils,
  DollarSign,
  Activity,
  Loader2,
  FileText,
  TrendingUp,
  User,
  Award,
  Download,
  Flame
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface EmployeeProfileDrawerProps {
  employeeId: string;
  onClose: () => void;
}

export const EmployeeProfileDrawer: React.FC<EmployeeProfileDrawerProps> = ({
  employeeId,
  onClose
}) => {
  const { apiRequest } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'payroll' | 'timeline'>('overview');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await apiRequest(`/restaurant/employees/${employeeId}`);
        setProfile(data);
      } catch (err) {
        console.error('Failed to load employee profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl border-l border-slate-200 z-50 p-6 flex flex-col items-center justify-center font-['Outfit']">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">Fetching comprehensive profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl border-l border-slate-200 z-50 p-6 flex flex-col items-center justify-center space-y-4 font-['Outfit']">
        <p className="text-sm font-bold text-slate-500">Employee profile not found.</p>
        <button onClick={onClose} className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-650">Close Drawer</button>
      </div>
    );
  }

  const defaultAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80";
  const isWaiter = ['Waiter', 'Senior Waiter', 'Captain'].includes(profile.role);
  const isKitchen = ['Head Chef', 'Sous Chef', 'Chef', 'Kitchen Staff', 'Helper'].includes(profile.role);
  
  const tableString = profile.waiterProfile?.tableAssignments?.map((t: any) => t.tableNumber).join(', ');

  // Simulated performance metrics based on role
  const performanceRating = profile.role === 'Head Chef' ? '9.8/10' : profile.role.includes('Waiter') ? '4.8/5.0' : '95%';
  const performanceLabel = profile.role === 'Head Chef' ? 'Culinary Score' : profile.role.includes('Waiter') ? 'Customer Rating' : 'Punctuality Rate';

  // Simulated documents list
  const mockDocuments = [
    { name: 'National ID Card (Aadhaar/PAN)', size: '1.2 MB', type: 'PDF' },
    { name: 'Employment Agreement Contract', size: '2.4 MB', type: 'PDF' },
    { name: 'Health Clearance Certificate', size: '840 KB', type: 'JPG' }
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col text-left font-['Outfit'] antialiased">
      
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <img 
            src={profile.photo || defaultAvatar} 
            alt={profile.name} 
            className="w-11 h-11 rounded-full object-cover border border-slate-200"
          />
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{profile.name}</h3>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{profile.employeeId} • {profile.employmentType}</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="px-5 border-b border-slate-100 flex gap-4 bg-white">
        {(['overview', 'attendance', 'payroll', 'timeline'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === tab 
                ? 'border-emerald-600 text-emerald-655 font-black' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab === 'payroll' ? 'Payroll & Leaves' : tab === 'attendance' ? 'Attendance & Shifts' : tab === 'timeline' ? 'Docs & Timeline' : tab}
          </button>
        ))}
      </div>

      {/* Profile Sections Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
        
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Core Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Job Placement */}
              <div className="bg-slate-50/30 p-4 rounded-xl border border-slate-100 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" /> Job Details
                </h4>
                <div className="space-y-2 text-xs text-slate-500 font-semibold">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Department</span><span className="text-slate-800 font-bold">{profile.department}</span></div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Role</span><span className="text-slate-800 font-black">{profile.role}</span></div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Shift Time</span><span className="text-slate-800 font-bold">{profile.shift}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Base Salary</span><span className="text-slate-800 font-black">₹{Number(profile.salary || 0).toLocaleString()}</span></div>
                </div>
              </div>

              {/* Personal & Contact */}
              <div className="bg-slate-50/30 p-4 rounded-xl border border-slate-100 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-emerald-600" /> Contact Info
                </h4>
                <div className="space-y-2 text-xs text-slate-500 font-semibold">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Phone</span><span className="text-slate-800 font-mono">+91 {profile.phone}</span></div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Email</span><span className="text-slate-800 font-bold truncate max-w-[160px]">{profile.email || '-'}</span></div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Joining Date</span><span className="text-slate-800">{new Date(profile.joiningDate).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Login Account</span><span className={`text-[10px] uppercase font-black ${profile.userId ? 'text-emerald-600' : 'text-slate-400'}`}>{profile.userId ? 'Active' : 'No Account'}</span></div>
                </div>
              </div>
            </div>

            {/* Performance Overview */}
            <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-100 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-emerald-600" /> Performance Index
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-slate-150 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block">{performanceLabel}</span>
                  <span className="text-base font-black text-emerald-600 block mt-1 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> {performanceRating}
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-150 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block">Punctuality Score</span>
                  <span className="text-base font-black text-indigo-700 block mt-1">98.4%</span>
                </div>
                <div className="p-3 bg-white border border-slate-150 rounded-xl col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold block">Status Code</span>
                  <span className="text-base font-black text-slate-800 block mt-1 uppercase">{profile.status}</span>
                </div>
              </div>
            </div>

            {/* Waiter Specific Assignments */}
            {isWaiter && (
              <div className="bg-emerald-50/10 p-4 rounded-xl border border-emerald-100/60 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Utensils className="w-3.5 h-3.5 text-emerald-600" /> Waitstaff Performance Logs
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white border border-emerald-100/50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block">Assigned Tables</span>
                    <span className="text-xs font-black text-indigo-700 block mt-1">{tableString || 'No tables assigned'}</span>
                  </div>
                  <div className="p-3 bg-white border border-emerald-100/50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block">Orders Served</span>
                    <span className="text-xs font-black text-slate-800 block mt-1">{profile.waiterProfile?.ordersServed || 0} served</span>
                  </div>
                  <div className="p-3 bg-white border border-emerald-100/50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block">Sales Handled</span>
                    <span className="text-xs font-black text-emerald-600 block mt-1">₹{(profile.waiterProfile?.salesHandled || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Kitchen Specific Assignments */}
            {isKitchen && (
              <div className="bg-orange-50/10 p-4 rounded-xl border border-orange-100/60 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-orange-600" /> Kitchen Station Duty
                </h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-white border border-orange-150 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block">Station Assignment</span>
                    <span className="text-xs font-black text-orange-700 block mt-1">
                      {profile.role === 'Head Chef' ? 'Main Kitchen R&D' : profile.role === 'Sous Chef' ? 'Hot Grills & Sauté' : 'General Prep & Pantry'}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-orange-150 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block">Shift Supervisor</span>
                    <span className="text-xs font-black text-slate-800 block mt-1">Chef Vikas Khanna</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="bg-slate-50/30 p-4 rounded-xl border border-slate-100 space-y-1.5">
              <span className="text-[10px] text-slate-450 uppercase font-black block">Administrative Notes</span>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold italic">"{profile.notes || 'No notes on record for this employee.'}"</p>
            </div>

          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" /> Attendance Ledger
              </h4>
              <span className="text-[10px] text-slate-400 font-bold">Showing last 7 entries</span>
            </div>
            <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                    <th className="py-2.5 px-4 text-left">Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-center">Clock-In / Out</th>
                    <th className="py-2.5 px-4 text-center">Hours</th>
                    <th className="py-2.5 px-4 text-right">Overtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                  {profile.attendance && profile.attendance.length > 0 ? (
                    profile.attendance.map((att: any) => (
                      <tr key={att.id}>
                        <td className="py-2.5 px-4 text-slate-800 font-medium">
                          {new Date(att.date).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            att.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            att.status === 'Late' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {att.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-700">
                          {att.checkIn ? `${att.checkIn} - ${att.checkOut}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-800 font-bold">{att.workHours || 0} hrs</td>
                        <td className="py-2.5 px-4 text-right text-slate-500">{att.overtime || 0} hrs</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-slate-400 text-center italic">No attendance records registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="space-y-6">
            
            {/* Payroll Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Payroll History
              </h4>
              <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                      <th className="py-2.5 px-4 text-left">Period</th>
                      <th className="py-2.5 px-4 text-center">Net salary</th>
                      <th className="py-2.5 px-4 text-center">Allowance / Bonus</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                    {profile.salaries && profile.salaries.length > 0 ? (
                      profile.salaries.map((sal: any) => (
                        <tr key={sal.id}>
                          <td className="py-2.5 px-4 text-slate-800">
                            {new Date(sal.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' })}
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-slate-800">₹{sal.netSalary.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-center text-slate-500">₹{sal.allowances + sal.bonus}</td>
                          <td className="py-2.5 px-4 text-right">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              sal.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {sal.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-slate-400 text-center italic">No processed payroll invoices.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leaves Ledgers */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" /> Leaves Register
              </h4>
              <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                      <th className="py-2.5 px-4 text-left">Leave Type</th>
                      <th className="py-2.5 px-4">Period</th>
                      <th className="py-2.5 px-4">Reason</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650 font-semibold">
                    {profile.leaves && profile.leaves.length > 0 ? (
                      profile.leaves.map((l: any) => (
                        <tr key={l.id}>
                          <td className="py-2.5 px-4 text-slate-850 font-black">{l.leaveType}</td>
                          <td className="py-2.5 px-4 text-[10.5px]">
                            {new Date(l.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(l.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-2.5 px-4 max-w-[150px] truncate text-slate-500" title={l.reason}>{l.reason}</td>
                          <td className="py-2.5 px-4 text-right">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              l.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              l.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-slate-400 text-center italic">No leaves logs filed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            
            {/* Uploaded Documents */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" /> Uploaded Documents & Credentials
              </h4>
              <div className="space-y-2">
                {mockDocuments.map((doc, idx) => (
                  <div 
                    key={idx} 
                    className="flex justify-between items-center p-3 bg-slate-55/30 border border-slate-200/50 rounded-xl hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-750 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{doc.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{doc.type} • {doc.size}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert(`Downloading "${doc.name}"...`)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-450 hover:text-slate-750 transition cursor-pointer"
                      title="Download Document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> Roster Audit Logs
              </h4>
              <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-150 space-y-3 max-h-60 overflow-y-auto">
                {profile.activities && profile.activities.length > 0 ? (
                  profile.activities.map((act: any) => (
                    <div key={act.id} className="flex gap-2.5 text-xs text-slate-500 font-semibold border-b border-slate-100 last:border-0 pb-2.5 last:pb-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold mb-0.5">
                          <span>{act.action}</span>
                          <span>{new Date(act.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 font-normal leading-relaxed">{act.details || 'System log recorded.'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">No recent activity logs.</p>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
