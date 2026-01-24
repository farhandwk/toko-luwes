"use client";

import Link from 'next/link';
import React, { useEffect, useState, useMemo } from 'react';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import CartDrawer from '@/components/CartDrawer'; 
import { useCartStore } from '@/hooks/useCart';
import { Input } from '@/components/ui/input'; 
import { Search, X, History, Settings, RefreshCw, BarChart3 } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { PRODUCT_CATEGORIES } from '../types/categories';
// Import Sidebar Baru
import MobileSidebar from '@/components/MobileSidebar';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const { addItem } = useCartStore();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Gagal ambil data:', error);
      toast.error("Gagal memuat data produk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Semua" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`${product.name} +1`, { duration: 1000 });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
            
            {/* BARIS 1: JUDUL & MENU */}
            <div className="flex justify-between items-center">
                <div className="flex items-center">
                    {/* [LOGIC BARU] Mobile Sidebar (Hanya muncul di < lg) */}
                    <MobileSidebar onRefresh={fetchProducts} />
                    
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Toko Luwes</h1>
                        <p className="text-xs text-slate-500 hidden md:block">Kasir Point of Sales</p>
                    </div>
                </div>
                
                {/* [LOGIC BARU] Desktop Menu (Hanya muncul di Laptop >= lg) */}
                <div className="hidden lg:flex items-center gap-2">
                    <Link href="/transactions">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <History className="h-4 w-4 text-slate-600" />
                            Riwayat
                        </Button>
                    </Link>

                    <Link href="/admin/products">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <Settings className="h-4 w-4 text-slate-600" />
                            Produk
                        </Button>
                    </Link>

                    <Link href="/admin/analytics">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <BarChart3 className="h-4 w-4 text-slate-600" /> 
                            Analytics / Dashboard
                        </Button>
                    </Link>

                    <div className="w-px h-6 bg-slate-200 mx-1"></div>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={fetchProducts} 
                        title="Refresh Data"
                    >
                        <RefreshCw className="h-4 w-4 text-slate-500" />
                    </Button>
                </div>

                {/* Mobile Refresh (Opsional, jika ingin tombol refresh cepat di HP juga) */}
                <div className="lg:hidden">
                    <Button variant="ghost" size="icon" onClick={fetchProducts}>
                        <RefreshCw className="h-5 w-5 text-slate-600" />
                    </Button>
                </div>
            </div>

            {/* BARIS 2: SEARCH */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Cari produk..." className="pl-9 bg-slate-50" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                {searchQuery && (<button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="h-4 w-4" /></button>)}
            </div>

            {/* BARIS 3: KATEGORI */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <Button variant={selectedCategory === "Semua" ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory("Semua")} className="rounded-full px-4 text-xs">Semua</Button>
                {PRODUCT_CATEGORIES.map((cat) => (
                    <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)} className="rounded-full px-4 text-xs whitespace-nowrap">
                        {cat}
                    </Button>
                ))}
            </div>
        </div>
      </header>

      {/* MAIN CONTENT (Grid Layout SAMA SEPERTI SEBELUMNYA) */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-24 lg:pb-0">
                    {loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[150px] w-full rounded-xl" />) 
                    : filteredProducts.length > 0 ? filteredProducts.map((p) => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />) 
                    : <div className="col-span-full py-20 text-center text-slate-400">Produk tidak ditemukan</div>}
                </div>
            </div>
            <div className="hidden lg:block lg:col-span-1">
                <div className="sticky top-24 z-10"> 
                    <CartDrawer onCheckoutSuccess={fetchProducts} className="shadow-lg border rounded-xl overflow-hidden bg-white h-[calc(100vh-140px)]" />
                </div>
            </div>
            <div className="lg:hidden"><CartDrawer onCheckoutSuccess={fetchProducts} /></div>
        </div>
      </div>
    </main>
  );
}