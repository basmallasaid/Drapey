import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ORDER_STATUSES, STATUS_META } from "@/lib/order-status";
import * as u from "./utils";
import KpiCard from "./KpiCard";
import DateRangeSelect from "./DateRangeSelect";
import ViewBySelect from "./ViewBySelect";
import SalesPerformanceChart from "./SalesPerformanceChart";
import CategoryDonut from "./CategoryDonut";
import OrderStatusDonut from "./OrderStatusDonut";
import TopProductsChart from "./TopProductsChart";
import NewCustomersChart from "./NewCustomersChart";

export const metadata = { title: "Analytics | Drapey Admin" };

const CARD_HEADING = "text-sm font-bold text-[var(--color-dark-brown)] mb-4";

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

function StatTile({ label, value, sub }) {
  return (
    <div className="bg-[var(--color-cream)] rounded-2xl p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-medium-brown)] mb-2">
        {label}
      </p>
      <p className="text-xl font-bold text-[var(--color-dark-brown)] break-words">{value}</p>
      {sub ? (
        <p className="text-[10px] text-[var(--color-medium-brown)] mt-1.5 leading-snug">{sub}</p>
      ) : null}
    </div>
  );
}

// Picks the best image for a product: primary flag first, then sort order.
function pickPrimaryImage(list) {
  if (!Array.isArray(list) || list.length === 0) return "";
  const sorted = list
    .slice()
    .sort(
      (a, b) =>
        (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) ||
        (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
  return sorted[0]?.image_url || "";
}

export default async function AdminAnalyticsPage({ searchParams }) {
  const { user, isAdmin, supabase } = await requireAdmin();
  if (!user) redirect("/login");
  if (!isAdmin) redirect("/");

  const sp = await searchParams;
  const range = u.parseRange(sp || {});
  const gran = u.normalizeView(sp?.view, range);

  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  // A) All orders created within the range (KPI/status/insights/series source).
  const { data: orders } = await supabase
    .from("orders")
    .select("id, created_at, status, total_amount, user_id")
    .gte("created_at", fromIso)
    .lt("created_at", toIso);

  // B) Customer accounts created within the range.
  const { data: newUsers } = await supabase
    .from("users")
    .select("id, created_at")
    .eq("role", "customer")
    .gte("created_at", fromIso)
    .lt("created_at", toIso);

  // C) Total customers ever registered (excludes admins).
  const { count: totalCustomers } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "customer");

  // D) Order items (variant + product + category + image) for product/category analytics.
  const { data: rangeItems } = await supabase
    .from("order_items")
    .select(
      "order_id, id, quantity, total_price, product_name, product_variants(product_id, products(category_id, name, categories(name), product_images(image_url, is_primary, sort_order)))"
    );

  // Keep only items belonging to orders created inside the range, skipping cancelled.
  const cancelledStatuses = new Set(["cancelled"]);
  const orderStatusById = new Map((orders || []).map((o) => [o.id, o.status]));
  const inRangeItems = (rangeItems || []).filter((item) => {
    const status = orderStatusById.get(item.order_id);
    if (typeof status !== "string") return false;
    return !cancelledStatuses.has(status);
  });

  // ---------------------------------------------------------------
  // KPIs (real data; cancelled orders never count toward revenue)
  // ---------------------------------------------------------------
  const totalOrders = (orders || []).length;
  const cancelledOrders = (orders || []).filter((o) => o.status === "cancelled");
  const totalRevenue = (orders || [])
    .filter((o) => o.status !== "cancelled")
    .reduce((a, o) => a + Number(o.total_amount || 0), 0);
  const deliveredOrders = (orders || []).filter((o) => o.status === "delivered");
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const cancellationRate = totalOrders > 0 ? (cancelledOrders.length / totalOrders) * 100 : 0;

  // ---------------------------------------------------------------
  // Sales performance series (revenue non-cancelled + all orders per bucket)
  // ---------------------------------------------------------------
  const buckets = u.buildBuckets(range.from, range.to, gran);
  const salesSeries = buckets.map((b) => ({ name: b.label, revenue: 0, orders: 0 }));
  (orders || []).forEach((o) => {
    const idx = u.bucketIndex(o.created_at, buckets);
    if (idx < 0) return;
    salesSeries[idx].orders += 1;
    if (o.status !== "cancelled") {
      salesSeries[idx].revenue += Number(o.total_amount || 0);
    }
  });

  // ---------------------------------------------------------------
  // Order status analysis (all orders in range, all statuses)
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
  // Sales by category (non-cancelled in-range items, revenue share)
  // ---------------------------------------------------------------
  const catMap = new Map();
  inRangeItems.forEach((item) => {
    const name = item.product_variants?.products?.categories?.name || "Uncategorized";
    catMap.set(name, (catMap.get(name) || 0) + Number(item.total_price || 0));
  });
  const catTotal = [...catMap.values()].reduce((a, b) => a + b, 0);
  const sortedCats = [...catMap.entries()].sort((a, b) => b[1] - a[1]);
  const topCats = sortedCats.slice(0, 6).map(([name, value]) => ({ name, value }));
  const restCatValue = sortedCats.slice(6).reduce((a, [, v]) => a + v, 0);
  if (restCatValue > 0) topCats.push({ name: "Other", value: restCatValue });

  // ---------------------------------------------------------------
  // Top products (non-cancelled in-range items; units + revenue + image)
  // ---------------------------------------------------------------
  const prodMap = new Map();
  inRangeItems.forEach((item) => {
    const prd = item.product_variants?.products;
    const image = pickPrimaryImage(prd?.product_images);
    const name = item.product_name || prd?.name || "Unknown product";
    const entry = prodMap.get(name) || { units: 0, revenue: 0, image: "" };
    entry.units += Number(item.quantity || 0);
    entry.revenue += Number(item.total_price || 0);
    if (image) entry.image = image;
    prodMap.set(name, entry);
  });
  const topProducts = [...prodMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, 10);

  // ---------------------------------------------------------------
  // Customer insights
  // ---------------------------------------------------------------
  const buyerCounts = new Map();
  (orders || []).forEach((o) => {
    if (!o.user_id) return;
    buyerCounts.set(o.user_id, (buyerCounts.get(o.user_id) || 0) + 1);
  });
  const activeCustomers = buyerCounts.size;
  const returningCustomers = [...buyerCounts.values()].filter((n) => n > 1).length;
  const avgOrdersPerCustomer = activeCustomers > 0 ? totalOrders / activeCustomers : 0;

  // ---------------------------------------------------------------
  // New customers over time (respects range + granularity)
  // ---------------------------------------------------------------
  const customersSeries = buckets.map((b) => ({ name: b.label, customers: 0 }));
  (newUsers || []).forEach((cu) => {
    const idx = u.bucketIndex(cu.created_at, buckets);
    if (idx < 0) return;
    customersSeries[idx].customers += 1;
  });

  const selectorProps = {
    range: range.key,
    from: sp?.from || "",
    to: sp?.to || "",
    view: gran,
  };

  return (
    <div className="space-y-6">
      {/* Header + global filters */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-dark-brown)]">Analytics</h1>
          <p className="text-xs text-[var(--color-medium-brown)] mt-1">{u.rangeLabel(range)}</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <DateRangeSelect
            range={selectorProps.range}
            from={selectorProps.from}
            to={selectorProps.to}
            view={selectorProps.view}
          />
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[var(--color-medium-brown)]">
            View By
            <ViewBySelect
              value={selectorProps.view}
              range={selectorProps.range}
              from={selectorProps.from}
              to={selectorProps.to}
            />
          </label>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard
          label="Total Revenue"
          value={u.formatEgpWhole(totalRevenue)}
          sub="Excludes cancelled orders"
        />
        <KpiCard label="Total Orders" value={totalOrders.toLocaleString()} sub="All statuses this period" />
        <KpiCard
          label="Average Order Value"
          value={u.formatEgpWhole(aov)}
          sub="Revenue ÷ total orders"
        />
        <KpiCard
          label="Delivered Orders"
          value={deliveredOrders.length.toLocaleString()}
          sub="Orders marked delivered"
        />
        <KpiCard
          label="Cancellation Rate"
          value={u.formatRate(cancellationRate)}
          sub={`${cancelledOrders.length.toLocaleString()} cancelled`}
        />
      </div>

      {/* Sales performance line/area chart */}
      <SectionCard
        title="Sales Performance"
        extra={<span className="text-[10px] text-[var(--color-medium-brown)] whitespace-nowrap">Revenue excludes cancelled · Orders all statuses</span>}
      >
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
        <SectionCard title="New Customers Over Time">
          <NewCustomersChart data={customersSeries} total={newUsers?.length || 0} />
        </SectionCard>
      </div>

      {/* Customer insights */}
      <SectionCard title="Customer Insights">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            label="Total Customers"
            value={(totalCustomers || 0).toLocaleString()}
            sub="All registered customers"
          />
          <StatTile
            label="New Customers"
            value={(newUsers?.length || 0).toLocaleString()}
            sub="Accounts created in period"
          />
          <StatTile
            label="Returning Customers"
            value={returningCustomers.toLocaleString()}
            sub="More than one order in period"
          />
          <StatTile
            label="Avg Orders per Customer"
            value={avgOrdersPerCustomer.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            sub={`${activeCustomers.toLocaleString()} customer${activeCustomers === 1 ? "" : "s"} placed orders`}
          />
        </div>
      </SectionCard>
    </div>
  );
}