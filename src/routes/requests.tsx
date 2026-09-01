import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HandCoins, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/marketplace-data";
import {
  acceptOffer,
  bidConditions,
  biddingCategories,
  createOffer,
  createRequest,
  listMyVisibleOffers,
  listRequests,
  type BuyerRequest,
  type RequestOffer,
} from "@/lib/bidding";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "Buyer Requests — Vendors Bid on Your Apple Device | AppleHub" },
      {
        name: "description",
        content:
          "Post the iPhone, iPad, MacBook or AirPods you want with your budget, and let verified AppleHub vendors send their best price. Accept the offer you like.",
      },
      { property: "og:title", content: "Buyer requests on AppleHub" },
      {
        property: "og:description",
        content: "Tell vendors what you want and compare their bids side by side.",
      },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const { user, displayName } = useAuth();
  const [category, setCategory] = useState("all");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["buyer-requests"],
    queryFn: listRequests,
  });

  const { data: offers = [] } = useQuery({
    queryKey: ["request-offers", user?.id ?? "anon"],
    queryFn: listMyVisibleOffers,
    enabled: Boolean(user),
  });

  const visible = useMemo(
    () => requests.filter((r) => category === "all" || r.category === category),
    [requests, category],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary" className="gap-1">
            <HandCoins className="h-3.5 w-3.5" /> Reverse bidding
          </Badge>
          <h1 className="mt-3 text-3xl font-bold">Buyer requests</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Buyers post the device they want with a budget. Vendors reply with their best
            price, and the buyer accepts the offer that suits them.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All devices</SelectItem>
              {biddingCategories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {user ? <NewRequestDialog buyerId={user.id} buyerName={displayName} /> : null}
          <Button asChild variant="outline">
            <Link to="/auctions">Live auctions</Link>
          </Button>
        </div>
      </header>

      {!user && (
        <div className="mt-6 rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
          <Link to="/auth" className="font-medium text-foreground underline">
            Sign in
          </Link>{" "}
          to post a request or send a vendor offer.
        </div>
      )}

      {isLoading ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading requests…</p>
      ) : visible.length === 0 ? (
        <div className="mt-10 rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No buyer requests in this category yet.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {visible.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              offers={offers.filter((o) => o.request_id === r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  request,
  offers,
}: {
  request: BuyerRequest;
  offers: RequestOffer[];
}) {
  const { user, displayName } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const isOwner = Boolean(user && request.buyer_id === user.id);
  const closed = request.status !== "open";

  const offerMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in to send an offer.");
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a valid price.");
      await createOffer({
        request_id: request.id,
        vendor_id: user.id,
        vendor_name: displayName,
        amount: value,
        message: message.trim().slice(0, 500) || null,
      });
    },
    onSuccess: () => {
      toast.success("Offer sent to the buyer.");
      setAmount("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["request-offers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const acceptMutation = useMutation({
    mutationFn: (offerId: string) => acceptOffer(offerId, request.id),
    onSuccess: () => {
      toast.success("Offer accepted — the vendor will be notified.");
      queryClient.invalidateQueries({ queryKey: ["request-offers"] });
      queryClient.invalidateQueries({ queryKey: ["buyer-requests"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <article className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold leading-tight">{request.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {request.model ?? "Any model"} · {request.storage ?? "Any storage"} ·{" "}
            {request.condition_pref ?? "Any condition"}
          </p>
        </div>
        <Badge variant={closed ? "outline" : "secondary"}>
          {closed ? "Matched" : "Open"}
        </Badge>
      </div>

      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" /> {request.city} · posted by {request.buyer_name}
      </p>

      <div>
        <p className="text-xs text-muted-foreground">Budget up to</p>
        <p className="text-xl font-bold">{formatPrice(Number(request.max_budget))}</p>
      </div>

      {request.notes ? (
        <p className="text-sm text-muted-foreground">{request.notes}</p>
      ) : null}

      {offers.length > 0 && (
        <div className="rounded-xl border bg-background/60 p-3">
          <p className="text-xs font-medium">
            {isOwner ? "Vendor offers" : "Your offer"}
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {offers.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {o.vendor_name ?? "Vendor"} — {formatPrice(Number(o.amount))}
                  {o.status === "accepted" ? " · accepted" : ""}
                </span>
                {isOwner && o.status !== "accepted" && !closed ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acceptMutation.mutate(o.id)}
                    disabled={acceptMutation.isPending}
                  >
                    Accept
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {user && !isOwner && !closed && (
        <div className="mt-auto space-y-2 pt-2">
          <div className="flex gap-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Your price (PKR)"
              aria-label={`Offer price for ${request.title}`}
            />
            <Button onClick={() => offerMutation.mutate()} disabled={offerMutation.isPending}>
              Send offer
            </Button>
          </div>
          <Input
            value={message}
            maxLength={500}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Short note (condition, warranty, pickup)"
            aria-label="Offer note"
          />
        </div>
      )}
    </article>
  );
}

function NewRequestDialog({ buyerId, buyerName }: { buyerId: string; buyerName: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "iphone",
    model: "",
    storage: "128GB",
    condition_pref: "Excellent",
    max_budget: "",
    city: "Lahore",
    notes: "",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const budget = Number(form.max_budget);
      if (form.title.trim().length < 3) throw new Error("Describe what you are looking for.");
      if (!Number.isFinite(budget) || budget <= 0) throw new Error("Enter a valid budget.");
      await createRequest({
        buyer_id: buyerId,
        buyer_name: buyerName,
        title: form.title.trim().slice(0, 120),
        category: form.category,
        model: form.model.trim().slice(0, 80) || null,
        storage: form.storage,
        condition_pref: form.condition_pref,
        max_budget: budget,
        city: form.city.trim().slice(0, 60) || "Lahore",
        notes: form.notes.trim().slice(0, 1000) || null,
      });
    },
    onSuccess: () => {
      toast.success("Request posted — vendors can bid now.");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["buyer-requests"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Post request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tell vendors what you want</DialogTitle>
          <DialogDescription>
            Vendors send their best price and you accept the one you prefer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="r-title">What are you looking for?</Label>
            <Input
              id="r-title"
              value={form.title}
              maxLength={120}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Looking for iPhone 14 128GB"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Device</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {biddingCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Minimum condition</Label>
              <Select
                value={form.condition_pref}
                onValueChange={(v) => set("condition_pref", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bidConditions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-model">Model</Label>
              <Input
                id="r-model"
                value={form.model}
                maxLength={80}
                onChange={(e) => set("model", e.target.value)}
                placeholder="iPhone 14"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-storage">Storage</Label>
              <Input
                id="r-storage"
                value={form.storage}
                maxLength={20}
                onChange={(e) => set("storage", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-budget">Max budget (PKR)</Label>
              <Input
                id="r-budget"
                type="number"
                value={form.max_budget}
                onChange={(e) => set("max_budget", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-city">City</Label>
              <Input
                id="r-city"
                value={form.city}
                maxLength={60}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-notes">Notes</Label>
            <Textarea
              id="r-notes"
              value={form.notes}
              maxLength={1000}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="PTA approved only, battery above 90%…"
            />
          </div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Post request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
