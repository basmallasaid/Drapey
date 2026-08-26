import { adminResponse } from "@/lib/supabase/admin";
import UsersContent from "./content";

export const metadata = { title: "Manage Users | Drapey Admin" };

export default async function AdminUsersPage() {
  const { error, supabase } = await adminResponse();
  if (error) return null;

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return <UsersContent users={users || []} />;
}
