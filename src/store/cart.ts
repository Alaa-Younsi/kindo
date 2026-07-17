import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuantityOffer, VariantPick } from "@/types/db";

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
  variants: VariantPick[];
  quantityOffers: QuantityOffer[];
  stock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, color: string | null, size: string | null, variants: VariantPick[]) => void;
  updateQuantity: (
    productId: string,
    color: string | null,
    size: string | null,
    variants: VariantPick[],
    quantity: number,
  ) => void;
  clear: () => void;
  subtotal: () => number;
  totalCount: () => number;
}

/** Order-independent identity key for a line's custom-variant picks — sorted
 *  so the same picks made in a different order merge into one cart line. */
function variantsKey(variants: VariantPick[]): string {
  return variants
    .map((v) => `${v.name_fr}:${v.value}`)
    .sort()
    .join("|");
}

function sameLine(
  a: { productId: string; color: string | null; size: string | null; variants: VariantPick[] },
  productId: string,
  color: string | null,
  size: string | null,
  variants: VariantPick[],
) {
  return (
    a.productId === productId &&
    a.color === color &&
    a.size === size &&
    variantsKey(a.variants) === variantsKey(variants)
  );
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
            sameLine(line, item.productId, item.color, item.size, item.variants),
          );
          if (existing) {
            const nextQty = Math.min(existing.quantity + quantity, existing.stock || 99);
            return {
              items: state.items.map((line) =>
                sameLine(line, item.productId, item.color, item.size, item.variants)
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
      removeItem: (productId, color, size, variants) => {
        set((state) => ({
          items: state.items.filter((line) => !sameLine(line, productId, color, size, variants)),
        }));
      },
      updateQuantity: (productId, color, size, variants, quantity) => {
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((line) => !sameLine(line, productId, color, size, variants))
              : state.items.map((line) =>
                  sameLine(line, productId, color, size, variants) ? { ...line, quantity } : line,
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
