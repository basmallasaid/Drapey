'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers';
import { showToast, showError } from '@/lib/sweetalert';

export default function RegisterPageContent() {
  const { signup } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(email, password, fullName);
      showToast('success', 'Your account has been created');
      router.push('/');
    } catch (e) {
      const msg = e.message?.includes('already') ? 'This email is already registered.' : 'Registration failed. Please try again.';
      showError('Account Error', msg);
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
            Join <span className="not-italic font-normal">Us</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[4px] text-medium-brown opacity-60">
            Start your minimalist journey
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-8">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-medium-brown ml-1">Full Name</label>
            <input
              required type="text" value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border-b border-light-beige py-3 px-1 outline-none focus:border-tan transition-all font-sans text-sm placeholder:text-light-beige"
              placeholder="Enter your name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-medium-brown ml-1">Email Address</label>
            <input
              required type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-light-beige py-3 px-1 outline-none focus:border-tan transition-all font-sans text-sm placeholder:text-light-beige"
              placeholder="name@example.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-medium-brown ml-1">Password</label>
            <input
              required type="password" value={password} minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-light-beige py-3 px-1 outline-none focus:border-tan transition-all font-sans text-sm placeholder:text-light-beige"
              placeholder="Minimum 6 characters"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-dark-brown text-white py-5 text-[10px] font-bold uppercase tracking-[3px] hover:bg-tan transition-all duration-500 disabled:opacity-50 active:scale-[0.98] shadow-sm mt-4"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-12 text-center text-[11px] text-medium-brown tracking-wide">
          Already a member?{' '}
          <Link href="/login" className="text-dark-brown font-bold border-b border-tan pb-0.5 hover:text-tan transition-colors ml-1">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}