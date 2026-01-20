
import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../services/api';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 auth-gradient overflow-hidden relative">
      {/* Decorative Circles */}
      <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-blue-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-slate-800/50 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md relative animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 bg-blue-600 rounded-3xl items-center justify-center text-white text-3xl font-black shadow-2xl shadow-blue-500/40 mb-6">
            F
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">FuelCharge <span className="text-blue-500">Pro</span></h1>
          <p className="text-slate-400 font-medium mt-2">Enterprise House Account Management</p>
        </div>

        <div className="bg-white/10 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl mb-8 border border-white/5">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-white'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-white'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
              <input 
                required
                type="email" 
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white font-medium transition-all"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Password</label>
              <input 
                required
                type="password" 
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white font-medium transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold animate-shake">
                {error}
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLogin ? 'Access Dashboard' : 'Create My Account')}
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              <span className="bg-transparent px-4">Instant Access</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl shadow-xl hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center space-x-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
        
        <p className="text-center mt-8 text-slate-500 text-xs font-medium">
          Secure biometric-ready cloud storage powered by Firebase.
        </p>
      </div>
    </div>
  );
};

export default Auth;
