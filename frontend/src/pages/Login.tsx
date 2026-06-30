import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  UserCheck, 
  ChefHat, 
  Utensils, 
  Layers, 
  CreditCard, 
  Package, 
  Brush, 
  ShieldCheck, 
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

type LoginStep = 'SYSTEM_LOGIN' | 'ROLE_SELECTION' | 'ROLE_LOGIN';

interface RoleConfig {
  name: string;
  icon: React.ComponentType<any>;
  desc: string;
}

const ROLES_LIST: RoleConfig[] = [
  {
    name: 'Admin',
    icon: ShieldAlert,
    desc: 'Manage the complete restaurant system.'
  },
  {
    name: 'Manager',
    icon: UserCheck,
    desc: 'Monitor daily operations and employees.'
  },
  {
    name: 'Waiter',
    icon: Utensils,
    desc: 'Manage assigned tables and customer orders.'
  },
  {
    name: 'Chef',
    icon: ChefHat,
    desc: 'Handle food preparation and recipes.'
  },
  {
    name: 'Kitchen Staff',
    icon: Layers,
    desc: 'Prepare and manage kitchen orders.'
  },
  {
    name: 'Cashier',
    icon: CreditCard,
    desc: 'Manage billing and payments.'
  },
  {
    name: 'Inventory Manager',
    icon: Package,
    desc: 'Manage inventory and suppliers.'
  },
  {
    name: 'Housekeeping',
    icon: Brush,
    desc: 'Access shifts roster and checklists.'
  },
  {
    name: 'Security',
    icon: ShieldCheck,
    desc: 'Access security logs and shift check-ins.'
  }
];

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  'Admin': { bg: 'bg-blue-50', text: 'text-blue-600' },
  'Manager': { bg: 'bg-purple-50', text: 'text-purple-600' },
  'Waiter': { bg: 'bg-orange-50', text: 'text-orange-600' },
  'Chef': { bg: 'bg-red-50', text: 'text-red-600' },
  'Kitchen Staff': { bg: 'bg-amber-50', text: 'text-amber-600' },
  'Cashier': { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  'Inventory Manager': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  'Housekeeping': { bg: 'bg-teal-50', text: 'text-teal-600' },
  'Security': { bg: 'bg-slate-100', text: 'text-slate-650' }
};

