import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Auction = Database["public"]["Tables"]["auctions"]["Row"];
export type Bid = Database["public"]["Tables"]["bids"]["Row"];
export type BuyerRequest = Database["public"]["Tables"]["buyer_requests"]["Row"];
export type RequestOffer = Database["public"]["Tables"]["request_offers"]["Row"];

export const biddingCategories = [
  { value: "iphone", label: "iPhone" },
  { value: "ipad", label: "iPad" },
  { value: "macbook", label: "MacBook" },
  { value: "airpods", label: "AirPods / iPods" },
  { value: "watch", label: "Apple Watch" },
];

export const bidConditions = ["New", "Like New", "Excellent", "Good", "Fair"];

export async function listAuctions(): Promise<Auction[]> {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .order("ends_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listBids(auctionId: string): Promise<Bid[]> {
  const { data, error } = await supabase
    .from("bids")
    .select("*")
    .eq("auction_id", auctionId)
    .order("amount", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function placeBid(input: {
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
}) {
  const { error } = await supabase.from("bids").insert({
    auction_id: input.auctionId,
    bidder_id: input.bidderId,
    bidder_name: input.bidderName,
    amount: input.amount,
  });
  if (error) throw error;
}

export async function createAuction(
  input: Database["public"]["Tables"]["auctions"]["Insert"],
) {
  const { error } = await supabase.from("auctions").insert(input);
  if (error) throw error;
}

export async function listRequests(): Promise<BuyerRequest[]> {
  const { data, error } = await supabase
    .from("buyer_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRequest(
  input: Database["public"]["Tables"]["buyer_requests"]["Insert"],
) {
  const { error } = await supabase.from("buyer_requests").insert(input);
  if (error) throw error;
}

export async function listMyVisibleOffers(): Promise<RequestOffer[]> {
  const { data, error } = await supabase
    .from("request_offers")
    .select("*")
    .order("amount", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createOffer(
  input: Database["public"]["Tables"]["request_offers"]["Insert"],
) {
  const { error } = await supabase.from("request_offers").insert(input);
  if (error) throw error;
}

export async function acceptOffer(offerId: string, requestId: string) {
  const { error } = await supabase
    .from("request_offers")
    .update({ status: "accepted" })
    .eq("id", offerId);
  if (error) throw error;
  const { error: reqError } = await supabase
    .from("buyer_requests")
    .update({ status: "matched" })
    .eq("id", requestId);
  if (reqError) throw reqError;
}

export function timeLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins % 60}m left`;
  return `${mins}m left`;
}
