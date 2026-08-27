export type AvatarRole = "user" | "vendor" | "admin";

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_MIN_DIMENSION = 200;
export const AVATAR_OUTPUT_SIZE = 512;
export const AVATAR_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

type Accepted = (typeof AVATAR_ACCEPTED_TYPES)[number];

/** Magic-number sniffing: never trust the browser-reported MIME type alone. */
const SIGNATURES: { type: Accepted; bytes: number[] }[] = [
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

export type ValidationResult =
  | { ok: true; type: Accepted; width: number; height: number; objectUrl: string }
  | { ok: false; error: string };

function matches(head: Uint8Array, bytes: number[]) {
  return bytes.every((b, i) => head[i] === b);
}

export async function validateAvatarFile(file: File): Promise<ValidationResult> {
  if (!AVATAR_ACCEPTED_TYPES.includes(file.type as Accepted)) {
    return { ok: false, error: "Only PNG, JPEG or WebP images are allowed." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: "Image is larger than 5 MB. Please pick a smaller file." };
  }
  if (file.size === 0) {
    return { ok: false, error: "That file is empty." };
  }

  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const sniffed = SIGNATURES.find((s) => matches(head, s.bytes));
  const isWebp =
    sniffed?.type === "image/webp" &&
    String.fromCharCode(head[8]!, head[9]!, head[10]!, head[11]!) === "WEBP";

  if (!sniffed || (sniffed.type === "image/webp" && !isWebp)) {
    return { ok: false, error: "This file is not a valid image." };
  }
  if (sniffed.type !== file.type) {
    return { ok: false, error: "File contents do not match its type. Upload rejected." };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const { width, height } = await probeDimensions(objectUrl);
    if (width < AVATAR_MIN_DIMENSION || height < AVATAR_MIN_DIMENSION) {
      URL.revokeObjectURL(objectUrl);
      return {
        ok: false,
        error: `Image must be at least ${AVATAR_MIN_DIMENSION}×${AVATAR_MIN_DIMENSION} pixels.`,
      };
    }
    return { ok: true, type: sniffed.type, width, height, objectUrl };
  } catch {
    URL.revokeObjectURL(objectUrl);
    return { ok: false, error: "The image could not be decoded." };
  }
}

function probeDimensions(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("decode failed"));
    img.src = src;
  });
}

export type CropRect = { sx: number; sy: number; size: number };

/**
 * Re-encodes the cropped region through a canvas. Re-encoding strips EXIF and any
 * embedded payload, so only pixel data is ever persisted.
 */
export async function cropToDataUrl(objectUrl: string, crop: CropRect): Promise<string> {
  const img = new Image();
  img.src = objectUrl;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    crop.sx,
    crop.sy,
    crop.size,
    crop.size,
    0,
    0,
    AVATAR_OUTPUT_SIZE,
    AVATAR_OUTPUT_SIZE,
  );
  return canvas.toDataURL("image/jpeg", 0.9);
}

const key = (role: AvatarRole) => `applehub.avatar.${role}`;

export function loadAvatar(role: AvatarRole): string | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(key(role));
  return value && value.startsWith("data:image/") ? value : null;
}

export function saveAvatar(role: AvatarRole, dataUrl: string) {
  window.localStorage.setItem(key(role), dataUrl);
}

export function clearAvatar(role: AvatarRole) {
  window.localStorage.removeItem(key(role));
}
