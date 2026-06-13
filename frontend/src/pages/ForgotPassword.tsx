import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Check, X, ShieldAlert, ArrowLeft } from 'lucide-react';

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
      }, 2500); // 2.5 seconds redirect
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
      // Direct API update for admin@pos.com (default account reset)
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
    <div className="min-h-screen flex bg-[#030712] font-sans overflow-hidden">
      
      {/* LEFT SIDE PANEL (Showcase - COMPLETELY IDENTICAL TO LOGIN) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-4 relative overflow-hidden select-none bg-gradient-to-br from-[#090d23] via-[#040613] to-[#010207] border-r border-slate-900">
        
        {/* Absolute Glowing Orbs */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"></div>

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 z-10 mb-0">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" />
            </svg>
          </div>
          <div>
            <h2 className="font-extrabold text-white text-xl tracking-tight leading-none">POS</h2>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-0.5 block">Inventory Management System</span>
          </div>
        </div>

        {/* Core Content */}
        <div className="my-auto max-w-lg z-10 py-10 mt-1">
          <h1 className="text-[40px] font-extrabold text-white leading-[1.15] tracking-tight font-sans">
            Smart POS & Inventory <br />
            for <span className="text-emerald-500">Modern Businesses</span>
          </h1>
          <p className="text-slate-300 font-medium text-[16px] mt-3 leading-relaxed">
            Manage your sales, inventory, employees, and customers in one powerful platform.
          </p>

          {/* Highlight Bullets */}
          <ul className="mt-5 space-y-3">
            {[
              'Real-time Inventory Tracking',
              'Multi-Branch Management',
              'AI Sales & Stock Prediction',
              'Offline POS Billing',
              'Secure & Cloud Based'
            ].map((text) => (
              <li key={text} className="flex items-center gap-3 text-base font-semibold text-slate-100">
                <span className="w-6 h-6 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center text-emerald-400 text-sm">
                  ✓
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT SIDE FORM CARD */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 select-none bg-white relative">
        <div className="w-full max-w-md">
          
          {/* Back button */}
          {!success && (
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors mb-6 uppercase tracking-wider"
            >
              <ArrowLeft className="w-4.5 h-4.5" /> Back to Login
            </button>
          )}

          {/* Welcome Titles */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-extrabold text-black font-sans tracking-tight">
              Reset Password
            </h2>
            <p className="text-slate-700 text-sm mt-1 font-medium">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <div className="relative">
            {/* Display Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-semibold text-red-700 mb-4 flex items-start gap-2.5">
                <ShieldAlert className="w-4.5 h-4.5 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!success ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                
                {/* New Password */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl pl-12 pr-12 py-2.5 text-sm font-semibold text-black placeholder:text-slate-500 focus:outline-none focus:border-blue-600/60 focus:bg-white bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl pl-12 pr-12 py-2.5 text-sm font-semibold text-black placeholder:text-slate-500 focus:outline-none focus:border-blue-600/60 focus:bg-white bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Validation Info Box */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    {newPassword.length >= 8 ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-slate-400" />}
                    <span className={newPassword.length >= 8 ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>Minimum 8 Characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(newPassword === confirmPassword && newPassword !== '') ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-slate-400" />}
                    <span className={(newPassword === confirmPassword && newPassword !== '') ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>Passwords Match</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/15"
                >
                  {isLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4 animate-bounce">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-center font-bold text-emerald-600 text-lg">
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
