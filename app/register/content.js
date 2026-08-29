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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(email, password, fullName);
      showToast('success', 'Account created!');
      router.push('/');
    } catch (e) {
      if (e.message?.includes('already')) {
        showError('Registration failed', 'This email is already registered.');
        setError('This email is already registered.');
      } else {
        showError('Registration failed', 'Please try again.');
        setError(e.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f5f3] py-12 px-4">
      <div className="max-w-md w-full bg-white shadow-lg p-8 md:p-12">
        <h2 className="text-3xl font-serif font-medium uppercase mb-10 text-center tracking-widest">Register</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <input
            required
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border-b border-gray-300 py-3 outline-none focus:border-black transition-all text-sm"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-b border-gray-300 py-3 outline-none focus:border-black transition-all text-sm"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="w-full border-b border-gray-300 py-3 outline-none focus:border-black transition-all text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-[2px] hover:bg-gray-800 mt-4 disabled:opacity-50 transition-all"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-black font-bold">Login</Link>
        </p>
      </div>
    </div>
  );
}
