// app/admin/page.js
import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import SalesChart from "./SalesChart";
import OrdersChart from "./OrdersChart";
import { ShoppingCart, BarChart3, Users, ShoppingBag, Bell } from "lucide-react";
import { ORDER_STATUSES, STATUS_META } from "@/lib/order-status";

// Wraps a Supabase query so a single failed query is clearly logged and never
// crashes the whole dashboard. Raw database errors stay server-side only.
async function fetchQuery(label, supabase, builder) {
  try {
    const res = await builder(supabase);
    if (res.error) {
      console.error(`[admin-dashboard] ${label} failed:`, res.error.message, res.error.code, res.error.details);
      return { data: null, count: null };
    }
    return res;
  } catch (err) {
    console.error(`[admin-dashboard] ${label} threw unexpectedly:`, err);
    return { data: null, count: null };
  }
}

// Real month-over-month percentage change. Returns null when a previous period
// is missing/empty so we NEVER show a fake/division-by-zero percentage.
function pctChange(current, previous) {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

export default async function AdminDashboardPage() {
  const { user, isAdmin, supabase } = await requireAdmin();
  if (!user || !isAdmin) redirect("/login");

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const thisStart = new Date(y, m, 1);
  const lastStart = new Date(y, m - 1, 1);
  const nextMonthStart = new Date(y, m + 1, 1); // exclusive upper bound for current month

  const daysInThisMonth = new Date(y, m + 1, 0).getDate();
  const daysInLastMonth = new Date(y, m, 0).getDate();
  const thisMonthName = thisStart.toLocaleString("en-US", { month: "short" });
  const lastMonthName = lastStart.toLocaleString("en-US", { month: "short" });

  // Each query runs in parallel but is individually guarded and labelled so a
  // failure is identifiable in server logs without exposing details to the UI.
  const [
    totalOrdersRes,
    revenueRes,
    customersRes,
    activeProductsRes,
    pendingRes,
    orderDatesRes,
    newCustomerDatesRes,
    periodSalesRes,
    recentOrdersRes,
    statusesRes,
    topOrdersRes,
  ] = await Promise.all([
    fetchQuery("total orders", supabase, (s) => s.from("orders").select("*", { count: "exact", head: true })),
    fetchQuery("total revenue", supabase, (s) =>
      s.from("orders").select("total_amount").not("status", "eq", "cancelled")
    ),
    fetchQuery("total customers", supabase, (s) =>
      s.from("users").select("*", { count: "exact", head: true }).eq("role", "customer")
    ),
    fetchQuery("active products", supabase, (s) =>
      s.from("products").select("*", { count: "exact", head: true }).eq("is_active", true)
    ),
    fetchQuery("pending orders", supabase, (s) =>
      s.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending")
    ),
    fetchQuery("order dates", supabase, (s) =>
      s.from("orders").select("created_at").gte("created_at", lastStart.toISOString()).lt("created_at", nextMonthStart.toISOString())
    ),
    fetchQuery("new customer dates", supabase, (s) =>
      s.from("users").select("created_at").eq("role", "customer").gte("created_at", lastStart.toISOString()).lt("created_at", nextMonthStart.toISOString())
    ),
    fetchQuery("sales period", supabase, (s) =>
      s
        .from("orders")
        .select("created_at, total_amount")
        .not("status", "eq", "cancelled")
        .gte("created_at", lastStart.toISOString())
        .lt("created_at", nextMonthStart.toISOString())
    ),
    fetchQuery("recent orders", supabase, (s) =>
      s
        .from("orders")
        .select("id, created_at, status, total_amount, customer_name, users(full_name)")
        .order("created_at", { ascending: false })
        .limit(5)
    ),
    fetchQuery("order statuses", supabase, (s) => s.from("orders").select("status")),
    fetchQuery("top products", supabase, (s) =>
      s
        .from("orders")
        .select("status, order_items(quantity, total_price, product_variants(product_id, products(id, name)))")
        .neq("status", "cancelled")
    ),
  ]);

  // ---- KPI values (all from real data) ----
  const totalOrders = totalOrdersRes.count || 0;
  const totalRevenue = revenueRes.data?.reduce((a, b) => a + (b.total_amount || 0), 0) || 0;
  const totalCustomers = customersRes.count || 0;
  const activeProducts = activeProductsRes.count || 0;
  const pendingCount = pendingRes.count || 0;

  // ---- Real month-over-month trend inputs ----
  const countInPeriod = (rows, start, days) => {
    const begin = new Date(start.getFullYear(), start.getMonth(), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    let n = 0;
    for (const row of rows || []) {
      const d = new Date(row.created_at);
      if (d >= begin && d < end) n += 1;
    }
    return n;
  };
  const ordersThisMonth = countInPeriod(orderDatesRes.data, thisStart, daysInThisMonth);
  const ordersLastMonth = countInPeriod(orderDatesRes.data, lastStart, daysInLastMonth);
  const newCustomersThisMonth = countInPeriod(newCustomerDatesRes.data, thisStart, daysInThisMonth);
  const newCustomersLastMonth = countInPeriod(newCustomerDatesRes.data, lastStart, daysInLastMonth);

  const sumInPeriod = (rows, start) => {
    const begin = new Date(start.getFullYear(), start.getMonth(), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    let sum = 0;
    for (const row of rows || []) {
      const d = new Date(row.created_at);
      if (d >= begin && d < end) sum += row.total_amount || 0;
    }
    return sum;
  };
  const revenueThisMonth = sumInPeriod(periodSalesRes.data, thisStart);
  const revenueLastMonth = sumInPeriod(periodSalesRes.data, lastStart);

  // ---- Sales overview: daily revenue series (This Month + Last Month) ----
  const buildDailySeries = (rows, start, days, monthName) => {
    const series = Array.from({ length: days }, (_, i) => ({
      name: `${monthName} ${i + 1}`,
      sales: 0,
    }));
    const dayStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const dayEnd = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    for (const row of rows || []) {
      const d = new Date(row.created_at);
      if (d >= dayStart && d < dayEnd) {
        const idx = d.getDate() - 1;
        if (idx >= 0 && idx < days) series[idx].sales += row.total_amount || 0;
      }
    }
    return series;
  };

  const thisMonth = buildDailySeries(periodSalesRes.data, thisStart, daysInThisMonth, thisMonthName);
  const lastMonth = buildDailySeries(periodSalesRes.data, lastStart, daysInLastMonth, lastMonthName);

  // ---- Orders overview: counts by actual status ----
  const statusCounts = ORDER_STATUSES.map((status) => ({
    status,
    count: (statusesRes.data || []).filter((o) => o.status === status).length,
  }));

  // ---- Top products: units sold + revenue, excluding cancelled orders ----
  const productSales = {};
  for (const order of topOrdersRes.data || []) {
    for (const item of order.order_items || []) {
      const variant = item.product_variants;
      const product = variant?.products;
      if (!product) continue;
      const key = product.id;
      if (!productSales[key]) {
        productSales[key] = { id: product.id, name: product.name, units: 0, revenue: 0 };
      }
      productSales[key].units += item.quantity || 0;
      productSales[key].revenue += item.total_price || 0;
    }
  }
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.units - a.units)
    .slice(0, 3);

  // ---- Top products images (reuse existing product_images architecture) ----
  const topIds = topProducts.map((t) => t.id);
  let imagesMap = {};
  if (topIds.length) {
    const img = await fetchQuery("top product images", supabase, (s) =>
      s.from("product_images").select("product_id, image_url, is_primary, sort_order").in("product_id", topIds)
    );
    const byProduct = {};
    for (const im of img.data || []) {
      if (!byProduct[im.product_id]) byProduct[im.product_id] = [];
      byProduct[im.product_id].push(im);
    }
    for (const pid of topIds) {
      const list = (byProduct[pid] || [])
        .slice()
        .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order);
      imagesMap[pid] = list[0]?.image_url || "";
    }
  }
  const topProductsWithImages = topProducts.map((t) => ({ ...t, image_url: imagesMap[t.id] || "" }));

  // ---- KPI cards (real values + real month-over-month where cleanly defined) ----
  const stats = [
    { label: "Total Orders", value: totalOrders.toLocaleString(), trend: pctChange(ordersThisMonth, ordersLastMonth), icon: <ShoppingCart size={18} /> },
    { label: "Total Revenue", value: `EGP ${totalRevenue.toLocaleString()}`, trend: pctChange(revenueThisMonth, revenueLastMonth), icon: <BarChart3 size={18} /> },
    { label: "Total Customers", value: totalCustomers.toLocaleString(), trend: pctChange(newCustomersThisMonth, newCustomersLastMonth), icon: <Users size={18} /> },
    { label: "Active Products", value: activeProducts.toLocaleString(), trend: null, icon: <ShoppingBag size={18} /> },
    { label: "Pending Orders", value: pendingCount.toLocaleString(), trend: null, icon: <Bell size={18} /> },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Stats Grid (real values; real MoM trends only, never fake) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] border border-[#EBE2DA] shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-[#8E8A84]">
              <div className="p-2 bg-[#FAF8F5] rounded-lg">{s.icon}</div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            {s.trend != null && (
              <div className={`text-[11px] font-bold mt-2 ${s.trend >= 0 ? "text-green-600" : "text-red-500"}`}>
                {s.trend >= 0 ? "+" : ""}
                {s.trend.toFixed(1)}%{" "}
                <span className="text-[#8E8A84] font-normal text-[10px]">vs last month</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 2. Charts — Sales Overview + Orders Overview (side by side on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-[24px] border border-[#EBE2DA] shadow-sm">
          <SalesChart thisMonth={thisMonth} lastMonth={lastMonth} />
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-[#EBE2DA] shadow-sm">
          <OrdersChart counts={statusCounts} />
        </div>
      </div>

      {/* 3. Top Products (real units sold + revenue) */}
      <div className="bg-white p-6 rounded-[24px] border border-[#EBE2DA] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-[#3E3A36]">Top Products</h3>
        </div>
        {topProductsWithImages.length === 0 ? (
          <div className="text-center text-xs text-[#8E8A84] py-6">No sales yet</div>
        ) : (
          <div className="space-y-5">
            {topProductsWithImages.map((product, i) => (
              <div key={product.id} className="flex items-center gap-4">
                <span className="text-xs font-bold text-[#8E8A84] w-4 shrink-0">{i + 1}</span>
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded-lg bg-[#F3EFEA] shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-[#F3EFEA] rounded-lg shrink-0"></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#3E3A36] truncate">{product.name}</p>
                  <p className="text-[10px] text-[#8E8A84]">{product.units} sold</p>
                </div>
                <div className="text-xs font-bold whitespace-nowrap shrink-0">EGP {product.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Recent Orders */}
      <div className="bg-white rounded-[24px] border border-[#EBE2DA] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#EBE2DA] flex justify-between items-center">
          <h3 className="font-bold text-[#3E3A36]">Recent Orders</h3>
          <Link href="/admin/orders" className="text-xs text-[#8E8A84] hover:text-black">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF8F5] text-[11px] text-[#8E8A84] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-center">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#EBE2DA]">
              {!recentOrdersRes.data?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#8E8A84] text-xs">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrdersRes.data.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FCFAF8] transition-colors">
                    <td className="px-6 py-4 text-[#8E8A84] whitespace-nowrap">#ORD-{order.id.slice(0, 4)}</td>
                    <td className="px-6 py-4 font-semibold whitespace-nowrap">
                      {order.customer_name || order.users?.full_name || "Guest"}
                    </td>
                    <td className="px-6 py-4 text-center text-[#8E8A84] whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold whitespace-nowrap">
                      EGP {Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Shared StatusBadge — colors sourced from the centralized STATUS_META
function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${meta?.badge || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
