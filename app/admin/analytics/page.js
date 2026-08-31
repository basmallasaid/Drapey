import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ORDER_STATUSES, STATUS_META } from "@/lib/order-status";
import * as u from "./utils";
import KpiCard from "./KpiCard";
import DateRangeSelect from "./DateRangeSelect";
import SalesPerformanceChart from "./SalesPerformanceChart";
import CategoryDonut from "./CategoryDonut";
import OrderStatusDonut from "./OrderStatusDonut";
import TopProductsChart from "./TopProductsChart";
import NewCustomersChart from "./NewCustomersChart";

export const metadata = { title: "Analytics | Drapey Admin" };

const CARD_HEADING =
  "text-sm font-bold text-[var(--color-dark-brown)] mb-4";

function SectionCard({ title, extra, children }) {
  return (
    <div className="bg-white p-6 rounded-[24px] border border-[var(--color-light-beige)] shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-5">
        <h2 className={CARD_HEADING}>{title}</h2>
        {extra}
      </div>
      {children}
    </div>
  );
}

export default async function AdminAnalyticsPage({ searchParams }) {
  const { user, isAdmin, supabase } = await requireAdmin();
  if (!user) redirect("/login");
  if (!isAdmin) redirect("/");

  const sp = await searchParams;
  const range = u.parseRange(sp || {});
  const gran = u.granularityForRange(range);

  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  // A) All orders created within the range (for revenue, pipeline, line chart).
  const ordersQuery = supabase
    .from("orders")
    .select("id, created_at, status, total_amount")
    .gte("created_at", fromIso)
    .lt("created_at", toIso);
  const { data: orders } = await ordersQuery;

  // B) User ids that placed orders before the range -> to tag "new customers" vs returning.
  const beforeQuery = supabase
    .from("orders")
    .select("user_id")
    .lt("created_at", fromIso);
  const { data: beforeOrders } = await beforeQuery;
  const priorBuyerIds = new Set((beforeOrders || []).map((o) => o.user_id));

  // C) New customers created within the range (role = customer).
  const usersQuery = supabase
    .from("users")
    .select("id, created_at")
    .eq("role", "customer")
    .gte("created_at", fromIso)
    .lt("created_at", toIso);
  const { data: newUsers } = await usersQuery;

  // D) Order items within the range (non-cancelled) joined to category for product/category analytics.
  const itemsQuery = supabase
    .from("order_items")
    .select(
      "order_id, id, quantity, total_price, product_name, product_variants(product_id, products(category_id, categories(name)))"
    );
  const { data: rangeItems } = await itemsQuery;

  // Filter items to orders created inside the range and non-cancelled.
  const cancelledStatuses = new Set(["cancelled"]);
  const orderStatusById = new Map((orders || []).map((o) => [o.id, o.status]));
  const inRangeItems = (rangeItems || []).filter((item) => {
    const status = orderStatusById.get(item.order_id);
    const inRange = typeof status === "string";
    if (!inRange) return false;
    return !cancelledStatuses.has(status);
  });

  // ---------------------------------------------------------------
  // KPIs
  // ---------------------------------------------------------------
  const deliveredOrders = (orders || []).filter((o) => o.status === "delivered");
  const deliveredRevenue = deliveredOrders.reduce((a, o) => a + Number(o.total_amount || 0), 0);
  const totalOrders = (orders || []).length;
  const aov = deliveredOrders.length > 0 ? deliveredRevenue / deliveredOrders.length : 0;
  const uniqueBuyers = new Set((orders || []).map((o) => o.user_id)).size;
  const newCustomerIds = new Set((newUsers || []).map((u2) => u2.id));
  const newCustomersFromOrders = (orders || []).filter(
    (o) => newCustomerIds.has(o.user_id) && !priorBuyerIds.has(o.user_id)
  );
  const newCustomerCount = newCustomersFromOrders.length;

  // ---------------------------------------------------------------
  // Line chart: revenue (delivered) + orders (all) per bucket
  // ---------------------------------------------------------------
  const buckets = u.buildBuckets(range.from, range.to, gran);
  const salesSeries = buckets.map((b) => ({ name: b.label, revenue: 0, orders: 0 }));
  (orders || []).forEach((o) => {
    const idx = u.bucketIndex(o.created_at, buckets);
    if (idx < 0) return;
    salesSeries[idx].orders += 1;
    if (o.status === "delivered") {
      salesSeries[idx].revenue += Number(o.total_amount || 0);
    }
  });

  // ---------------------------------------------------------------
  // Order status donut (all orders in range, all statuses)
  // ---------------------------------------------------------------
  const statusData = ORDER_STATUSES.map((status) => {
    const meta = STATUS_META[status];
    return {
      status,
      label: meta.label,
      fill: meta.fill,
      count: (orders || []).filter((o) => o.status === status).length,
    };
  });

  // ---------------------------------------------------------------
  // Category donut (non-cancelled in-range items, revenue share)
  // ---------------------------------------------------------------
  const catMap = new Map();
  inRangeItems.forEach((item) => {
    const name =
      item.product_variants?.products?.categories?.name || "Uncategorized";
    const revenue = Number(item.total_price || 0);
    catMap.set(name, (catMap.get(name) || 0) + revenue);
  });
  const catTotal = [...catMap.values()].reduce((a, b) => a + b, 0);
  const sortedCats = [...catMap.entries()].sort((a, b) => b[1] - a[1]);
  const topCats = sortedCats.slice(0, 6).map(([name, value]) => ({ name, value }));
  const restCatValue = sortedCats.slice(6).reduce((a, [, v]) => a + v, 0);
  if (restCatValue > 0) topCats.push({ name: "Other", value: restCatValue });

  // ---------------------------------------------------------------
  // Top products (non-cancelled in-range items; units + revenue)
  // ---------------------------------------------------------------
  const prodMap = new Map();
  inRangeItems.forEach((item) => {
    const name = item.product_name || "Unknown product";
    const entry = prodMap.get(name) || { units: 0, revenue: 0 };
    entry.units += Number(item.quantity || 0);
    entry.revenue += Number(item.total_price || 0);
    prodMap.set(name, entry);
  });
  const topProducts = [...prodMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.units - a.units);

  // ---------------------------------------------------------------
  // New customers area chart (all new customers in range)
  // ---------------------------------------------------------------
  const customersSeries = buckets.map((b) => ({ name: b.label, customers: 0 }));
  (newUsers || []).forEach((cu) => {
    const idx = u.bucketIndex(cu.created_at, buckets);
    if (idx < 0) return;
    customersSeries[idx].customers += 1;
  });

  // Preserve query params for the date selector (always sends explicit params).
  const selectorProps = {
    value: range.key,
    from: sp?.from || "",
    to: sp?.to || "",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-dark-brown)]">Analytics</h1>
          <p className="text-xs text-[var(--color-medium-brown)] mt-1">{u.rangeLabel(range)}</p>
        </div>
        <DateRangeSelect {...selectorProps} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Delivered Revenue"
          value={u.formatEgpWhole(deliveredRevenue)}
          sub={`${deliveredOrders.length} delivered order${
            deliveredOrders.length === 1 ? "" : "s"
          }`}
        />
        <KpiCard label="Total Orders" value={totalOrders} sub="All statuses, this period" />
        <KpiCard
          label="Average Order Value"
          value={u.formatEgpWhole(aov)}
          sub="Delivered revenue ÷ delivered orders"
        />
        <KpiCard
          label="Unique Buyers"
          value={uniqueBuyers}
          sub={`${newCustomerCount} new customer${newCustomerCount === 1 ? "" : "s"} placed an order`}
        />
      </div>

      {/* Sales performance line chart */}
      <SectionCard title="Sales Performance" extra={<span className="text-[10px] text-[var(--color-medium-brown)] whitespace-nowrap">Revenue = delivered · Orders = all</span>}>
        <SalesPerformanceChart data={salesSeries} />
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Revenue by Category">
          <CategoryDonut data={topCats} total={catTotal} />
        </SectionCard>
        <SectionCard title="Orders by Status">
          <OrderStatusDonut data={statusData} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Top Products" extra={<span className="text-[10px] text-[var(--color-medium-brown)] whitespace-nowrap">Non-cancelled orders</span>}>
          <TopProductsChart data={topProducts} />
        </SectionCard>
        <SectionCard title="New Customers">
          <NewCustomersChart data={customersSeries} total={newUsers.length} />
        </SectionCard>
      </div>
    </div>
  );
}
