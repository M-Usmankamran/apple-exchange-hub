import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gavel, Clock, MapPin, Plus } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/marketplace-data";
import {
  bidConditions,
  biddingCategories,
  createAuction,
  listAuctions,
  listBids,
  placeBid,
  timeLeft,
  type Auction,
} from "@/lib/bidding";

export const Route = createFileRoute("/auctions")({
  head: () => ({
    meta: [
      { title: "Live Apple Auctions — Bid on iPhone, MacBook & iPad | AppleHub" },
      {
        name: "description",
        content:
          "Bid live on verified iPhone, iPad, MacBook, AirPods and Apple Watch auctions from AppleHub vendors. Real-time bids, minimum increments and city filters.",
      },
      { property: "og:title", content: "Live Apple auctions on AppleHub" },
      {
        property: "og:description",
        content: "Place real-time bids on verified Apple devices from local vendors.",
      },
    ],
  }),
  component: AuctionsPage,
});

function AuctionsPage() {
  const { user, displayName } = useAuth();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("all");
  const [, setTick] = useState(0);

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ["auctions"],
    queryFn: listAuctions,
  });

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("auctions-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "auctions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["auctions"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bids" }, () => {
        queryClient.invalidateQueries({ queryKey: ["auctions"] });
        queryClient.invalidateQueries({ queryKey: ["bids"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const visible = useMemo(
    () => auctions.filter((a) => category === "all" || a.category === category),
    [auctions, category],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary" className="gap-1">
            <Gavel className="h-3.5 w-3.5" /> Live bidding
          </Badge>
          <h1 className="mt-3 text-3xl font-bold">Apple auctions</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Vendors list iPhones, iPads, MacBooks, AirPods and Watches with a starting price
            and a closing time. Bids update live for everyone watching.
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
          {user ? <NewAuctionDialog vendorName={displayName} vendorId={user.id} /> : null}
          <Button asChild variant="outline">
            <Link to="/requests">Buyer requests</Link>
          </Button>
        </div>
      </header>

      {!user && (
        <div className="mt-6 rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
          <Link to="/auth" className="font-medium text-foreground underline">
            Sign in
          </Link>{" "}
          to place bids or list your own auction.
        </div>
      )}

      {isLoading ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading auctions…</p>
      ) : visible.length === 0 ? (
        <div className="mt-10 rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No auctions in this category yet.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((a) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  const { user, displayName } = useAuth();
  const queryClient = useQueryClient();
  const minBid = Number(auction.current_price) + Number(auction.bid_increment);
  const [amount, setAmount] = useState(String(minBid));
  const ended = auction.status !== "live" || new Date(auction.ends_at).getTime() <= Date.now();

  const { data: bids = [] } = useQuery({
    queryKey: ["bids", auction.id],
    queryFn: () => listBids(auction.id),
  });

  const bidMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in to bid.");
      const value = Number(amount);
      if (!Number.isFinite(value) || value < minBid) {
        throw new Error(`Bid must be at least ${formatPrice(minBid)}.`);
      }
      await placeBid({
        auctionId: auction.id,
        bidderId: user.id,
        bidderName: displayName,
        amount: value,
      });
    },
    onSuccess: () => {
      toast.success("Bid placed — you are the highest bidder.");
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      queryClient.invalidateQueries({ queryKey: ["bids", auction.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft">
      {auction.image_url ? (
        <img
          src={auction.image_url}
          alt={auction.title}
          loading="lazy"
          className="h-44 w-full object-cover"
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold leading-tight">{auction.title}</h2>
          <Badge variant={ended ? "outline" : "secondary"} className="shrink-0 gap-1">
            <Clock className="h-3 w-3" /> {ended ? "Ended" : timeLeft(auction.ends_at)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {auction.condition} · {auction.storage ?? "—"} · {auction.vendor_name}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {auction.city}
        </p>
        <div>
          <p className="text-xs text-muted-foreground">Current bid</p>
          <p className="text-xl font-bold">{formatPrice(Number(auction.current_price))}</p>
          <p className="text-xs text-muted-foreground">
            {bids.length} bid{bids.length === 1 ? "" : "s"} · next bid {formatPrice(minBid)}
          </p>
        </div>

        {bids.length > 0 && (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {bids.slice(0, 3).map((b) => (
              <li key={b.id} className="flex justify-between">
                <span>{b.bidder_name ?? "Bidder"}</span>
                <span>{formatPrice(Number(b.amount))}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex gap-2 pt-2">
          <Input
            type="number"
            min={minBid}
            step={Number(auction.bid_increment)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label={`Bid amount for ${auction.title}`}
            disabled={ended || !user}
          />
          <Button
            onClick={() => bidMutation.mutate()}
            disabled={ended || !user || bidMutation.isPending}
          >
            Bid
          </Button>
        </div>
      </div>
    </article>
  );
}

function NewAuctionDialog({ vendorId, vendorName }: { vendorId: string; vendorName: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "iphone",
    model: "",
    storage: "256GB",
    condition: "Excellent",
    city: "Lahore",
    image_url: "",
    description: "",
    start_price: "",
    bid_increment: "1000",
    days: "3",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const start = Number(form.start_price);
      if (form.title.trim().length < 3) throw new Error("Add a clear auction title.");
      if (!Number.isFinite(start) || start <= 0) throw new Error("Enter a valid start price.");
      const days = Math.min(Math.max(Number(form.days) || 3, 1), 14);
      await createAuction({
        vendor_id: vendorId,
        vendor_name: vendorName,
        title: form.title.trim().slice(0, 120),
        category: form.category,
        model: form.model.trim().slice(0, 80) || null,
        storage: form.storage,
        condition: form.condition,
        city: form.city.trim().slice(0, 60) || "Lahore",
        image_url: form.image_url.trim().slice(0, 500) || null,
        description: form.description.trim().slice(0, 1000) || null,
        start_price: start,
        current_price: start,
        bid_increment: Number(form.bid_increment) || 1000,
        ends_at: new Date(Date.now() + days * 86400000).toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Auction is live.");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> List auction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List a device for auction</DialogTitle>
          <DialogDescription>
            Buyers bid until the closing time. The highest bid wins.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="a-title">Title</Label>
            <Input
              id="a-title"
              value={form.title}
              maxLength={120}
              onChange={(e) => set("title", e.target.value)}
              placeholder="iPhone 15 Pro 256GB"
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
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
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
              <Label htmlFor="a-storage">Storage</Label>
              <Input
                id="a-storage"
                value={form.storage}
                maxLength={20}
                onChange={(e) => set("storage", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-city">City</Label>
              <Input
                id="a-city"
                value={form.city}
                maxLength={60}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-start">Start price (PKR)</Label>
              <Input
                id="a-start"
                type="number"
                value={form.start_price}
                onChange={(e) => set("start_price", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-inc">Min bid step</Label>
              <Input
                id="a-inc"
                type="number"
                value={form.bid_increment}
                onChange={(e) => set("bid_increment", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-days">Runs for (days)</Label>
              <Input
                id="a-days"
                type="number"
                min={1}
                max={14}
                value={form.days}
                onChange={(e) => set("days", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-img">Photo URL</Label>
              <Input
                id="a-img"
                value={form.image_url}
                maxLength={500}
                onChange={(e) => set("image_url", e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-desc">Description</Label>
            <Textarea
              id="a-desc"
              value={form.description}
              maxLength={1000}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Battery health, accessories, warranty…"
            />
          </div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Start auction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
