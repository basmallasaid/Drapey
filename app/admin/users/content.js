// app/admin/users/content.js
"use client";

import { useState } from "react";
import { useAuth } from "@/providers";
import { showToast, showError, confirmAction } from "@/lib/sweetalert";
import { 
  Search, ShieldCheck, User as UserIcon, Trash2, 
  Mail, Phone, Calendar, MoreHorizontal, ShieldAlert 
} from "lucide-react";

const roleStyles = {
  admin: "bg-[var(--color-dark-brown)] text-white border-[var(--color-dark-brown)]", // Ø´ÙƒÙ„ ÙØ®Ù… Ù„Ù„Ø¢Ø¯Ù…Ù†
  customer: "bg-[var(--color-light-beige)] text-[var(--color-dark-brown)] border-[var(--color-light-beige)]", // Ø´ÙƒÙ„ Ù‡Ø§Ø¯Ø¦ Ù„Ù„Ø¹Ù…ÙŠÙ„
};

export default function UsersContent({ users }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [userList, setUserList] = useState(users);
  const { user: currentUser } = useAuth();

  const filtered = userList.filter((u) => {
    const matchSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // (Ù†ÙØ³ Ø¯ÙˆØ§Ù„ handleRoleChange Ùˆ handleDelete Ø§Ù„Ø£ØµÙ„ÙŠØ©)
  async function handleRoleChange(userId, newRole) {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await showToast("success", "Role updated.");
      window.location.reload();
    } catch (e) {
      showError("Could not update role", e.message || "Update failed");
      setUpdating(null);
    }
  }

  async function handleDelete(target) {
    const userId = target?.id;
    if (!userId) return;
    const confirmed = await confirmAction({
      title: "Delete user?",
      text: `Are you sure you want to delete "${target?.full_name}"? This cannot be undone.`,
      confirmText: "Yes, delete",
    });
    if (!confirmed) return;
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }
      setUserList((prev) => prev.filter((u) => u.id !== userId));
      showToast("success", "User deleted.");
    } catch (e) {
      showError("Could not delete user", e.message || "Failed to delete user.");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-dark-brown)]">User Directory</h2>
          <p className="text-sm text-[var(--color-medium-brown)]">Manage permissions and view customer activity</p>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-[20px] border border-[var(--color-light-beige)] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-medium-brown)]" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[var(--color-cream)] border-none rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-tan)] outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 bg-[var(--color-cream)] border-none rounded-xl text-sm font-medium outline-none cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="customer">Customers</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[24px] border border-[var(--color-light-beige)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--color-cream)] border-b border-[var(--color-light-beige)]">
              <tr className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-medium-brown)]">
                <th className="px-8 py-5">User Profile</th>
                <th className="px-6 py-5">Contact</th>
                <th className="px-6 py-5 text-center">Access Level</th>
                <th className="px-6 py-5">Registration Date</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-light-beige)]">
              {filtered.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const initials = u.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

                return (
                  <tr key={u.id} className="hover:bg-[var(--color-cream)]/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--color-light-beige)] rounded-full flex items-center justify-center text-[var(--color-dark-brown)] font-bold text-sm border border-[var(--color-light-beige)] shrink-0">
                          {initials || <UserIcon size={20}/>}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[var(--color-dark-brown)] flex items-center gap-2">
                            {u.full_name || "Guest User"}
                            {isSelf && <span className="px-2 py-0.5 bg-[var(--color-light-beige)] text-[var(--color-dark-brown)] text-[8px] font-bold uppercase rounded-md tracking-tighter">You</span>}
                          </span>
                          <span className="text-xs text-[var(--color-medium-brown)] flex items-center gap-1">
                            <Mail size={12}/> {u.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs text-[var(--color-dark-brown)] font-medium">
                        <Phone size={14} className="text-[var(--color-medium-brown)]"/>
                        {u.phone || "No phone"}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${roleStyles[u.role]}`}>
                        {u.role === 'admin' ? <ShieldCheck size={12}/> : <UserIcon size={12}/>}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs text-[var(--color-medium-brown)]">
                        <Calendar size={14}/>
                        {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={updating === u.id || isSelf}
                          className="text-[10px] font-bold uppercase bg-white border border-[var(--color-light-beige)] rounded-lg px-2 py-1 outline-none cursor-pointer disabled:opacity-30"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={updating === u.id || isSelf}
                          className={`p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all ${isSelf ? "opacity-0 pointer-events-none" : "disabled:opacity-60 disabled:pointer-events-none"}`}
                          title={isSelf ? "Cannot delete yourself" : "Delete user"}
                        >
                          {updating === u.id ? (
                            <span className="block w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] text-[var(--color-medium-brown)] font-medium italic">Showing {filtered.length} active members</p>
    </div>
  );
}