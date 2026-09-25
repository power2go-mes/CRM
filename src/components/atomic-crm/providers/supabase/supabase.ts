import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

const requiredEnv = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SB_PUBLISHABLE_KEY: import.meta.env.VITE_SB_PUBLISHABLE_KEY,
} as const;

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  const missing = Object.entries(requiredEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const message = `Missing required Vite Supabase environment variables: ${missing.join(", ")}. Add them to the Vercel project before deployment.`;
    console.error(message);
    throw new Error(message);
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      requiredEnv.VITE_SUPABASE_URL,
      requiredEnv.VITE_SB_PUBLISHABLE_KEY,
    );
  }
  return supabaseClient;
};
