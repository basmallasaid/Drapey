import { adminResponse } from "@/lib/supabase/admin";
import ProductsContent from "./content";

export const metadata = { title: "Manage Products | Drapey Admin" };

export default async function AdminProductsPage() {
  const { error, supabase } = await adminResponse();
  if (error) return null;

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*, categories(name, slug)").order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  return <ProductsContent products={products || []} categories={categories || []} />;
}
