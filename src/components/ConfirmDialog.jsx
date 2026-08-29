// Shared confirmation dialog used across the Admin Dashboard
// (products, categories, users). Mirrors the existing admin visual style
// and stays responsive on mobile.
"use client";

import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "",
  confirmLabel = "Delete",
  loading = false,
  tone = "danger",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  const confirmStyles =
    tone === "danger"
      ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200"
      : "bg-[#3E3A36] text-white hover:bg-black";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={loading ? undefined : onCancel} />
      <div className="relative bg-white w-full max-w-md p-8 rounded-[24px] border border-[#EBE2DA] shadow-2xl text-center animate-in fade-in slide-in-from-top-4 duration-300">
        <button
          onClick={loading ? undefined : onCancel}
          className="absolute top-4 right-4 p-1 text-[#8E8A84] hover:text-[#3E3A36] rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div className={`w-16 h-16 ${tone === "danger" ? "bg-red-50 text-red-500" : "bg-[#F3EFEA] text-[#3E3A36]"} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <AlertTriangle size={28} />
        </div>
        <h3 className="text-xl font-bold text-[#3E3A36] mb-2">{title}</h3>
        {message && (
          <p className="text-sm text-[#8E8A84] mb-8 leading-relaxed">{message}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={loading ? undefined : onCancel}
            disabled={loading}
            className="flex-1 py-3 border border-[#EBE2DA] rounded-xl text-sm font-bold text-[#3E3A36] hover:bg-[#FAF8F5] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${confirmStyles} flex items-center justify-center gap-2`}
          >
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
