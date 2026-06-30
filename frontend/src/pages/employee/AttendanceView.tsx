import React, { useState } from 'react';
import {
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Coffee,
  Edit2,
  FileText
} from 'lucide-react';

import { Employee, Shift, Leave } from '../EmployeeManagement';

interface AttendanceViewProps {
  employees: Employee[];
  leaves: Leave[];
  shifts: Shift[];
  onUpdateAttendance: (employeeId: string, attendanceData: any) => Promise<void>;
  userRole: string; // "ADMIN", "MANAGER", etc.
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  employees,
  leaves,
  shifts,
  onUpdateAttendance,
  userRole
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [notes, setNotes] = useState('');
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  // Edit fields
  const [editStatus, setEditStatus] = useState('Present');
  const [editCheckIn, setEditCheckIn] = useState('09:00 AM');
  const [editCheckOut, setEditCheckOut] = useState('05:00 PM');
  const [editWorkHours, setEditWorkHours] = useState('8.0');
  const [editOvertime, setEditOvertime] = useState('0.0');
  const [editNotes, setEditNotes] = useState('');

  React.useEffect(() => {
    const isManagerOrAdmin = userRole === 'ADMIN' || userRole === 'MANAGER';
    if (!isManagerOrAdmin && employees.length === 1) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees, userRole]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Get active staff
  const activeStaff = employees.filter(e => e.status === 'Active');

  // Find selected employee's today record
  const selectedEmp = employees.find(e => e.id === selectedEmpId);
  const todayRecord = selectedEmp?.attendance?.find((a: any) => a.date.startsWith(todayStr));

  // Get shift info for selected employee
  const empShift = shifts.find(s => s.name === selectedEmp?.shift);
  const breakTimeStr = empShift?.breakTime || '30 mins';

  // Helper: Get Current Time String (e.g. 09:30 AM)
  const getCurrentTimeString = () => {
    const now = new Date();
    let hrs = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, '0');
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12;
    hrs = hrs ? hrs : 12; // 0 should be 12
    return `${String(hrs).padStart(2, '0')}:${mins} ${ampm}`;
  };

  // Helper: Calculate worked hours and overtime
  const calculateWorkedHours = (checkInStr: string, checkOutStr: string, breakStr: string) => {
    const parseTimeToMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const clean = timeStr.trim().toUpperCase();
      const parts = clean.match(/^(\d+):(\d+)\s*(AM|PM)?$/);
      if (!parts) {
        const altParts = clean.split(':');
        if (altParts.length >= 2) {
          return parseInt(altParts[0]) * 60 + parseInt(altParts[1]);
        }
        return 0;
      }
      let hrs = parseInt(parts[1]);
      const mins = parseInt(parts[2]);
      const ampm = parts[3];
      if (ampm === 'PM' && hrs < 12) hrs += 12;
      if (ampm === 'AM' && hrs === 12) hrs = 0;
      return hrs * 60 + mins;
    };

    const parseBreakMinutes = (bStr: string) => {
      if (!bStr) return 0;
      const num = parseInt(bStr);
      if (isNaN(num)) return 0;
      if (bStr.toLowerCase().includes('hour') || bStr.toLowerCase().includes('hr')) {
        return num * 60;
      }
      return num;
    };

    const inMins = parseTimeToMinutes(checkInStr);
    const outMins = parseTimeToMinutes(checkOutStr);
    const breakMins = parseBreakMinutes(breakStr);

