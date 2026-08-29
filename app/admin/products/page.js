import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import ProductsContent from "./content";

export const metadata = { title: "Manage Products | Drapey Admin" };

export default async function AdminProductsPage() {
  const { user, isAdmin, supabase } = await requireAdmin();
  if (!user) redirect("/login");
  if (!isAdmin) redirect("/");

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(`
        *,
        categories(name, slug),
        product_images(id, image_url, is_primary, sort_order),
        product_variants(id, size, color, sku, stock_quantity)
      `)
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  return <ProductsContent products={products || []} categories={categories || []} />;
}
