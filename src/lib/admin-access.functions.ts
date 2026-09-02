import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Grants the admin role to the signed-in user when they present the correct
 * admin invite code. The code lives only in a server secret, so it can never
 * be read or guessed from the browser bundle.
 */
export const claimAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { inviteCode: string }) => {
    const inviteCode = String(input?.inviteCode ?? "").trim();
    if (!inviteCode) throw new Error("Admin invite code is required.");
    return { inviteCode };
  })
  .handler(async ({ data, context }) => {
    const expected = process.env["ADMIN_INVITE_CODE"];
    if (!expected) {
      throw new Error("Admin registration is not configured yet.");
    }
    if (data.inviteCode !== expected) {
      throw new Error("Invalid admin invite code.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (roleError) throw new Error(roleError.message);

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ account_type: "admin" })
      .eq("id", context.userId);
    if (profileError) throw new Error(profileError.message);

    return { ok: true as const };
  });
