'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers';
import { createClient } from '@/lib/supabase/client';
import { showToast, showError } from '@/lib/sweetalert';

export default function LoginPageContent() {
  const { googleSignIn, login } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const { data: { user } } = await supabase.auth.getUser();
      let isAdmin = false;
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        isAdmin = profile?.role === 'admin';
      }
      showToast('success', 'Welcome back to Drapey');
      router.push(isAdmin ? '/admin' : '/');
    } catch (e) {
      showError('Login Failed', 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F6F3] py-12 px-4 selection:bg-tan/20">
      <div className="max-w-[440px] w-full bg-white shadow-[0_20px_80px_rgba(0,0,0,0.03)] p-10 md:p-16 animate-fadeIn">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-dark-brown mb-3 tracking-tight italic">
            Login <span className="not-italic font-normal">Back</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[4px] text-medium-brown opacity-60">
            Welcome to the community
          </p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-8">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-medium-brown ml-1">Email Address</label>
            <input
              required type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-light-beige py-3 px-1 outline-none focus:border-tan transition-all font-sans text-sm placeholder:text-light-beige"
              placeholder="name@example.com"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2 relative">
             <label className="text-[9px] font-bold uppercase tracking-widest text-medium-brown ml-1">Password</label>
            <input
              required type={showPassword ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-light-beige py-3 px-1 pr-10 outline-none focus:border-tan transition-all font-sans text-sm placeholder:text-light-beige"
              placeholder="••••••••"
            />
            <button
              type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute bottom-3 right-1 text-medium-brown hover:text-tan transition-colors"
            >
              <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
              </svg>
            </button>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-dark-brown text-white py-5 text-[10px] font-bold uppercase tracking-[3px] hover:bg-tan transition-all duration-500 disabled:opacity-50 active:scale-[0.98] shadow-sm"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-10">
            <div className="w-full border-t border-light-beige"></div>
            <span className="absolute bg-white px-4 text-[9px] font-bold uppercase tracking-widest text-light-beige">or</span>
          </div>

          {/* Google Button */}
          <button
            type="button" onClick={googleSignIn}
            className="w-full border border-light-beige py-4 flex items-center justify-center gap-3 hover:bg-cream transition-all duration-500 group"
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-[2px] text-dark-brown">Continue with Google</span>
          </button>
        </form>

        <p className="mt-12 text-center text-[11px] text-medium-brown tracking-wide">
          New to Drapey?{' '}
          <Link href="/register" className="text-dark-brown font-bold border-b border-tan pb-0.5 hover:text-tan transition-colors ml-1">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}