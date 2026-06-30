import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  Clock,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

import { Employee, Leave } from '../EmployeeManagement';

interface LeaveViewProps {
  leaves: Leave[];
  employees: Employee[];
  onCreateLeave: (leaveData: any) => Promise<void>;
  onUpdateLeaveStatus: (leaveId: string, status: 'Approved' | 'Rejected') => Promise<void>;
  userRole: string;
}

export const LeaveView: React.FC<LeaveViewProps> = ({
  leaves,
  employees,
  onCreateLeave,
  onUpdateLeaveStatus,
  userRole
}) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    const isManagerOrAdmin = userRole === 'ADMIN' || userRole === 'MANAGER';
    if (!isManagerOrAdmin && employees.length === 1) {
      setEmployeeId(employees[0].id);
    }
  }, [employees, userRole]);

  // Sort leaves: newest first (based on createdAt or startDate)
  const sortedLeaves = [...leaves].sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime());

  const pendingLeaves = sortedLeaves.filter(l => l.status === 'Pending');
  const resolvedLeaves = sortedLeaves.filter(l => l.status !== 'Pending');

  const defaultAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !startDate || !endDate || !reason) {
      alert('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeId,
        leaveType,
        startDate,
        endDate,
        reason
      };
      await onCreateLeave(payload);
      setShowApplyModal(false);
      // Reset form
      setEmployeeId('');
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-['Outfit'] antialiased">
      {/* Section Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900">Leave Approvals & Ledgers</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Submit and approve staff leave requests, review durations, and log reasons.</p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Apply for Leave
        </button>
      </div>

      {/* Pending Approvals Cards - Newest First */}
      <div className="space-y-4">
        <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-500" /> Pending Leave Approvals ({pendingLeaves.length})
        </h4>

        {pendingLeaves.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingLeaves.map(l => {
              // Find employee profile to get photo & department
              const empProfile = employees.find(e => e.id === l.employeeId);
              const photo = empProfile?.photo || defaultAvatar;
              const dept = empProfile?.department || 'Staff';
              const requestedDate = l.createdAt ? new Date(l.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today';
              
              const start = new Date(l.startDate);
              const end = new Date(l.endDate);
              const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

              return (
                <div 
                  key={l.id} 
                  className="bg-white rounded-2xl border border-slate-200/65 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative"
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 bg-amber-50 text-amber-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                  </div>

                  {/* Profile Header */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={photo} 
                      alt={l.employee?.name || 'Staff'} 
                      className="w-11 h-11 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <strong className="text-slate-900 text-sm block truncate">{l.employee?.name || 'Staff Member'}</strong>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{l.employee?.role || '-'} • {dept}</span>
                    </div>
                  </div>

                  {/* Leave Duration & Date range */}
                  <div className="bg-slate-50/55 p-3 rounded-xl border border-slate-100/70 space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-slate-500">
                      <span>Leave Type</span>
                      <span className="text-slate-900 font-black">{l.leaveType}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-500">
                      <span>Duration</span>
                      <span className="text-indigo-700 font-black">{days} {days === 1 ? 'Day' : 'Days'}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-500">
                      <span>Period</span>
                      <span className="text-slate-800 font-bold">
                        {start.toLocaleDateString([], { month: 'short', day: '2-digit' })} - {end.toLocaleDateString([], { month: 'short', day: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] text-slate-400 font-bold block uppercase">Reason Details</span>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/20 p-2.5 rounded-lg border border-slate-100 italic">
                      "{l.reason}"
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-bold">Requested: {requestedDate}</span>
                    
                    <div className="flex items-center gap-1.5">
                      {(userRole === 'ADMIN' || userRole === 'MANAGER') ? (
                        <>
                          <button
                            onClick={() => onUpdateLeaveStatus(l.id, 'Approved')}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-2 rounded-xl border border-emerald-100 transition cursor-pointer flex items-center gap-1 text-[10.5px] font-black"
                            title="Approve leave"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => onUpdateLeaveStatus(l.id, 'Rejected')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl border border-rose-100 transition cursor-pointer flex items-center gap-1 text-[10.5px] font-black"
                            title="Reject leave"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold italic flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Pending Approval
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/55 rounded-2xl p-10 text-center text-slate-400 italic text-xs">
            No pending leave requests.
          </div>
        )}
      </div>

      {/* Resolved History */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-600" /> Resolved Leaves Log
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                <th className="py-2.5 px-4 text-left">Employee</th>
                <th className="py-2.5 px-4 text-left">Leave Type</th>
                <th className="py-2.5 px-4">Period</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Reason Details</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-650 font-semibold">
              {resolvedLeaves.map(l => {
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);
                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

                return (
                  <tr key={l.id} className="hover:bg-slate-50/20">
                    <td className="py-3 px-4 text-left">
                      <strong className="text-slate-800 block">{l.employee?.name || 'Unknown'}</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{l.employee?.role || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-left text-slate-700">{l.leaveType}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {start.toLocaleDateString([], { month: 'short', day: '2-digit' })} - {end.toLocaleDateString([], { month: 'short', day: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-indigo-700 font-bold">{days} {days === 1 ? 'Day' : 'Days'}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate text-slate-450 font-normal" title={l.reason}>
                      {l.reason}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        l.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                        'bg-rose-50 text-rose-700 border-rose-150'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {resolvedLeaves.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">No leaves history logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-['Outfit']">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 text-left border border-slate-150 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Submit Leave Application
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-450 hover:text-slate-650 cursor-pointer"><XCircle className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-500">
              <div className="space-y-1">
                <label className="block">Employee Name</label>
                <select
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  disabled={userRole !== 'ADMIN' && userRole !== 'MANAGER'}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700 bg-white disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer"
                  required
                >
                  <option value="">Select Employee profile...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700 bg-white cursor-pointer"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                  <option value="Maternity/Paternity Leave">Maternity/Paternity Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-750"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-750"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block">Reason for Leave</label>
                <textarea
                  placeholder="Elaborate on the reason for your time off request..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-medium outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? 'Applying...' : 'Apply Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
