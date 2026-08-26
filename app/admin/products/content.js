"use client";

import { useState } from "react";

export default function ProductsContent({ products, categories }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = products.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.is_active) ||
      (statusFilter === "inactive" && !p.is_active);
    return matchSearch && matchStatus;
  });

  async function toggleActive(id, current) {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !current }),
      });
      if (!res.ok) throw new Error("Failed");
      setMessage({ type: "success", text: `Product ${!current ? "activated" : "deactivated"}` });
      window.location.reload();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setMessage({ type: "success", text: "Product deleted" });
      window.location.reload();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const body = {
      name: form.get("name"),
      description: form.get("description"),
      price: parseFloat(form.get("price")),
      category_id: form.get("category_id") || null,
      image_url: form.get("image_url"),
      is_active: form.get("is_active") === "on",
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing, ...body } : body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      setMessage({ type: "success", text: editing ? "Product updated" : "Product created" });
      setShowForm(false);
      setEditing(null);
      window.location.reload();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  }

  function startEdit(p) {
    setEditing(p.id);
    setShowForm(true);
  }

  const editProduct = editing ? products.find((p) => p.id === editing) : null;

  return (
    <div>
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{editing ? "Edit Product" : "Add New Product"}</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input name="name" required defaultValue={editProduct?.name || ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input name="price" type="number" step="0.01" min="0" required defaultValue={editProduct?.price || ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows={3} defaultValue={editProduct?.description || ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category_id" defaultValue={editProduct?.category_id || ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input name="image_url" defaultValue={editProduct?.image_url || ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="is_active" defaultChecked={editProduct?.is_active ?? true} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <label className="text-sm text-gray-700">Active</label>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
                {editing ? "Update" : "Create"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); }}
          className="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
        >
          {showForm ? "Close Form" : "+ Add Product"}
        </button>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-500">No products found</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No</div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{p.categories?.name || "—"}</td>
                    <td className="px-5 py-3 font-medium">${(p.price || 0).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(p.id, p.is_active)}
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          p.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(p)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">Edit</button>
                        <button onClick={() => handleDelete(p.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">{filtered.length} product{filtered.length !== 1 ? "s" : ""} shown</p>
    </div>
  );
}
