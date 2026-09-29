import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type VendorOrderRow = {
  orderId: string;
  buyerName: string;
  city: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: { name: string; qty: number; unitPrice: number }[];
  vendorTotal: number;
};

const ORDER_FLOW = ["pending", "confirmed", "shipped", "delivered"] as const;

async function assertVendor(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "vendor")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Vendor access required.");
}

async function myProductIds(supabase: any, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("vendor_products").select("id").eq("vendor_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { id: string }) => r.id);
}

/** Orders containing at least one of the signed-in vendor's products. */
export const listVendorOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VendorOrderRow[]> => {
    await assertVendor(context as any);
    const ids = await myProductIds(context.supabase, context.userId);
    if (ids.length === 0) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: items, error } = await supabaseAdmin
      .from("order_items")
      .select("order_id, product_name, qty, unit_price, product_id")
      .in("product_id", ids);
    if (error) throw new Error(error.message);
    const orderIds = [...new Set((items ?? []).map((i) => i.order_id))];
    if (orderIds.length === 0) return [];
    const { data: orders, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("id, buyer_name, delivery_address, status, payment_status, created_at")
      .in("id", orderIds)
      .order("created_at", { ascending: false });
    if (oErr) throw new Error(oErr.message);
    return (orders ?? []).map((o) => {
      const mine = (items ?? []).filter((i) => i.order_id === o.id);
      return {
        orderId: o.id,
        buyerName: o.buyer_name,
        city: o.delivery_address ?? "",
        status: o.status,
        paymentStatus: o.payment_status,
        createdAt: o.created_at,
        items: mine.map((i) => ({ name: i.product_name, qty: i.qty, unitPrice: Number(i.unit_price) })),
        vendorTotal: mine.reduce((s, i) => s + Number(i.unit_price) * i.qty, 0),
      };
    });
  });

/** Moves an order to the next fulfilment step, only if it holds this vendor's products. */
export const advanceVendorOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertVendor(context as any);
    const ids = await myProductIds(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: owned } = await supabaseAdmin
      .from("order_items")
      .select("id")
      .eq("order_id", data.orderId)
      .in("product_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
      .limit(1);
    if (!owned?.length) throw new Error("This order doesn't include your products.");
    const { data: order } = await supabaseAdmin.from("orders").select("status").eq("id", data.orderId).single();
    const idx = ORDER_FLOW.indexOf((order?.status ?? "pending") as (typeof ORDER_FLOW)[number]);
    const next: string = ORDER_FLOW[Math.min(idx < 0 ? 1 : idx + 1, ORDER_FLOW.length - 1)] ?? "delivered";
    const { error } = await supabaseAdmin.from("orders").update({ status: next }).eq("id", data.orderId);
    if (error) throw new Error(error.message);
    return { status: next };
  });
