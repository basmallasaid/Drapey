'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers';
import { createClient } from '@/lib/supabase/client';
import { showToast, showError } from '@/lib/sweetalert';


export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);

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
    const { error } = await supabase
      .from('users')
      .update({ full_name: form.full_name, phone: form.phone })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      showError('Update failed', 'Could not save your profile.');
    } else {
      showToast('success', 'Profile updated successfully.');
    }
  };

  if (!user) return null;

  return (
    <>
      <main className="min-h-screen bg-white pb-20">
        {/* Header Section */}
        <div className="bg-cream pt-32 pb-16 border-b border-light-beige text-center">
          <h1 className="text-4xl md:text-6xl font-serif text-dark-brown mb-2 tracking-tight">
            My Account
          </h1>
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-[4px] text-medium-brown opacity-70">
            Manage your profile and orders
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Sidebar/Info Section */}
            <div className="lg:col-span-1 space-y-8">
              <div className="border border-light-beige p-8 rounded-sm bg-cream/20">
                <h2 className="text-[11px] font-bold uppercase tracking-[3px] text-dark-brown mb-6 border-b border-light-beige pb-4">
                  Account Overview
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-medium-brown uppercase tracking-widest block mb-1">Email Address</label>
                    <p className="text-sm font-medium text-dark-brown break-words">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-medium-brown uppercase tracking-widest block mb-1">Membership</label>
                    <p className="text-sm font-medium text-tan capitalize">{profile?.role || 'Customer'}</p>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 gap-4">
                <Link href="/orders" className="group flex items-center justify-between border border-light-beige p-5 hover:bg-dark-brown transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <svg className="w-5 h-5 text-tan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-dark-brown group-hover:text-white transition-colors">My Orders</span>
                  </div>
                  <svg className="w-4 h-4 text-medium-brown group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </Link>

                <Link href="/addresses" className="group flex items-center justify-between border border-light-beige p-5 hover:bg-dark-brown transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <svg className="w-5 h-5 text-tan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-dark-brown group-hover:text-white transition-colors">Saved Addresses</span>
                  </div>
                  <svg className="w-4 h-4 text-medium-brown group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>

              <button
                onClick={() => { logout(); router.push('/'); }}
                className="w-full py-4 text-[10px] font-bold uppercase tracking-[3px] text-red-500 border border-red-100 hover:bg-red-50 transition-all duration-300"
              >
                Sign Out
              </button>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="border border-light-beige p-8 md:p-12 shadow-sm">
                <h2 className="text-[13px] font-bold uppercase tracking-[4px] text-dark-brown mb-10 text-center lg:text-left">
                  Personal Details
                </h2>
                
                <form onSubmit={handleSave} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-medium-brown">Full Name</label>
                      <input
                        value={form.full_name}
                        onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))}
                        className="w-full border-b border-light-beige py-3 text-sm focus:border-tan outline-none transition-all placeholder:text-light-beige font-sans"
                        placeholder="e.g. Basmala"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-medium-brown">Phone Number</label>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                        className="w-full border-b border-light-beige py-3 text-sm focus:border-tan outline-none transition-all placeholder:text-light-beige font-sans"
                        placeholder="e.g. 010xxxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      type="submit" 
                      disabled={saving} 
                      className="bg-dark-brown text-white px-12 py-4 text-[10px] font-bold uppercase tracking-[3px] hover:bg-tan transition-all duration-500 disabled:opacity-50 hover:shadow-lg active:scale-95"
                    >
                      {saving ? 'Saving Changes...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}