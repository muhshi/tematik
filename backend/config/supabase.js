const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes("your-project.supabase.co")) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY ? "Service Role Key (RLS Bypass)" : "Anon Key";
    console.log(`⚡ Supabase client initialized using ${keyType}.`);
  } catch (err) {
    console.warn("⚠️ Supabase initialization failed:", err.message);
  }
} else {
  console.warn("⚠️ Supabase credentials missing in .env - running with local DB fallback.");
}

module.exports = { supabase };
