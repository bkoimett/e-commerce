"use client";

// Client-side shopping cart. v1 has no backend cart table (see WORKFLOW
// #21 / DESIGN.md §2 note), so the cart lives in localStorage only. Prices
// are snapshotted when an item is added; the product detail page always
// shows the live price, so a later promotion change affects the next
// add-to-cart rather than rewriting stored items.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

export interface CartItem {
  key: string; // variant id when one is chosen, otherwise the product id
  productId: string;
  productSlug: string;
  productName: string;
  image: string; // first product image, blank when none
  variantId: string | null;
  variantLabel: string | null; // e.g. "Black • 128 GB"
  unitPrice: number; // effective price at the moment it was added
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; item: CartItem }
  | { type: "SET_QUANTITY"; key: string; quantity: number }
  | { type: "REMOVE"; key: string }
  | { type: "CLEAR" }
  | { type: "REPLACE"; state: CartState };

const STORAGE_KEY = "benjie:cart";

function readStorage(): CartState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const state = raw ? (JSON.parse(raw) as CartState) : { items: [] };
    if (!Array.isArray(state.items)) return { items: [] };
    return state;
  } catch {
    return { items: [] };
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.key === action.item.key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.key === action.item.key
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, action.item] };
    }
    case "SET_QUANTITY": {
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => i.key !== action.key) };
      }
      return {
        items: state.items.map((i) =>
          i.key === action.key ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.key !== action.key) };
    case "CLEAR":
      return { items: [] };
    case "REPLACE":
      return action.state;
  }
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, readStorage);

  // Persist on every change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage may be blocked (private mode); the cart stays in-memory
      // for the session and just won't survive a reload.
    }
  }, [state]);

  // Keep tabs in sync: when another tab writes the cart, adopt its state.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      dispatch({ type: "REPLACE", state: readStorage() });
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = state.items.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0
    );
    return {
      items: state.items,
      count,
      subtotal,
      addItem: (item) => dispatch({ type: "ADD", item }),
      setQuantity: (key, quantity) =>
        dispatch({ type: "SET_QUANTITY", key, quantity }),
      removeItem: (key) => dispatch({ type: "REMOVE", key }),
      clear: () => dispatch({ type: "CLEAR" }),
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}