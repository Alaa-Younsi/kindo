// POST /functions/v1/set-worker-password  { userId, password }
// Owner-only. Sets ANOTHER admin's password. Refuses if the target is missing
// from admin_profiles or is an owner (owners rotate their own password on
// /admin/account, where the current one is required — this no-old-password
// path must never point at an owner). The worker is NOT notified.
//
// Deploy:  supabase functions deploy set-worker-password
//
// Self-contained on purpose — shared helpers inlined so the CLI bundler can't
// miss a ../_shared import. Keep the helper bodies identical to create-worker.
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

function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

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

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ code: "method_not_allowed" }, 405);

  const gate = await requireOwner(req);
  if (gate instanceof Response) return gate;
  const { admin } = gate;

  let body: { userId?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ code: "bad_request" }, 400);
  }

  const userId = (body.userId ?? "").trim();
  const password = body.password ?? "";
  if (!userId) return json({ code: "bad_request" }, 400);
  if (password.length < 8) return json({ code: "weak_password" }, 400);

  const { data: target } = await admin
    .from("admin_profiles")
    .select("is_owner")
    .eq("user_id", userId)
    .maybeSingle();

  if (!target) return json({ code: "not_found" }, 404);
  if (target.is_owner) return json({ code: "forbidden_target" }, 403);

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return json({ code: "update_failed", detail: error.message }, 400);

  return json({ ok: true });
});