    let diff = outMins - inMins - breakMins;
    if (outMins < inMins) {
      diff = (1440 - inMins) + outMins - breakMins;
    }
    return Math.max(0, parseFloat((diff / 60).toFixed(2)));
  };

  const handleCheckIn = async () => {
    if (!selectedEmpId) return;
    const timeNow = getCurrentTimeString();
    
    // Status is Late if checked in after 9:15 AM (assuming general shift starting at 9 AM)
    const isLate = selectedEmp?.shift === 'General' && new Date().getHours() >= 9 && new Date().getMinutes() > 15;
    const status = isLate ? 'Late' : 'Present';

    const payload = {
      status,
      checkIn: timeNow,
      notes: notes || 'Checked in via terminal.',
      workHours: 0,
      overtime: 0
    };

    await onUpdateAttendance(selectedEmpId, payload);
    setNotes('');
  };

  const handleCheckOut = async () => {
    if (!selectedEmpId || !todayRecord) return;
    const timeNow = getCurrentTimeString();
    const workHours = calculateWorkedHours(todayRecord.checkIn, timeNow, breakTimeStr);
    const overtime = workHours > 8.0 ? parseFloat((workHours - 8.0).toFixed(2)) : 0.0;

    const payload = {
      status: todayRecord.status,
      checkIn: todayRecord.checkIn,
      checkOut: timeNow,
      workHours,
      overtime,
      notes: notes || 'Checked out via terminal.'
    };

    await onUpdateAttendance(selectedEmpId, payload);
    setNotes('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const payload = {
      status: editStatus,
      checkIn: editCheckIn,
      checkOut: editCheckOut,
      workHours: parseFloat(editWorkHours) || 0,
      overtime: parseFloat(editOvertime) || 0,
      notes: editNotes
    };

    await onUpdateAttendance(editingRecord.employeeId, payload);
    setEditingRecord(null);
  };

  const handleOpenEdit = (rec: any, empName: string) => {
    setEditingRecord({ ...rec, empName });
    setEditStatus(rec.status);
    setEditCheckIn(rec.checkIn || '09:00 AM');
    setEditCheckOut(rec.checkOut || '05:00 PM');
    setEditWorkHours(String(rec.workHours || 8.0));
    setEditOvertime(String(rec.overtime || 0.0));
    setEditNotes(rec.notes || '');
  };

  // Summaries calculation
  const onDutyCount = employees.filter(e => {
    const todayRec = e.attendance?.find((a: any) => a.date.startsWith(todayStr));
    return todayRec && (todayRec.status === 'Present' || todayRec.status === 'Late');
  }).length;

  const lateCount = employees.filter(e => {
    const todayRec = e.attendance?.find((a: any) => a.date.startsWith(todayStr));
    return todayRec && todayRec.status === 'Late';
  }).length;

  const leaveCount = leaves.filter(l => l.status === 'Approved' && todayStr >= l.startDate.split('T')[0] && todayStr <= l.endDate.split('T')[0]).length;

  return (
    <div className="space-y-6">
      {/* Attendance Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Checked In Today</span>
            <span className="text-xl font-extrabold text-slate-800">{onDutyCount} Staff</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Late Arrivals</span>
            <span className="text-xl font-extrabold text-amber-700">{lateCount} Staff</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">On Approved Leave</span>
            <span className="text-xl font-extrabold text-purple-700">{leaveCount} Staff</span>
          </div>
        </div>
      </div>

      {/* Check-In / Check-Out Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 text-left h-fit">
          <h3 className="font-extrabold text-sm text-slate-900">Attendance Terminal</h3>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">Select your name to record daily check-in or checkout timestamps.</p>
          
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 block">Select Staff Profile</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              disabled={userRole !== 'ADMIN' && userRole !== 'MANAGER'}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 bg-white disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Choose Employee...</option>
              {activeStaff.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
              ))}
            </select>
          </div>

          {selectedEmp && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 text-xs">
              <div className="flex justify-between"><span className="text-slate-450 font-bold">Assigned Shift:</span><span className="text-slate-800 font-extrabold">{selectedEmp.shift}</span></div>
              <div className="flex justify-between"><span className="text-slate-455 font-bold">Shift Break:</span><span className="text-slate-800 font-extrabold">{breakTimeStr}</span></div>
              <div className="flex justify-between"><span className="text-slate-450 font-bold">Check-In Status:</span>
                <span className={`font-black uppercase text-[10px] ${
                  todayRecord ? 'text-emerald-600' : 'text-slate-450'
                }`}>
                  {todayRecord ? (todayRecord.checkOut ? 'Checked Out' : 'Checked In') : 'Not Checked In'}
                </span>
              </div>
              {todayRecord?.checkIn && (
                <div className="flex justify-between"><span className="text-slate-450 font-bold">Checked In At:</span><span className="text-slate-800 font-extrabold">{todayRecord.checkIn}</span></div>
              )}
              {todayRecord?.checkOut && (
                <div className="flex justify-between"><span className="text-slate-450 font-bold">Checked Out At:</span><span className="text-slate-800 font-extrabold">{todayRecord.checkOut}</span></div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 block">Terminal Remarks / Notes</label>
            <input
              type="text"
              placeholder="e.g. Traffic delays, extra shift coverage..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCheckIn}
              disabled={!selectedEmpId || !!todayRecord}
              className={`py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 ${
                !selectedEmpId || !!todayRecord 
                  ? 'bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" /> Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!selectedEmpId || !todayRecord || !!todayRecord.checkOut}
              className={`py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 ${
                !selectedEmpId || !todayRecord || !!todayRecord.checkOut
                  ? 'bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed' 
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              <XCircle className="w-4 h-4" /> Check Out
            </button>
          </div>
        </div>

        {/* Attendance Registry Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 text-left">Today's Attendance Registry</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Shift</th>
                  <th className="py-2.5 px-4 text-center">In / Out</th>
                  <th className="py-2.5 px-4 text-center">Hours (OT)</th>
                  <th className="py-2.5 px-4">Status</th>
                  {(userRole === 'ADMIN' || userRole === 'MANAGER') && <th className="py-2.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                {employees.map(emp => {
                  const todayRec = emp.attendance?.find((a: any) => a.date.startsWith(todayStr));
                  if (!todayRec) return null;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-4">
                        <span className="text-slate-900 font-extrabold block">{emp.name}</span>
                        <span className="text-[9.5px] text-slate-400 block mt-0.5">{emp.role}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-800">{emp.shift}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-slate-800 block">{todayRec.checkIn || '-'}</span>
                        <span className="text-[10px] text-slate-450 block mt-0.5">{todayRec.checkOut || '-'}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-slate-905 block">{todayRec.workHours || 0} hrs</span>
                        {todayRec.overtime > 0 && (
                          <span className="text-[9.5px] text-emerald-600 font-bold block mt-0.5">+{todayRec.overtime} OT</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          todayRec.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          todayRec.status === 'Late' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {todayRec.status}
                        </span>
                      </td>
                      {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenEdit(todayRec, emp.name)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                            title="Edit Attendance Override"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {onDutyCount === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">No attendance marked for today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Override Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-['Outfit']">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 text-left border border-slate-150 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Override Attendance: {editingRecord.empName}
              </h3>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-semibold text-slate-500">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block">Status</label>
                  <select 
                    value={editStatus} 
                    onChange={e => setEditStatus(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700 bg-white"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block">Worked Hours</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={editWorkHours} 
                    onChange={e => setEditWorkHours(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block">Check In Time</label>
                  <input 
                    type="text" 
                    value={editCheckIn} 
                    onChange={e => setEditCheckIn(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block">Check Out Time</label>
                  <input 
                    type="text" 
                    value={editCheckOut} 
                    onChange={e => setEditCheckOut(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block">Overtime Hours</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={editOvertime} 
                    onChange={e => setEditOvertime(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block">Correction Notes</label>
                  <input 
                    type="text" 
                    value={editNotes} 
                    onChange={e => setEditNotes(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
