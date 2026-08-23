import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string;
  name: string;
  vendorId: string;
  price: number;
  qty: number;
  meta?: string;
  image?: string | undefined;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  bulkSavings: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "applehub.cart";

const BULK_MIN = 6;
const BULK_RATE = 0.08;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [items]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + qty } : p));
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, qty: Math.max(0, qty) } : p))
        .filter((p) => p.qty > 0),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const bulkSavings = items.reduce(
      (sum, i) => (i.qty >= BULK_MIN ? sum + i.price * i.qty * BULK_RATE : sum),
      0,
    );
    return {
      items,
      add,
      remove,
      setQty,
      clear,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal,
      bulkSavings,
      total: subtotal - bulkSavings,
    };
  }, [items, add, remove, setQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
