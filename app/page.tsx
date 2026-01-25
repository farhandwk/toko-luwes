"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link"; // [BARU] Untuk link navigasi desktop
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, LayoutGrid, ShoppingBag, History, Settings, ChartAreaIcon } from "lucide-react"; // [BARU] Icon menu
import { toast } from "sonner";
import { useCartStore } from "@/hooks/useCart"; 
import MobileSidebar from "@/components/MobileSidebar"; 

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const { addItem } = useCartStore(); 

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resProducts, resCategories] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/attributes?type=categories')
      ]);
      const dataProducts = await resProducts.json();
      const dataCategories = await resCategories.json();

      if (Array.isArray(dataProducts)) setProducts(dataProducts);
      else { 
        setProducts([]); 
        if (dataProducts.error) toast.error("Gagal: " + dataProducts.error); 
      }

      if (Array.isArray(dataCategories)) setCategories(dataCategories);
      else setCategories([]);

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Bagian Kiri: Logo & Navigasi */}
            <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-4">
              <div className="flex items-center gap-3">
                {/* [LOGIKA BARU]
                    lg:hidden -> Sidebar HANYA muncul di Mobile/Tablet.
                    Di Desktop tombol ini hilang.
                */}
                <div className="lg:hidden">
                  <MobileSidebar onRefresh={fetchData} />
                </div>
                
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="h-6 w-6 text-primary" /> Toko Luwes
                  </h1>
                  <p className="text-xs text-slate-500">Kasir Point of Sales</p>
                </div>
              </div>

              {/* [MENU DESKTOP] 
                  hidden lg:flex -> HANYA muncul di Desktop.
                  Navigasi langsung tanpa harus klik hamburger.
              */}
              <nav className="hidden lg:flex items-center gap-1 ml-4 border-l pl-4 h-10">
                 <Link href="/transactions">
                    <Button variant="ghost" className="flex items-center gap-2 text-slate-600">
                        <History className="h-4 w-4" /> Riwayat
                    </Button>
                 </Link>
                 <Link href="/admin/products">
                    <Button variant="ghost" className="flex items-center gap-2 text-slate-600">
                        <Settings className="h-4 w-4" /> Produk
                    </Button>
                 </Link>

                 <Link href="/admin/settings">
                    <Button variant="ghost" className="flex items-center gap-2 text-slate-600">
                        <Settings className="h-4 w-4" /> Pengaturan
                    </Button>
                 </Link>
                 
                 <Link href="/admin/analytics">
                    <Button variant="ghost" className="flex items-center gap-2 text-slate-600">
                        <ChartAreaIcon className="h-4 w-4" /> Analytics
                    </Button>
                 </Link>
                 {/* Tombol Produk ada di halaman ini, jadi opsional mau ditambah atau tidak */}
              </nav>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Cari produk..." className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
            </div>
          </div>

          {/* Category Filter */}
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
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={addItem} />
                ))}
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