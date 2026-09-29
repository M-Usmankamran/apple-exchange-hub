import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

async function writeAudit(
  db: any,
  context: { userId: string; claims?: any },
  entry: { action: string; category?: string | undefined; severity?: string | undefined; target?: string | undefined },
) {
  await db.from("admin_audit_log").insert({
    actor_id: context.userId,
    actor_email: (context.claims?.email as string) || "admin",
    category: entry.category ?? "user",
    severity: entry.severity ?? "info",
    action: entry.action.slice(0, 500),
    target: (entry.target ?? "—").slice(0, 200),
  });
}

/* ---------- Audit log ---------- */
export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const db = await admin();
    const { data, error } = await db
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return (data ?? []).map((a) => ({
      id: a.id,
      at: a.created_at,
      actor: a.actor_email,
      category: a.category,
      severity: a.severity,
      action: a.action,
      target: a.target,
      ip: a.ip,
    }));
  });

export const addAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        action: z.string().min(1).max(500),
        category: z.enum(["auth", "vendor", "listing", "user", "payment", "complaint"]).optional(),
        severity: z.enum(["info", "warning", "critical"]).optional(),
        target: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context as any);
    await writeAudit(await admin(), context as any, data);
    return { ok: true };
  });

/* ---------- Listings ---------- */
export const listAllListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const db = await admin();
    const { data, error } = await db
      .from("vendor_products")
      .select("id, title, vendor_name, price, stock, status, image_urls, image_url, description, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((p) => {
      const imgs = p.image_urls?.length ? p.image_urls.length : p.image_url ? 1 : 0;
      const flags: string[] = [];
      if (imgs === 0) flags.push("No product photos uploaded");
      if (!p.description || p.description.length < 20) flags.push("Description is very short");
      if (p.stock <= 0) flags.push("Out of stock");
      return {
        id: p.id,
        product: p.title,
        vendor: p.vendor_name,
        price: Number(p.price),
        images: imgs,
        flags,
        status: p.status === "active" ? "approved" : p.status === "rejected" ? "rejected" : "pending",
      } as const;
    });
  });

export const decideListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context as any);
    const db = await admin();
    const { data: row, error } = await db
      .from("vendor_products")
      .update({ status: data.status === "approved" ? "active" : "rejected" })
      .eq("id", data.id)
      .select("title")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(db, context as any, {
      action: `Listing ${data.status === "approved" ? "published" : "removed"}`,
      category: "listing",
      severity: data.status === "approved" ? "info" : "warning",
      target: row.title,
    });
    return { ok: true };
  });

/* ---------- Users ---------- */
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const db = await admin();
    const [{ data: authData, error }, { data: roles }, { data: profiles }, { data: orders }] =
      await Promise.all([
        db.auth.admin.listUsers({ perPage: 1000 }),
        db.from("user_roles").select("user_id, role"),
        db.from("profiles").select("id, display_name"),
        db.from("orders").select("buyer_id"),
      ]);
    if (error) throw new Error(error.message);
    return authData.users.map((u) => {
      const r = (roles ?? []).filter((x) => x.user_id === u.id).map((x) => x.role);
      const banned = u.banned_until ? new Date(u.banned_until).getTime() > Date.now() : false;
      return {
        id: u.id,
        name:
          (profiles ?? []).find((p) => p.id === u.id)?.display_name ||
          u.email?.split("@")[0] ||
          "User",
        email: u.email ?? "",
        role: (r.includes("admin") ? "Admin" : r.includes("vendor") ? "Vendor" : "Buyer") as
          | "Admin"
          | "Vendor"
          | "Buyer",
        joined: new Date(u.created_at).toLocaleDateString(),
        orders: (orders ?? []).filter((o) => o.buyer_id === u.id).length,
        blocked: banned,
      };
    });
  });

export const setUserBlocked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), blocked: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context as any);
    if (data.userId === context.userId) throw new Error("You can't block your own account.");
    const db = await admin();
    const { data: res, error } = await db.auth.admin.updateUserById(data.userId, {
      ban_duration: data.blocked ? "876000h" : "none",
    });
    if (error) throw new Error(error.message);
    await writeAudit(db, context as any, {
      action: `${data.blocked ? "Blocked" : "Unblocked"} account`,
      category: "user",
      severity: data.blocked ? "warning" : "info",
      target: res.user?.email ?? data.userId,
    });
    return { ok: true };
  });

/* ---------- Orders ---------- */
export const listAllOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const db = await admin();
    const [{ data: orders, error }, { data: items }] = await Promise.all([
      db
        .from("orders")
        .select("id, buyer_name, total_amount, payment_method, payment_status, status, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      db.from("order_items").select("order_id, vendor_name"),
    ]);
    if (error) throw new Error(error.message);
    return (orders ?? []).map((o) => ({
      id: o.id,
      shortId: `#${o.id.slice(0, 8).toUpperCase()}`,
      buyer: o.buyer_name,
      vendor:
        [...new Set((items ?? []).filter((i) => i.order_id === o.id).map((i) => i.vendor_name).filter(Boolean))].join(", ") ||
        "—",
      amount: Number(o.total_amount),
      method: o.payment_method,
      payment: o.payment_status,
      fulfilment: o.status,
      createdAt: o.created_at,
    }));
  });

export const updateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["refund", "mark_paid", "cancel", "advance"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context as any);
    const db = await admin();
    const { data: cur, error: e1 } = await db.from("orders").select("status").eq("id", data.id).single();
    if (e1) throw new Error(e1.message);
    const flow = ["pending", "confirmed", "shipped", "delivered"];
    const patch: { payment_status?: string; status?: string; paid_at?: string } =
      data.action === "refund"
        ? { payment_status: "refunded", status: "cancelled" }
        : data.action === "mark_paid"
          ? { payment_status: "paid", paid_at: new Date().toISOString() }
          : data.action === "cancel"
            ? { status: "cancelled" }
            : { status: flow[Math.min(flow.indexOf(cur.status) + 1, flow.length - 1)] ?? "confirmed" };
    const { error } = await db.from("orders").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(db, context as any, {
      action: `Order ${data.action.replace("_", " ")}`,
      category: "payment",
      severity: data.action === "refund" || data.action === "cancel" ? "warning" : "info",
      target: `#${data.id.slice(0, 8).toUpperCase()}`,
    });
    return { ok: true };
  });

/* ---------- Complaints ---------- */
export const listComplaints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const db = await admin();
    const { data, error } = await db
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((c) => ({
      id: c.id,
      from: c.from_name,
      against: c.against,
      topic: c.topic,
      severity: (["High", "Medium", "Low"].includes(c.severity) ? c.severity : "Medium") as
        | "High"
        | "Medium"
        | "Low",
      detail: c.detail,
      status: (c.status === "resolved" ? "resolved" : "open") as "open" | "resolved",
    }));
  });

export const resolveComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), resolution: z.string().min(1).max(2000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context as any);
    const db = await admin();
    const { data: row, error } = await db
      .from("complaints")
      .update({ status: "resolved", resolution: data.resolution, resolved_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("topic, against")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(db, context as any, {
      action: `Complaint resolved: ${row.topic}`,
      category: "complaint",
      target: row.against,
    });
    return { ok: true };
  });
