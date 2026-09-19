/** Shared dropdown options so every form offers the same cities, models and storage sizes. */

export const pkCities = ["Karachi", "Lahore", "Islamabad", "Quetta", "Peshawar"] as const;

export const iphoneModels = [
  "iPhone 12 Pro",
  "iPhone 12 Pro Max",
  "iPhone 13 Pro",
  "iPhone 13 Pro Max",
  "iPhone 14 Pro",
  "iPhone 14 Pro Max",
  "iPhone 15 Pro",
  "iPhone 15 Pro Max",
  "iPhone 16 Pro",
  "iPhone 16 Pro Max",
  "iPhone 17 Pro",
  "iPhone 17 Pro Max",
  "iPhone 18 Pro",
  "iPhone 18 Pro Max",
] as const;

export const storageSizes = ["128GB", "256GB", "512GB", "1TB", "2TB"] as const;

/** Field limits shared across profile and verification forms. */
export const MAX_CNIC_LENGTH = 15; // 13 digits + 2 dashes
export const MAX_PHONE_LENGTH = 15;

/** Formats a CNIC as 00000-0000000-0 and caps it at 13 digits. */
export function formatCnic(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  const parts = [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12, 13)].filter(Boolean);
  return parts.join("-");
}

/** Keeps only phone-safe characters and caps the length. */
export function formatPhone(value: string): string {
  return value.replace(/[^\d+\s-]/g, "").slice(0, MAX_PHONE_LENGTH);
}
