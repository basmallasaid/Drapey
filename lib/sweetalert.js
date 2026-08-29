// Central SweetAlert2 helper for consistent notifications across the site.
// Provides short toasts (cart/favorites), full alerts (success/error), and a
// reusable destructive-action confirmation dialog.
"use client";

import Swal from "sweetalert2";

const base = {
  customClass: {
    popup: "rounded-2xl",
    confirmButton: "rounded-lg font-semibold px-6",
    cancelButton: "rounded-lg font-semibold px-6",
  },
  buttonsStyling: true,
  background: "#ffffff",
  color: "#2A1D17",
  confirmButtonColor: "#2A1D17",
};

// Short, unobtrusive notification used for quick actions like cart/favorites.
export function showToast(type, title, text) {
  return Swal.fire({
    ...base,
    toast: true,
    position: "top-end",
    icon: type,
    title,
    text,
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
}

// Standard success notification for important completed actions.
export function showSuccess(title, text) {
  return Swal.fire({
    ...base,
    icon: "success",
    title,
    text,
    confirmButtonText: "OK",
    confirmButtonColor: "#2A1D17",
  });
}

// Standard error notification when an operation fails.
export function showError(title, text) {
  return Swal.fire({
    ...base,
    icon: "error",
    title,
    text: text || "Something went wrong. Please try again.",
    confirmButtonText: "OK",
    confirmButtonColor: "#DC2626",
  });
}

// Confirmation dialog for destructive actions. Resolves true only if the user
// explicitly confirms; false if they cancel.
export async function confirmAction({
  title = "Are you sure?",
  text = "This action cannot be undone.",
  confirmText = "Yes, delete",
  cancelText = "Cancel",
}) {
  const result = await Swal.fire({
    ...base,
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: "#DC2626",
    cancelButtonColor: "#E9DED0",
  });
  return result.isConfirmed;
}
