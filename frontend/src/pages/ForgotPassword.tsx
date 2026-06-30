import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Check, X, ShieldAlert, ArrowLeft, ArrowRight } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Clear messages automatically
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Redirect after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@pos.com', newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-white font-sans overflow-hidden animate-fade-in">
      
      {/* LEFT COLUMN: FIXED BRANDING PANEL (Never scrolls, dark slate/graphite theme) */}
      <div className="hidden lg:flex lg:w-5/12 h-full flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white select-none overflow-hidden shrink-0 relative">
        
        {/* Background visual cover */}
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80" 
            alt="Operations POS Checkout terminal"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute top-[-30%] left-[-20%] w-[100%] h-[100%] rounded-full bg-emerald-500/5 blur-[135px] pointer-events-none"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[80%] h-[80%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none"></div>

        {/* Brand Logo Header */}
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-11 h-11 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/10 shadow-md">
            <svg className="w-5.5 h-5.5 text-emerald-500 fill-current" viewBox="0 0 24 24">
              <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" />
            </svg>
          </div>
          <div>
            <h2 className="font-extrabold text-white text-lg tracking-tight leading-none">POS & INVENTORY</h2>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-1 block">Unified Enterprise System</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="my-auto max-w-md z-10">
          <h1 className="text-4xl font-extrabold text-white leading-[1.25] tracking-tight">
            Manage your store, <br />
            retail & venue <br />
            operations.
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-4 leading-relaxed">
            A single unified control panel for POS checkout, barcodes tracking, inventory stock levels, tables management, and financial ledgers.
          </p>

          <ul className="mt-8 space-y-3.5">
            {[
              'Universal Billing & POS Checkout',
              'Barcode Scanning & Stock Replenishment',
              'Visual Table Reservations & Floorplans',
              'Real-Time Reports & Operations Ledgers'
            ].map((text) => (
              <li key={text} className="flex items-center gap-3 text-xs font-semibold text-emerald-50">
                <span className="w-5 h-5 bg-emerald-500/10 border border-emerald-400/20 rounded-full flex items-center justify-center text-emerald-300 text-xxs shrink-0">
                  ✓
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Version info */}
        <div className="z-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Intellisys POS & Inventory v2.4
        </div>
      </div>

      {/* RIGHT COLUMN: SCROLLABLE FORM PANEL (Always scrolls independently, uses clean white bg) */}
      <div className="w-full lg:w-7/12 h-full overflow-y-auto flex flex-col justify-start items-center p-8 sm:p-12 lg:p-16 bg-white">
        
        {/* Natural container aligned and spaced identically across pages */}
        <div className="w-full max-w-xl my-auto py-6">
          
          {/* Back button */}
          {!success && (
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-black transition-colors mb-6 uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
          )}

          {/* Welcome Titles */}
          <div className="text-left mb-8">
            <h2 className="text-2xl font-semibold text-black tracking-tight font-sans">
              Reset Password
            </h2>
            <p className="text-slate-655 text-xs font-normal mt-1.5">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <div className="relative">
            {/* Display Error Message */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs font-semibold text-rose-700 mb-6 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!success ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                
                {/* New Password */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-black uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-12 pr-11 py-2.5 text-xs text-black placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-655 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-black uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-12 pr-11 py-2.5 text-xs text-black placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-655 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Validation Info Box */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2.5">
                  <div className="flex items-center gap-2">
                    {newPassword.length >= 8 ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />}
                    <span className={newPassword.length >= 8 ? 'text-emerald-700 font-semibold' : 'text-slate-655'}>Minimum 8 Characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(newPassword === confirmPassword && newPassword !== '') ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />}
                    <span className={(newPassword === confirmPassword && newPassword !== '') ? 'text-emerald-700 font-semibold' : 'text-slate-655'}>Passwords Match</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 cursor-pointer mt-6 text-xs uppercase tracking-wider"
                >
                  {isLoading ? (
                    <span>Updating Password...</span>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4 py-6">
                <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4 animate-bounce">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-center font-bold text-emerald-755 text-lg">
                  Password updated successfully.
                </h3>
                <p className="text-center font-medium text-slate-500 text-xs">
                  Redirecting to Login page...
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
