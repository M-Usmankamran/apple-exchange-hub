export type Condition = "New" | "Like New" | "Excellent" | "Good" | "Fair";

export type Product = {
  id: string;
  name: string;
  category: string;
  model: string;
  storage: string;
  color: string;
  condition: Condition;
  price: number;
  originalPrice?: number;
  batteryHealth?: number;
  vendorId: string;
  city: string;
  distanceKm: number;
  rating: number;
  reviews: number;
  stock: number;
  pta: boolean;
  images: string[];
  highlights: string[];
  description: string;
};

export type Vendor = {
  id: string;
  name: string;
  owner: string;
  city: string;
  area: string;
  distanceKm: number;
  rating: number;
  reviews: number;
  products: number;
  verified: boolean;
  since: string;
  pickup: boolean;
  riderPickup: boolean;
  tagline: string;
};

export const categories = [
  { slug: "iphone", name: "iPhone", count: 412 },
  { slug: "ipad", name: "iPad", count: 168 },
  { slug: "macbook", name: "MacBook", count: 121 },
  { slug: "watch", name: "Apple Watch", count: 96 },
  { slug: "airpods", name: "AirPods", count: 143 },
  { slug: "accessories", name: "Accessories", count: 260 },
  { slug: "cases", name: "Cases & Covers", count: 318 },
];

export const conditions: Condition[] = ["New", "Like New", "Excellent", "Good", "Fair"];

export const storageOptions = ["64GB", "128GB", "256GB", "512GB", "1TB"];

export const vendors: Vendor[] = [
  {
    id: "v-apex",
    name: "Apex Apple Store",
    owner: "Bilal Ahmed",
    city: "Lahore",
    area: "Gulberg III",
    distanceKm: 1.8,
    rating: 4.9,
    reviews: 1284,
    products: 96,
    verified: true,
    since: "2019",
    pickup: true,
    riderPickup: true,
    tagline: "Authorised-grade refurbished iPhones with 6-month warranty.",
  },
  {
    id: "v-corex",
    name: "CoreX Mobiles",
    owner: "Hassan Raza",
    city: "Karachi",
    area: "Clifton Block 5",
    distanceKm: 3.4,
    rating: 4.8,
    reviews: 940,
    products: 71,
    verified: true,
    since: "2020",
    pickup: true,
    riderPickup: true,
    tagline: "Bulk iPhone supplier — special pricing on 6+ units.",
  },
  {
    id: "v-orchard",
    name: "Orchard Tech",
    owner: "Ayesha Khan",
    city: "Islamabad",
    area: "F-7 Markaz",
    distanceKm: 5.1,
    rating: 4.7,
    reviews: 612,
    products: 58,
    verified: true,
    since: "2021",
    pickup: true,
    riderPickup: false,
    tagline: "MacBooks and iPads, fully tested with battery reports.",
  },
  {
    id: "v-lumen",
    name: "Lumen Accessories",
    owner: "Zainab Tariq",
    city: "Lahore",
    area: "DHA Phase 5",
    distanceKm: 2.6,
    rating: 4.9,
    reviews: 2210,
    products: 184,
    verified: true,
    since: "2018",
    pickup: false,
    riderPickup: true,
    tagline: "Custom printed cases, skins and premium accessories.",
  },
];

export const vendorById = (id: string) => vendors.find((v) => v.id === id);

const img = (seed: string) => `https://images.unsplash.com/${seed}`;

