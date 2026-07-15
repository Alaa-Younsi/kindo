import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  price: number;
  image: string | null;
  quantity: number;
  color: string | null;
  size: string | null;
  stock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, color: string | null, size: string | null) => void;
  updateQuantity: (
    productId: string,
    color: string | null,
    size: string | null,
    quantity: number,
  ) => void;
  clear: () => void;
  subtotal: () => number;
  totalCount: () => number;
}

function sameLine(
  a: { productId: string; color: string | null; size: string | null },
  productId: string,
  color: string | null,
  size: string | null,
) {
  return a.productId === productId && a.color === color && a.size === size;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((line) =>
            sameLine(line, item.productId, item.color, item.size),
          );
          if (existing) {
            const nextQty = Math.min(existing.quantity + quantity, existing.stock || 99);
            return {
              items: state.items.map((line) =>
                sameLine(line, item.productId, item.color, item.size)
                  ? { ...line, quantity: nextQty }
                  : line,
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { ...item, quantity }],
            isOpen: true,
          };
        });
      },
      removeItem: (productId, color, size) => {
        set((state) => ({
          items: state.items.filter((line) => !sameLine(line, productId, color, size)),
        }));
      },
      updateQuantity: (productId, color, size, quantity) => {
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((line) => !sameLine(line, productId, color, size))
              : state.items.map((line) =>
                  sameLine(line, productId, color, size) ? { ...line, quantity } : line,
                ),
        }));
      },
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, line) => sum + line.price * line.quantity, 0),
      totalCount: () => get().items.reduce((sum, line) => sum + line.quantity, 0),
    }),
    {
      name: "kindo-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
