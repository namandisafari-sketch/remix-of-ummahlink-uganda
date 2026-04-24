// One-shot bootstrap to create a fixed admin user. Idempotent.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ADMIN_EMAIL = "admin@ummahlink.app";
const ADMIN_PASSWORD = "Zxcvbn#2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find existing user
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) throw listErr;
    let user = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);

    if (!user) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: "Platform Admin" },
      });
      if (createErr) throw createErr;
      user = created.user!;
    } else {
      // Ensure password is set to the requested value
      await admin.auth.admin.updateUserById(user.id, { password: ADMIN_PASSWORD, email_confirm: true });
    }

    // Grant admin role (idempotent)
    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;

    return new Response(
      JSON.stringify({ ok: true, user_id: user.id, email: ADMIN_EMAIL }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
