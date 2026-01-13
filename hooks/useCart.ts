// hooks/useCart.ts
import { create } from 'zustand';
import { Product } from '@/types';

// Tipe data item di dalam keranjang (Produk + Jumlah Beli)
export interface CartItem extends Product {
  qty: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  decreaseQty: (productId: string) => void;
  clearCart: () => void;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  // LOGIKA: Tambah Barang
  addItem: (product) => {
    set((state) => {
      // Cek apakah barang sudah ada di keranjang?
      const existingItem = state.items.find((item) => item.id === product.id);

      if (existingItem) {
        // Jika sudah ada, tambah qty-nya saja
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, qty: item.qty + 1 }
              : item
          ),
        };
      } else {
        // Jika belum ada, masukkan sebagai item baru dengan qty 1
        return { items: [...state.items, { ...product, qty: 1 }] };
      }
    });
  },

  // LOGIKA: Kurangi Qty (jika 1 lalu dikurangi, maka hapus)
  decreaseQty: (productId) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === productId);
      if (existingItem && existingItem.qty > 1) {
        return {
          items: state.items.map((item) =>
            item.id === productId ? { ...item, qty: item.qty - 1 } : item
          ),
        };
      } else {
        // Hapus item jika qty sisa 1
        return { items: state.items.filter((item) => item.id !== productId) };
      }
    });
  },

  // LOGIKA: Hapus Item Total
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));
  },

  // LOGIKA: Kosongkan Keranjang
  clearCart: () => set({ items: [] }),

  // LOGIKA: Hitung Total Harga
  totalPrice: () => {
    return get().items.reduce((total, item) => total + item.price * item.qty, 0);
  },
}));