// app/admin/products/content.js
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { COMMON_SIZES, normalizeSize } from "@/lib/sizes";
import { showToast, showError, confirmAction } from "@/lib/sweetalert";
import { 
  Plus, Search, Filter, Edit2, Trash2, CheckCircle, 
  XCircle, Image as ImageIcon, MoreHorizontal, X, UploadCloud 
} from "lucide-react";

function emptyVariant() {
  return { size: "", color: "", stock_quantity: 1 };
}

function isCommonSize(size) {
  return COMMON_SIZES.includes(size);
}

export default function ProductsContent({ products, categories }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [productList, setProductList] = useState(products);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category_id, setCategoryId] = useState("");
  const [is_active, setIsActive] = useState(true);
  const [variants, setVariants] = useState([emptyVariant()]);
  const [images, setImages] = useState([]);

  const supabase = createClient();

  const filtered = productList.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.is_active) ||
      (statusFilter === "inactive" && !p.is_active);
    return matchSearch && matchStatus;
  });

  // (Ù†ÙØ³ Ø§Ù„Ø¯ÙˆØ§Ù„ handleSave, handleImageUpload ÙƒÙ…Ø§ Ù‡ÙŠ ÙÙŠ ÙƒÙˆØ¯Ùƒ Ø§Ù„Ø£ØµÙ„ÙŠ)
  // ... Ø³Ø£Ø®ØªØµØ±Ù‡Ø§ Ù‡Ù†Ø§ Ù„Ù„ØªØ±ÙƒÙŠØ² Ø¹Ù„Ù‰ Ø§Ù„ØªØµÙ…ÙŠÙ… ...
  async function handleSave(e) { /* ÙƒÙˆØ¯ Ø§Ù„Ø­ÙØ¸ Ø§Ù„Ø£ØµÙ„ÙŠ */ }
  async function handleImageUpload(e, index) { /* ÙƒÙˆØ¯ Ø§Ù„Ø±ÙØ¹ Ø§Ù„Ø£ØµÙ„ÙŠ */ }

  async function handleDelete(target) {
    const id = target?.id;
    if (!id) return;
    const confirmed = await confirmAction({
      title: "Delete product?",
      text: `Are you sure you want to delete "${target?.name}"? This will also remove its images and variants. This cannot be undone.`,
      confirmText: "Yes, delete",
    });
    if (!confirmed) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product");
      }
      setProductList((prev) => prev.filter((p) => p.id !== id));
      showToast("success", "Product deleted.");
    } catch (err) {
      showError("Could not delete product", err.message || "Failed to delete product.");
    } finally {
      setDeleting(null);
    }
  }
  function startEdit(p) { /* ÙƒÙˆØ¯ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø£ØµÙ„ÙŠ */ setEditing(p.id); setName(p.name); setDescription(p.description || ""); setPrice(p.price); setCategoryId(p.category_id || ""); setIsActive(p.is_active); setVariants((p.product_variants || []).map((v) => ({ size: normalizeSize(v.size), color: v.color, stock_quantity: v.stock_quantity, }))); setImages((p.product_images || []).map((img) => ({ image_url: img.image_url, is_primary: img.is_primary, }))); setShowForm(true); }
  function startCreate() { setEditing(null); setName(""); setDescription(""); setPrice(""); setCategoryId(""); setIsActive(true); setVariants([emptyVariant()]); setImages([]); setShowForm(true); }

  return (
    <div className="space-y-6">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-dark-brown)]">Products</h2>
          <p className="text-sm text-[var(--color-medium-brown)]">Manage your garment collection and inventory</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-dark-brown)] text-white rounded-full text-sm font-semibold hover:bg-[var(--color-tan)] transition-all shadow-lg shadow-[var(--color-dark-brown)]/10"
        >
          <Plus size={18} /> Add New Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-[20px] border border-[var(--color-light-beige)] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-medium-brown)]" size={18} />
          <input
            type="text"
            placeholder="Search by product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[var(--color-cream)] border-none rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-tan)] outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[var(--color-cream)] border-none rounded-xl text-sm text-[var(--color-dark-brown)] font-medium outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Main Form (Overlay or In-line) */}
      {showForm && (
        <div className="bg-white rounded-[24px] border border-[var(--color-light-beige)] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-6 border-b border-[var(--color-light-beige)] flex justify-between items-center bg-[var(--color-cream)]">
            <h3 className="font-bold text-lg text-[var(--color-dark-brown)]">{editing ? "Edit Product" : "Create New Product"}</h3>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-[var(--color-light-beige)] rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* Left Column: General Info */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-medium-brown)]">General Information</h4>
                <div>
                  <label className="block text-xs font-bold mb-2 text-[var(--color-dark-brown)]">Product Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-[var(--color-light-beige)] focus:border-[var(--color-tan)] outline-none transition-all" placeholder="e.g. Silk Evening Dress" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-2 text-[var(--color-dark-brown)]">Price (EGP)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-[var(--color-light-beige)] outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 text-[var(--color-dark-brown)]">Category</label>
                    <select value={category_id} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[var(--color-light-beige)] outline-none bg-white">
                      <option value="">Select Category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2 text-[var(--color-dark-brown)]">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border border-[var(--color-light-beige)] outline-none resize-none" placeholder="Describe the fabric, fit, and style..." />
                </div>

                {/* Variants Management */}
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-medium-brown)]">Inventory & Variants</h4>
                     <button type="button" onClick={() => setVariants([...variants, emptyVariant()])} className="text-xs font-bold text-[var(--color-dark-brown)] hover:underline">+ Add Variant</button>
                   </div>
                   <div className="space-y-3">
                     {variants.map((v, i) => (
                       <div key={i} className="flex flex-wrap items-center gap-3 bg-[var(--color-cream)] p-3 rounded-xl border border-[var(--color-light-beige)]">
                         <select 
                            value={v.size === "" ? "" : !isCommonSize(normalizeSize(v.size)) ? "custom" : normalizeSize(v.size)}
                            onChange={(e) => {
                              const next = [...variants];
                              next[i].size = e.target.value === "custom" ? "" : e.target.value;
                              setVariants(next);
                            }}
                            className="bg-transparent text-sm font-medium outline-none flex-1 sm:flex-none"
                          >
                           <option value="">Size</option>
                           {COMMON_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                           <option value="custom">Other</option>
                         </select>
                         <input placeholder="Color" value={v.color} onChange={(e) => {const next=[...variants]; next[i].color=e.target.value; setVariants(next)}} className="bg-transparent text-sm w-full sm:w-24 outline-none border-l sm:border-[var(--color-light-beige)] sm:pl-3 py-1" />
                         <input type="number" placeholder="Stock" value={v.stock_quantity} onChange={(e) => {const next=[...variants]; next[i].stock_quantity=Number(e.target.value); setVariants(next)}} className="bg-transparent text-sm w-full sm:w-16 outline-none border-l sm:border-[var(--color-light-beige)] sm:pl-3 py-1" />
                         <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 ml-auto"><X size={16}/></button>
                       </div>
                     ))}
                   </div>
                </div>
              </div>

              {/* Right Column: Media */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-medium-brown)]">Product Media</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-[3/4] bg-[var(--color-cream)] rounded-2xl border-2 border-dashed border-[var(--color-light-beige)] overflow-hidden group">
                      {img.image_url ? (
                        <>
                          <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                          {img.is_primary && <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-[var(--color-dark-brown)] text-white text-[8px] font-bold uppercase rounded">Primary</span>}
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-[var(--color-light-beige)] transition-colors">
                          <UploadCloud size={20} className="text-[var(--color-medium-brown)] mb-1" />
                          <span className="text-[10px] font-bold text-[var(--color-medium-brown)]">Upload</span>
                          <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, i)} />
                        </label>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setImages([...images, {image_url: "", is_primary: images.length===0}])} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-[var(--color-light-beige)] flex items-center justify-center text-[var(--color-medium-brown)] hover:bg-[var(--color-cream)] transition-all">
                    <Plus size={24} />
                  </button>
                </div>
                
                <div className="p-4 bg-[#FEF9C3]/30 rounded-2xl border border-[#FEF9C3] text-[11px] text-[#713F12]">
                  <strong>Tip:</strong> Use high-quality portrait images (3:4 ratio) for the best store appearance.
                </div>

                <div className="pt-10 flex flex-col gap-3">
                   <button type="submit" disabled={saving} className="w-full py-4 bg-[var(--color-dark-brown)] text-white rounded-xl font-bold hover:bg-[var(--color-tan)] transition-all disabled:opacity-50">
                     {saving ? "Processing..." : editing ? "Update Product" : "Publish Product"}
                   </button>
                   <label className="flex items-center justify-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={is_active} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-[var(--color-light-beige)] text-[var(--color-dark-brown)] focus:ring-0" />
                     <span className="text-sm font-medium text-[var(--color-dark-brown)]">Product is active and visible</span>
                   </label>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-[24px] border border-[var(--color-light-beige)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[var(--color-cream)] border-b border-[var(--color-light-beige)]">
            <tr className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-medium-brown)]">
              <th className="px-8 py-5">Product Details</th>
              <th className="px-6 py-5 text-center">Category</th>
              <th className="px-6 py-5 text-center">Stock</th>
              <th className="px-6 py-5 text-right">Price</th>
              <th className="px-6 py-5 text-center">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-light-beige)]">
            {filtered.map((p) => {
              const primaryImg = p.product_images?.find(i => i.is_primary)?.image_url || p.product_images?.[0]?.image_url;
              const totalStock = p.product_variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || 0;
              
              return (
                <tr key={p.id} className="hover:bg-[var(--color-cream)]/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-18 aspect-[3/4] bg-[var(--color-light-beige)] rounded-lg overflow-hidden shrink-0 border border-[var(--color-light-beige)]">
                        {primaryImg && <img src={primaryImg} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-bold text-[var(--color-dark-brown)] group-hover:underline underline-offset-4">{p.name}</p>
                        <p className="text-[10px] text-[var(--color-medium-brown)] mt-1 font-mono uppercase tracking-tighter">ID: {p.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xs font-medium bg-[var(--color-light-beige)] px-3 py-1 rounded-full text-[var(--color-dark-brown)]">
                      {p.categories?.name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="text-sm font-bold text-[var(--color-dark-brown)]">{totalStock}</p>
                    <p className="text-[10px] text-[var(--color-medium-brown)]">{p.product_variants?.length || 0} Variants</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <p className="text-sm font-bold text-[var(--color-dark-brown)]">EGP {p.price?.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${p.is_active ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-light-beige text-brown border border-transparent'}`}>
                      {p.is_active ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 ">
                      <button onClick={() => startEdit(p)} className="p-2 text-[var(--color-dark-brown)] hover:bg-white rounded-lg border border-transparent hover:border-[var(--color-light-beige)] shadow-sm transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                        title={deleting === p.id ? "Deleting..." : "Delete product"}
                      >
                        {deleting === p.id ? (
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
    </div>
  );
}