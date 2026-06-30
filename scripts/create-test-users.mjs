import crypto from "node:crypto";
import fs from "node:fs";
import process from "node:process";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function usage() {
  console.error("Usage: node scripts/create-test-users.mjs users.json");
  console.error("   or: node scripts/create-test-users.mjs ana@example.com bia@example.com");
  console.error('users.json example: [{"name":"Ana","email":"ana@example.com"}]');
}

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.randomBytes(18);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function loadUsers(filePath) {
  if (!filePath) {
    usage();
    process.exit(1);
  }

  const users = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, "utf8"))
    : process.argv.slice(2).map((email) => ({
        name: String(email).split("@")[0].replace(/[._-]+/g, " "),
        email,
      }));

  if (!Array.isArray(users) || users.length === 0) {
    throw new Error("Expected a non-empty JSON array of users.");
  }

  return users.map((user, index) => {
    const name = String(user.name || "").trim();
    const email = String(user.email || "").trim().toLowerCase();

    if (!name) {
      throw new Error(`User ${index + 1} is missing name.`);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`User ${index + 1} has an invalid email.`);
    }

    return { name, email };
  });
}

if (!supabaseUrl || (!serviceRoleKey && !supabaseAnonKey)) {
  throw new Error("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local before creating users.");
}

const users = loadUsers(process.argv[2]);
const isAdminMode = Boolean(serviceRoleKey);
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const createdUsers = [];

for (const user of users) {
  const password = generatePassword();
  let data;
  let error;

  try {
    const result = isAdminMode
      ? await supabase.auth.admin.createUser({
          email: user.email,
          password,
          email_confirm: true,
          user_metadata: { name: user.name, test_user: true },
        })
      : await supabase.auth.signUp({
          email: user.email,
          password,
          options: {
            data: { name: user.name, test_user: true },
          },
        });

    data = result.data;
    error = result.error;
  } catch (err) {
    error = err;
  }

  if (error) {
    const message = error.cause?.code || error.code || error.message || "erro desconhecido";
    createdUsers.push({ name: user.name, email: user.email, status: "erro", message });
    continue;
  }

  createdUsers.push({
    name: user.name,
    email: user.email,
    password,
    userId: data.user?.id || "",
    status: isAdminMode || data.session ? "criada" : "criada_confirme_email",
  });
}

console.table(createdUsers.map(({ userId: _userId, ...user }) => user));
