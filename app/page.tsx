"use client";

import Link from 'next/link';
import React, { useEffect, useState, useMemo } from 'react';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import CartDrawer from '@/components/CartDrawer';
import { useCartStore } from '@/hooks/useCart';
import { Input } from '@/components/ui/input'; // Import Input Shadcn
import { Search, X } from 'lucide-react'; // Icon
import { Button } from '@/components/ui/button'; // Kita pakai button untuk kategori
import { History, Settings } from 'lucide-react'
import { signOut } from '@/auth';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // STATE BARU: PENCARIAN & FILTER
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

  useEffect(() => {
    fetchProducts();
  }, []);

  // LOGIKA 1: AMBIL DAFTAR KATEGORI UNIK
  // Otomatis mencari kategori apa saja yang ada di database (misal: Makanan, Minuman, Snack)
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map((p) => p.category));
    return ["Semua", ...Array.from(uniqueCategories)];
  }, [products]);

  // LOGIKA 2: FILTER PRODUK
  const filteredProducts = products.filter((product) => {
    // Cek apakah nama produk cocok dengan pencarian? (Case insensitive)
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Cek apakah kategori cocok?
    const matchesCategory = selectedCategory === "Semua" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`${product.name} masuk keranjang`, {
        duration: 1000, 
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER + SEARCH BAR */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
            {/* Baris 1: Judul & Keranjang */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">Kasir Toko</h1>
                    <p className="text-xs text-slate-500">Point of Sales System</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link href="/transactions">
                        <Button variant="ghost" size="icon" title="Riwayat Transaksi" className='cursor-pointer'>
                            <History className="h-5 w-5 text-slate-600" />
                        </Button>
                    </Link>

                  <Link href="/admin/products">
                        <Button variant="ghost" size="icon" title="Manajemen Produk" className='cursor-pointer'>
                            <Settings className="h-5 w-5 text-slate-600" />
                        </Button>
                    </Link>

                    <button 
                        onClick={fetchProducts} 
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                        title="Refresh Data"
                    >
                    ⟳
                    </button>
                    <CartDrawer onCheckoutSuccess={fetchProducts} />
                    {/* <form
                    action={async () => {
                      'use server';
                      await signOut({ redirectTo: '/' })
                    }}>
                      <button className='text-slate-100 transition-all font-semibold bg-red-600 hover:bg-red-800 w-auto h-auto border-2 border-solid border-red-600 hover:border-red-800 text-sm px-4 py-2 rounded-[10] cursor-pointer'>
                        Log Out
                      </button>
                    </form> */}
                </div>
            </div>

            {/* Baris 2: Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Cari nama produk (contoh: Kopi)..." 
                    className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Baris 3: Kategori Pills (Scrollable Horizontal) */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {categories.map((cat) => (
                    <Button
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-full px-4 text-xs ${selectedCategory === cat ? 'bg-primary' : 'border-slate-300 text-slate-600'}`}
                    >
                        {cat}
                    </Button>
                ))}
            </div>
        </div>
      </header>

      {/* PRODUCT GRID */}
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? (
            // Skeleton Loading
            Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[125px] w-full rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
                </div>
            ))
            ) : filteredProducts.length > 0 ? (
                // Render Hasil Filter
                filteredProducts.map((product) => (
                    <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={handleAddToCart} 
                    />
                ))
            ) : (
                // Tampilan Jika Tidak Ada Hasil
                <div className="col-span-full py-10 text-center text-slate-500">
                    <p className="text-lg font-medium">Produk tidak ditemukan</p>
                    <p className="text-sm">Coba kata kunci lain atau ganti kategori.</p>
                </div>
            )}
        </div>
      </div>
    </main>
  );
}