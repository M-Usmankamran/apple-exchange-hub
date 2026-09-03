import { createFileRoute } from "@tanstack/react-router";
import {
  getJazzCashConfig,
  verifySecureHash,
  classifyResponse,
} from "@/lib/jazzcash.server";

/**
 * JazzCash posts the payment result back here as a form submission.
 * The secure hash is verified before the order is marked paid.
 */
async function handleReturn(request: Request): Promise<Response> {
  const config = getJazzCashConfig();
  if (!config) return new Response("Gateway not configured", { status: 503 });

  const fields: Record<string, string> = {};
  if (request.method === "POST") {
    const form = await request.formData();
    for (const [k, v] of form.entries()) fields[k] = typeof v === "string" ? v : "";
  } else {
    new URL(request.url).searchParams.forEach((v, k) => {
      fields[k] = v;
    });
  }

  const txnRef = fields["pp_TxnRefNo"] ?? "";
  if (!txnRef) return new Response("Missing transaction reference", { status: 400 });

  if (!verifySecureHash(fields, config.salt)) {
    console.error(`JazzCash return with invalid secure hash for txn ${txnRef}`);
    return new Response("Invalid secure hash", { status: 401 });
  }

  const code = fields["pp_ResponseCode"] ?? "";
  const message = fields["pp_ResponseMessage"] ?? "";
  const outcome = classifyResponse(code);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .update({
      payment_status: outcome === "paid" ? "paid" : outcome,
      status: outcome === "paid" ? "confirmed" : outcome === "pending" ? "pending" : "failed",
      gateway_response_code: code,
      gateway_response_message: message.slice(0, 500),
      gateway_retrieval_ref: fields["pp_RetreivalReferenceNo"] ?? null,
      paid_at: outcome === "paid" ? new Date().toISOString() : null,
    })
    .eq("gateway_txn_ref", txnRef)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(`JazzCash return update failed for txn ${txnRef}: ${error.message}`);
    return new Response("Could not record payment", { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const target = order
    ? `${origin}/order/${order.id}?payment=${outcome}`
    : `${origin}/dashboard/user?payment=${outcome}`;
  return new Response(null, { status: 303, headers: { Location: target } });
}

export const Route = createFileRoute("/api/public/payments/jazzcash/return")({
  server: {
    handlers: {
      POST: async ({ request }) => handleReturn(request),
      GET: async ({ request }) => handleReturn(request),
    },
  },
});
