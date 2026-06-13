import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;
    if (!passwordRegex.test(password)) {
      setLocalError('Password must be 8-15 characters, include uppercase, lowercase, number, and special character');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Registration failed');
      }

      setSuccessMessage('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#030712] font-sans overflow-hidden">
      
      {/* LEFT SIDE PANEL (Showcase) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-6 relative overflow-hidden select-none bg-gradient-to-br from-[#090d23] via-[#040613] to-[#010207] border-r border-slate-900">
        
        {/* Absolute Glowing Orbs */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"></div>

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 z-10">
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
        <div className="my-auto max-w-lg z-10 py-6">
          <h1 className="text-[36px] font-extrabold text-white leading-[1.15] tracking-tight font-sans">
            Create Your <br />
            <span className="text-emerald-500">Account Today</span>
          </h1>
          <p className="text-slate-400 font-medium text-[15px] mt-4 leading-relaxed">
            Join thousands of businesses using our POS and Inventory Management System.
          </p>

          {/* Highlight Bullets */}
          <ul className="mt-6 space-y-3">
            {[
              'Real-time Inventory Tracking',
              'Multi-Branch Management',
              'Secure & Cloud Based',
              'Easy to Use Interface'
            ].map((text) => (
              <li key={text} className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                <span className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center text-emerald-400 text-xs">
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
          {/* Welcome Titles */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">Create Account</h2>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">Sign up to get started with our POS system</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Display Messages */}
            {localError && (
              <div className="bg-red-50 border border-red-200/80 rounded-xl p-4 text-xs font-semibold text-red-600 animate-pulse-subtle">
                {localError}
              </div>
            )}
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 text-xs font-semibold text-emerald-600">
                {successMessage}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600/60 focus:bg-white pos-input bg-slate-50/50"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600/60 focus:bg-white pos-input bg-slate-50/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-12 pr-12 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600/60 focus:bg-white pos-input bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-12 pr-12 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600/60 focus:bg-white pos-input bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/15"
            >
              {isLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Sign Up</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Login prompt */}
          <p className="text-center text-xs font-semibold text-slate-400 mt-8">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 transition-colors font-bold">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
export default SignUp;
