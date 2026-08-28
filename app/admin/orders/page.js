import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import OrdersContent from "./content";

export const metadata = { title: "Manage Orders | Drapey Admin" };

export default async function AdminOrdersPage() {
  const { user, isAdmin, supabase } = await requireAdmin();
  if (!user) redirect("/login");
  if (!isAdmin) redirect("/");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, users(full_name, email), order_items(*)")
    .order("created_at", { ascending: false });

  return <OrdersContent orders={orders || []} />;
}
