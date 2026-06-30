import React, { useState } from 'react';
import {
  Shield,
  Clock,
  ShoppingBag,
  Check,
  X,
  Users,
  Utensils
} from 'lucide-react';

import { Employee, TableInfo } from '../EmployeeManagement';

interface ShiftChangeRequest {
  id: string;
  employeeName: string;
  role: string;
  currentShift: string;
  requestedShift: string;
  reason: string;
  status: string;
}

interface KitchenInventoryRequest {
  id: string;
  itemName: string;
  quantityRequested: string;
  urgency: string;
  requestedBy: string;
  status: string;
}

interface ManagersViewProps {
  employees: Employee[];
  tables: TableInfo[];
  onToggleTableAssignment: (tableNumber: string, isAssigned: boolean) => Promise<void>;
  onClearAllAssignments: (employee: Employee) => Promise<void>;
  selectedWaiterId: string;
  setSelectedWaiterId: (id: string) => void;
}

export const ManagersView: React.FC<ManagersViewProps> = ({
  employees,
  tables,
  onToggleTableAssignment,
  onClearAllAssignments,
  selectedWaiterId,
  setSelectedWaiterId
}) => {
  const defaultAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80";

  // Filter only managers, admins, captains
  const managers = employees.filter(e => 
    ['ADMIN', 'MANAGER', 'Captain', 'Kitchen Manager', 'Chef'].some(role => 
      e.role.toUpperCase().includes(role.toUpperCase())
    )
  );

  // Waiters list
  const waiters = employees.filter(e => ['Waiter', 'Senior Waiter', 'Captain'].includes(e.role));
  const selectedWaiter = employees.find(e => e.id === selectedWaiterId);

  // Shift Change Requests State
  const [shiftChangeRequests, setShiftChangeRequests] = useState<ShiftChangeRequest[]>([
    { id: '1', employeeName: 'Rahul Sharma', role: 'Senior Waiter', currentShift: 'Evening', requestedShift: 'Morning', reason: 'Personal family commitments', status: 'Pending' },
    { id: '2', employeeName: 'Pooja Hegde', role: 'Helper', currentShift: 'Evening', requestedShift: 'General', reason: 'Routine medical checkup', status: 'Pending' }
  ]);

  // Kitchen Inventory Requests State
  const [kitchenInventoryRequests, setKitchenInventoryRequests] = useState<KitchenInventoryRequest[]>([
    { id: '1', itemName: 'Extra Virgin Olive Oil', quantityRequested: '5 Liters', urgency: 'High', requestedBy: 'Chef Vikas Khanna', status: 'Pending' },
    { id: '2', itemName: 'Fresh Mozzarella Cheese', quantityRequested: '10 Kg', urgency: 'Medium', requestedBy: 'Chef Ranveer Brar', status: 'Pending' }
  ]);

  const handleShiftRequest = (id: string, action: 'Approved' | 'Rejected') => {
    setShiftChangeRequests(prev => 
      prev.map(r => r.id === id ? { ...r, status: action } : r)
    );
  };

  const handleInventoryRequest = (id: string, action: 'Approved' | 'Rejected') => {
    setKitchenInventoryRequests(prev => 
      prev.map(r => r.id === id ? { ...r, status: action } : r)
    );
  };

  // Roles Authority Matrix Details
  const rolesAuthority = [
    {
      role: 'Restaurant Admin',
      badge: 'Level 4 Access',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200/50',
      actions: [
        'Complete system override and root configurations',
        'Directly alter all inventory levels and supplier contracts',
        'Add/Edit/Delete any staff profiles, payroll details and shifts',
        'Access deep analytics, P&L matrices and compliance logs'
      ]
    },
    {
      role: 'Kitchen / Ops Manager',
      badge: 'Level 3 Access',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200/50',
      actions: [
        'Modify shift timings and approve leave requests',
        'Initiate kitchen inventory procurement requests',
        'View complete attendance registers and performance summaries',
        'Override cashier registers for refunds or credit entries'
      ]
    },
    {
      role: 'Waiter / Serving Staff',
      badge: 'Level 1 Access',
      color: 'bg-slate-50 text-slate-700 border-slate-200/60',
      actions: [
        'Mark self daily check-in / check-out timestamps',
        'Request shift swaps and submit casual leave forms',
        'Access allocated dining tables and service tasks',
        'Process orders and view basic digital tip splits'
      ]
    }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Visual Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <h3 className="font-extrabold text-sm text-slate-900">Manager Control Center</h3>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Review operational override authorities, allocate dining zones, and authorize resource approvals.
        </p>
      </div>

      {/* Row 1: Waiter Table Assignments Control */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <div>
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-emerald-600" />
            Waiter Table Assignments Control Matrix
          </h4>
          <p className="text-[11px] text-slate-450 mt-0.5">
            Select a waiter, then click any table in the visual layout below to register or release their assignment.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-full sm:w-72">
            <select
              value={selectedWaiterId}
              onChange={(e) => setSelectedWaiterId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 bg-white font-bold"
            >
              <option value="">-- Choose Waiter --</option>
              {waiters.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
              ))}
            </select>
          </div>
          {selectedWaiter && (
            <button
              onClick={() => onClearAllAssignments(selectedWaiter)}
              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Clear All Assigned Tables
            </button>
          )}
        </div>

        {selectedWaiter ? (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/40 text-xs">
              <span className="font-bold text-slate-800">Active assignments for {selectedWaiter.name}:</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Assigned Tables: {selectedWaiter.waiterProfile?.tableAssignments?.map((t: any) => t.tableNumber).join(', ') || 'None'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {tables.map(table => {
                const isAssignedToMe = selectedWaiter.waiterProfile?.tableAssignments?.some(
                  (a: any) => a.tableNumber === table.tableNumber
                ) || false;
                
                const otherAssignee = employees.find(e => 
                  e.id !== selectedWaiter.id && 
                  e.waiterProfile?.tableAssignments?.some((a: any) => a.tableNumber === table.tableNumber)
                );

                let btnClass = "bg-white border-slate-200 text-slate-850 hover:border-emerald-500/50";
                let label = "Unassigned";
                if (isAssignedToMe) {
                  btnClass = "bg-emerald-600 border-emerald-700 text-white shadow-sm";
                  label = "Assigned";
                } else if (otherAssignee) {
                  btnClass = "bg-blue-50 border-blue-200 text-blue-800";
                  label = otherAssignee.name.split(' ')[0];
                }

                return (
                  <button
                    key={table.id}
                    onClick={() => onToggleTableAssignment(table.tableNumber, isAssignedToMe)}
                    className={`p-3 rounded-xl border font-bold text-xs text-center transition flex flex-col justify-between h-16 ${btnClass}`}
                  >
                    <span className="text-xs block">Table {table.tableNumber}</span>
                    <span className="text-[9px] font-normal block opacity-80">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/50 border-dashed rounded-xl p-8 text-center text-slate-400 italic text-xs">
            Please select a waiter to configure table assignments.
          </div>
        )}
      </div>

      {/* Row 2: Authority Matrix + Approved Managers Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Authority Matrix Card */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <div>
            <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              Staff Authority & Role Matrix
            </h4>
            <p className="text-[11px] text-slate-450 mt-0.5">
              Access permissions and scopes of operational responsibility configured within the ERP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rolesAuthority.map(ra => (
              <div key={ra.role} className={`p-4 rounded-xl border ${ra.color} flex flex-col space-y-3`}>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs">{ra.role}</span>
                  </div>
                  <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 bg-white border rounded-full inline-block">
                    {ra.badge}
                  </span>
                </div>
                <ul className="space-y-1 pl-4 list-disc text-[10px] font-medium opacity-90 leading-relaxed font-sans">
                  {ra.actions.map((act, idx) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Manager Directory Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            Approved Managers ({managers.length})
          </h4>

          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
            {managers.map(m => (
              <div key={m.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <img
                    src={m.photo || defaultAvatar}
                    alt={m.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-100"
                  />
                  <div>
                    <span className="font-extrabold text-slate-900 block text-xs">{m.name}</span>
                    <span className="text-[9.5px] text-slate-400 block mt-0.5">{m.role}</span>
                  </div>
                </div>
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Approvals (Shift Swap + Kitchen Requests) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Shift swaps */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            Pending Shift Swaps & Requests
          </h4>

          <div className="space-y-3">
            {shiftChangeRequests.map(req => (
              <div key={req.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center gap-4 text-xs font-semibold text-slate-500">
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800">{req.employeeName}</span>
                    <span className="text-[10px] text-slate-400">({req.role})</span>
                  </div>
                  <p className="text-[10.5px]">Requested Change: <strong className="text-slate-800">{req.currentShift}</strong> → <strong className="text-emerald-700">{req.requestedShift}</strong></p>
                  <p className="text-[10px] text-slate-400 font-normal italic">"{req.reason}"</p>
                </div>

                {req.status === 'Pending' ? (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleShiftRequest(req.id, 'Approved')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded-lg"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleShiftRequest(req.id, 'Rejected')}
                      className="bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {req.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Kitchen inventory request */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-indigo-500" />
            Kitchen Procurement Authorizations
          </h4>

          <div className="space-y-3">
            {kitchenInventoryRequests.map(req => (
              <div key={req.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center gap-4 text-xs font-semibold text-slate-500">
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800">{req.itemName}</span>
                    <span className="text-[10px] text-slate-400">Qty: {req.quantityRequested}</span>
                  </div>
                  <p className="text-[10.5px]">Requested By: <strong className="text-slate-800">{req.requestedBy}</strong></p>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                    req.urgency === 'High' ? 'bg-rose-100 text-rose-750' : 'bg-amber-100 text-amber-750'
                  }`}>
                    {req.urgency} Urgency
                  </span>
                </div>

                {req.status === 'Pending' ? (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleInventoryRequest(req.id, 'Approved')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded-lg"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleInventoryRequest(req.id, 'Rejected')}
                      className="bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {req.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
