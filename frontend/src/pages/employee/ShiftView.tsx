import React from 'react';
import {
  Clock,
  Coffee,
  Briefcase,
  Plus,
  Users,
  Edit2,
  Trash2,
  Shield,
  Layers
} from 'lucide-react';

import { Employee, Shift } from '../EmployeeManagement';

interface ShiftViewProps {
  shifts: Shift[];
  employees: Employee[];
  onOpenAddShiftModal: () => void;
  onOpenEditShiftModal: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => Promise<void>;
  userRole: string;
}

export const ShiftView: React.FC<ShiftViewProps> = ({
  shifts,
  employees,
  onOpenAddShiftModal,
  onOpenEditShiftModal,
  onDeleteShift,
  userRole
}) => {
  const defaultAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80";

  // Helper to parse time string (e.g., "09:00 AM") into hour percentage (0-100) on a 24h scale
  const getTimelinePercentage = (timeStr: string) => {
    try {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      const totalHours = hours + minutes / 60;
      return (totalHours / 24) * 100;
    } catch {
      return 0;
    }
  };

  return (
    <div className="space-y-6 text-left font-['Outfit'] antialiased">
      {/* Section Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900">Restaurant Shifts & Timelines</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Design daily shift rosters, specify breaks, and monitor on-shift employee allocations.</p>
        </div>
        {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
          <button
            onClick={onOpenAddShiftModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Shift Slot
          </button>
        )}
      </div>

      {/* Shifts Timeline Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shifts.map(shift => {
          // Get employees assigned to this shift
          const assignedStaff = employees.filter(e => e.shift === shift.name);

          // Get unique departments active in this shift
          const activeDepts = Array.from(new Set(assignedStaff.map(e => e.department)));

          // Determine supervising managers based on active departments
          const managers: string[] = [];
          if (activeDepts.includes('Kitchen')) managers.push('Chef Vikas Khanna (Head Chef)');
          if (activeDepts.includes('Service')) managers.push('Vikram Malhotra (Service Manager)');
          if (activeDepts.includes('Billing') || activeDepts.includes('Inventory')) managers.push('Ananya Roy (Assistant Manager)');
          if (managers.length === 0) managers.push('Vikram Malhotra (General Manager)');

          // Calculate start and end percentages for the graphical timeline
          const startPct = getTimelinePercentage(shift.startTime);
          const endPct = getTimelinePercentage(shift.endTime);
          const durationPct = endPct >= startPct ? (endPct - startPct) : (100 - startPct + endPct);

          return (
            <div 
              key={shift.id} 
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
            >
              {/* Top Row: Shift Name & Actions */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-wide block">{shift.name} Shift</span>
                  <div className="flex items-center gap-1.5 text-slate-800 text-sm font-extrabold">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{shift.startTime} - {shift.endTime}</span>
                  </div>
                </div>

                {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditShiftModal(shift)}
                      title="Edit Shift details"
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteShift(shift.id)}
                      title="Delete Shift slot"
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-450 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Graphical Timeline Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                  <span>12 AM</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full relative overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-550 to-teal-500 rounded-full absolute"
                    style={{
                      left: `${startPct}%`,
                      width: `${durationPct}%`
                    }}
                  />
                </div>
              </div>

              {/* Middle Section: Break Time & Applicable Roles */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-3 text-xs font-semibold text-slate-500">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-450 font-bold block uppercase">Break Interval</span>
                  <div className="flex items-center gap-1.5 text-slate-850 font-black">
                    <Coffee className="w-3.5 h-3.5 text-slate-400" />
                    <span>{shift.breakTime}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-455 font-bold block uppercase">Applicable Roles</span>
                  <div className="flex items-center gap-1.5 text-slate-850 font-black truncate">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate" title={shift.applicableRoles?.join(', ')}>
                      {shift.applicableRoles && shift.applicableRoles.length > 0 
                        ? shift.applicableRoles.join(', ') 
                        : 'All Roles'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Department & Manager Details */}
              <div className="space-y-2 text-xs font-semibold text-slate-500">
                <div className="flex items-start gap-1.5">
                  <Layers className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9.5px] text-slate-400 font-bold block uppercase">Active Departments</span>
                    <span className="text-slate-800 font-bold">{activeDepts.length > 0 ? activeDepts.join(', ') : 'None assigned'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9.5px] text-slate-400 font-bold block uppercase">Supervising Managers</span>
                    <span className="text-slate-800 font-bold">{managers.join(' / ')}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Assigned Staff Avatars */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Assigned Workforce</span>
                  <span className="text-slate-800 font-extrabold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {assignedStaff.length} Staff members
                  </span>
                </div>

                <div className="flex items-center -space-x-2 overflow-hidden py-1">
                  {assignedStaff.slice(0, 7).map(staff => (
                    <img
                      key={staff.id}
                      src={staff.photo || defaultAvatar}
                      alt={staff.name}
                      title={`${staff.name} (${staff.role})`}
                      className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover border border-slate-100"
                    />
                  ))}
                  {assignedStaff.length > 7 && (
                    <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold ring-2 ring-white border border-slate-100">
                      +{assignedStaff.length - 7}
                    </div>
                  )}
                  {assignedStaff.length === 0 && (
                    <span className="text-[11px] text-slate-400 italic">No employees assigned to this shift slot yet.</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
