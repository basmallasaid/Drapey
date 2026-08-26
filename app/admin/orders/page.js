import { adminResponse } from "@/lib/supabase/admin";
import OrdersContent from "./content";

export const metadata = { title: "Manage Orders | Drapey Admin" };

export default async function AdminOrdersPage() {
  const { error, supabase } = await adminResponse();
  if (error) return null;

  const { data: orders } = await supabase
    .from("orders")
    .select("*, users(full_name, email), order_items(*, products(name))")
    .order("created_at", { ascending: false });

  return <OrdersContent orders={orders || []} />;
}
