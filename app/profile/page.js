'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers';
import { createClient } from '@/lib/supabase/client';
import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/FooterWrapper';

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (profile) {
      setForm({ full_name: profile.full_name || '', phone: profile.phone || '' });
    }
  }, [user, profile, router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const { error } = await supabase
      .from('users')
      .update({ full_name: form.full_name, phone: form.phone })
      .eq('id', user.id);
    setSaving(false);
    setMessage(error ? 'Failed to save' : 'Saved successfully');
  };

  if (!user) return null;

  return (
    <>
      <Navbar />
      <div className="pt-20">
      <div className="bg-[#f6f5f3] py-16 text-center mb-10 border-b border-gray-100">
        <h1 className="text-3xl md:text-5xl font-serif font-medium mb-4">Profile</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-8 pb-20">
        <div className="space-y-6">
          {/* Account info */}
          <div className="border border-gray-100 p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-6">Account Details</h2>
            <p className="text-sm text-gray-500 mb-4">Email: <span className="text-black font-medium">{user.email}</span></p>
            <p className="text-sm text-gray-500 mb-6">Role: <span className="text-black font-medium capitalize">{profile?.role || 'customer'}</span></p>

            <form onSubmit={handleSave} className="space-y-4">
              <input
                value={form.full_name}
                onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Full Name"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="Phone"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors"
              />
              <div className="flex items-center gap-4">
                <button type="submit" disabled={saving} className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {message && <span className="text-sm text-gray-500">{message}</span>}
              </div>
            </form>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/addresses" className="border border-gray-100 p-6 text-center hover:bg-gray-50 transition-colors">
              <p className="text-xs font-bold uppercase tracking-widest">Addresses</p>
            </Link>
            <Link href="/orders" className="border border-gray-100 p-6 text-center hover:bg-gray-50 transition-colors">
              <p className="text-xs font-bold uppercase tracking-widest">Orders</p>
            </Link>
          </div>

          <button
            onClick={() => { logout(); router.push('/'); }}
            className="w-full border border-red-200 text-red-500 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
