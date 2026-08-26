"use client";

import { useState } from "react";

export default function CategoriesContent({ categories }) {
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const editCategory = editing ? categories.find((c) => c.id === editing) : null;

  async function handleSave(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const body = {
      name: form.get("name"),
      slug: form.get("slug"),
      description: form.get("description"),
      image_url: form.get("image_url"),
    };

    try {
      const res = await fetch("/api/admin/categories", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing, ...body } : body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      setMessage({ type: "success", text: editing ? "Category updated" : "Category created" });
      setShowForm(false);
      setEditing(null);
      window.location.reload();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this category? Products in this category will become uncategorized.")) return;
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setMessage({ type: "success", text: "Category deleted" });
      window.location.reload();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  }

  return (
    <div>
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{editing ? "Edit Category" : "Add New Category"}</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input name="name" required defaultValue={editCategory?.name || ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input name="slug" required defaultValue={editCategory?.slug || ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows={2} defaultValue={editCategory?.description || ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input name="image_url" defaultValue={editCategory?.image_url || ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div className="flex items-end gap-2">
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

      <div className="mb-6">
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); }}
          className="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
        >
          {showForm ? "Close Form" : "+ Add Category"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No categories yet. Create your first one above.
          </div>
        ) : (
          categories.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{c.name}</h4>
                  <p className="text-xs text-gray-400">/{c.slug}</p>
                </div>
                {c.image_url && (
                  <img src={c.image_url} alt="" className="w-12 h-12 rounded object-cover bg-gray-100" />
                )}
              </div>
              {c.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{c.description}</p>
              )}
              <p className="text-xs text-gray-400 mb-3">{c.products?.[0]?.count || 0} product{(c.products?.[0]?.count || 0) !== 1 ? "s" : ""}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditing(c.id); setShowForm(true); }}
                  className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
