"use client";

import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import { formatRupiah } from "@/utils/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Package, DollarSign, ShoppingBag, AlertTriangle, Loader2 } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Product } from "@/types";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resTrx, resProd] = await Promise.all([
            fetch('/api/transactions'),
            fetch('/api/products')
        ]);
        const dataTrx = await resTrx.json();
        const dataProd = await resProd.json();
        setTransactions(Array.isArray(dataTrx) ? dataTrx : []);
        setProducts(Array.isArray(dataProd) ? dataProd : []);
      } catch (error) {
        console.error("Gagal load analytics", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalItemsSold = 0;
    const salesByDate: Record<string, number> = {};
    const productSales: Record<string, number> = {};
    const paymentMethods: Record<string, number> = {};

    // [HELPER 1] Parsing Tanggal Indonesia (DD/MM/YYYY) ke Object Date JS
    const parseTransactionDate = (dateStr: string) => {
        if (!dateStr) return null;
        try {
            // Format di Sheet: "26/01/2026, 8:02:47"
            // Ambil bagian tanggal saja: "26/01/2026"
            const datePart = dateStr.split(',')[0].trim(); 
            const parts = datePart.split('/'); // ["26", "01", "2026"]
            
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // JS Month mulai dari 0
                const year = parseInt(parts[2], 10);
                return new Date(year, month, day);
            }
            
            // Fallback jika formatnya sudah ISO
            const isoDate = new Date(dateStr);
            return isNaN(isoDate.getTime()) ? null : isoDate;
        } catch (e) {
            return null;
        }
    };

    // [HELPER 2] Format ke Key String YYYY-MM-DD
    const getLocalDateKey = (dateObj: Date) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // 1. ITERASI TRANSAKSI
    transactions.forEach((trx) => {
        const total = Number(trx.total) || 0;
        totalRevenue += total;

        // PARSING TANGGAL YANG LEBIH KUAT
        const dateObj = parseTransactionDate(trx.date);

        if (dateObj) {
            const dateKey = getLocalDateKey(dateObj);
            salesByDate[dateKey] = (salesByDate[dateKey] || 0) + total;
        }

        // Payment Method
        const method = trx.paymentMethod || "Cash";
        paymentMethods[method] = (paymentMethods[method] || 0) + 1;

        // Produk Terlaris
        let items: any[] = [];
        try {
            if (Array.isArray(trx.items)) items = trx.items;
            else if (typeof trx.items === 'string') items = JSON.parse(trx.items);
        } catch (e) { items = []; }

        if (Array.isArray(items)) {
            items.forEach((item: any) => {
                const qty = Number(item.qty) || 0;
                const cleanName = item.name.trim(); 
                productSales[cleanName] = (productSales[cleanName] || 0) + qty;
                totalItemsSold += qty;
            });
        }
    });

    // 2. GENERATE GRAFIK 7 HARI TERAKHIR
    const graphData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        
        const dateKey = getLocalDateKey(d);
        const dateLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        graphData.push({
            name: dateLabel,
            total: salesByDate[dateKey] || 0 
        });
    }

    // 3. Data Lainnya
    const topProducts = Object.keys(productSales)
        .map(name => ({ name, qty: productSales[name] }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

    const paymentData = Object.keys(paymentMethods).map(method => ({
        name: method,
        value: paymentMethods[method]
    }));

    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 5);

    return {
        totalRevenue,
        totalTransactions: transactions.length,
        totalItemsSold,
        averageOrderValue: transactions.length > 0 ? totalRevenue / transactions.length : 0,
        graphData, 
        topProducts,
        paymentData,
        lowStockProducts
    };

  }, [transactions, products]);

  if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/">
            <Button variant="outline" size="icon" className="h-10 w-10 border-slate-300 hover:bg-white" title="Kembali ke POS">
                <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Button>
        </Link>
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Analytics</h1>
            <p className="text-slate-500">Pantau performa bisnis Toko Luwes.</p>
        </div>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Omzet</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatRupiah(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Semua waktu</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                <ShoppingBag className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                <p className="text-xs text-muted-foreground">Struk tercetak</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produk Terjual</CardTitle>
                <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalItemsSold}</div>
                <p className="text-xs text-muted-foreground">Item keluar</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rata-rata Transaksi</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatRupiah(stats.averageOrderValue)}</div>
                <p className="text-xs text-muted-foreground">Per pelanggan</p>
            </CardContent>
        </Card>
      </div>

      {/* GRAFIK & STOK */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        <Card className="lg:col-span-4 shadow-sm">
            <CardHeader>
                <CardTitle>Tren Pendapatan</CardTitle>
                <CardDescription>7 Hari Terakhir</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.graphData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value/1000}k`} />
                            <Tooltip 
                                formatter={(value: any) => formatRupiah(Number(value) || 0)}
                                cursor={{fill: 'transparent'}}
                            />
                            <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm border-orange-200 bg-orange-50/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                    <AlertTriangle className="h-5 w-5" /> Stok Menipis
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {stats.lowStockProducts.length === 0 ? (
                        <p className="text-sm text-green-600">Stok aman.</p>
                    ) : (
                        stats.lowStockProducts.slice(0, 5).map((p) => (
                            <div key={p.id} className="flex justify-between border-b pb-2 border-orange-100 last:border-0">
                                <span className="text-sm font-medium">{p.name}</span>
                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">Sisa {p.stock}</span>
                            </div>
                        ))
                    )}
                    {stats.lowStockProducts.length > 5 && (
                        <Link href="/admin/products" className="text-xs text-orange-600 block mt-2 hover:underline">Lihat semua &rarr;</Link>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>

      {/* PIE CHART & TOP PRODUK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
            <CardHeader><CardTitle>Top 5 Produk</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {stats.topProducts.length === 0 ? (
                         <p className="text-sm text-slate-400">Belum ada data penjualan.</p>
                    ) : (
                        stats.topProducts.map((item, i) => (
                            <div key={item.name} className="flex items-center">
                                <span className="w-6 font-bold text-slate-400 text-sm">#{i+1}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{item.name}</span>
                                        <span className="font-bold">{item.qty} Terjual</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(item.qty / stats.topProducts[0].qty) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Metode Pembayaran</CardTitle></CardHeader>
            <CardContent className="flex justify-center">
                 <div className="h-[250px] w-full max-w-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={stats.paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {stats.paymentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}