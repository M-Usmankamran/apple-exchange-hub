import { useEffect, useState } from "react";
import { vendors as baseVendors, type Vendor } from "@/lib/marketplace-data";

/**
 * Stores the vendors an admin has approved so they appear on the public
 * "Vendors near you" directory alongside the founding stores.
 */
const KEY = "applehub_approved_vendors";
const EVENT = "applehub:vendors-changed";

export type ApprovedVendorInput = {
  id: string;
  shop: string;
  owner: string;
  city: string;
  phone?: string;
};

function read(): Vendor[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Vendor[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: Vendor[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function approvedVendors(): Vendor[] {
  return read();
}

export function allVendors(): Vendor[] {
  const approved = read();
  const extra = approved.filter((v) => !baseVendors.some((b) => b.id === v.id));
  return [...baseVendors, ...extra];
}

/** Turn an approved application into a live storefront entry. */
export function approveVendorStore(input: ApprovedVendorInput): Vendor {
  const vendor: Vendor = {
    id: `store-${input.id}`,
    name: input.shop,
    owner: input.owner,
    city: input.city,
    area: "Newly approved store",
    distanceKm: Number((2 + Math.random() * 6).toFixed(1)),
    rating: 5,
    reviews: 0,
    products: 0,
    verified: true,
    since: String(new Date().getFullYear()),
    pickup: true,
    riderPickup: true,
    tagline: `${input.shop} — verified by AppleHub admins${input.phone ? ` · ${input.phone}` : ""}.`,
  };
  const next = read().filter((v) => v.id !== vendor.id);
  write([...next, vendor]);
  return vendor;
}

/** Remove a store again (rejection or revoked approval). */
export function removeVendorStore(applicationId: string) {
  write(read().filter((v) => v.id !== `store-${applicationId}`));
}

export function useVendorDirectory(): Vendor[] {
  const [list, setList] = useState<Vendor[]>(baseVendors);

  useEffect(() => {
    const sync = () => setList(allVendors());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return list;
}
