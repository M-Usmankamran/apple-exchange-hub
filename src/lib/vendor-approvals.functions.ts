import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type VendorSignup = {
  userId: string;
  shop: string;
  owner: string;
  email: string;
  phone: string;
  city: string;
  status: "pending" | "approved" | "rejected" | "none";
  submittedAt: string;
};

/** Confirms the caller really holds the admin role before touching accounts. */
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Admin access required.");
}

/** Every real vendor sign-up, newest first, with its approval state. */
export const listVendorSignups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VendorSignup[]> => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, phone, city, account_type, vendor_status, created_at")
      .eq("account_type", "vendor")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const emails = new Map<string, string>();
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    for (const u of userList?.users ?? []) {
      if (u.email) emails.set(u.id, u.email);
    }

    return (profiles ?? []).map((p) => ({
      userId: p.id,
      shop: p.display_name?.trim() || emails.get(p.id) || "Unnamed vendor",
      owner: p.display_name?.trim() || "—",
      email: emails.get(p.id) ?? "—",
      phone: p.phone?.trim() || "Not provided",
      city: p.city?.trim() || "Not provided",
      status: (p.vendor_status as VendorSignup["status"]) ?? "pending",
      submittedAt: p.created_at,
    }));
  });

/** Approve or reject a real vendor sign-up and sync their vendor role. */
export const decideVendorSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      userId: string;
      status: "approved" | "rejected";
      shop?: string;
      phone?: string;
      city?: string;
    }) => {
      const userId = String(input?.userId ?? "").trim();
      if (!userId) throw new Error("Vendor account is required.");
      if (input?.status !== "approved" && input?.status !== "rejected") {
        throw new Error("Decision must be approved or rejected.");
      }
      const clean = (v: unknown) => String(v ?? "").trim().slice(0, 120);
      const shop = clean(input.shop);
      const phone = clean(input.phone);
      const city = clean(input.city);
      if (input.status === "approved" && !shop) {
        throw new Error("Shop name is required before approving a vendor.");
      }
      return { userId, status: input.status, shop, phone, city };
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const update = {
      vendor_status: data.status,
      ...(data.shop ? { display_name: data.shop } : {}),
      ...(data.phone ? { phone: data.phone } : {}),
      ...(data.city ? { city: data.city } : {}),
    };

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(update)
      .eq("id", data.userId);
    if (profileError) throw new Error(profileError.message);

    if (data.status === "approved") {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "vendor" }, { onConflict: "user_id,role" });
      if (roleError) throw new Error(roleError.message);
    } else {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "vendor");
      if (roleError) throw new Error(roleError.message);
    }

    return { ok: true as const };
  });
