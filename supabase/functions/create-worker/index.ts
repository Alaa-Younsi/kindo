// POST /functions/v1/create-worker  { email, password, sections: string[] }
// Owner-only. Creates a Supabase Auth user + an admin_profiles row, atomically
// (rolls the auth user back if the profile insert fails).
//
// Deploy:  supabase functions deploy create-worker
//
// Self-contained on purpose — the shared CORS/owner-check helpers are inlined
// rather than imported from ../_shared so the CLI bundler can't miss them.
// The `npm:` specifier is the Supabase Edge Functions standard and needs no
// import map; the editor resolves it via the shim in ../deno.d.ts.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Keep in sync with src/lib/adminSections.ts (GRANTABLE_SECTIONS) and the
// has_section('…') strings in 0015_admin_content.sql.
const ALLOWED_SECTIONS = [
  "products",
  "categories",
  "orders",
  "delivery",
  "reviews",
  "pixels",
  "policy",
];

function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** Resolve the caller from the Authorization header and confirm they're an
 *  active owner. Returns the admin client, or a Response to return as-is. */
async function requireOwner(
  req: Request,
): Promise<{ admin: ReturnType<typeof serviceClient> } | Response> {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ code: "unauthorized" }, 401);

  const admin = serviceClient();
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) return json({ code: "unauthorized" }, 401);

  const { data: profile } = await admin
    .from("admin_profiles")
    .select("is_owner, active")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!profile?.active || !profile.is_owner) return json({ code: "forbidden" }, 403);
  return { admin };
}

function sanitizeSections(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((s): s is string => typeof s === "string"))].filter((s) =>
    ALLOWED_SECTIONS.includes(s),
  );
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ code: "method_not_allowed" }, 405);

  const gate = await requireOwner(req);
  if (gate instanceof Response) return gate;
  const { admin } = gate;

  let body: { email?: string; password?: string; sections?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ code: "bad_request" }, 400);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const sections = sanitizeSections(body.sections);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ code: "bad_email" }, 400);
  if (password.length < 8) return json({ code: "weak_password" }, 400);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no inbox flow for a shop employee
  });

  if (createErr || !created.user) {
    const msg = createErr?.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return json({ code: "email_exists" }, 409);
    }
    return json({ code: "create_failed", detail: createErr?.message }, 400);
  }

  const { error: profileErr } = await admin.from("admin_profiles").insert({
    user_id: created.user.id,
    email,
    is_owner: false,
    sections,
    active: true,
  });

  if (profileErr) {
    // Roll back — a dangling auth user with no profile can log in, see the
    // no-access screen forever, and blocks the email from being re-used.
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ code: "profile_failed", detail: profileErr.message }, 400);
  }

  return json({ ok: true, user_id: created.user.id });
});
