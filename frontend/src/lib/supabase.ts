import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes("your-project.supabase.co")) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.warn("[supabase] Failed to initialize Supabase client:", err);
  }
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = () => !!supabaseInstance;
