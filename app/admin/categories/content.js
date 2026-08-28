// app/admin/categories/content.js
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Plus, Edit2, Trash2, Folder, Image as ImageIcon, 
  Link as LinkIcon, UploadCloud, X, LayoutGrid, Info 
} from "lucide-react";

export default function CategoriesContent({ categories }) {
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageMode, setImageMode] = useState("url"); 
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState(""); 
  const [uploadFile, setUploadFile] = useState(null);

  const supabase = createClient();

  // (نفس الدوال startCreate, startEdit, handleFileChange كما هي في كودك)
  function startCreate() {
    setEditing(null); setName(""); setSlug(""); setDescription("");
    setImageMode("url"); setImageUrl(""); setPreview(""); setUploadFile(null);
    setMessage(null); setShowForm(true);
  }

  function startEdit(c) {
    setEditing(c.id); setName(c.name); setSlug(c.slug || "");
    setDescription(c.description || ""); setImageUrl(c.image_url || "");
    setPreview(c.image_url || ""); setImageMode("url");
    setUploadFile(null); setMessage(null); setShowForm(true);
  }

  async function handleSave(e) { /* كود الحفظ الأصلي */ e.preventDefault(); setMessage(null); setSaving(true); const resolvedImageUrl = imageMode === "upload" && uploadFile ? await uploadCategoryImage(uploadFile) : imageUrl; try { const body = { name, slug, description, image_url: resolvedImageUrl }; const res = await fetch("/api/admin/categories", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing ? { id: editing, ...body } : body) }); if (!res.ok) throw new Error("Failed"); window.location.reload(); } catch (err) { setMessage({ type: "error", text: err.message }); setSaving(false); } }

  async function uploadCategoryImage(file) { /* كود الرفع الأصلي */ const path = `categories/${Date.now()}-${file.name}`; const { data, error } = await supabase.storage.from("product-images").upload(path, file); if (error) throw error; return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl; }

  async function handleDelete(id) { if (!confirm("Delete this category?")) return; await fetch("/api/admin/categories", { method: "DELETE", body: JSON.stringify({ id }) }); window.location.reload(); }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#3E3A36]">Categories</h2>
          <p className="text-sm text-[#8E8A84]">Organize your store collection into elegant groups</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#3E3A36] text-white rounded-full text-sm font-semibold hover:bg-black transition-all shadow-lg shadow-charcoal/10"
        >
          <Plus size={18} /> Add New Category
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-medium border ${message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}>
          {message.text}
        </div>
      )}

      {/* Form Overlay Card */}
      {showForm && (
        <div className="bg-white rounded-[24px] border border-[#EBE2DA] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-6 border-b border-[#EBE2DA] flex justify-between items-center bg-[#FAF8F5]">
            <h3 className="font-bold text-[#3E3A36]">{editing ? "Edit Category" : "New Category"}</h3>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-[#EBE2DA] rounded-full transition-colors"><X size={20} /></button>
          </div>
          
          <form onSubmit={handleSave} className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold mb-2 text-[#8E8A84] uppercase tracking-wider">Category Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#EBE2DA] focus:border-[#3E3A36] outline-none" placeholder="e.g. Summer Collection" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-[#8E8A84] uppercase tracking-wider">URL Slug</label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#EBE2DA] bg-[#FAF8F5]">
                  <span className="text-[#8E8A84] text-sm">/</span>
                  <input required value={slug} onChange={(e) => setSlug(e.target.value)} className="bg-transparent w-full outline-none text-sm" placeholder="summer-collection" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-[#8E8A84] uppercase tracking-wider">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-[#EBE2DA] outline-none resize-none" placeholder="Short summary for customers..." />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold mb-3 text-[#8E8A84] uppercase tracking-wider">Cover Image</label>
                <div className="flex gap-4 mb-4">
                  <button type="button" onClick={() => setImageMode("url")} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${imageMode === 'url' ? 'bg-[#3E3A36] text-white' : 'bg-white text-[#8E8A84]'}`}>Link URL</button>
                  <button type="button" onClick={() => setImageMode("upload")} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${imageMode === 'upload' ? 'bg-[#3E3A36] text-white' : 'bg-white text-[#8E8A84]'}`}>Upload File</button>
                </div>

                {imageMode === "url" ? (
                  <input value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setPreview(e.target.value); }} className="w-full px-4 py-3 rounded-xl border border-[#EBE2DA] outline-none text-sm" placeholder="https://..." />
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-[#EBE2DA] bg-[#FAF8F5] cursor-pointer hover:bg-[#F3EFEA] transition-all">
                    <UploadCloud size={24} className="text-[#8E8A84] mb-2" />
                    <span className="text-xs font-medium text-[#8E8A84]">Click to upload category cover</span>
                    <input type="file" className="hidden" onChange={(e) => {
                      const file = e.target.files[0];
                      setUploadFile(file);
                      setPreview(URL.createObjectURL(file));
                    }} />
                  </label>
                )}
                
                {preview && (
                  <div className="mt-4 flex items-center gap-4 p-3 bg-[#FAF8F5] rounded-xl border border-[#EBE2DA]">
                    <img src={preview} className="w-16 h-16 rounded-lg object-cover" alt="Preview" />
                    <span className="text-xs text-[#8E8A84]">Image preview ready</span>
                  </div>
                )}
              </div>

              <div className="pt-5">
                <button type="submit" disabled={saving} className="w-full py-4 bg-[#3E3A36] text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg">
                  {saving ? "Saving..." : editing ? "Update Category" : "Save Category"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[24px] border border-[#EBE2DA]">
            <Folder size={48} className="mx-auto text-[#EBE2DA] mb-4" />
            <p className="text-[#8E8A84]">No categories found. Start by adding one.</p>
          </div>
        ) : (
          categories.map((c) => (
            <div key={c.id} className="group relative bg-white rounded-[24px] border border-[#EBE2DA] p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#F3EFEA] overflow-hidden border border-[#EBE2DA]">
                  {c.image_url ? (
                    <img src={c.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8E8A84]"><ImageIcon size={20}/></div>
                  )}
                </div>
                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(c)} className="p-2 text-[#3E3A36] hover:bg-[#FAF8F5] rounded-full transition-colors"><Edit2 size={16}/></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-[#3E3A36]">{c.name}</h4>
                <div className="flex items-center gap-1.5 mt-1 text-[#8E8A84]">
                  <LinkIcon size={12}/>
                  <span className="text-xs font-medium">/{c.slug}</span>
                </div>
              </div>

              {c.description && (
                <p className="mt-4 text-xs text-[#8E8A84] line-clamp-2 leading-relaxed italic border-l-2 border-[#EBE2DA] pl-3">
                  {c.description}
                </p>
              )}

              <div className="mt-6 pt-6 border-t border-[#FAF8F5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutGrid size={14} className="text-[#8E8A84]" />
                  <span className="text-xs font-bold text-[#3E3A36]">{c.products?.[0]?.count || 0} Products</span>
                </div>
                <div className="px-3 py-1 bg-[#FAF8F5] rounded-full text-[10px] font-bold text-[#8E8A84] uppercase">
                  Collection
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}