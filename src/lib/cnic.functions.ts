import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CnicStatus = "not_uploaded" | "pending" | "verified" | "rejected";

export type CnicSubmission = {
  userId: string;
  accountType: string;
  displayName: string;
  email: string;
  phone: string;
  city: string;
  cnicNumber: string;
  status: Exclude<CnicStatus, "not_uploaded">;
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

/** Confirms the caller really holds the admin role before any CNIC document is touched. */
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

/** Admin-only queue of submitted CNIC documents. Never returns the document itself. */
export const listCnicSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CnicSubmission[]> => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("cnic_verifications")
      .select(
        "user_id, account_type, cnic_number, status, rejection_reason, submitted_at, reviewed_at",
      )
      .order("submitted_at", { ascending: false });
    if (error) throw new Error(error.message);
    if (!rows?.length) return [];

    const ids = rows.map((r) => r.user_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, phone, city")
      .in("id", ids);
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    const emails = new Map<string, string>();
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    for (const u of userList?.users ?? []) {
      if (u.email) emails.set(u.id, u.email);
    }

    return rows.map((r) => {
      const p = profileById.get(r.user_id);
      return {
        userId: r.user_id,
        accountType: r.account_type,
        displayName: p?.display_name?.trim() || "Unnamed account",
        email: emails.get(r.user_id) ?? "—",
        phone: p?.phone?.trim() || "Not provided",
        city: p?.city?.trim() || "Not provided",
        cnicNumber: r.cnic_number?.trim() || "Not provided",
        status: r.status as CnicSubmission["status"],
        rejectionReason: r.rejection_reason,
        submittedAt: r.submitted_at,
        reviewedAt: r.reviewed_at,
      };
    });
  });

/**
 * Short-lived signed link so an admin can inspect one document.
 * The path is never exposed to the client and the link expires in 60 seconds.
 */
export const getCnicDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; side?: "front" | "back" }) => {
    const userId = String(input?.userId ?? "").trim();
    if (!userId) throw new Error("Account is required.");
    const side = input?.side === "back" ? "back" : "front";
    return { userId, side };
  })
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("cnic_verifications")
      .select("document_path, document_back_path")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const path = data.side === "back" ? row?.document_back_path : row?.document_path;
    if (!path) {
      throw new Error(
        data.side === "back"
          ? "No back picture on file for this account."
          : "No document on file for this account.",
      );
    }

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("cnic-documents")
      .createSignedUrl(path, 60);
    if (signError || !signed?.signedUrl) {
      throw new Error(signError?.message ?? "Could not open that document.");
    }
    return { url: signed.signedUrl };
  });

/** Approve, reject (with reason) or ask for a fresh upload. */
export const decideCnic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { userId: string; status: "verified" | "rejected"; reason?: string }) => {
      const userId = String(input?.userId ?? "").trim();
      if (!userId) throw new Error("Account is required.");
      if (input?.status !== "verified" && input?.status !== "rejected") {
        throw new Error("Decision must be verified or rejected.");
      }
      const reason = String(input?.reason ?? "").trim().slice(0, 500);
      if (input.status === "rejected" && !reason) {
        throw new Error("A reason is required when rejecting a document.");
      }
      return { userId, status: input.status, reason };
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("cnic_verifications")
      .update({
        status: data.status,
        rejection_reason: data.status === "rejected" ? data.reason : null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);

    return { ok: true as const };
  });
