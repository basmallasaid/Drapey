import { createClient } from "./server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, profile: null, isAdmin: false, supabase };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  return { user, profile, isAdmin, supabase };
}

export async function adminResponse() {
  const { user, profile, isAdmin, supabase } = await requireAdmin();

  if (!user || !isAdmin) {
    return { error: true, status: 403, message: "Admin access required" };
  }

  return { user, profile, isAdmin, supabase, error: false };
}