export const products: Product[] = [
  {
    id: "p-1",
    name: "iPhone 15 Pro Max",
    category: "iphone",
    model: "iPhone 15 Pro Max",
    storage: "256GB",
    color: "Natural Titanium",
    condition: "Like New",
    price: 389000,
    originalPrice: 445000,
    batteryHealth: 98,
    vendorId: "v-apex",
    city: "Lahore",
    distanceKm: 1.8,
    rating: 4.9,
    reviews: 128,
    stock: 12,
    pta: true,
    images: [img("photo-1592286927505-1def25115558?w=1200&q=80")],
    highlights: ["PTA approved", "Battery 98%", "Box + cable", "6-month warranty"],
    description:
      "Titanium design, A17 Pro chip and a 48MP main camera. Fully tested unit with original accessories and vendor warranty.",
  },
  {
    id: "p-2",
    name: "iPhone 14",
    category: "iphone",
    model: "iPhone 14",
    storage: "128GB",
    color: "Midnight",
    condition: "Excellent",
    price: 214000,
    batteryHealth: 91,
    vendorId: "v-corex",
    city: "Karachi",
    distanceKm: 3.4,
    rating: 4.7,
    reviews: 86,
    stock: 24,
    pta: true,
    images: [img("photo-1678652197831-2d180705cd2c?w=1200&q=80")],
    highlights: ["Bulk pricing 6+", "PTA approved", "Battery 91%"],
    description:
      "Reliable daily driver with strong battery health. Bulk discount unlocks automatically at 6 units or more.",
  },
  {
    id: "p-3",
    name: 'MacBook Air 13" M3',
    category: "macbook",
    model: "MacBook Air M3",
    storage: "512GB",
    color: "Starlight",
    condition: "New",
    price: 428000,
    vendorId: "v-orchard",
    city: "Islamabad",
    distanceKm: 5.1,
    rating: 4.9,
    reviews: 54,
    stock: 6,
    pta: true,
    images: [img("photo-1517336714731-489689fd1ca8?w=1200&q=80")],
    highlights: ["Sealed box", "18h battery", "1-year warranty"],
    description:
      "Sealed MacBook Air with the M3 chip, 16GB unified memory and 512GB storage. Store pickup available.",
  },
  {
    id: "p-4",
    name: 'iPad Pro 11" M4',
    category: "ipad",
    model: "iPad Pro M4",
    storage: "256GB",
    color: "Space Black",
    condition: "Like New",
    price: 312000,
    vendorId: "v-orchard",
    city: "Islamabad",
    distanceKm: 5.1,
    rating: 4.8,
    reviews: 41,
    stock: 4,
    pta: true,
    images: [img("photo-1544244015-0df4b3ffc6b0?w=1200&q=80")],
    highlights: ["Tandem OLED", "Apple Pencil Pro ready", "Tested display"],
    description:
      "Ultra Retina XDR display with the M4 chip. Includes original charger and inspection report.",
  },
  {
    id: "p-5",
    name: "Apple Watch Series 9",
    category: "watch",
    model: "Watch Series 9 45mm",
    storage: "64GB",
    color: "Silver",
    condition: "Excellent",
    price: 118000,
    batteryHealth: 95,
    vendorId: "v-apex",
    city: "Lahore",
    distanceKm: 1.8,
    rating: 4.7,
    reviews: 73,
    stock: 9,
    pta: true,
    images: [img("photo-1579586337278-3befd40fd17a?w=1200&q=80")],
    highlights: ["Double tap", "New strap", "Battery 95%"],
    description:
      "Series 9 with the S9 SiP, always-on Retina display and a brand new sport loop strap.",
  },
  {
    id: "p-6",
    name: "AirPods Pro 2 (USB-C)",
    category: "airpods",
    model: "AirPods Pro 2",
    storage: "64GB",
    color: "White",
    condition: "New",
    price: 74500,
    vendorId: "v-lumen",
    city: "Lahore",
    distanceKm: 2.6,
    rating: 4.9,
    reviews: 312,
    stock: 40,
    pta: true,
    images: [img("photo-1600294037681-c80b4cb5b434?w=1200&q=80")],
    highlights: ["Sealed", "Adaptive audio", "Serial verified"],
    description:
      "Sealed AirPods Pro 2 with the USB-C case, adaptive audio and conversation awareness.",
  },
  {
    id: "p-7",
    name: "Custom Silicone Case",
    category: "cases",
    model: "iPhone 15 / 15 Pro",
    storage: "64GB",
    color: "Your design",
    condition: "New",
    price: 4900,
    vendorId: "v-lumen",
    city: "Lahore",
    distanceKm: 2.6,
    rating: 4.8,
    reviews: 528,
    stock: 200,
    pta: true,
    images: [img("photo-1541877944-ac82a091518a?w=1200&q=80")],
    highlights: ["Design studio", "MagSafe compatible", "48h dispatch"],
    description:
      "Design your own case in the Customization Studio — add text, colours, patterns or your own photo.",
  },
  {
    id: "p-8",
    name: "iPhone 13",
    category: "iphone",
    model: "iPhone 13",
    storage: "128GB",
    color: "Blue",
    condition: "Good",
    price: 164000,
    batteryHealth: 87,
    vendorId: "v-corex",
    city: "Karachi",
    distanceKm: 3.4,
    rating: 4.5,
    reviews: 119,
    stock: 18,
    pta: true,
    images: [img("photo-1632582569624-01e0dd2b8e0a?w=1200&q=80")],
    highlights: ["Budget pick", "PTA approved", "Bulk available"],
    description:
      "Great value iPhone 13 with minor cosmetic wear. Inspection at the vendor store is welcome before payment.",
  },
];

export const productById = (id: string) => products.find((p) => p.id === id);

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);

export const BULK_MIN_QTY = 6;
export const BULK_DISCOUNT = 0.08;

export const bulkPrice = (price: number, qty: number) =>
  qty >= BULK_MIN_QTY ? price * (1 - BULK_DISCOUNT) : price;

export const reviews = [
  {
    name: "Hamza Sheikh",
    city: "Lahore",
    text: "Sold my iPhone 12 in a day. The rider inspected it at home and paid on the spot.",
    rating: 5,
  },
  {
    name: "Maryam Iqbal",
    city: "Islamabad",
    text: "Ordered six iPhone 14 units for my team and the bulk discount applied automatically.",
    rating: 5,
  },
  {
    name: "Usman Kamran",
    city: "Karachi",
    text: "The customization studio preview matched the printed case almost exactly. Impressive.",
    rating: 4,
  },
];
