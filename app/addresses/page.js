'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers';
import { createClient } from '@/lib/supabase/client';
import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/FooterWrapper';

export default function AddressesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    full_name: '', phone: '', governorate: '', city: '',
    area: '', street: '', building: '', floor: '', apartment: '',
    is_default: false,
  });
  const [error, setError] = useState('');

  const fetchAddresses = async () => {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    setAddresses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchAddresses();
  }, [user, router]);

  const resetForm = () => {
    setForm({ full_name: '', phone: '', governorate: '', city: '', area: '', street: '', building: '', floor: '', apartment: '', is_default: false });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (addr) => {
    setForm({
      full_name: addr.full_name, phone: addr.phone, governorate: addr.governorate,
      city: addr.city, area: addr.area, street: addr.street, building: addr.building,
      floor: addr.floor, apartment: addr.apartment, is_default: addr.is_default,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (form.is_default) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      }
      if (editingId) {
        const { error } = await supabase.from('addresses').update(form).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('addresses').insert({ ...form, user_id: user.id });
        if (error) throw error;
      }
      resetForm();
      fetchAddresses();
    } catch (err) {
      setError(err.message || 'Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;
      fetchAddresses();
    } catch (err) {
      setError(err.message || 'Failed to delete address');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[#f6f5f3] py-16 text-center mb-10 border-b border-gray-100">
        <h1 className="text-3xl md:text-5xl font-serif font-medium mb-4">Addresses</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 pb-20">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors mb-8"
        >
          + Add New Address
        </button>

        {showForm && (
          <form onSubmit={handleSave} className="border border-gray-100 p-6 mb-8 animate-fadeIn">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-6">{editingId ? 'Edit Address' : 'New Address'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Full Name" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="phone" value={form.phone} onChange={handleChange} required placeholder="Phone" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="governorate" value={form.governorate} onChange={handleChange} required placeholder="Governorate" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="city" value={form.city} onChange={handleChange} required placeholder="City" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="area" value={form.area} onChange={handleChange} placeholder="Area" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="street" value={form.street} onChange={handleChange} required placeholder="Street" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="building" value={form.building} onChange={handleChange} placeholder="Building" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="floor" value={form.floor} onChange={handleChange} placeholder="Floor" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
              <input name="apartment" value={form.apartment} onChange={handleChange} placeholder="Apartment" className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors" />
            </div>
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" name="is_default" checked={form.is_default} onChange={handleChange} className="accent-black" />
              <span className="text-sm">Set as default</span>
            </label>
            <div className="flex gap-3 mt-6">
              <button type="submit" className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                {editingId ? 'Update' : 'Save'}
              </button>
              <button type="button" onClick={resetForm} className="border border-gray-200 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="border border-gray-100 p-6 flex justify-between items-start">
              <div className="text-sm">
                <p className="font-medium">{addr.full_name} — {addr.phone}</p>
                <p className="text-gray-500 mt-1">{addr.street}{addr.building ? `, Bldg ${addr.building}` : ''}{addr.floor ? `, Fl ${addr.floor}` : ''}{addr.apartment ? `, Apt ${addr.apartment}` : ''}</p>
                <p className="text-gray-500">{addr.city}, {addr.governorate}</p>
                {addr.is_default && <span className="text-[10px] font-bold text-gray-400 uppercase mt-2 inline-block">Default</span>}
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => handleEdit(addr)} className="text-xs font-bold text-gray-400 hover:text-black transition-colors">Edit</button>
                <button onClick={() => handleDelete(addr.id)} className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {addresses.length === 0 && !showForm && (
            <p className="text-center text-gray-400 py-10">No addresses saved yet.</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
