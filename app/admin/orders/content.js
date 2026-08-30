// app/admin/orders/content.js
"use client";

import { useState, Fragment } from "react";
import { showToast, showError, confirmAction } from "@/lib/sweetalert";
import { 
  Search, Filter, ChevronDown, ChevronUp, Package, 
  User, MapPin, Calendar, DollarSign, X, CheckCircle2, Clock
} from "lucide-react";

const STATUSES = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];

const statusStyles = {
  pending: "bg-[#FEF9C3] text-[#713F12] border-[#FEF08A]",
  confirmed: "bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]",
  preparing: "bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]",
  shipped: "bg-[#E0E7FF] text-[#3730A3] border-[#C7D2FE]",
  delivered: "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]",
  cancelled: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",
};

export default function OrdersContent({ orders }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.id?.toLowerCase().includes(search.toLowerCase()) ||
      o.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function submitStatusChange(orderId, newStatus) {
    if (newStatus === "cancelled") {
      const confirmed = await confirmAction({
        title: "Cancel order?",
        text: "This will restore the stock for all items in this order. Are you sure you want to proceed?",
        confirmText: "Yes, cancel order",
      });
      if (!confirmed) return;
    }
    setUpdating(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await showToast("success", `Order marked as ${newStatus}.`);
      window.location.reload();
    } catch (e) {
      showError("Could not update order", e.message || "Update failed");
    } finally {
      setUpdating(null);
      setPendingCancelId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-dark-brown)]">Order Management</h2>
          <p className="text-sm text-[var(--color-medium-brown)]">Track and process customer orders</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-[20px] border border-[var(--color-light-beige)] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-medium-brown)]" size={18} />
          <input
            type="text"
            placeholder="Search by ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[var(--color-cream)] border-none rounded-xl text-sm outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-[var(--color-cream)] border-none rounded-xl text-sm font-medium outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[24px] border border-[var(--color-light-beige)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-cream)] border-b border-[var(--color-light-beige)] text-[11px] font-bold uppercase tracking-widest text-[var(--color-medium-brown)]">
                <th className="px-6 py-5">Order ID</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5 text-center">Items</th>
                <th className="px-6 py-5 text-right">Total</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-light-beige)]">
              {filtered.map((o) => (
                <Fragment key={o.id}>
                  <tr className={`hover:bg-[var(--color-cream)]/50 transition-colors ${expanded === o.id ? 'bg-[var(--color-cream)]' : ''}`}>
                    <td className="px-6 py-5 font-mono text-[10px] font-bold text-[var(--color-medium-brown)]">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-[var(--color-dark-brown)]">{o.users?.full_name || o.customer_name}</span>
                        <span className="text-[10px] text-[var(--color-medium-brown)]">{o.users?.email || o.customer_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-dark-brown)] bg-[var(--color-light-beige)] px-2 py-1 rounded-lg">
                        <Package size={12} /> {o.order_items?.length}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-[var(--color-dark-brown)]">
                      EGP {o.total_amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${statusStyles[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <select
                          value={o.status}
                          onChange={(e) => submitStatusChange(o.id, e.target.value)}
                          className="text-[10px] font-bold uppercase bg-white border border-[var(--color-light-beige)] rounded-lg px-2 py-1 outline-none"
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button 
                          onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                          className="p-2 hover:bg-white rounded-full border border-transparent hover:border-[var(--color-light-beige)] transition-all"
                        >
                          {expanded === o.id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Detail View */}
                  {expanded === o.id && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 sm:px-8 sm:py-8 bg-[var(--color-cream)]/50 border-b border-[var(--color-light-beige)]">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                          {/* Items List */}
                          <div className="lg:col-span-2 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-medium-brown)] flex items-center gap-2">
                              <Package size={14} /> Order Items
                            </h4>
                            <div className="bg-white rounded-2xl border border-[var(--color-light-beige)] overflow-hidden">
                              {o.order_items?.map((item, i) => (
                                <div key={i} className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-cream)] last:border-0">
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 bg-[var(--color-light-beige)] rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0">IMG</div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-[var(--color-dark-brown)] truncate">{item.product_name}</p>
                                      <p className="text-[10px] text-[var(--color-medium-brown)]">{item.size} / {item.color} Â· Qty: {item.quantity}</p>
                                    </div>
                                  </div>
                                  <span className="font-bold text-sm ml-auto">EGP {item.total_price?.toLocaleString()}</span>
                                </div>
                              ))}
                              <div className="p-4 bg-[var(--color-light-beige)]/30 space-y-1">
                                <div className="flex justify-between text-xs text-[var(--color-medium-brown)]">
                                  <span>Subtotal</span>
                                  <span>EGP {o.subtotal?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs text-[var(--color-medium-brown)]">
                                  <span>Shipping</span>
                                  <span>EGP {o.shipping_fee?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-[var(--color-dark-brown)] pt-2 border-t border-[var(--color-light-beige)]">
                                  <span>Total Amount</span>
                                  <span>EGP {o.total_amount?.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Customer & Shipping Info */}
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-medium-brown)] mb-3 flex items-center gap-2">
                                <User size={14} /> Customer
                              </h4>
                              <p className="text-sm font-bold text-[var(--color-dark-brown)]">{o.customer_name}</p>
                              <p className="text-xs text-[var(--color-medium-brown)]">{o.customer_phone}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-medium-brown)] mb-3 flex items-center gap-2">
                                <MapPin size={14} /> Shipping Address
                              </h4>
                              <p className="text-xs text-[var(--color-dark-brown)] leading-relaxed">
                                {o.street}, {o.area}<br/>
                                {o.city}, {o.governorate}<br/>
                                <span className="text-[var(--color-medium-brown)]">
                                  Bldg: {o.building}, Floor: {o.floor}, Apt: {o.apartment}
                                </span>
                              </p>
                            </div>
                            {o.notes && (
                              <div className="p-3 bg-white rounded-xl border border-[var(--color-light-beige)]">
                                <h4 className="text-[10px] font-bold text-[var(--color-medium-brown)] uppercase mb-1">Notes</h4>
                                <p className="text-xs italic text-[var(--color-dark-brown)]">"{o.notes}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}