export const Login: React.FC = () => {
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<LoginStep>('SYSTEM_LOGIN');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // System credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState('Retail Store');
  const [businessName, setBusinessName] = useState('My Shop');

  // Role credentials
  const [roleEmail, setRoleEmail] = useState('');
  const [rolePassword, setRolePassword] = useState('');
  const [showRolePassword, setShowRolePassword] = useState(false);

  useEffect(() => {
    if (localError || authError) {
      const timer = setTimeout(() => {
        setLocalError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [localError, authError]);

  // Pre-fill role credentials in the background for demo ease
  useEffect(() => {
    if (selectedRole) {
      setRoleEmail('demo@restaurant.com');
      setRolePassword('123456');
    }
  }, [selectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError(null);

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setLocalError('Password must be at least 8 characters, include uppercase, lowercase, number, and special character');
      setIsLoading(false);
      return;
    }

    const success = await login(email, password, businessType, businessName);
    if (success) {
      if (businessType === 'Restaurant' || businessType === 'Cafe') {
        setStep('ROLE_SELECTION');
      } else {
        navigate('/');
      }
    }
    setIsLoading(false);
  };

  const handleRoleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError(null);

    if (!selectedRole) {
      setLocalError('Please select a role first');
      setIsLoading(false);
      return;
    }

    const success = await login(roleEmail, rolePassword, 'Restaurant', businessName, selectedRole);
    if (success) {
      navigate('/');
    } else {
      setLocalError('Workspace login failed. Please verify credentials.');
    }
    setIsLoading(false);
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
              <li key={text} className="flex items-center gap-3 text-xs font-semibold text-slate-200">
                <span className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-xxs shrink-0">
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
      <div className="w-full lg:w-7/12 h-full overflow-y-auto flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 bg-white">
        
        {/* Natural container aligned and spaced identically across steps */}
        <div className="w-full max-w-xl my-auto py-6">

          {/* STAGE 1: SYSTEM SIGN IN */}
          {step === 'SYSTEM_LOGIN' && (
            <div className="transition-opacity duration-200">
              
              {/* Error messages */}
              {((localError || authError)) && (
                <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs font-semibold text-rose-700">
                  {localError || authError}
                </div>
              )}

              <div className="text-left mb-8">
                <h2 className="text-2xl font-semibold text-black tracking-tight font-sans">System Login</h2>
                <p className="text-slate-600 text-xs font-normal mt-1.5">Enter your credentials to access the console</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-black uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="admin@pos.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-2.5 text-xs text-black placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-black uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-11 pr-11 py-2.5 text-xs text-black placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-650 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Business Type */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-black uppercase tracking-wider">Business Type</label>
                  <div className="relative">
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition appearance-none cursor-pointer font-semibold"
                    >
                      <option value="Retail Store">Retail Store</option>
                      <option value="Restaurant">Restaurant Module</option>
                      <option value="Cafe">Cafe / Bistro</option>
                      <option value="Medical Store">Medical Store</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                      <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-black uppercase tracking-wider">Business Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Demo Enterprise"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-black placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition font-semibold"
                  />
                </div>

                {/* Remember Checkbox */}
                <div className="flex items-center pt-1">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-200 rounded focus:ring-emerald-500 bg-slate-50 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-xs font-semibold text-black select-none cursor-pointer">
                    Keep me signed in
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 cursor-pointer mt-6 text-xs uppercase tracking-wider"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Proceed to Console</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs font-semibold text-black mt-6">
                Don't have an account?{' '}
                <a href="/register" className="text-emerald-600 hover:text-emerald-700 transition-colors font-bold">
                  Sign up
                </a>
              </p>
            </div>
          )}

          {/* STAGE 2: CHOOSE YOUR ROLE SCREEN */}
          {step === 'ROLE_SELECTION' && (
            <div className="transition-opacity duration-200">
              <div className="text-left mb-8">
                <h2 className="text-2xl font-semibold text-black tracking-tight font-sans">Choose Your Role</h2>
                <p className="text-slate-655 text-xs font-normal mt-1.5">Select your designated access level.</p>
              </div>

              {/* Roles 3x3 Grid with Colorful Icons, Centered Content & Green Selection Outlines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {ROLES_LIST.map((roleObj) => {
                  const IconComponent = roleObj.icon;
                  const isSelected = selectedRole === roleObj.name;
                  const colorConfig = ROLE_COLORS[roleObj.name];
                  
                  return (
                    <button
                      key={roleObj.name}
                      onClick={() => setSelectedRole(roleObj.name)}
                      className={`flex flex-col items-center justify-center p-5 border rounded-2xl text-center shadow-xs transition-all duration-200 relative cursor-pointer min-h-[164px] h-full ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/10 ring-1 ring-emerald-500/25 scale-[1.01]'
                          : 'border-slate-200 bg-white hover:bg-slate-50/60 hover:border-emerald-500/30 hover:scale-[1.01]'
                      }`}
                    >
                      {/* Centered icon slot with consistent color per role, only using green tint/border on selected card */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mb-3.5 shadow-xs transition-all duration-200 ${
                        isSelected ? 'bg-emerald-50 text-emerald-600' : `${colorConfig.bg} ${colorConfig.text}`
                      }`}>
                        <IconComponent className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs.5 text-black leading-none block whitespace-nowrap">{roleObj.name}</h4>
                        <p className="text-slate-600 text-[10.5px] leading-normal mt-2 block">{roleObj.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-emerald-50"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Actions Footer (Horizontal Divider Removed) */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                <button
                  onClick={() => setStep('SYSTEM_LOGIN')}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-black transition-colors order-2 sm:order-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to System Login</span>
                </button>
                
                <button
                  onClick={() => {
                    if (selectedRole) setStep('ROLE_LOGIN');
                  }}
                  disabled={!selectedRole}
                  className={`flex items-center gap-2 py-3 px-8 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 order-1 sm:order-2 cursor-pointer ${
                    selectedRole
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  <span>Continue to Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: ROLE GATEWAY AUTHENTICATION */}
          {step === 'ROLE_LOGIN' && (
            <div className="transition-opacity duration-200">
              
              {/* Error messages */}
              {((localError || authError)) && (
                <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs font-semibold text-rose-700">
                  {localError || authError}
                </div>
              )}

              <div className="text-left mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm uppercase tracking-wider mb-3">
                  {selectedRole} Workspace
                </span>
                <h2 className="text-2xl font-semibold text-black tracking-tight font-sans">Role Credentials</h2>
                <p className="text-slate-655 text-xs font-normal mt-1">Sign in to initialize your workspace</p>
              </div>

              <form onSubmit={handleRoleLoginSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-black uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="demo@restaurant.com"
                      value={roleEmail}
                      onChange={(e) => setRoleEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-2.5 text-xs text-black placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-black uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showRolePassword ? 'text' : 'password'}
                      required
                      placeholder="123456"
                      value={rolePassword}
                      onChange={(e) => setRolePassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-11 pr-11 py-2.5 text-xs text-black placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRolePassword(!showRolePassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-650 transition-colors"
                    >
                      {showRolePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 cursor-pointer mt-6 text-xs uppercase tracking-wider"
                >
                  {isLoading ? (
                    <span>Accessing Workspace...</span>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <button
                onClick={() => setStep('ROLE_SELECTION')}
                className="mt-6 flex items-center gap-1.5 justify-center mx-auto text-xs font-bold text-slate-500 hover:text-black transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change selected role selection</span>
              </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default Login;
