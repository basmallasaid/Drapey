"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function emptyVariant() {
  return { size: "", color: "", stock_quantity: 1 };
}

export default function ProductsContent({ products, categories }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category_id, setCategoryId] = useState("");
  const [is_active, setIsActive] = useState(true);
  const [variants, setVariants] = useState([emptyVariant()]);
  const [images, setImages] = useState([]);

  const supabase = createClient();

  const filtered = products.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.is_active) ||
      (statusFilter === "inactive" && !p.is_active);
    return matchSearch && matchStatus;
  });

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setCategoryId("");
    setIsActive(true);
    setVariants([emptyVariant()]);
    setImages([]);
  }

  function startCreate() {
    setEditing(null);
    resetForm();
    setShowForm(true);
  }

  function startEdit(p) {
    setEditing(p.id);
    setName(p.name);
    setDescription(p.description || "");
    setPrice(p.price);
    setCategoryId(p.category_id || "");
    setIsActive(p.is_active);
    setVariants((p.product_variants || []).map((v) => ({
      size: v.size,
      color: v.color,
      stock_quantity: v.stock_quantity,
    })));
    setImages((p.product_images || []).map((img) => ({
      image_url: img.image_url,
      is_primary: img.is_primary,
    })));
    setShowForm(true);
  }

  async function uploadImage(file) {
    const path = `products/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file);
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave(e) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    const validVariants = variants.filter((v) => v.size && v.color);
    const body = {
      name,
      description,
      price: parseFloat(price),
      category_id: category_id || null,
      is_active,
      variants: validVariants,
      images: images.filter((img) => img.image_url),
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing, ...body } : body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");
      setMessage({ type: "success", text: editing ? "Product updated" : "Product created" });
      setShowForm(false);
      setEditing(null);
      window.location.reload();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id, current) {
    setMessage(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !current }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      setMessage({ type: "success", text: `Product ${!current ? "activated" : "deactivated"}` });
      window.location.reload();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(id);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setMessage({ type: "success", text: "Product deleted" });
      window.location.reload();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setDeleting(null);
    }
  }

  async function handleImageUpload(e, index) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    try {
      const url = await uploadImage(file);
      const next = [...images];
      if (index === -1) {
        next.push({ image_url: url, is_primary: next.length === 0 });
      } else {
        next[index] = { ...next[index], image_url: url };
      }
      setImages(next);
    } catch (err) {
      setMessage({ type: "error", text: `Image upload failed: ${err.message}` });
    }
  }

  const primaryImage = (p) =>
    (p.product_images || []).find((i) => i.is_primary) || (p.product_images || [])[0];

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
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" min="0" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={category_id} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={is_active} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                Active
              </label>
            </div>

            {/* Variants */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Variants (Size / Color / Stock)</label>
                <button type="button" onClick={() => setVariants([...variants, emptyVariant()])} className="text-xs text-teal-600 font-medium hover:underline">
                  + Add variant
                </button>
              </div>
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_90px_36px] gap-2 items-center">
                    <input
                      placeholder="Size (e.g. M)"
                      value={v.size}
                      onChange={(e) => {
                        const next = [...variants];
                        next[i] = { ...next[i], size: e.target.value };
                        setVariants(next);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      placeholder="Color (e.g. Black)"
                      value={v.color}
                      onChange={(e) => {
                        const next = [...variants];
                        next[i] = { ...next[i], color: e.target.value };
                        setVariants(next);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Stock"
                      value={v.stock_quantity}
                      onChange={(e) => {
                        const next = [...variants];
                        next[i] = { ...next[i], stock_quantity: Number(e.target.value) };
                        setVariants(next);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                      className="text-red-500 hover:text-red-700 text-lg"
                      title="Remove variant"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Product Images</label>
                <button type="button" onClick={() => setImages([...images, { image_url: "", is_primary: images.length === 0 }])} className="text-xs text-teal-600 font-medium hover:underline">
                  + Add image
                </button>
              </div>
              <div className="space-y-2">
                {images.map((img, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {img.image_url && (
                      <img src={img.image_url} alt="" className="w-12 h-12 rounded object-cover bg-gray-100 shrink-0" />
                    )}
                    <input
                      placeholder="Image URL (or upload below)"
                      value={img.image_url}
                      onChange={(e) => {
                        const next = [...images];
                        next[i] = { ...next[i], image_url: e.target.value };
                        setImages(next);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <label className="text-xs text-teal-600 cursor-pointer hover:underline shrink-0">
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, i)} />
                    </label>
                    <label className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
                      <input
                        type="checkbox"
                        checked={!!img.is_primary}
                        onChange={(e) => {
                          const next = images.map((x, idx) => ({ ...x, is_primary: idx === i ? e.target.checked : false }));
                          setImages(next);
                        }}
                        className="rounded border-gray-300 text-teal-600"
                      />
                      Primary
                    </label>
                    <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 text-lg shrink-0">×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                {saving ? "Saving..." : editing ? "Update" : "Create"}
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
          onClick={() => { showForm ? setShowForm(false) : startCreate(); }}
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
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">No products found</td></tr>
              ) : (
                filtered.map((p) => {
                  const img = primaryImage(p);
                  const totalStock = (p.product_variants || []).reduce((s, v) => s + (v.stock_quantity || 0), 0);
                  return (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {img ? (
                            <img src={img.image_url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
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
                      <td className="px-5 py-3 text-gray-600">{p.product_variants?.length || 0} variants · {totalStock} units</td>
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
                          <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-50">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">{filtered.length} product{filtered.length !== 1 ? "s" : ""} shown</p>
    </div>
  );
}
