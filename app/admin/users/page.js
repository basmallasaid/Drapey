import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import UsersContent from "./content";

export const metadata = { title: "Manage Users | Drapey Admin" };

export default async function AdminUsersPage() {
  const { user, isAdmin, supabase } = await requireAdmin();
  if (!user) redirect("/login");
  if (!isAdmin) redirect("/");

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return <UsersContent users={users || []} />;
}
