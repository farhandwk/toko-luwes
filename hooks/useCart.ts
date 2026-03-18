import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. Update Interface CartItem agar mengenal is_decimal dan units
export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number; 
  qty: number;
  image?: string;
  category?: string;
  isSpecial?: boolean;
  is_decimal?: boolean; // [BARU] Tambahkan ini
  units?: { name: string }; // [BARU] Tambahkan ini untuk menampilkan 'kg' atau 'pcs'
}

// 2. Update Interface CartStore agar mendaftarkan updateQty
interface CartStore {
  items: CartItem[];
  addItem: (product: any) => void;
  removeItem: (id: string) => void;
  decreaseQty: (id: string) => void;
  updateQty: (id: string, qty: number) => void; // [BARU] Daftarkan di sini agar bisa dipanggil
  updateCartItems: (newItems: CartItem[]) => void;
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
            // Jika item sudah ada, update qty & update harga terbaru
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { 
                      ...item, 
                      qty: item.is_decimal ? item.qty + 0.1 : item.qty + 1, // Jika timbangan, tambah 0.1 sebagai default
                      price: product.price, 
                      isSpecial: product.isSpecial 
                    }
                  : item
              ),
            };
          } else {
            // Jika item baru, pastikan properti is_decimal dan units ikut terbawa
            return { 
                items: [
                    ...state.items, 
                    { 
                        ...product, 
                        qty: product.is_decimal ? 1 : 1 // Default awal 1 (bisa 1kg atau 1pcs)
                    }
                ] 
            };
          }
        });
      },

      decreaseQty: (id) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === id);
          if (existingItem) {
            // Logika pengurangan untuk desimal vs bulat
            const step = existingItem.is_decimal ? 0.1 : 1;
            const newQty = existingItem.qty - step;

            if (newQty <= 0) {
              return { items: state.items.filter((item) => item.id !== id) };
            }

            return {
              items: state.items.map((item) =>
                item.id === id ? { ...item, qty: Number(newQty.toFixed(2)) } : item
              ),
            };
          }
          return state;
        });
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      },

      updateCartItems: (newItems) => {
        set({ items: newItems });
      },

      clearCart: () => set({ items: [] }),

      totalPrice: () => {
        // Gunakan Math.round untuk menghindari error angka di belakang koma (0.300000004)
        const total = get().items.reduce((total, item) => total + item.price * item.qty, 0);
        return Math.round(total);
      },

      // Fungsi untuk input angka manual di CartDrawer
      updateQty: (id: string, qty: number) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, qty: Number(qty) } : item
          ),
        }));
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);