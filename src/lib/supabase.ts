import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "متغيرات البيئة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY مطلوبة. راجع ملف .env.example"
  );
}

// Database النوع سيتم توليده تلقائيًا في المرحلة 3 عبر:
// npm run gen:types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
