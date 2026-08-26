import { adminResponse } from "@/lib/supabase/admin";
import CategoriesContent from "./content";

export const metadata = { title: "Manage Categories | Drapey Admin" };

export default async function AdminCategoriesPage() {
  const { error, supabase } = await adminResponse();
  if (error) return null;

  const { data: categories } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("name");

  return <CategoriesContent categories={categories || []} />;
}
