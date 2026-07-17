import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { cleanEnv } from "./helpers.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const supabaseUrl = cleanEnv(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
