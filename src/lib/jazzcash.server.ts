import { createHmac, timingSafeEqual } from "crypto";

/**
 * JazzCash Page Redirection (Hosted Checkout) helpers.
 * Server-only: reads merchant credentials from the server environment.
 */

export type JazzCashConfig = {
  merchantId: string;
  password: string;
  salt: string;
  live: boolean;
  postUrl: string;
};

const SANDBOX_URL =
  "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform";
const LIVE_URL =
  "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform";

export function getJazzCashConfig(): JazzCashConfig | null {
  const merchantId = process.env["JAZZCASH_MERCHANT_ID"];
  const password = process.env["JAZZCASH_PASSWORD"];
  const salt = process.env["JAZZCASH_INTEGRITY_SALT"];
  if (!merchantId || !password || !salt) return null;
  const live = (process.env["JAZZCASH_ENVIRONMENT"] ?? "sandbox").toLowerCase() === "live";
  return {
    merchantId,
    password,
    salt,
    live,
    postUrl: live ? LIVE_URL : SANDBOX_URL,
  };
}

/** JazzCash timestamps are Pakistan Standard Time (UTC+5), format yyyyMMddHHmmss. */
export function pktStamp(date: Date): string {
  const pkt = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return (
    `${pkt.getUTCFullYear()}${p(pkt.getUTCMonth() + 1)}${p(pkt.getUTCDate())}` +
    `${p(pkt.getUTCHours())}${p(pkt.getUTCMinutes())}${p(pkt.getUTCSeconds())}`
  );
}

/**
 * Secure hash = HMAC-SHA256 over "salt&v1&v2&..." where the values are the
 * non-empty pp_*/ppmpf_* fields sorted by field name (case-insensitive).
 */
export function secureHash(fields: Record<string, string>, salt: string): string {
  const values = Object.keys(fields)
    .filter((k) => /^(pp_|ppmpf_)/i.test(k) && k.toLowerCase() !== "pp_securehash")
    .filter((k) => fields[k] !== undefined && fields[k] !== null && fields[k] !== "")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((k) => fields[k]);
  const message = [salt, ...values].join("&");
  return createHmac("sha256", salt).update(message, "utf8").digest("hex").toUpperCase();
}

export function verifySecureHash(fields: Record<string, string>, salt: string): boolean {
  const provided = (fields["pp_SecureHash"] ?? fields["pp_securehash"] ?? "").toUpperCase();
  if (!provided) return false;
  const expected = secureHash(fields, salt);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

/** Amount is sent in the lowest denomination (paisa) with no separators. */
export function toPaisa(amount: number): string {
  return String(Math.round(amount * 100));
}

export function buildCheckoutFields(input: {
  config: JazzCashConfig;
  txnRef: string;
  amount: number;
  description: string;
  billReference: string;
  returnUrl: string;
  now?: Date;
  expiryMinutes?: number;
}): Record<string, string> {
  const now = input.now ?? new Date();
  const expiry = new Date(now.getTime() + (input.expiryMinutes ?? 60) * 60 * 1000);
  const fields: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: input.config.merchantId,
    pp_SubMerchantID: "",
    pp_Password: input.config.password,
    pp_BankID: "",
    pp_ProductID: "",
    pp_TxnRefNo: input.txnRef,
    pp_Amount: toPaisa(input.amount),
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: pktStamp(now),
    pp_BillReference: input.billReference,
    pp_Description: input.description,
    pp_TxnExpiryDateTime: pktStamp(expiry),
    pp_ReturnURL: input.returnUrl,
    ppmpf_1: "",
    ppmpf_2: "",
    ppmpf_3: "",
    ppmpf_4: "",
    ppmpf_5: "",
  };
  fields["pp_SecureHash"] = secureHash(fields, input.config.salt);
  return fields;
}

/** JazzCash success codes: 000 = success, 121 = transaction pending/in progress. */
export function classifyResponse(code: string): "paid" | "pending" | "failed" {
  if (code === "000" || code === "121") return code === "000" ? "paid" : "pending";
  return "failed";
}
