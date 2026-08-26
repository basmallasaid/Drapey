import { createClient } from "@supabase/supabase-js";

let serviceClient = null;

export function getServiceClient() {
  if (!serviceClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    serviceClient = createClient(url, key);
  }
  return serviceClient;
}
