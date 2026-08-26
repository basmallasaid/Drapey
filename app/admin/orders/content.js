"use client";

import { useState, Fragment } from "react";

const STATUSES = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrdersContent({ orders }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [message, setMessage] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.id?.includes(search) ||
      o.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.users?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleStatusChange(orderId, newStatus) {
    setUpdating(orderId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setMessage({ type: "success", text: "Status updated" });
      window.location.reload();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setUpdating(null);
    }
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
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
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
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-500">No orders found</td></tr>
              ) : (
                filtered.map((o) => (
                  <Fragment key={o.id}>
                    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs text-gray-600">#{o.id.slice(0, 8)}</td>
                      <td className="px-5 py-3">
                        <p className="text-gray-900">{o.users?.full_name || "N/A"}</p>
                        <p className="text-xs text-gray-400">{o.users?.email}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{o.order_items?.length || 0}</td>
                      <td className="px-5 py-3 font-medium">${(o.total_amount || 0).toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[o.status] || "bg-gray-100 text-gray-800"}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            disabled={updating === o.id}
                            className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 capitalize"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                            className="px-2 py-1 text-xs text-teal-600 hover:bg-teal-50 rounded"
                          >
                            {expanded === o.id ? "Hide" : "View"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded === o.id && (
                      <tr key={`${o.id}-details`}>
                        <td colSpan={7} className="px-5 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Items</p>
                              {o.order_items?.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm py-1">
                                  <span className="text-gray-700">{item.products?.name} x{item.quantity}</span>
                                  <span className="font-medium">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span>${(o.subtotal || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Shipping</span>
                                <span>${(o.shipping_fee || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm font-bold">
                                <span>Total</span>
                                <span>${(o.total_amount || 0).toFixed(2)}</span>
                              </div>
                            </div>
                            <div>
                              {o.shipping_address && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Shipping Address</p>
                                  <p className="text-sm text-gray-700">
                                    {typeof o.shipping_address === "string" ? o.shipping_address : (
                                      <>
                                        {o.shipping_address.full_name}<br />
                                        {o.shipping_address.address_line_1}<br />
                                        {o.shipping_address.address_line_2 && <>{o.shipping_address.address_line_2}<br /></>}
                                        {o.shipping_address.city}, {o.shipping_address.state} {o.shipping_address.postal_code}<br />
                                        {o.shipping_address.phone}
                                      </>
                                    )}
                                  </p>
                                </div>
                              )}
                              {o.notes && (
                                <div className="mt-3">
                                  <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                                  <p className="text-sm text-gray-700">{o.notes}</p>
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

      <p className="mt-3 text-xs text-gray-400">{filtered.length} order{filtered.length !== 1 ? "s" : ""} shown</p>
    </div>
  );
}
