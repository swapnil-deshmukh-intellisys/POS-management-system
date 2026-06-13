import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, X } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, googleLogin, error: authError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Google Sign-In Sandbox States
  const [showGoogleSandbox, setShowGoogleSandbox] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (localError || authError) {
      const timer = setTimeout(() => {
        setLocalError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [localError, authError]);

  // Initialize official Google Identity Services
  useEffect(() => {
    try {
      const gWindow = window as any;
      if (gWindow.google) {
        gWindow.google.accounts.id.initialize({
          client_id: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '1068832599292-mockclientid.apps.googleusercontent.com',
          callback: (response: any) => {
            handleGoogleCredential(response.credential);
          },
        });
      }
    } catch (err) {
      console.warn('Google SDK failed to initialize. Sandbox modal fallback is ready.', err);
    }
  }, []);

  const handleGoogleCredential = async (credential: string) => {
    setIsLoading(true);
    setErrorState(null);
    const success = await googleLogin(credential);
    if (success) {
      navigate('/');
    } else {
      setLocalError('Google authentication failed. Please check credentials.');
    }
    setIsLoading(false);
    setShowGoogleSandbox(false);
  };

  const generateMockGoogleJWT = (email: string, name: string) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: `mock-google-sub-${email.replace(/[@.]/g, '-')}`,
      email,
      name,
      picture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
      email_verified: true,
      iss: 'https://accounts.google.com',
      aud: 'pos-app'
    }));
    return `${header}.${payload}.mocksignature`;
  };

  const handleGoogleLogin = () => {
    const metaEnv = (import.meta as any).env;
    const hasClientId = metaEnv.VITE_GOOGLE_CLIENT_ID && metaEnv.VITE_GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID';
    const gWindow = window as any;
    if (gWindow.google && hasClientId) {
      try {
        gWindow.google.accounts.id.prompt();
      } catch (err) {
        console.warn('Google prompt error, launching sandbox:', err);
        setShowGoogleSandbox(true);
      }
    } else {
      // Open our premium simulated Google Account Selector Sandbox
      setShowGoogleSandbox(true);
    }
  };

  const handleSandboxSelect = (selectedEmail: string, selectedName: string) => {
    const mockToken = generateMockGoogleJWT(selectedEmail, selectedName);
    handleGoogleCredential(mockToken);
  };

  const handleCustomSandboxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail || !customGoogleName) return;
    handleSandboxSelect(customGoogleEmail, customGoogleName);
  };

  const setErrorState = (msg: string | null) => {
    setLocalError(msg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;
    if (!passwordRegex.test(password)) {
      setLocalError('Password must be 8-15 characters, include uppercase, lowercase, number, and special character');
      setIsLoading(false);
      return;
    }

    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setLocalError('Invalid email or password. Hint: admin@pos.com / Password123!');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-[#030712] font-sans overflow-hidden">
      
      {/* LEFT SIDE PANEL (Showcase) */}
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
          {/* Welcome Titles */}
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-extrabold text-black font-sans tracking-tight">Welcome Back!</h2>
            <p className="text-slate-700 text-sm mt-1 font-medium">Login to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative">
            
            {/* Display Error Message - Absolute position, no space taken */}
            <div className="absolute -top-16 left-0 right-0 z-10">
              {(localError || authError) && (
                <div className="bg-red-100 border border-red-300 rounded-xl p-3 text-xs font-semibold text-red-700">
                  {localError || authError}
                </div>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl pl-12 pr-4 py-2.5 text-sm font-semibold text-black placeholder:text-slate-500 focus:outline-none focus:border-blue-600/60 focus:bg-white bg-slate-50/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 text-xs font-semibold text-slate-800 select-none cursor-pointer">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/15"
            >
              {isLoading ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <span>Login</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Social Separator */}
          <div className="relative my-4 text-center select-none">
            <span className="absolute inset-x-0 top-1/2 border-t border-slate-100 -z-10"></span>
            <span className="bg-white px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">or continue with</span>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200/80 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-xs text-slate-600"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.17-3.17C17.47 1.61 14.93 1 12 1 7.37 1 3.4 3.73 1.58 7.7l3.65 2.83C6.1 7.33 8.84 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.45c-.28 1.48-1.12 2.73-2.38 3.58l3.65 2.83c2.14-1.98 3.38-4.89 3.38-8.51z"/>
                <path fill="#FBBC05" d="M5.23 10.53c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.58 5.34C.58 7.33 0 9.58 0 12s.58 4.67 1.58 6.66l3.65-5.13z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.65-2.83c-1.1.74-2.51 1.18-4.31 1.18-3.16 0-5.9-2.29-6.77-5.49L1.58 16.3C3.4 20.27 7.37 23 12 23z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Sign Up prompt */}
          <p className="text-center text-xs font-semibold text-slate-400 mt-4">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-600 hover:text-blue-700 transition-colors font-bold">
              Sign up
            </a>
          </p>
        </div>
      </div>

      {/* --- GOOGLE SIGN-IN SIMULATOR SANDBOX MODAL --- */}
      {showGoogleSandbox && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Sandbox Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="font-bold text-slate-800 text-sm">Sign in with Google</span>
              </div>
              <button 
                onClick={() => setShowGoogleSandbox(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Selector List */}
            <div className="p-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Choose an account</span>
              
              <div className="space-y-3">
                {/* Account 1: Link to existing Admin */}
                <button
                  onClick={() => handleSandboxSelect('admin@pos.com', 'John Doe')}
                  className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"
                      alt="John"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">John Doe (Admin)</h4>
                      <p className="text-xs text-slate-500">admin@pos.com</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">Link User</span>
                </button>

                {/* Account 2: Auto-create new user */}
                <button
                  onClick={() => handleSandboxSelect('clara.oswald@gmail.com', 'Clara Oswald')}
                  className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
                      alt="Clara"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">Clara Oswald</h4>
                      <p className="text-xs text-slate-500">clara.oswald@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Create New</span>
                </button>

                {/* Account 3: Custom account login */}
                {!showCustomInput ? (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="w-full py-2.5 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-bold text-xs text-slate-600 text-center"
                  >
                    + Use another account
                  </button>
                ) : (
                  <form onSubmit={handleCustomSandboxSubmit} className="border border-slate-200 rounded-xl p-3 space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Google Email</label>
                      <input
                        type="email"
                        required
                        placeholder="user@gmail.com"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-600 bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Alex Mercer"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-600 bg-slate-50/50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white font-bold py-1.5 rounded-lg text-xs hover:bg-blue-700 transition-colors"
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomInput(false)}
                        className="bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
