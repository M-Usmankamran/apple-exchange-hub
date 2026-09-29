import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/marketplace-data";

export function VendorProductsGrid() {
  const q = useQuery({
    queryKey: ["vendor-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_products")
        .select("id,title,vendor_name,storage,condition,city,price,image_url,stock")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return data;
    },
  });
  if (!q.data?.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold">New from vendors</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.data.map((p) => (
          <div key={p.id} className="flex flex-col rounded-2xl border bg-card p-4 shadow-sm">
            {p.image_url && <img src={p.image_url} alt={p.title} loading="lazy" className="mb-3 aspect-square w-full rounded-xl object-cover" />}
            <p className="font-medium">{p.title}</p>
            <p className="text-xs text-muted-foreground">
              {[p.storage, p.condition, p.city].filter(Boolean).join(" · ")} · by {p.vendor_name}
            </p>
            <p className="mt-2 font-semibold">{formatPrice(Number(p.price))}</p>
            <p className="text-xs text-muted-foreground">{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</p>
            <Button asChild size="sm" variant="secondary" className="mt-3">
              <Link to="/messages" search={{ product: p.id }}>
                <MessageCircle className="size-4" /> Message vendor
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
