"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link"; 
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, LayoutGrid, ShoppingBag, History, Settings, Users, FolderTree, ChartArea } from "lucide-react"; 
import { toast } from "sonner";
import { useCartStore } from "@/hooks/useCart"; 
import MobileSidebar from "@/components/MobileSidebar"; 

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  
  // State Multi-Level Price
  const [groups, setGroups] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("umum");

  // [PENTING] Ambil fungsi updateCartItems
  const { addItem, items, updateCartItems } = useCartStore(); 

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resProducts, resCategories, resSpecial] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/attributes?type=categories'),
        fetch('/api/grosir') 
      ]);

      const dataProducts = await resProducts.json();
      const dataCategories = await resCategories.json();
      const dataSpecial = await resSpecial.json();

      if (Array.isArray(dataProducts)) setProducts(dataProducts);
      else { 
        setProducts([]); 
        if (dataProducts.error) toast.error("Gagal: " + dataProducts.error); 
      }

      if (Array.isArray(dataCategories)) setCategories(dataCategories);
      else setCategories([]);

      if (dataSpecial.groups) setGroups(dataSpecial.groups);
      if (dataSpecial.prices) setPrices(dataSpecial.prices);

    } catch (error) { 
      console.error(error); 
      setProducts([]); 
    } finally { 
      setIsLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- [LOGIKA BARU] AUTO UPDATE CART SAAT GANTI PELANGGAN ---
  useEffect(() => {
    // Jangan jalankan jika keranjang kosong atau data belum siap
    if (items.length === 0 || products.length === 0) return;

    // Hitung ulang harga untuk setiap item di keranjang
    const updatedItems = items.map(cartItem => {
        // Cari harga khusus di database berdasarkan Group yang dipilih
        const specialPrice = prices.find(p => p.product_id === cartItem.id && p.group_id === selectedGroupId);
        
        // Cari harga dasar (harga normal produk)
        const baseProduct = products.find(p => p.id === cartItem.id);
        const basePrice = baseProduct ? baseProduct.price : cartItem.price;

        // Tentukan harga baru
        const newPrice = specialPrice ? specialPrice.price : basePrice;
        const isSpecial = !!specialPrice; // True jika pakai harga khusus

        // Return item dengan harga baru
        return { ...cartItem, price: newPrice, isSpecial };
    });

    // Cek apakah ada perubahan (biar tidak render berulang-ulang/infinite loop)
    const hasChanges = updatedItems.some((newItem, index) => {
        return newItem.price !== items[index].price || newItem.isSpecial !== items[index].isSpecial;
    });

    // Jika ada harga yang beda, update store
    // if (hasChanges) {
    //     updateCartItems(updatedItems);
    //     toast.info("Harga keranjang disesuaikan dengan jenis pelanggan.");
    // }

  }, [selectedGroupId, prices, products, items, updateCartItems]); 


  // Helper hitung harga kartu produk
  const getAdjustedProduct = (product: any) => {
    if (selectedGroupId === "umum") return product;
    const specialPrice = prices.find(p => p.product_id === product.id && p.group_id === selectedGroupId);
    if (specialPrice) {
        return { ...product, price: specialPrice.price, isSpecial: true };
    }
    return product;
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Semua" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* HEADER */}
      <header className="bg-white border-b shadow-sm z-10 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center justify-between w-full lg:w-auto">
              <div className="flex items-center gap-3">
                <div className="lg:hidden">
                  <MobileSidebar onRefresh={fetchData} />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="h-6 w-6 text-primary" /> TOKO LUWES
                  </h1>
                  <p className="text-xs text-slate-500">Kasir Point of Sales</p>
                </div>
              </div>

              <nav className="hidden lg:flex flex-wrap items-center gap-1 ml-4 border-l pl-4 h-auto">
                 <Link href="/transactions">
                    <Button variant="ghost" className="flex items-center gap-2 text-slate-600">
                        <History className="h-4 w-4" /> Riwayat
                    </Button>
                 </Link>

                 <Link href="/admin/settings">
                    <Button variant="ghost" className="flex items-center gap-2 text-slate-600">
                        <Settings className="h-4 w-4" /> Pengaturan
                    </Button>
                 </Link>

                 <Link href="/admin/products">
                    <Button variant="ghost" className="flex items-center gap-2 text-slate-600">
                        <Settings className="mh-4 w-4" /> 
                        Manajemen Produk
                    </Button>
                </Link>

                 <Link href="/admin/grosir">
                    <Button variant="ghost" className="flex items-center gap-2 text-slate-600">
                        <FolderTree className="h-4 w-4" /> Pengaturan Harga Grosir
                    </Button>
                 </Link>

                 <Link href="/admin/analytics">
                    <Button variant="ghost" className="flex items-center gap-2 text-slate-600">
                        <ChartArea className="h-4 w-4" /> Analytics
                    </Button>
                 </Link>
              </nav>
            </div>

            <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                {/* Customer Switcher */}
                <div className="w-full md:w-48">
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <SelectTrigger className={`h-10 font-bold border-slate-200 ${selectedGroupId !== 'umum' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50'}`}>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <SelectValue />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="umum">Umum / Eceran</SelectItem>
                            {groups.map(g => (
                                <SelectItem key={g.id} value={g.id} className="font-bold text-blue-600">
                                    {g.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Cari produk..." 
                        className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button variant={selectedCategory === "Semua" ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory("Semua")} className="rounded-full px-4 flex-shrink-0">Semua</Button>
            {categories.map((cat) => (
              <Button key={cat.id} variant={selectedCategory === cat.name ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.name)} className="rounded-full px-4 flex-shrink-0">{cat.name}</Button>
            ))}
          </div>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 lg:mr-[400px]">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p>Memuat produk...</p></div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 pb-24">
                {filteredProducts.map((originalProduct) => {
                  const finalProduct = getAdjustedProduct(originalProduct);
                  return (
                    <div key={originalProduct.id} className="relative group">
                        <ProductCard 
                            product={finalProduct} 
                            onAddToCart={addItem} 
                        />
                        {finalProduct.isSpecial && (
                            <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-10">
                                Harga {groups.find(g => g.id === selectedGroupId)?.name}
                            </div>
                        )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center"><LayoutGrid className="h-8 w-8 text-slate-300" /></div>
                <p>Produk tidak ditemukan.</p>
                <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory("Semua"); }}>Reset Filter</Button>
              </div>
            )}
          </div>
        </main>
        <CartDrawer />
      </div>
    </div>
  );
}