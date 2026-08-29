import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import CategoriesContent from "./content";

export const metadata = { title: "Manage Categories | Drapey Admin" };

export default async function AdminCategoriesPage() {
  const { user, isAdmin, supabase } = await requireAdmin();
  if (!user) redirect("/login");
  if (!isAdmin) redirect("/");

  const { data: categories } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("name");

  return <CategoriesContent categories={categories || []} />;
}
