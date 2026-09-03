import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock3, CreditCard, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { getOrder } from "@/lib/payments.functions";

export const Route = createFileRoute("/order/$id")({
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getOrder);
  const [result, setResult] = useState<Awaited<ReturnType<typeof fetchOrder>> | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    void fetchOrder({ data: { orderId: id } })
      .then(setResult)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Unable to load order"));
  }, [fetchOrder, id]);

  if (error) {
    return <Message title="We couldn't load this order" body={error} />;
  }
  if (!result) {
    return <Message title="Loading your order…" body="Retrieving the latest payment status." />;
  }
  if (!result.order) {
    return <Message title="Order not found" body="This order is not available for your account." />;
  }

  const status = result.order.payment_status;
  const paid = status === "paid";
  const failed = status === "failed";
  const pending = !paid && !failed;
  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <div className="flex items-center gap-3">
        {paid ? <CheckCircle2 className="size-9 text-emerald-600" /> : failed ? <XCircle className="size-9 text-destructive" /> : <Clock3 className="size-9 text-primary" />}
        <div>
          <p className="text-sm text-muted-foreground">AppleHub order</p>
          <h1 className="text-2xl font-bold">{paid ? "Payment confirmed" : failed ? "Payment not completed" : pending ? "Payment processing" : "Order reserved"}</h1>
        </div>
      </div>
      <section className="mt-8 rounded-2xl border bg-card p-6 shadow-soft">
        <div className="flex justify-between gap-4 border-b pb-4">
          <span className="text-sm text-muted-foreground">Order reference</span>
          <span className="font-mono text-sm">{result.order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="mt-4 space-y-3">
          {result.items.map((item) => (
            <div className="flex justify-between gap-4 text-sm" key={item.id}>
              <span className="text-muted-foreground">{item.qty} × {item.product_name}</span>
              <span>{Number(item.unit_price * item.qty).toLocaleString("en-PK")} PKR</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-between border-t pt-4 font-semibold">
          <span>Total</span>
          <span>{Number(result.order.total_amount).toLocaleString("en-PK")} {result.order.currency}</span>
        </div>
        {result.order.gateway_response_message ? (
          <p className="mt-5 rounded-lg bg-secondary p-3 text-sm text-muted-foreground">{result.order.gateway_response_message}</p>
        ) : null}
      </section>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild><Link to="/shop">Continue shopping</Link></Button>
        <Button asChild variant="outline"><Link to="/dashboard/user">View dashboard</Link></Button>
      </div>
    </main>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <CreditCard className="mx-auto size-10 text-muted-foreground" />
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{body}</p>
      <Button asChild className="mt-6"><Link to="/shop">Back to shop</Link></Button>
    </main>
  );
}
