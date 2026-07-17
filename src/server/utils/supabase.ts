import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { cleanEnv } from "./helpers.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const supabaseUrl = cleanEnv(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
const supabaseAnonKey = cleanEnv(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);

export const supabaseAuth = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
