"use client";

import { useState, Fragment } from "react";

const STATUSES = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];

const statusColors = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-rose-100 text-rose-800",
};

export default function OrdersContent({ orders }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [message, setMessage] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [pendingCancelId, setPendingCancelId] = useState(null);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.id?.includes(search) ||
      o.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.users?.email?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleStatusChange(orderId, newStatus) {
    // Confirm the destructive cancellation action before applying.
    if (newStatus === "cancelled") {
      setPendingCancelId(orderId);
      return;
    }
    await submitStatusChange(orderId, newStatus);
  }

  async function submitStatusChange(orderId, newStatus) {
    setUpdating(orderId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      setMessage({ type: "success", text: "Status updated" });
      setPendingCancelId(null);
      window.location.reload();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setUpdating(null);
    }
  }

  function renderAddress(o) {
    const parts = [
      o.street,
      o.building ? `Bldg ${o.building}` : "",
      o.floor ? `Fl ${o.floor}` : "",
      o.apartment ? `Apt ${o.apartment}` : "",
      o.area,
      o.city && o.governorate ? `${o.city}, ${o.governorate}` : (o.city || o.governorate || ""),
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "—";
  }

  return (
    <div>
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by order ID, customer name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-taupe rounded-lg text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-pebble focus:border-pebble"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-taupe rounded-lg text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-pebble"
        >
          <option value="all">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-sand shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand text-left text-stone bg-cream">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-charcoal-soft">No orders found</td></tr>
              ) : (
                filtered.map((o) => (
                  <Fragment key={o.id}>
                    <tr className="border-b border-sand last:border-0 hover:bg-row-hover">
                      <td className="px-5 py-3 font-mono text-xs text-charcoal-soft">#{o.id.slice(0, 8)}</td>
                      <td className="px-5 py-3">
                        <p className="text-charcoal">{o.users?.full_name || o.customer_name || "N/A"}</p>
                        <p className="text-xs text-stone">{o.users?.email || o.customer_email}</p>
                      </td>
                      <td className="px-5 py-3 text-charcoal-soft">{o.order_items?.length || 0}</td>
                      <td className="px-5 py-3 font-medium">${(o.total_amount || 0).toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[o.status] || "bg-cream text-charcoal-soft"}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-charcoal-soft">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            disabled={updating === o.id}
                            className="px-2 py-1 border border-taupe rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-pebble disabled:opacity-50 capitalize"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                            className="px-2 py-1 text-xs text-charcoal-soft hover:bg-cream rounded"
                          >
                            {expanded === o.id ? "Hide" : "View"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded === o.id && (
                      <tr key={`${o.id}-details`}>
                        <td colSpan={7} className="px-5 py-4 bg-cream">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-charcoal-soft mb-1">Items</p>
                              {o.order_items?.map((item, i) => (
                                <div key={i} className="text-sm py-1 border-b border-taupe last:border-0">
                                  <div className="flex justify-between">
                                    <span className="text-charcoal">{item.product_name}</span>
                                    <span className="font-medium">${(item.total_price || 0).toFixed(2)}</span>
                                  </div>
                                  <div className="text-xs text-stone">
                                    {item.size} / {item.color} · qty {item.quantity} @ ${(item.unit_price || 0).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                              <div className="border-t border-taupe mt-2 pt-2 flex justify-between text-sm">
                                <span className="text-charcoal-soft">Subtotal</span>
                                <span>${(o.subtotal || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-charcoal-soft">Shipping</span>
                                <span>{o.shipping_fee === 0 ? "FREE" : `$${(o.shipping_fee || 0).toFixed(2)}`}</span>
                              </div>
                              {Number(o.discount) > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-charcoal-soft">Discount</span>
                                  <span>-${(o.discount || 0).toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-bold">
                                <span>Total</span>
                                <span>${(o.total_amount || 0).toFixed(2)}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-charcoal-soft mb-1">Customer</p>
                              <p className="text-sm text-charcoal">{o.customer_name}</p>
                              <p className="text-sm text-charcoal">{o.customer_phone}</p>
                              <p className="text-sm text-charcoal">{o.customer_email}</p>
                              <p className="text-xs font-medium text-charcoal-soft mt-3 mb-1">Delivery Address</p>
                              <p className="text-sm text-charcoal">{renderAddress(o)}</p>
                              {o.notes && (
                                <div className="mt-3">
                                  <p className="text-xs font-medium text-charcoal-soft mb-1">Notes</p>
                                  <p className="text-sm text-charcoal">{o.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-stone">{filtered.length} order{filtered.length !== 1 ? "s" : ""} shown</p>

      {/* Cancel confirmation */}
      {pendingCancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPendingCancelId(null)} />
          <div className="relative bg-white w-full max-w-md p-8 rounded-xl border border-sand shadow-card">
            <h3 className="text-lg font-semibold text-charcoal mb-3">Cancel this order?</h3>
            <p className="text-sm text-charcoal-soft mb-6">
              Cancelling restores the purchased stock. Confirm you want to mark this order as cancelled?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setPendingCancelId(null)} className="px-4 py-2 border border-taupe rounded-lg text-sm text-charcoal hover:bg-cream">
                Keep Order
              </button>
              <button
                onClick={() => submitStatusChange(pendingCancelId, "cancelled")}
                disabled={updating === pendingCancelId}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {updating === pendingCancelId ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
