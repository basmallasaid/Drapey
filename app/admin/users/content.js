"use client";

import { useState } from "react";
import { useAuth } from "@/providers";

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

  async function handleRoleChange(userId, newRole) {
    setUpdating(userId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setMessage({ type: "success", text: "Role updated" });
      window.location.reload();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(userId) {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    setUpdating(userId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setMessage({ type: "success", text: "User deleted" });
      window.location.reload();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-taupe rounded-lg text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-pebble focus:border-pebble"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 border border-taupe rounded-lg text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-pebble"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-sand shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand text-left text-stone bg-cream">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-charcoal-soft">No users found</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-sand last:border-0 hover:bg-row-hover">
                    <td className="px-5 py-3">
                      <p className="font-medium text-charcoal">
                        {u.full_name || "No name"}
                        {u.id === currentUser?.id && <span className="ml-2 text-xs text-stone">(you)</span>}
                      </p>
                      <p className="text-xs text-stone">{u.email}</p>
                    </td>
                    <td className="px-5 py-3 text-charcoal-soft">{u.phone || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        u.role === "admin" ? "bg-taupe text-charcoal" : "bg-cream text-charcoal-soft"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-charcoal-soft">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={updating === u.id || u.id === currentUser?.id}
                          className="px-2 py-1 border border-taupe rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-pebble disabled:opacity-40"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={updating === u.id || u.id === currentUser?.id}
                          title={u.id === currentUser?.id ? "You cannot delete yourself" : "Delete"}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-stone">{filtered.length} user{filtered.length !== 1 ? "s" : ""} shown</p>
    </div>
  );
}
