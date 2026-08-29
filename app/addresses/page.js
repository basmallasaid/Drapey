'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers';
import { createClient } from '@/lib/supabase/client';
import { showToast, showError, confirmAction } from '@/lib/sweetalert';


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
        showToast('success', 'Address updated.');
      } else {
        const { error } = await supabase.from('addresses').insert({ ...form, user_id: user.id });
        if (error) throw error;
        showToast('success', 'Address saved.');
      }
      resetForm();
      fetchAddresses();
    } catch (err) {
      showError('Could not save address', err.message || 'Failed to save address');
      setError(err.message || 'Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: 'Delete address?',
      text: 'This address will be permanently removed. Are you sure?',
      confirmText: 'Yes, delete',
    });
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;
      fetchAddresses();
      showToast('success', 'Address deleted.');
    } catch (err) {
      showError('Could not delete address', err.message || 'Failed to delete address');
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
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-light-beige border-t-tan rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pt-20">
      <div className="bg-cream py-16 text-center mb-10 border-b border-light-beige">
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
          className="bg-dark-brown text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-tan transition-colors mb-8"
        >
          + Add New Address
        </button>

        {showForm && (
          <form onSubmit={handleSave} className="border border-light-beige p-6 mb-8 animate-fadeIn">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-6">{editingId ? 'Edit Address' : 'New Address'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Full Name" className="border border-light-beige px-4 py-3 text-sm outline-none focus:border-tan transition-colors" />
              <input name="phone" value={form.phone} onChange={handleChange} required placeholder="Phone" className="border border-light-beige px-4 py-3 text-sm outline-none focus:border-tan transition-colors" />
              <input name="governorate" value={form.governorate} onChange={handleChange} required placeholder="Governorate" className="border border-light-beige px-4 py-3 text-sm outline-none focus:border-tan transition-colors" />
              <input name="city" value={form.city} onChange={handleChange} required placeholder="City" className="border border-light-beige px-4 py-3 text-sm outline-none focus:border-tan transition-colors" />
              <input name="area" value={form.area} onChange={handleChange} placeholder="Area" className="border border-light-beige px-4 py-3 text-sm outline-none focus:border-tan transition-colors" />
              <input name="street" value={form.street} onChange={handleChange} required placeholder="Street" className="border border-light-beige px-4 py-3 text-sm outline-none focus:border-tan transition-colors" />
              <input name="building" value={form.building} onChange={handleChange} placeholder="Building" className="border border-light-beige px-4 py-3 text-sm outline-none focus:border-tan transition-colors" />
              <input name="floor" value={form.floor} onChange={handleChange} placeholder="Floor" className="border border-light-beige px-4 py-3 text-sm outline-none focus:border-tan transition-colors" />
              <input name="apartment" value={form.apartment} onChange={handleChange} placeholder="Apartment" className="border border-light-beige px-4 py-3 text-sm outline-none focus:border-tan transition-colors" />
            </div>
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" name="is_default" checked={form.is_default} onChange={handleChange} className="accent-tan" />
              <span className="text-sm">Set as default</span>
            </label>
            <div className="flex gap-3 mt-6">
              <button type="submit" className="bg-dark-brown text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-tan transition-colors">
                {editingId ? 'Update' : 'Save'}
              </button>
              <button type="button" onClick={resetForm} className="border border-light-beige px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-cream transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="border border-light-beige p-6 flex justify-between items-start">
              <div className="text-sm">
                <p className="font-semibold text-dark-brown">{addr.full_name} — {addr.phone}</p>
                <p className="text-medium-brown mt-1">{addr.street}{addr.building ? `, Bldg ${addr.building}` : ''}{addr.floor ? `, Fl ${addr.floor}` : ''}{addr.apartment ? `, Apt ${addr.apartment}` : ''}</p>
                <p className="text-medium-brown">{addr.city}, {addr.governorate}</p>
                {addr.is_default && <span className="text-[10px] font-bold text-tan uppercase mt-2 inline-block">Default</span>}
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => handleEdit(addr)} className="text-xs font-bold text-medium-brown hover:text-tan transition-colors">Edit</button>
                <button onClick={() => handleDelete(addr.id)} className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {addresses.length === 0 && !showForm && (
            <p className="text-center text-medium-brown py-10">No addresses saved yet.</p>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
