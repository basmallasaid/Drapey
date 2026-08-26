import { adminResponse } from "@/lib/supabase/admin";
import Link from "next/link";

export const metadata = { title: "Admin Dashboard | Drapey" };

export default async function AdminDashboardPage() {
  const { error, supabase } = await adminResponse();
  if (error) return null;

  const [
    { count: totalUsers },
    { count: totalAdmins },
    { count: totalProducts },
    { count: activeProducts },
    { count: totalOrders },
    { data: revenueData },
    { count: totalCategories },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total_amount").not("status", "eq", "cancelled"),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("id, created_at, status, total_amount, users(full_name, email)").order("created_at", { ascending: false }).limit(5),
  ]);

  const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
  const regularUsers = (totalUsers || 0) - (totalAdmins || 0);

  const stats = [
    { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-600 bg-green-100" },
    { label: "Total Orders", value: totalOrders || 0, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "text-blue-600 bg-blue-100" },
    { label: "Products", value: `${activeProducts || 0}/${totalProducts || 0}`, sub: "active/total", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "text-purple-600 bg-purple-100" },
    { label: "Customers", value: regularUsers, icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", color: "text-teal-600 bg-teal-100" },
  ];

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${s.color}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              <span className="text-sm text-gray-500">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            {s.sub && <p className="text-xs text-gray-400 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { href: "/admin/users", label: "Manage Users", color: "bg-teal-50 text-teal-700 hover:bg-teal-100" },
          { href: "/admin/products", label: "Manage Products", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
          { href: "/admin/orders", label: "Manage Orders", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
          { href: "/admin/categories", label: "Manage Categories", color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className={`px-4 py-3 rounded-lg text-sm font-medium text-center transition-colors ${a.color}`}>
            {a.label}
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
          <Link href="/admin/orders" className="text-sm text-teal-600 hover:underline">View All</Link>
        </div>
        {(!recentOrders || recentOrders.length === 0) ? (
          <div className="p-8 text-center text-gray-500">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Order ID</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">#{order.id.slice(0, 8)}</td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900">{order.users?.full_name || "N/A"}</p>
                      <p className="text-xs text-gray-400">{order.users?.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium">${(order.total_amount || 0).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
