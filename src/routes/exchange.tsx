import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, MessageCircle, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  conditions,
  formatPrice,
  products,
  storageOptions,
  vendors,
} from "@/lib/marketplace-data";

export const Route = createFileRoute("/exchange")({
  head: () => ({
    meta: [
      { title: "Exchange Your Apple Device — Pay Only the Difference | AppleHub" },
      {
        name: "description",
        content:
          "Trade your current iPhone, iPad or MacBook for another model. See the price difference instantly and negotiate with verified vendors.",
      },
      { property: "og:title", content: "Exchange Apple products on AppleHub" },
      {
        property: "og:description",
        content: "Trade up and pay only the difference, with vendor counter-offers.",
      },
    ],
  }),
  component: ExchangePage,
});

function ExchangePage() {
  const [wantAmount, setWantAmount] = useState("");
  const [targetId, setTargetId] = useState(products[0]?.id ?? "");
  const [model, setModel] = useState("");
  const [storage, setStorage] = useState("");
  const [condition, setCondition] = useState("");
  const [battery, setBattery] = useState("90");
  const [details, setDetails] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [sent, setSent] = useState(false);

  const target = products.find((p) => p.id === targetId);
  const difference = useMemo(() => {
    const credit = Number(wantAmount || 0);
    return (target?.price ?? 0) - credit;
  }, [wantAmount, target]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim() || !storage || !condition || !wantAmount) {
      toast.error("Please complete your device details and asking value");
      return;
    }
    if (!agreed) {
      toast.error("Please accept the Terms & Conditions");
      return;
    }
    setSent(true);
    toast.success("Exchange request sent to matching vendors");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="max-w-2xl">
        <Badge variant="secondary" className="rounded-full">
          🔄 Exchange
        </Badge>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Exchange your Apple product</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tell us what your device is worth to you and which model you want instead. Vendors
          can accept, reject or counter — and you only pay the difference.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="space-y-6">
          <section className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Your exchange</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="want">How much do you want for your current phone?</Label>
                <Input
                  id="want"
                  className="mt-1.5"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="150000"
                  value={wantAmount}
                  onChange={(e) => setWantAmount(e.target.value)}
                />
              </div>
              <div>
                <Label>Which phone do you want to exchange it with?</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a listing" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter((p) => p.category !== "cases")
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} {p.storage}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Your current device</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="cmodel">Current phone model</Label>
                <Input
                  id="cmodel"
                  className="mt-1.5"
                  maxLength={80}
                  placeholder="iPhone 12 Pro"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
              <div>
                <Label>Storage capacity</Label>
                <Select value={storage} onValueChange={setStorage}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select storage" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bat">Battery health (%)</Label>
                <Input
                  id="bat"
                  className="mt-1.5"
                  inputMode="numeric"
                  maxLength={3}
                  value={battery}
                  onChange={(e) => setBattery(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="extra">Additional details</Label>
                <Textarea
                  id="extra"
                  className="mt-1.5"
                  maxLength={600}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Accessories, repairs, warranty, PTA status…"
                />
              </div>
            </div>
            <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground hover:bg-secondary">
              <Upload className="size-5" />
              Upload authentic, unedited product images
              <input type="file" accept="image/png,image/jpeg" multiple className="hidden" />
            </label>
          </section>

          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-0.5"
            />
            <span>
              I have read, understood, and agree to the Terms &amp; Conditions, and confirm
              the device details are accurate.
            </span>
          </label>

          <Button type="submit" size="lg">
            <RefreshCw className="size-4" /> Request exchange
          </Button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Price difference</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your device value</span>
                <span>{formatPrice(Number(wantAmount || 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{target?.name}</span>
                <span>{formatPrice(target?.price ?? 0)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-base font-semibold">
                <span>{difference >= 0 ? "You pay" : "Vendor pays you"}</span>
                <span className={difference >= 0 ? "" : "text-success"}>
                  {formatPrice(Math.abs(difference))}
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Estimated only. The final figure is confirmed after physical inspection.
            </p>
          </div>

          {sent && (
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <h2 className="font-semibold">Vendor responses</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {vendors.slice(0, 3).map((v, i) => (
                  <li key={v.id} className="rounded-xl surface-tint p-4">
                    <p className="font-medium">{v.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {i === 0
                        ? "Accepted your terms"
                        : `Counter-offer: pay ${formatPrice(Math.abs(difference) + i * 6000)}`}
                    </p>
                    <Button size="sm" variant="secondary" className="mt-3">
                      <MessageCircle className="size-3.5" /> Continue in chat
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
