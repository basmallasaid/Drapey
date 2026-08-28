import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import OrdersChart from "./OrdersChart";
import SalesChart from "./SalesChart";

export const metadata = { title: "Admin Dashboard | Drapey" };

export default async function AdminDashboardPage() {
  const { user, isAdmin, supabase } = await requireAdmin();
  if (!user) redirect("/login");
  if (!isAdmin) redirect("/");

  const [
    { count: totalUsers },
    { count: totalAdmins },
    { count: totalProducts },
    { count: activeProducts },
    { count: totalOrders },
    { data: revenueData },
    { count: totalCategories },
    { data: recentOrders },
    { data: orderStatuses },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total_amount, created_at").not("status", "eq", "cancelled"),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("id, created_at, status, total_amount, users(full_name, email)").order("created_at", { ascending: false }).limit(5),
    supabase.from("orders").select("status"),
  ]);

  const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
  const regularUsers = (totalUsers || 0) - (totalAdmins || 0);

  const ORDER_STATUSES = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];
  const statusCounts = ORDER_STATUSES.map((status) => ({
    status,
    count: (orderStatuses || []).filter((o) => o.status === status).length,
  }));

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthLabel = now.toLocaleString("en-US", { month: "short" });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const revenueByDay = new Array(daysInMonth).fill(0);
  for (const o of revenueData || []) {
    const d = new Date(o.created_at);
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      revenueByDay[d.getDate() - 1] += o.total_amount || 0;
    }
  }
  const salesPoints = revenueByDay.map((value, i) => ({
    label: `${monthLabel} ${i + 1}`,
    value,
  }));

  const stats = [
    { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-warmgray bg-cream" },
    { label: "Total Orders", value: totalOrders || 0, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "text-warmgray bg-cream" },
    { label: "Products", value: `${activeProducts || 0}/${totalProducts || 0}`, sub: "active/total", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "text-warmgray bg-cream" },
    { label: "Customers", value: regularUsers, icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", color: "text-warmgray bg-cream" },
  ];

  const statusColors = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-rose-100 text-rose-800",
  };

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-sand shadow-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-full ${s.color}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              <span className="text-sm text-warmgray">{s.label}</span>
            </div>
            <p className="text-3xl font-semibold text-charcoal">{s.value}</p>
            {s.sub && <p className="text-xs text-stone mt-2">{s.sub} · last month</p>}
          </div>
        ))}
      </div>

      {/* Charts — Sales Overview + Orders Overview side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <div className="flex flex-col bg-white rounded-xl border border-sand shadow-card">
          <div className="flex items-center justify-between px-6 py-5 border-b border-sand">
            <h3 className="font-serif text-lg text-charcoal">Sales Overview</h3>
            <span className="px-3 py-1 text-xs font-medium text-warmgray border border-sand rounded-lg bg-cream">
              This Month
            </span>
          </div>
          <div className="flex-1 px-6 py-6">
            <SalesChart points={salesPoints} />
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-xl border border-sand shadow-card">
          <div className="flex items-center justify-between px-6 py-5 border-b border-sand">
            <h3 className="font-serif text-lg text-charcoal">Orders Overview</h3>
            <span className="text-sm text-stone">By status</span>
          </div>
          <div className="flex-1 px-6 py-6">
            <OrdersChart counts={statusCounts} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { href: "/admin/users", label: "Manage Users" },
          { href: "/admin/products", label: "Manage Products" },
          { href: "/admin/orders", label: "Manage Orders" },
          { href: "/admin/categories", label: "Manage Categories" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="px-4 py-3 rounded-xl text-sm font-medium text-center transition-colors bg-white border border-sand text-charcoal hover:bg-cream shadow-sm">
            {a.label}
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-sand shadow-card overflow-hidden">
        <div className="px-6 py-5 border-b border-sand flex items-center justify-between">
          <h3 className="font-serif text-lg text-charcoal">Recent Orders</h3>
          <Link href="/admin/orders" className="text-sm text-warmgray hover:text-charcoal">View All</Link>
        </div>
        {(!recentOrders || recentOrders.length === 0) ? (
          <div className="p-8 text-center text-stone">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand text-left text-stone bg-cream">
                  <th className="px-6 py-3.5 font-medium">Order ID</th>
                  <th className="px-6 py-3.5 font-medium">Customer</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium text-right">Total</th>
                  <th className="px-6 py-3.5 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-sand last:border-0 hover:bg-row-hover">
                    <td className="px-6 py-4 font-mono text-xs text-warmgray">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4">
                      <p className="text-charcoal">{order.users?.full_name || "N/A"}</p>
                      <p className="text-xs text-stone">{order.users?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || "bg-cream text-warmgray"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">${(order.total_amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-stone">{new Date(order.created_at).toLocaleDateString()}</td>
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
