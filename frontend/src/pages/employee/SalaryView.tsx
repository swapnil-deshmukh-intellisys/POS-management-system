import React, { useState } from 'react';
import {
  Plus,
  XCircle,
  CreditCard,
  TrendingUp,
  Percent,
  Clock,
  Printer,
  FileText,
  Search,
  Building
} from 'lucide-react';

import { Employee, Salary } from '../EmployeeManagement';

interface SalaryViewProps {
  salaries: Salary[];
  employees: Employee[];
  onProcessSalary: (salaryData: any) => Promise<void>;
  onUpdateSalaryStatus: (salaryId: string, status: 'Paid' | 'Unpaid') => Promise<void>;
  userRole: string;
}

export const SalaryView: React.FC<SalaryViewProps> = ({
  salaries,
  employees,
  onProcessSalary,
  onUpdateSalaryStatus,
  userRole
}) => {
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [allowances, setAllowances] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [overtime, setOvertime] = useState('0');
  const [bonus, setBonus] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Payslip Modal Preview
  const [previewSalary, setPreviewSalary] = useState<Salary | null>(null);

  const defaultAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80";

  // Autofill base salary when employee is selected
  const handleEmployeeChange = (empId: string) => {
    setEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp && emp.salary) {
      setBasicSalary(String(emp.salary));
    } else {
      setBasicSalary('');
    }
  };

  // Calculate Net Salary for Preview
  const calculateNetPreview = () => {
    const basic = parseFloat(basicSalary) || 0;
    const allow = parseFloat(allowances) || 0;
    const deduct = parseFloat(deductions) || 0;
    const ot = parseFloat(overtime) || 0;
    const bon = parseFloat(bonus) || 0;
    return basic + allow + ot + bon - deduct;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !basicSalary) {
      alert('Please select an employee and input basic salary.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeId,
        basicSalary,
        allowances,
        deductions,
        overtime,
        bonus
      };
      await onProcessSalary(payload);
      setShowProcessModal(false);
      // Reset form
      setEmployeeId('');
      setBasicSalary('');
      setAllowances('0');
      setDeductions('0');
      setOvertime('0');
      setBonus('0');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Financial Statistics
  const totalPaidAmount = salaries
    .filter(s => s.paymentStatus === 'Paid')
    .reduce((sum, s) => sum + s.netSalary, 0);

  const totalUnpaidAmount = salaries
    .filter(s => s.paymentStatus === 'Unpaid')
    .reduce((sum, s) => sum + s.netSalary, 0);

  // Filter salaries
  const filteredSalaries = salaries.filter(sal => {
    const empName = sal.employee?.name || '';
    const matchesSearch = empName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (sal.employee?.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? sal.paymentStatus === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-left font-['Outfit'] antialiased">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-655 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Total Disbursed</span>
            <span className="text-lg font-black text-emerald-655">₹{totalPaidAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Outstanding Payouts</span>
            <span className="text-lg font-black text-rose-600">₹{totalUnpaidAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-605 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Processed Slips</span>
            <span className="text-lg font-black text-slate-800">{salaries.length} Slips</span>
          </div>
        </div>
      </div>

      {/* Salary List Control & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900">Payroll Ledger & Salary Slips</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Review disbursed payroll history, process monthly payouts, and track payment clearances.</p>
        </div>
        
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold w-44 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 bg-white cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>

          {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
            <button
              onClick={() => setShowProcessModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Process Salary Payout
            </button>
          )}
        </div>
      </div>

      {/* Visually Organized Salary Cards instead of Tables */}
      {filteredSalaries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSalaries.map(sal => {
            const empProfile = employees.find(e => e.id === sal.employeeId);
            const photo = empProfile?.photo || defaultAvatar;
            const dept = empProfile?.department || 'Staff';
            const payPeriod = sal.createdAt ? new Date(sal.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' }) : 'Current Month';

            return (
              <div 
                key={sal.id} 
                className="bg-white rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    sal.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {sal.paymentStatus}
                  </span>
                </div>

                {/* Profile header */}
                <div className="flex items-center gap-3">
                  <img 
                    src={photo} 
                    alt={sal.employee?.name || 'Staff'} 
                    className="w-11 h-11 rounded-xl object-cover border border-slate-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <strong className="text-slate-900 text-sm block truncate">{sal.employee?.name || 'Staff Member'}</strong>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{sal.employee?.role} • {dept}</span>
                  </div>
                </div>

                {/* Payroll Breakdown Panel */}
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/70 space-y-2 text-xs">
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>Pay Period</span>
                    <span className="text-slate-800 font-bold">{payPeriod}</span>
                  </div>
                  <div className="border-t border-slate-200/40 my-1.5" />
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>Basic Salary</span>
                    <span className="text-slate-800 font-bold">₹{sal.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>Allowances & OT</span>
                    <span className="text-emerald-650 font-bold">₹{(sal.allowances + sal.overtime + sal.bonus).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>Deductions</span>
                    <span className="text-rose-600 font-bold">-₹{sal.deductions.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200/70 my-1.5 pt-1.5 flex justify-between font-black">
                    <span className="text-slate-900">Net Take-home</span>
                    <span className="text-slate-900 text-sm">₹{sal.netSalary.toLocaleString()}</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between">
                  {/* Status Toggle for Admin/Manager */}
                  {(userRole === 'ADMIN' || userRole === 'MANAGER') ? (
                    <select
                      value={sal.paymentStatus}
                      onChange={(e) => onUpdateSalaryStatus(sal.id, e.target.value as 'Paid' | 'Unpaid')}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 bg-white cursor-pointer outline-none"
                    >
                      <option value="Paid">Mark Paid</option>
                      <option value="Unpaid">Mark Unpaid</option>
                    </select>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold italic">Processed via HR</span>
                  )}

                  {/* Print / Payslip */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewSalary(sal)}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-750 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200/60"
                      title="Generate Payslip"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" /> Payslip
                    </button>
                    <button
                      onClick={() => { setPreviewSalary(sal); setTimeout(() => handlePrint(), 300); }}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-750 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200/60"
                      title="Print Payslip"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" /> Print
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/50 rounded-2xl p-12 text-center text-slate-400 italic text-xs">
          No salary records found matching the filters.
        </div>
      )}

      {/* Process Payout Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-['Outfit']">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 text-left border border-slate-150 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Process Salary Payout Slip
              </h3>
              <button onClick={() => setShowProcessModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer"><XCircle className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-500">
              <div className="space-y-1">
                <label className="block">Employee Profile</label>
                <select
                  value={employeeId}
                  onChange={e => handleEmployeeChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700 bg-white cursor-pointer"
                  required
                >
                  <option value="">Select Employee...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block">Basic Salary (₹)</label>
                  <input
                    type="number"
                    value={basicSalary}
                    onChange={e => setBasicSalary(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block">Allowances (₹)</label>
                  <input
                    type="number"
                    value={allowances}
                    onChange={e => setAllowances(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block">Deductions (₹)</label>
                  <input
                    type="number"
                    value={deductions}
                    onChange={e => setDeductions(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block">Overtime Pay (₹)</label>
                  <input
                    type="number"
                    value={overtime}
                    onChange={e => setOvertime(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block">Performance Bonus (₹)</label>
                  <input
                    type="number"
                    value={bonus}
                    onChange={e => setBonus(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  />
                </div>

                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Net Preview</span>
                  <span className="text-sm font-extrabold text-emerald-705 block mt-0.5">₹{calculateNetPreview().toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl cursor-pointer"
                >
                  {submitting ? 'Processing...' : 'Disburse Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Payslip Modal */}
      {previewSalary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-['Outfit'] print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-150 flex flex-col max-h-[90vh] overflow-hidden print:border-0 print:shadow-none print:max-h-full">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Salary Slip Preview
              </h3>
              <button onClick={() => setPreviewSalary(null)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Slip Printable Content */}
            <div id="printable-payslip" className="p-8 space-y-6 overflow-y-auto flex-1 text-xs text-slate-700 font-semibold print:p-0 print:overflow-visible">
              
              {/* Header: Company Logo & Info */}
              <div className="flex justify-between items-start border-b-2 border-slate-200 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-black text-sm uppercase">
                    <Building className="w-5 h-5" /> Central Diner POS Group
                  </div>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-medium">
                    102, Park Street, Sector-V, Kolkata, WB, 700091<br />
                    Phone: +91 33 2345 6789 | support@centraldiner.com
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] text-slate-450 uppercase font-black block">PAYSLIP INVOICE</span>
                  <span className="text-xs font-black text-slate-900 block">#{previewSalary.id.substring(0, 8).toUpperCase()}</span>
                  <span className="text-[10px] text-slate-450 block">Date: {new Date(previewSalary.createdAt || '').toLocaleDateString()}</span>
                </div>
              </div>

              {/* Employee Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-450">Employee Name:</span><span className="text-slate-900 font-bold">{previewSalary.employee?.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-450">Employee ID:</span><span className="text-slate-900 font-mono">{previewSalary.employee?.employeeId}</span></div>
                  <div className="flex justify-between"><span className="text-slate-450">Department:</span><span className="text-slate-800">{previewSalary.employee?.department}</span></div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-450">Designation / Role:</span><span className="text-slate-900 font-bold">{previewSalary.employee?.role}</span></div>
                  <div className="flex justify-between"><span className="text-slate-450">Pay Period:</span><span className="text-slate-800 font-bold">{new Date(previewSalary.createdAt || '').toLocaleDateString([], { month: 'long', year: 'numeric' })}</span></div>
                  <div className="flex justify-between"><span className="text-slate-450">Payment Status:</span><span className="text-emerald-700 font-bold uppercase">{previewSalary.paymentStatus}</span></div>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-2 gap-6">
                
                {/* Earnings */}
                <div className="space-y-2">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1">Earnings</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span>Basic Salary</span><span className="text-slate-900">₹{previewSalary.basicSalary.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>House Rent Allowance</span><span className="text-slate-900">₹{(previewSalary.allowances * 0.4).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Special Allowance</span><span className="text-slate-900">₹{(previewSalary.allowances * 0.6).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Overtime Pay</span><span className="text-slate-900">₹{previewSalary.overtime.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Performance Bonus</span><span className="text-slate-900">₹{previewSalary.bonus.toLocaleString()}</span></div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1">Deductions</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span>Provident Fund (PF)</span><span className="text-slate-900">₹{(previewSalary.deductions * 0.6).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Professional Tax (PT)</span><span className="text-slate-900">₹{(previewSalary.deductions * 0.1).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>TDS / Income Tax</span><span className="text-slate-900">₹{(previewSalary.deductions * 0.3).toLocaleString()}</span></div>
                  </div>
                </div>

              </div>

              <div className="border-t border-slate-200 my-4" />

              {/* Totals and Net Pay */}
              <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Net Payable Amount</span>
                  <span className="text-xs font-light text-slate-300">Rupees {convertNumberToWords(previewSalary.netSalary)} Only</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black">₹{previewSalary.netSalary.toLocaleString()}</span>
                </div>
              </div>

              {/* Signature Line */}
              <div className="flex justify-between items-end pt-12">
                <div className="text-center space-y-1 border-t border-slate-300 pt-2 w-36">
                  <span className="text-[10px] text-slate-450 block">Employee Signature</span>
                </div>
                <div className="text-center space-y-1 border-t border-slate-300 pt-2 w-36">
                  <span className="text-[10px] text-slate-450 block">Authorized HR Sign</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50 print:hidden">
              <button
                onClick={() => setPreviewSalary(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-650 px-4 py-2 rounded-xl"
              >
                Close Preview
              </button>
              <button
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Payslip
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );

  // Helper to convert number to words (simple simulation for demo)
  function convertNumberToWords(_num: number): string {
    return 'Ten Thousand Five Hundred'; // Mock conversion
  }
};
