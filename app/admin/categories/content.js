"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CategoriesContent({ categories }) {
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state (controlled so we can preview uploads + detect duplicates live)
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageMode, setImageMode] = useState("url"); // "url" | "upload"
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState(""); // resolved image src to show
  const [uploadFile, setUploadFile] = useState(null); // file chosen for upload

  const supabase = createClient();
  const editCategory = editing ? categories.find((c) => c.id === editing) : null;

  function startCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setDescription("");
    setImageMode("url");
    setImageUrl("");
    setPreview("");
    setUploadFile(null);
    setMessage(null);
    setShowForm(true);
  }

  function startEdit(c) {
    setEditing(c.id);
    setName(c.name);
    setSlug(c.slug || "");
    setDescription(c.description || "");
    setImageUrl(c.image_url || "");
    setPreview(c.image_url || "");
    setImageMode("url");
    setUploadFile(null);
    setMessage(null);
    setShowForm(true);
  }

  async function uploadCategoryImage(file) {
    const path = `categories/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }

  // Live duplicate-name hint (case-insensitive), excluding the row being edited.
  const duplicateName = name.trim()
    ? categories.some(
        (c) => c.id !== editing && c.name?.trim().toLowerCase() === name.trim().toLowerCase()
      )
    : false;

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName || !trimmedSlug) {
      setMessage({ type: "error", text: "Name and slug are required." });
      setSaving(false);
      return;
    }

    if (duplicateName) {
      setMessage({ type: "error", text: "A category with this name already exists." });
      setSaving(false);
      return;
    }

    // An uploaded (file) image takes priority; otherwise use the URL if provided.
    let resolvedImageUrl = "";
    if (imageMode === "upload" && uploadFile) {
      try {
        resolvedImageUrl = await uploadCategoryImage(uploadFile);
      } catch (err) {
        setMessage({ type: "error", text: `Image upload failed: ${err.message}` });
        setSaving(false);
        return;
      }
    } else {
      resolvedImageUrl = imageUrl.trim();
    }

    try {
      const body = {
        name: trimmedName,
        slug: trimmedSlug,
        description: description.trim(),
        image_url: resolvedImageUrl,
      };

      const res = await fetch("/api/admin/categories", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing, ...body } : body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setMessage({ type: "success", text: editing ? "Category updated" : "Category created" });
      setShowForm(false);
      setEditing(null);
      window.location.reload();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this category? Categories that still have products cannot be deleted.")) return;
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
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
        <div className="bg-white rounded-xl border border-sand shadow-card p-5 mb-6">
          <h3 className="font-semibold text-charcoal mb-4">{editing ? "Edit Category" : "Add New Category"}</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-soft mb-1">Name</label>
              <input
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm text-charcoal bg-white focus:ring-2 focus:ring-pebble focus:border-pebble ${duplicateName ? "border-red-300 bg-red-50" : "border-taupe"}`}
              />
              {duplicateName && <p className="text-xs text-red-600 mt-1">A category with this name already exists.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-soft mb-1">Slug</label>
              <input name="slug" required value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-3 py-2 border border-taupe rounded-lg text-sm text-charcoal bg-white focus:ring-2 focus:ring-pebble focus:border-pebble" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-charcoal-soft mb-1">Description</label>
              <textarea name="description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-taupe rounded-lg text-sm text-charcoal bg-white focus:ring-2 focus:ring-pebble focus:border-pebble" />
            </div>

            {/* Image (Upload or URL) */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-charcoal-soft mb-1">Image</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 text-sm text-charcoal-soft cursor-pointer">
                  <input
                    type="radio"
                    checked={imageMode === "url"}
                    onChange={() => {
                      setImageMode("url");
                      setPreview(imageUrl);
                    }}
                    className="accent-pebble"
                  />
                  Use Image URL
                </label>
                <label className="flex items-center gap-2 text-sm text-charcoal-soft cursor-pointer">
                  <input
                    type="radio"
                    checked={imageMode === "upload"}
                    onChange={() => setImageMode("upload")}
                    className="accent-pebble"
                  />
                  Upload Image
                </label>
              </div>

              {imageMode === "url" ? (
                <input
                  name="image_url"
                  value={imageUrl}
                  onChange={(e) => { setImageUrl(e.target.value); setPreview(e.target.value); }}
                  placeholder="https://example.com/category-image.jpg"
                  className="w-full px-3 py-2 border border-taupe rounded-lg text-sm text-charcoal bg-white focus:ring-2 focus:ring-pebble focus:border-pebble"
                />
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-stone file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cream file:text-charcoal-soft hover:file:bg-ivory"
                />
              )}

              {preview && (
                <div className="mt-3">
                  <p className="text-xs text-stone mb-1">Preview</p>
                  <img src={preview} alt="Category preview" className="w-32 h-32 rounded-lg object-cover bg-cream border border-taupe" />
                </div>
              )}
            </div>

            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-pebble text-charcoal rounded-lg text-sm font-medium hover:bg-pebble-dark disabled:opacity-50">
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 border border-taupe rounded-lg text-sm text-charcoal hover:bg-cream">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => { showForm ? setShowForm(false) : startCreate(); }}
          className="px-4 py-2.5 bg-pebble text-charcoal rounded-lg text-sm font-medium hover:bg-pebble-dark"
        >
          {showForm ? "Close Form" : "+ Add Category"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-sand shadow-card p-8 text-center text-charcoal-soft">
            No categories yet. Create your first one above.
          </div>
        ) : (
          categories.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-sand shadow-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-charcoal">{c.name}</h4>
                  <p className="text-xs text-stone">/{c.slug}</p>
                </div>
                {c.image_url && (
                  <img src={c.image_url} alt="" className="w-12 h-12 rounded object-cover bg-cream" />
                )}
              </div>
              {c.description && (
                <p className="text-sm text-charcoal-soft mb-3 line-clamp-2">{c.description}</p>
              )}
              <p className="text-xs text-stone mb-3">{c.products?.[0]?.count || 0} product{(c.products?.[0]?.count || 0) !== 1 ? "s" : ""}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { startEdit(c); }}
                  className="px-3 py-1.5 text-xs text-charcoal-soft hover:bg-cream rounded border border-taupe"
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
