import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, vendorById, type Product } from "@/lib/marketplace-data";

export function ProductCard({ product }: { product: Product }) {
  const vendor = vendorById(product.vendorId);

  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="lift group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft"
    >
      <div className="relative aspect-[4/3] overflow-hidden surface-tint">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge className="absolute left-3 top-3" variant="secondary">
          {product.condition}
        </Badge>
        {product.stock >= 6 && (
          <Badge className="absolute right-3 top-3">Bulk 6+</Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-semibold leading-tight">{product.name}</h3>
        <p className="text-xs text-muted-foreground">
          {product.storage} &middot; {product.color}
          {product.batteryHealth ? ` · Battery ${product.batteryHealth}%` : ""}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="text-base font-semibold">{formatPrice(product.price)}</p>
            {product.originalPrice && (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p className="flex items-center justify-end gap-1">
              <Star className="size-3 fill-warning text-warning" />
              {product.rating}
            </p>
            <p className="flex items-center justify-end gap-1">
              <MapPin className="size-3" />
              {product.distanceKm} km
            </p>
          </div>
        </div>
        <p className="truncate text-xs text-muted-foreground">{vendor?.name}</p>
      </div>
    </Link>
  );
}
