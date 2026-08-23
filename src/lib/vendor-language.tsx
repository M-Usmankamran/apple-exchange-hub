import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Lang = "en" | "ur";

const dict = {
  vendorDashboard: { en: "Vendor Dashboard", ur: "وینڈر ڈیش بورڈ" },
  overview: { en: "Overview", ur: "خلاصہ" },
  products: { en: "Products", ur: "پروڈکٹس" },
  orders: { en: "Orders", ur: "آرڈرز" },
  sellRequests: { en: "Sell Requests", ur: "فروخت کی درخواستیں" },
  exchanges: { en: "Exchange Offers", ur: "ایکسچینج آفرز" },
  bulk: { en: "Bulk Orders", ur: "بلک آرڈرز" },
  messages: { en: "Messages", ur: "پیغامات" },
  shopStatus: { en: "Shop status", ur: "دکان کی حالت" },
  approved: { en: "Approved", ur: "منظور شدہ" },
  totalSales: { en: "Total sales", ur: "کل فروخت" },
  activeListings: { en: "Active listings", ur: "فعال اشتہارات" },
  pendingOrders: { en: "Pending orders", ur: "زیرِ التوا آرڈرز" },
  rating: { en: "Store rating", ur: "اسٹور ریٹنگ" },
  addProduct: { en: "Add product", ur: "پروڈکٹ شامل کریں" },
  accept: { en: "Accept", ur: "قبول کریں" },
  reject: { en: "Reject", ur: "مسترد کریں" },
  counter: { en: "Counter offer", ur: "جوابی پیشکش" },
  chat: { en: "Chat", ur: "چیٹ" },
  sendRider: { en: "Send rider for inspection", ur: "معائنے کے لیے رائیڈر بھیجیں" },
  storeVisit: { en: "Invite to shop", ur: "دکان پر مدعو کریں" },
  price: { en: "Price", ur: "قیمت" },
  stock: { en: "Stock", ur: "اسٹاک" },
  status: { en: "Status", ur: "حالت" },
  customer: { en: "Customer", ur: "گاہک" },
  action: { en: "Action", ur: "کارروائی" },
  quality: {
    en: "Deliver exactly the product shown in your listing — images, condition, storage and accessories must match.",
    ur: "گاہک کو بالکل وہی پروڈکٹ دیں جو اشتہار میں دکھایا گیا ہے — تصاویر، حالت، اسٹوریج اور ایکسیسریز ایک جیسی ہونی چاہئیں۔",
  },
} as const;

export type DictKey = keyof typeof dict;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string; rtl: boolean };

const VendorLangContext = createContext<Ctx | null>(null);

export function VendorLanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: (k) => dict[k][lang], rtl: lang === "ur" }),
    [lang],
  );
  return <VendorLangContext.Provider value={value}>{children}</VendorLangContext.Provider>;
}

export function useVendorLang() {
  const ctx = useContext(VendorLangContext);
  if (!ctx) throw new Error("useVendorLang must be used inside VendorLanguageProvider");
  return ctx;
}
