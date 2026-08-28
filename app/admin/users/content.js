// app/admin/users/content.js
"use client";

import { useState } from "react";
import { useAuth } from "@/providers";
import { 
  Search, ShieldCheck, User as UserIcon, Trash2, 
  Mail, Phone, Calendar, MoreHorizontal, ShieldAlert 
} from "lucide-react";

const roleStyles = {
  admin: "bg-[#3E3A36] text-white border-[#3E3A36]", // شكل فخم للآدمن
  customer: "bg-[#F3EFEA] text-[#3E3A36] border-[#EBE2DA]", // شكل هادئ للعميل
};

export default function UsersContent({ users }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [message, setMessage] = useState(null);
  const { user: currentUser } = useAuth();

  const filtered = users.filter((u) => {
    const matchSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // (نفس دوال handleRoleChange و handleDelete الأصلية)
  async function handleRoleChange(userId, newRole) {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) throw new Error("Update failed");
      window.location.reload();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
      setUpdating(null);
    }
  }

  async function handleDelete(userId) {
    if (!confirm("Are you sure?")) return;
    setUpdating(userId);
    try {
      await fetch("/api/admin/users", { method: "DELETE", body: JSON.stringify({ userId }) });
      window.location.reload();
    } catch (e) {
       setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#3E3A36]">User Directory</h2>
          <p className="text-sm text-[#8E8A84]">Manage permissions and view customer activity</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-medium border ${message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}>
          {message.text}
        </div>
      )}

      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-[20px] border border-[#EBE2DA] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8A84]" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[#FAF8F5] border-none rounded-xl text-sm focus:ring-1 focus:ring-[#DCD6CC] outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#FAF8F5] border-none rounded-xl text-sm font-medium outline-none cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="customer">Customers</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[24px] border border-[#EBE2DA] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF8F5] border-b border-[#EBE2DA]">
              <tr className="text-[11px] font-bold uppercase tracking-widest text-[#8E8A84]">
                <th className="px-8 py-5">User Profile</th>
                <th className="px-6 py-5">Contact</th>
                <th className="px-6 py-5 text-center">Access Level</th>
                <th className="px-6 py-5">Registration Date</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE2DA]">
              {filtered.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const initials = u.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

                return (
                  <tr key={u.id} className="hover:bg-[#FAF8F5]/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F3EFEA] rounded-full flex items-center justify-center text-[#3E3A36] font-bold text-sm border border-[#EBE2DA] shrink-0">
                          {initials || <UserIcon size={20}/>}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#3E3A36] flex items-center gap-2">
                            {u.full_name || "Guest User"}
                            {isSelf && <span className="px-2 py-0.5 bg-[#EBE2DA] text-[#3E3A36] text-[8px] font-bold uppercase rounded-md tracking-tighter">You</span>}
                          </span>
                          <span className="text-xs text-[#8E8A84] flex items-center gap-1">
                            <Mail size={12}/> {u.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs text-[#3E3A36] font-medium">
                        <Phone size={14} className="text-[#8E8A84]"/>
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
                      <div className="flex items-center gap-2 text-xs text-[#8E8A84]">
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
                          className="text-[10px] font-bold uppercase bg-white border border-[#EBE2DA] rounded-lg px-2 py-1 outline-none cursor-pointer disabled:opacity-30"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={updating === u.id || isSelf}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all disabled:opacity-0"
                          title={isSelf ? "Cannot delete yourself" : "Delete user"}
                        >
                          <Trash2 size={16} />
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
      <p className="text-[11px] text-[#8E8A84] font-medium italic">Showing {filtered.length} active members</p>
    </div>
  );
}