import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number; // Harga asli sebelum diskon grup (opsional)
  qty: number;
  image?: string;
  category?: string;
  isSpecial?: boolean; // Penanda harga khusus
}

interface CartStore {
  items: CartItem[];
  addItem: (item: any) => void;
  removeItem: (id: string) => void;
  decreaseQty: (id: string) => void;
  updateCartItems: (newItems: CartItem[]) => void; // [BARU] Fungsi update massal
  clearCart: () => void;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          if (existingItem) {
            // Jika item sudah ada, update qty & update harga terbaru (penting!)
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, qty: item.qty + 1, price: product.price, isSpecial: product.isSpecial }
                  : item
              ),
            };
          } else {
            return { items: [...state.items, { ...product, qty: 1 }] };
          }
        });
      },

      decreaseQty: (id) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === id);
          if (existingItem && existingItem.qty > 1) {
            return {
              items: state.items.map((item) =>
                item.id === id ? { ...item, qty: item.qty - 1 } : item
              ),
            };
          } else {
            return { items: state.items.filter((item) => item.id !== id) };
          }
        });
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      },

      // [FITUR BARU] Update semua item sekaligus (dipakai saat ganti grup pelanggan)
      updateCartItems: (newItems) => {
        set({ items: newItems });
      },

      clearCart: () => set({ items: [] }),

      totalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.qty, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);