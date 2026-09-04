import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Palette, Sparkles, Type as TypeIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/marketplace-data";
import { useCart } from "@/lib/cart";
import caseImage from "@/assets/customize-case.jpg";

export const Route = createFileRoute("/customize")({
  head: () => ({
    meta: [
      { title: "Customization Studio — Design Your Own Apple Case | AppleHub" },
      {
        name: "description",
        content:
          "Design a custom iPhone case with your own colours, text, patterns and finish, and preview it live before you order.",
      },
      { property: "og:title", content: "Design your own Apple case" },
      {
        property: "og:description",
        content: "Live preview customization studio for cases, skins and accessories.",
      },
    ],
  }),
  component: CustomizePage,
});

const models = ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 14", "iPhone 13"];
const finishes = [
  { id: "matte", name: "Matte silicone", price: 4900 },
  { id: "clear", name: "Clear hard shell", price: 5400 },
  { id: "leather", name: "Vegan leather", price: 8900 },
];
const palette = ["#1d1d1f", "#0071e3", "#f5f5f7", "#c9a227", "#b4413c", "#3f7d58"];
const patterns = ["None", "Gradient", "Marble", "Dots", "Stripes"];

function CustomizePage() {
  const { add } = useCart();
  const [model, setModel] = useState(models[0]!);
  const [finish, setFinish] = useState(finishes[0]!);
  const [color, setColor] = useState(palette[1]!);
  const [pattern, setPattern] = useState(patterns[1]!);
  const [text, setText] = useState("Usman");
  const [size, setSize] = useState(28);
  const [magsafe, setMagsafe] = useState(true);

  const total = finish.price + (magsafe ? 1200 : 0) + (text.trim() ? 700 : 0);

  const background =
    pattern === "Gradient"
      ? `linear-gradient(150deg, ${color}, #ffffff33)`
      : pattern === "Marble"
        ? `radial-gradient(circle at 30% 20%, #ffffff66, ${color} 60%)`
        : pattern === "Dots"
          ? `radial-gradient(${color} 22%, transparent 23%) 0 0/22px 22px, #ffffff`
          : pattern === "Stripes"
            ? `repeating-linear-gradient(45deg, ${color} 0 12px, #ffffff 12px 24px)`
            : color;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="max-w-2xl">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3.5 w-3.5" /> Customization Studio
        </Badge>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Design it your way</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Pick a model and finish, choose colours and patterns, add your name and watch the
          preview update instantly. Printed and dispatched within 48 hours.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-3xl border bg-gradient-to-b from-muted/40 to-card p-6 shadow-sm sm:p-8">
          <PhonePreview3D
            caseBackground={background}
            color={color}
            model={model}
            finish={finish.name}
            text={text}
            textSize={size}
            magsafe={magsafe}
          />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {model} · {finish.name} · {pattern}
          </p>
        </div>


        <aside className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label>Device</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Finish</Label>
            <div className="grid gap-2">
              {finishes.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFinish(f)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
                    finish.id === f.id ? "border-primary bg-primary/5 font-medium" : "hover:bg-accent"
                  }`}
                >
                  <span>{f.name}</span>
                  <span className="text-muted-foreground">{formatPrice(f.price)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" /> Colour
            </Label>
            <div className="flex gap-2">
              {palette.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Colour ${c}`}
                  onClick={() => setColor(c)}
                  style={{ background: c }}
                  className={`h-8 w-8 rounded-full border-2 ${
                    color === c ? "border-primary" : "border-border"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pattern</Label>
            <div className="flex flex-wrap gap-2">
              {patterns.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPattern(p)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    pattern === p ? "border-primary bg-primary/5 font-medium" : "hover:bg-accent"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctext" className="flex items-center gap-2">
              <TypeIcon className="h-4 w-4" /> Custom text
            </Label>
            <Input
              id="ctext"
              value={text}
              maxLength={16}
              onChange={(e) => setText(e.target.value)}
              placeholder="Your name"
            />
            <div className="pt-2">
              <Label className="text-xs text-muted-foreground">Text size {size}px</Label>
              <Slider
                value={[size]}
                min={14}
                max={44}
                step={2}
                onValueChange={(v) => setSize(v[0] ?? 28)}
                className="mt-2"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMagsafe((m) => !m)}
            className={`w-full rounded-xl border px-3 py-2 text-sm transition-colors ${
              magsafe ? "border-primary bg-primary/5 font-medium" : "hover:bg-accent"
            }`}
          >
            MagSafe magnet ring {magsafe ? "included" : "not included"} · +{formatPrice(1200)}
          </button>

          <div className="rounded-xl bg-muted/60 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-semibold">{formatPrice(total)}</span>
            </div>
            <Button
              className="mt-4 w-full"
              onClick={() => {
                add(
                  {
                    id: `custom-${Date.now()}`,
                    name: `Custom ${finish.name} case`,
                    vendorId: "v-lumen",
                    price: total,
                    meta: `${model} · ${pattern}${text.trim() ? ` · “${text}”` : ""}`,
                  },
                  1,
                );
                toast.success("Custom design added to cart");
              }}
            >
              Add design to cart
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
