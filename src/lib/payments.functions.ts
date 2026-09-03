import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  price: z.number().finite().min(0).max(100_000_000),
  qty: z.number().int().min(1).max(50),
  vendor: z.string().max(200).optional(),
  image: z.string().max(2048).optional(),
});

const checkoutSchema = z.object({
  method: z.enum(["online", "store"]),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(255),
  address: z.string().trim().max(300).optional(),
  items: z.array(itemSchema).min(1).max(30),
});

export type CheckoutResult =
  | { kind: "reserved"; orderId: string }
  | { kind: "redirect"; orderId: string; postUrl: string; fields: Record<string, string> }
  | { kind: "unavailable"; orderId: string; reason: string };

/**
 * Creates a real order row, then either reserves it for in-store payment or
 * builds a signed JazzCash hosted-checkout payload for the browser to post.
 */
export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const { supabase, userId } = context;

    const total = data.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    if (!(total > 0)) throw new Error("Order total must be greater than zero");
    if (data.method === "store" && !data.address) {
      // address optional for store collection
    }

    const txnRef = `T${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        buyer_id: userId,
        buyer_name: data.name,
        buyer_phone: data.phone,
        buyer_email: data.email,
        delivery_address: data.address ?? null,
        payment_method: data.method,
        total_amount: total,
        currency: "PKR",
        status: data.method === "store" ? "reserved" : "pending",
        payment_status: data.method === "store" ? "pay_on_collection" : "unpaid",
        gateway: data.method === "store" ? null : "jazzcash",
        gateway_txn_ref: data.method === "store" ? null : txnRef,
      })
      .select("id")
      .single();

    if (error || !order) throw new Error(error?.message ?? "Could not create the order");

    const { error: itemsError } = await supabase.from("order_items").insert(
      data.items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        unit_price: i.price,
        qty: i.qty,
        vendor_name: i.vendor ?? null,
        image_url: i.image ?? null,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);

    if (data.method === "store") {
      return { kind: "reserved", orderId: order.id };
    }

    const { getJazzCashConfig, buildCheckoutFields } = await import("./jazzcash.server");
    const config = getJazzCashConfig();
    if (!config) {
      return {
        kind: "unavailable",
        orderId: order.id,
        reason:
          "Online payment is not configured yet. Your order is saved — choose 'Pay at store' or try again later.",
      };
    }

    const origin = new URL(getRequest().url).origin;
    const fields = buildCheckoutFields({
      config,
      txnRef,
      amount: total,
      description: `AppleHub order ${order.id.slice(0, 8)}`,
      billReference: `AH${order.id.replace(/-/g, "").slice(0, 18)}`,
      returnUrl: `${origin}/api/public/payments/jazzcash/return`,
    });

    return { kind: "redirect", orderId: order.id, postUrl: config.postUrl, fields };
  });

const orderIdSchema = z.object({ orderId: z.string().uuid() });

export const getOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => orderIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select(
        "id, total_amount, currency, status, payment_status, payment_method, gateway_response_message, gateway_retrieval_ref, created_at, paid_at",
      )
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;

    const { data: items } = await context.supabase
      .from("order_items")
      .select("id, product_name, unit_price, qty, vendor_name")
      .eq("order_id", data.orderId);

    return { order, items: items ?? [] };
  });
