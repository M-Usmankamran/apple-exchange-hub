import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { iphoneModels, storageSizes } from "@/lib/form-options";

const conditions = ["New", "Like New", "Excellent", "Good", "Fair"];
const MAX_PICS = 4;

/** Resize a picture in the browser to a small JPEG so it can be stored with the listing. */
function toJpeg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error("Use JPG, PNG or WEBP pictures"));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("Each picture must be under 8 MB"));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => reject(new Error("Could not read that picture"));
    img.src = url;
  });
}

export function AddProductDialog({ children }: { children: ReactNode }) {
  const { user, displayName } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [storage, setStorage] = useState("");
  const [condition, setCondition] = useState("");
  const [pics, setPics] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setPhone(""); setStorage(""); setCondition(""); setPics([]); setPrice(""); setDescription(""); };

  async function addPics(files: FileList | null) {
    if (!files) return;
    try {
      const room = MAX_PICS - pics.length;
      const next = await Promise.all(Array.from(files).slice(0, room).map(toJpeg));
      setPics((p) => [...p, ...next]);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const amount = Number(price);
    if (!phone || !storage || !condition) return toast.error("Choose the phone, storage and condition");
    if (pics.length === 0) return toast.error("Add at least one picture of the phone");
    if (!(amount > 0)) return toast.error("Enter a valid price");
    if (!description.trim()) return toast.error("Add a description");
    setSaving(true);
    const { data: prof } = await supabase.from("profiles").select("shop_name, city").eq("id", user.id).maybeSingle();
    const { error } = await supabase.from("vendor_products").insert({
      vendor_id: user.id,
      vendor_name: prof?.shop_name || displayName || "AppleHub Vendor",
      title: `${phone} ${storage}`,
      category: "iphone",
      model: phone,
      storage,
      condition,
      city: prof?.city || "Lahore",
      price: amount,
      stock: 1,
      image_url: pics[0] ?? null,
      image_urls: pics,
      description: description.trim().slice(0, 1000),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Listing published to your shop");
    qc.invalidateQueries({ queryKey: ["my-products"] });
    qc.invalidateQueries({ queryKey: ["vendor-products"] });
    reset();
    setOpen(false);
    return undefined;
  }

  const pick = (value: string, onChange: (v: string) => void, opts: readonly string[], ph: string) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={ph} /></SelectTrigger>
      <SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Add new listing</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label>Phone</Label>{pick(phone, setPhone, iphoneModels, "Select phone")}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Storage</Label>{pick(storage, setStorage, storageSizes, "Storage")}</div>
            <div className="space-y-2"><Label>Condition</Label>{pick(condition, setCondition, conditions, "Condition")}</div>
          </div>
          <div className="space-y-2">
            <Label>Pictures of the phone (up to {MAX_PICS})</Label>
            <div className="grid grid-cols-4 gap-2">
              {pics.map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg border">
                  <img src={src} alt={`Picture ${i + 1}`} className="size-full object-cover" />
                  <button type="button" aria-label="Remove picture" onClick={() => setPics((p) => p.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5"><X className="size-3" /></button>
                </div>
              ))}
              {pics.length < MAX_PICS && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed text-muted-foreground hover:bg-secondary">
                  <ImagePlus className="size-5" />
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                    onChange={(e) => { void addPics(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Price (PKR)</Label>
            <Input inputMode="numeric" value={price} placeholder="350000" onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 9))} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} maxLength={1000} placeholder="Battery health, box, accessories, PTA status…" onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Publish listing
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
