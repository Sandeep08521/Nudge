import { createClient } from "@supabase/supabase-js";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const storedUrl = typeof window !== "undefined" ? localStorage.getItem("nudge_supabase_url") : null;
const storedKey = typeof window !== "undefined" ? localStorage.getItem("nudge_supabase_key") : null;

const url = envUrl || storedUrl;
const key = envKey || storedKey;

export const isSupabaseConfigured = Boolean(
  url &&
  key &&
  !url.includes("YOUR-PROJECT") &&
  !key.includes("YOUR-ANON")
);

export const supabase = createClient(
  isSupabaseConfigured && url ? url : "https://placeholder-nudge.supabase.co",
  isSupabaseConfigured && key ? key : "placeholder-key"
);

export function configureSupabase(newUrl: string, newKey: string): void {
  localStorage.setItem("nudge_supabase_url", newUrl.trim());
  localStorage.setItem("nudge_supabase_key", newKey.trim());
  window.location.reload();
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem("nudge_supabase_url");
  localStorage.removeItem("nudge_supabase_key");
  window.location.reload();
}
